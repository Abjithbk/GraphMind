import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from backend.models.schema import ExtractionResult

# 1. Load .env file
dotenv_path = Path(__file__).parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

# 2. Get OpenRouter credentials
api_key = os.environ.get("OPENROUTER_API_KEY")
base_url = os.environ.get("OPENAI_BASE_URL", "https://openrouter.ai/api/v1")

if not api_key:
    raise ValueError("CRITICAL: OPENROUTER_API_KEY not found in .env file!")

# 3. Initialize client pointing to OpenRouter
client = OpenAI(
    api_key=api_key,
    base_url=base_url,
    default_headers={
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "GraphRAG Lit Review",
    },
)


def extract_graph_data(text: str, paper_filename: str) -> ExtractionResult:
    prompt = f"""
    You are an expert academic research assistant. 
    Read the following text from a research paper. 
    
    Extract the following:
    1. The Paper itself (use the paper title or filename as the name).
    2. Key Methods proposed or used in the paper.
    3. Key Claims made by the authors.
    
    Create relationships:
    - The Paper `uses_method` the Methods.
    - The Paper `makes_claim` the Claims.
    
    Paper Filename/Context: {paper_filename}
    
    Text:
    {text[:12000]} 
    CRITICAL RULE: In the relationships list, the 'source' and 'target' strings MUST be exactly identical, character-for-character, to the 'name' of one of the entities in your entities list. Never use filenames, abbreviations, or rephrased variants.
    """

    # 4. Call OpenRouter using the exact Qwen model string
    completion = client.beta.chat.completions.parse(
        model="qwen/qwen-2.5-72b-instruct",
        messages=[
            {
                "role": "system",
                "content": "You are an expert academic assistant that extracts structured knowledge graphs from text.",
            },
            {"role": "user", "content": prompt},
        ],
        response_format=ExtractionResult,
    )

    return completion.choices[0].message.parsed


def chat_with_graph(message: str, graph_context: dict, text_chunks: list[str] = None):
    """
    Takes a user question and the current graph context, and returns a STREAMING AI answer.
    """
    # Format the graph into a readable string for the LLM
    nodes_str = "\n".join([f"- {n['name']} ({n['type']})" for n in graph_context.get("nodes", [])])
    edges_str = "\n".join([f"- {e['source']} --({e['type']})-> {e['target']}" for e in graph_context.get("edges", [])])

    chunks_str = "\n\n".join(text_chunks) if text_chunks else "No direct text quotes found"

    prompt = f"""You are an expert research assistant. Answer the user's question based on the provided knowledge graph AND text excerpts.

    RULES:
    1. Use the Graph Context to understand relationships between papers, methods, and claims.
    2. Use the Text Excerpts to provide specific details, numbers, or quotes from the actual papers.
    3. Whenever you mention a specific paper, method, or claim that exists in the graph, wrap its EXACT name in square brackets like this: [Transformer] or [LoRA].
    4. NEVER mention "graph context", "text excerpts", or "the provided data" in your answer. Answer naturally like an expert who has read the papers.
    
    GRAPH CONTEXT:
    Nodes:
    {nodes_str}
    
    Relationships:
    {edges_str}
    
    TEXT EXCERPTS (from PDFs):
    {chunks_str}
    
    USER QUESTION: {message}
    IMPORTANT: When you mention a specific node from the graph, wrap its EXACT name in square brackets. For example: 'The paper uses the [Transformer] method.'
    
    Answer the question based ONLY on the provided graph context. If the graph doesn't contain the answer, say so. Keep the answer concise and academic.
    """

    # ENABLE STREAMING HERE
    completion = client.chat.completions.create(
        model="qwen/qwen-2.5-72b-instruct",
        messages=[
            {"role": "system", "content": "You are a helpful research assistant."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        stream=True,
    )

    return completion


def generate_paper_profile(paper_name: str, aspect_chunks: dict) -> str:
    """Writes a brief, grounded profile of a paper using aspect-based excerpts."""
    blocks = []
    for label, chunks in aspect_chunks.items():
        if chunks:
            blocks.append(f"--- {label} EXCERPTS ---\n" + "\n\n".join(chunks))

    prompt = f"""You are an expert research analyst. Write a brief, accurate profile of the paper "{paper_name}" using ONLY the excerpts below.

RULES:
- Only use facts found in the excerpts. Never invent numbers or methods.
- 1-2 sentences per section. Under 150 words total.

FORMAT EXACTLY:
🎯 Problem: ...
🔬 Method: ...
📊 Key Results: ...
⚠️ Limitations: ...

{chr(10).join(blocks)}
"""
    response = client.chat.completions.create(
        model="qwen/qwen-2.5-72b-instruct",  # <-- use your existing model string
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    return response.choices[0].message.content
