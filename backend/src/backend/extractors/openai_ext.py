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
        "HTTP-Referer": "http://localhost:8000",  # Required by OpenRouter
        "X-Title": "GraphRAG Lit Review",  # Required by OpenRouter
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


def chat_with_graph(message: str, graph_context: dict):
    """
    Takes a user question and the current graph context, and returns a STREAMING AI answer.
    """
    # Format the graph into a readable string for the LLM
    nodes_str = "\n".join([f"- {n['name']} ({n['type']})" for n in graph_context.get("nodes", [])])
    edges_str = "\n".join([f"- {e['source']} --({e['type']})-> {e['target']}" for e in graph_context.get("edges", [])])

    prompt = f"""
    You are an expert academic research assistant. 
    You have access to a Knowledge Graph extracted from research papers.
    
    Here is the current Knowledge Graph context:
    NODES:
    {nodes_str}
    
    EDGES (Relationships):
    {edges_str}
    
    User Question: {message}
    
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
        stream=True,  # <-- This makes it return a generator of tokens
    )

    return completion
