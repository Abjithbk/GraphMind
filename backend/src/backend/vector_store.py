import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pathlib import Path

CHROMA_DIR = Path(__file__).parent.parent.parent / "chroma_db"

client = chromadb.PersistentClient(path=str(CHROMA_DIR))

collection = client.get_or_create_collection(
    name="research_papers",
    metadata={"hnsw:space":"cosine"}
)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    length_function=len,
)
def add_paper_to_vector_store(paper_name: str, text: str):
    """Chunks raw PDF text and saves it to ChromaDB."""
    if not text.strip():
        return
    chunks = text_splitter.split_text(text)
    ids = [f"{paper_name}-chunk-{i}" for i in range(len(chunks))]
    metadatas = [{"paper_name": paper_name, "chunk_index": i} for i in range(len(chunks))]
    
    # upsert = update or insert (safe to re-process the same PDF)
    collection.upsert(ids=ids, documents=chunks, metadatas=metadatas)
    print(f"✅ Vector Store: saved {len(chunks)} chunks from '{paper_name}'")

def search_vector_store(query: str, n_results: int = 4) -> list[str]:
    """Finds the text chunks most similar to the question."""
    if collection.count() == 0:
        return []
    results = collection.query(query_texts=[query], n_results=n_results)
    if results and results["documents"]:
        return results["documents"][0]
    return []