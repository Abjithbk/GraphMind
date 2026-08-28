from src.backend.vector_store import add_paper_to_vector_store, search_vector_store

add_paper_to_vector_store("Test Paper", "LoRA reduces trainable parameters by 10,000x. FlashAttention speeds up training using IO-aware tiling.")

print("\n--- Searching: 'memory efficiency' ---")
for chunk in search_vector_store("How does it improve memory efficiency?"):
    print("-", chunk)
