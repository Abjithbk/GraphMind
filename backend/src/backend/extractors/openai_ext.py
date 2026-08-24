import os
from pathlib import Path
from openai import OpenAI
from backend.models.schema import ExtractionResult
from dotenv import load_dotenv

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
        "HTTP-Referer": "http://localhost:8000", # Required by OpenRouter
        "X-Title": "GraphRAG Lit Review",       # Required by OpenRouter
    }
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
    """

    # 4. Call OpenRouter using the exact Qwen model string
    completion = client.beta.chat.completions.parse(
        model="qwen/qwen-2.5-72b-instruct", 
        messages=[
            {"role": "system", "content": "You are an expert academic assistant that extracts structured knowledge graphs from text."},
            {"role": "user", "content": prompt},
        ],
        response_format=ExtractionResult, 
    )
    
    return completion.choices[0].message.parsed