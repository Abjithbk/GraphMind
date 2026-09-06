import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.extractors.openai_ext import chat_with_graph, extract_graph_data, generate_paper_profile
from backend.graph.builder import build_graph
from backend.parser.pdf_parser import get_pdf_text

from .database import attach_summary_to_paper, get_graph_from_neo4j, save_graph_to_neo4j
from .vector_store import add_paper_to_vector_store, search_vector_store

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="GraphRAG Literature Review API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Update the request model to accept a LIST of PDF paths
class ProcessRequest(BaseModel):
    pdf_paths: list[str]


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
            print(f"\n📄 PAPER PROFILE — {paper_name}\n{profile}\n")

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/graph")
def get_saved_graph():
    """Returns the persisted graph from Neo4j so the frontend can rehydrate."""
    nodes, edges = get_graph_from_neo4j()
    return {
        "papers_processed": len([n for n in nodes if n["type"].lower() == "paper"]),
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "nodes": nodes,
        "edges": edges,
    }
