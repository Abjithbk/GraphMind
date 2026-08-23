# backend/src/backend/main.py
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from backend.parser.pdf_parser import get_pdf_text
from backend.extractors.openai_ext import extract_graph_data
from backend.graph.builder import build_graph

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="GraphRAG Literature Review API")

class ProcessRequest(BaseModel):
    pdf_path: str

@app.get("/")
def read_root():
    return {"message": "GraphRAG API is running!"}

@app.post("/extract")
def extract_paper(request: ProcessRequest):
    if not os.path.exists(request.pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    try:
        # 1. Get text
        text = get_pdf_text(request.pdf_path)
        
        # 2. Extract with LLM
        result = extract_graph_data(text, os.path.basename(request.pdf_path))
        
        # 3. Build Graph
        G = build_graph([result])
        
        # 4. Format for JSON response
        nodes = [{"name": node, "type": attrs["type"]} for node, attrs in G.nodes(data=True)]
        edges = [{"source": u, "target": v, "type": attrs["type"]} for u, v, attrs in G.edges(data=True)]
        
        return {
            "paper_title": result.paper_title,
            "nodes": nodes,
            "edges": edges
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))