import os
from pathlib import Path
from openai import OpenAI
from backend.models.schema import ExtractionResult
from dotenv import load_dotenv

# Load .env
dotenv_path = Path(__file__).parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

api_key = os.environ.get("GROQ_API_KEY")
base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")

if not api_key:
    raise ValueError("CRITICAL: GROQ_API_KEY not found in .env file!")

# Initialize client pointing to Groq instead of OpenAI
client = OpenAI(
    api_key=api_key,
    base_url=base_url
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

    completion = client.beta.chat.completions.parse(
        model="llama-3.3-70b-versatile", # Groq's excellent free model
        messages=[
            {"role": "system", "content": "You are an expert academic assistant that extracts structured knowledge graphs from text."},
            {"role": "user", "content": prompt},
        ],
        response_format=ExtractionResult, 
    )
    
    return completion.choices[0].message.parsed