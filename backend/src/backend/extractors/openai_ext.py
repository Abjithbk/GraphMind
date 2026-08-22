import os
from openai import OpenAI
from backend.models.schema import ExtractionResult

# Initialize the OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def extract_graph_data(text: str, paper_filename: str) -> ExtractionResult:
    """Sends text to OpenAI and returns structured graph data."""
    
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
        model="gpt-4o-mini", 
        messages=[
            {"role": "system", "content": "You are an expert academic assistant that extracts structured knowledge graphs from text."},
            {"role": "user", "content": prompt},
        ],
        response_format=ExtractionResult, 
    )
    
    return completion.choices[0].message.parsed