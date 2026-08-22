import os
from dotenv import load_dotenv
from backend.parser.pdf_parser import get_pdf_text
from backend.extractors.openai_ext import extract_graph_data
from backend.graph.builder import build_graph

# Load environment variables
load_dotenv()

def main():
    # 1. Define the papers
    pdf_files = ["papers/paper1.pdf", "papers/paper2.pdf"]
    extractions = []
    
    print("🚀 Starting V1 GraphRAG Extraction...\n")
    
    # 2. Extract data
    for pdf in pdf_files:
        if not os.path.exists(pdf):
            print(f"⚠️ Warning: {pdf} not found. Skipping.")
            continue
            
        print(f"📄 Processing {pdf}...")
        text = get_pdf_text(pdf)
        
        result = extract_graph_data(text, os.path.basename(pdf))
        extractions.append(result)
        print(f"✅ Extracted {len(result.entities)} entities and {len(result.relationships)} relationships.\n")

    if not extractions:
        print("No papers found. Please add PDFs to the 'papers/' folder.")
        return

    # 3. Build Graph
    print("🕸️ Building Knowledge Graph...")
    G = build_graph(extractions)
    
    # 4. Print Results
    print("\n--- 📊 GRAPH NODES ---")
    for node, attrs in G.nodes(data=True):
        print(f" - [{attrs['type']}] {node}")
        
    print("\n--- 🔗 GRAPH EDGES ---")
    for source, target, attrs in G.edges(data=True):
        print(f" - {source} --({attrs['type']})--> {target}")

if __name__ == "__main__":
    main()