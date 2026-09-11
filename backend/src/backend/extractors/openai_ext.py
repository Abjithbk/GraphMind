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


# ---------------------------------------------------------------------------
# Chunking & Merging helpers
# ---------------------------------------------------------------------------

CHUNK_SIZE = 50_000  # ~12,500 tokens — safe for Qwen 72B's 32k context window
CHUNK_OVERLAP = 2_000  # overlap so entities near boundaries aren't lost


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split *text* into overlapping windows of *chunk_size* characters."""
    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def merge_extraction_results(results: list[ExtractionResult]) -> ExtractionResult:
    """Deduplicate and merge multiple extraction results into one."""
    from backend.models.schema import Entity, Relationship

    seen_entities: dict[tuple[str, str], Entity] = {}
    seen_relationships: dict[tuple[str, str, str], Relationship] = {}
    paper_title = results[0].paper_title if results else ""

    for result in results:
        # Keep the first non-empty paper_title we encounter
        if not paper_title and result.paper_title:
            paper_title = result.paper_title

        for entity in result.entities:
            key = (entity.name.lower().strip(), entity.type.lower().strip())
            if key not in seen_entities:
                seen_entities[key] = entity

        for rel in result.relationships:
            key = (rel.source.lower().strip(), rel.target.lower().strip(), rel.type.lower().strip())
            if key not in seen_relationships:
                seen_relationships[key] = rel

    return ExtractionResult(
        paper_title=paper_title,
        entities=list(seen_entities.values()),
        relationships=list(seen_relationships.values()),
    )


# ---------------------------------------------------------------------------
# Core extraction
# ---------------------------------------------------------------------------

def _extract_single_chunk(
    text_chunk: str,
    paper_filename: str,
    chunk_index: int = 0,
    total_chunks: int = 1,
) -> ExtractionResult:
    """Send a single text chunk to the LLM for entity/relationship extraction."""

    chunk_note = ""
    if total_chunks > 1:
        chunk_note = (
            f"\n    NOTE: This is section {chunk_index + 1} of {total_chunks} "
            f"from the same paper. Extract all entities and relationships you "
            f"find in THIS section.\n"
        )

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
    {chunk_note}
    Text:
    {text_chunk}
    CRITICAL RULE: In the relationships list, the 'source' and 'target' strings MUST be exactly identical, character-for-character, to the 'name' of one of the entities in your entities list. Never use filenames, abbreviations, or rephrased variants.
    """

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


def extract_graph_data(text: str, paper_filename: str) -> ExtractionResult:
    """Extract entities and relationships from the full paper text.

    Short papers (≤ 50k chars) are processed in a single LLM call.
    Longer papers are chunked, extracted per-chunk, then merged with
    deduplication.
    """
    chunks = chunk_text(text)

    if len(chunks) == 1:
        print(f"  → Single-chunk extraction ({len(text):,} chars)")
        return _extract_single_chunk(chunks[0], paper_filename)

    print(f"  → Chunked extraction: {len(chunks)} chunks from {len(text):,} chars")
    results: list[ExtractionResult] = []
    for i, chunk in enumerate(chunks):
        print(f"    • Extracting chunk {i + 1}/{len(chunks)} ({len(chunk):,} chars)...")
        result = _extract_single_chunk(chunk, paper_filename, chunk_index=i, total_chunks=len(chunks))
        results.append(result)

    merged = merge_extraction_results(results)
    print(
        f"  → Merged: {len(merged.entities)} entities, "
        f"{len(merged.relationships)} relationships"
    )
    return merged


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
