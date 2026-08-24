# src/backend/main.py
import os
from typing import List,Dict,Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from backend.parser.pdf_parser import get_pdf_text
from backend.extractors.openai_ext import extract_graph_data,chat_with_graph
from backend.graph.builder import build_graph

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="GraphRAG Literature Review API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
# Update the request model to accept a LIST of PDF paths
class ProcessRequest(BaseModel):
    pdf_paths: List[str]

@app.get("/")
def read_root():
    return {"message": "GraphRAG API is running!"}

@app.post("/extract")
def extract_papers(request: ProcessRequest):
    extractions = []
    
    # 1. Loop through all provided PDF paths
    for pdf_path in request.pdf_paths:
        if not os.path.exists(pdf_path):
            # Skip missing files but warn the user
            print(f"Warning: {pdf_path} not found. Skipping.")
            continue
            
        print(f"Processing: {pdf_path}...")
        try:
            text = get_pdf_text(pdf_path)
            result = extract_graph_data(text, os.path.basename(pdf_path))
            extractions.append(result)
        except Exception as e:
            print(f"Error processing {pdf_path}: {e}")

    if not extractions:
        raise HTTPException(status_code=404, detail="No valid PDFs were processed.")
    
    # 2. Build ONE unified graph from all extracted papers
    G = build_graph(extractions)
    
    # 3. Format for JSON response
    nodes = [{"name": node, "type": attrs.get("type", "Unknown")} for node, attrs in G.nodes(data=True)]
    edges = [{"source": u, "target": v, "type": attrs.get("type", "relates_to")} for u, v, attrs in G.edges(data=True)]
    
    # Return the combined graph
    return {
        "papers_processed": len(extractions),
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "nodes": nodes,
        "edges": edges
    }

class ChatRequest(BaseModel):
    message: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

@app.post("/chat")
def chat_with_assistant(request: ChatRequest):
    try:
        # Pass the current graph state to the LLM
        graph_context = {"nodes": request.nodes, "edges": request.edges}
        response = chat_with_graph(request.message, graph_context)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))