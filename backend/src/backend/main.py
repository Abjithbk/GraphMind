import json
import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from neo4j.exceptions import ServiceUnavailable, SessionExpired
from pydantic import BaseModel

from backend.extractors.openai_ext import chat_with_graph, extract_graph_data, generate_paper_profile
from backend.graph.builder import build_graph
from backend.parser.pdf_parser import get_pdf_text

from .database import attach_summary_to_paper, clear_database, get_graph_from_neo4j, save_graph_to_neo4j
from .vector_store import add_paper_to_vector_store, clear_vector_store, search_vector_store

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="GraphRAG Literature Review API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)


# Update the request model to accept a LIST of PDF paths and optional stream flag
class ProcessRequest(BaseModel):
    pdf_paths: list[str]
    stream: bool = False


@app.get("/")
def read_root():
    return {"message": "GraphRAG API is running!"}


ASPECT_QUERIES = {
    "PROBLEM": "What problem or research gap does this paper address?",
    "METHOD": "How does the proposed method work technically?",
    "RESULTS": "What are the main quantitative results and improvements?",
    "LIMITATIONS": "What limitations or future work are mentioned?",
}


@app.post("/extract")
def extract_papers(request: ProcessRequest):
    if request.stream:

        def stream_pipeline():
            extractions = []
            paper_summaries: dict[str, str] = {}
            valid_paths = [p for p in request.pdf_paths if os.path.exists(p)]
            total_papers = len(valid_paths)

            if total_papers == 0:
                yield f"data: {json.dumps({'type': 'error', 'message': 'No valid PDFs were found.'})}\n\n"
                return

            for idx, pdf_path in enumerate(valid_paths):
                paper_name = os.path.basename(pdf_path)
                yield f"data: {json.dumps({'type': 'paper_start', 'paper': paper_name, 'paper_index': idx + 1, 'total_papers': total_papers})}\n\n"

                try:
                    # Step 1: Parsing PDF
                    yield f"data: {json.dumps({'type': 'step', 'step': 1, 'total_steps': 4, 'name': 'Parsing PDF...', 'paper': paper_name})}\n\n"
                    text = get_pdf_text(pdf_path)

                    # Step 2: Generating vector embeddings
                    yield f"data: {json.dumps({'type': 'step', 'step': 2, 'total_steps': 4, 'name': 'Generating vector embeddings...', 'paper': paper_name})}\n\n"
                    add_paper_to_vector_store(paper_name, text)

                    # Step 3: Extracting knowledge graph via LLM
                    yield f"data: {json.dumps({'type': 'step', 'step': 3, 'total_steps': 4, 'name': 'Extracting knowledge graph via LLM...', 'paper': paper_name})}\n\n"
                    result = extract_graph_data(text, paper_name)
                    nodes_data = [{"name": entity.name, "type": entity.type.lower()} for entity in result.entities]
                    edges_data = [{"source": rel.source, "target": rel.target, "type": rel.type} for rel in result.relationships]
                    save_graph_to_neo4j(nodes_data, edges_data)

                    # Step 4: Generating grounded paper profile
                    yield f"data: {json.dumps({'type': 'step', 'step': 4, 'total_steps': 4, 'name': 'Generating grounded paper profile...', 'paper': paper_name})}\n\n"
                    aspect_chunks = {label: search_vector_store(q, paper_name=paper_name, n_results=3) for label, q in ASPECT_QUERIES.items()}
                    profile = generate_paper_profile(paper_name, aspect_chunks)
                    logger.info(f"[PAPER PROFILE] — {paper_name}\n{profile}")

                    paper_title = next(
                        (e.name for e in result.entities if e.type.lower() == "paper"),
                        paper_name,
                    )
                    attach_summary_to_paper(paper_title, profile)
                    paper_summaries[paper_title] = profile
                    extractions.append(result)

                    yield f"data: {json.dumps({'type': 'paper_complete', 'paper': paper_name, 'paper_index': idx + 1, 'total_papers': total_papers})}\n\n"

                except Exception as e:
                    logger.error(f"Error processing {pdf_path}: {e}")
                    yield f"data: {json.dumps({'type': 'paper_error', 'paper': paper_name, 'error': str(e)})}\n\n"

            if not extractions:
                yield f"data: {json.dumps({'type': 'error', 'message': 'No valid PDFs were processed.'})}\n\n"
                return

            # Build unified graph
            G = build_graph(extractions)
            nodes = [
                {
                    "name": node,
                    "type": attrs.get("type", "Unknown"),
                    "summary": paper_summaries.get(node),
                }
                for node, attrs in G.nodes(data=True)
            ]
            edges = [{"source": u, "target": v, "type": attrs.get("type", "relates_to")} for u, v, attrs in G.edges(data=True)]

            result_payload = {
                "papers_processed": len(extractions),
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "nodes": nodes,
                "edges": edges,
            }
            yield f"data: {json.dumps({'type': 'complete', 'result': result_payload})}\n\n"

        return StreamingResponse(stream_pipeline(), media_type="text/event-stream")

    extractions = []
    paper_summaries: dict[str, str] = {}
    # 1. Loop through all provided PDF paths
    for pdf_path in request.pdf_paths:
        if not os.path.exists(pdf_path):
            # Skip missing files but warn the user
            print(f"Warning: {pdf_path} not found. Skipping.")
            continue

        print(f"Processing: {pdf_path}...")
        try:
            text = get_pdf_text(pdf_path)
            paper_name = os.path.basename(pdf_path)

            add_paper_to_vector_store(paper_name, text)
            result = extract_graph_data(text, paper_name)
            nodes_data = [{"name": entity.name, "type": entity.type.lower()} for entity in result.entities]
            edges_data = [{"source": rel.source, "target": rel.target, "type": rel.type} for rel in result.relationships]

            # Save to Neo4j
            save_graph_to_neo4j(nodes_data, edges_data)
            # ✨ Generate a brief, grounded Paper Profile
            aspect_chunks = {label: search_vector_store(q, paper_name=paper_name, n_results=3) for label, q in ASPECT_QUERIES.items()}
            profile = generate_paper_profile(paper_name, aspect_chunks)
            logger.info(f"[PAPER PROFILE] — {paper_name}\n{profile}")

            # Save it on the Paper node in Neo4j
            paper_title = next(
                (e.name for e in result.entities if e.type.lower() == "paper"),
                paper_name,
            )
            attach_summary_to_paper(paper_title, profile)
            paper_summaries[paper_title] = profile
            extractions.append(result)
        except Exception as e:
            print(f"Error processing {pdf_path}: {e}")

    if not extractions:
        raise HTTPException(status_code=404, detail="No valid PDFs were processed.")

    # 2. Build ONE unified graph from all extracted papers
    G = build_graph(extractions)

    # 3. Format for JSON response
    nodes = [
        {
            "name": node,
            "type": attrs.get("type", "Unknown"),
            "summary": paper_summaries.get(node),
        }
        for node, attrs in G.nodes(data=True)
    ]
    edges = [{"source": u, "target": v, "type": attrs.get("type", "relates_to")} for u, v, attrs in G.edges(data=True)]

    # Return the combined graph
    return {
        "papers_processed": len(extractions),
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "nodes": nodes,
        "edges": edges,
    }


class ChatRequest(BaseModel):
    message: str


@app.post("/chat")
def chat_with_assistant(request: ChatRequest):
    try:
        # Read the live graph DIRECTLY from Neo4j!
        nodes, edges = get_graph_from_neo4j()
        graph_context = {"nodes": nodes, "edges": edges}

        text_chunks = search_vector_store(request.message)
        stream = chat_with_graph(request.message, graph_context, text_chunks)

        def generate():
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        return StreamingResponse(generate(), media_type="text/plain")
    except (ServiceUnavailable, SessionExpired, OSError) as e:
        logger.warning(f"Neo4j unavailable during chat: {e}")
        raise HTTPException(
            status_code=503,
            detail="Database is currently unavailable. Please check your Neo4j connection and try again.",
        ) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/graph")
def get_saved_graph():
    """Returns the persisted graph from Neo4j so the frontend can rehydrate."""
    try:
        nodes, edges = get_graph_from_neo4j()
        return {
            "papers_processed": len([n for n in nodes if n["type"].lower() == "paper"]),
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "nodes": nodes,
            "edges": edges,
        }
    except (ServiceUnavailable, SessionExpired, OSError) as e:
        logger.warning(f"Neo4j unavailable — returning empty graph: {e}")
        return {
            "papers_processed": 0,
            "total_nodes": 0,
            "total_edges": 0,
            "nodes": [],
            "edges": [],
        }


@app.delete("/graph")
def reset_knowledge_base():
    """Clears both Neo4j graph nodes/edges and ChromaDB vector embeddings."""
    try:
        clear_database()
        clear_vector_store()
        return {"status": "cleared", "message": "Knowledge base and vector store successfully reset."}
    except Exception as e:
        logger.error(f"Error resetting knowledge base: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reset knowledge base: {str(e)}") from e
