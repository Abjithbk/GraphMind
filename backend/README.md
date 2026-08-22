# GraphRAG Literature Review Assistant

## Problem Statement

Reviewing academic literature for a research or college project typically involves reading multiple papers independently and manually identifying how they relate — which methods overlap, which results conflict, which papers build on one another, and what gaps exist across the body of work. This process is slow and error-prone when done manually.

Existing AI-powered PDF tools (e.g., ChatPDF and similar summarizers) rely on standard vector-based Retrieval-Augmented Generation (RAG). These tools work reasonably well for single-document question answering, but they treat each paper as an isolated block of text. They struggle with **cross-paper relational questions** — such as identifying contradictions, shared methods, or common research gaps across a set of papers — because plain vector similarity search has no concept of structured relationships between documents.

## Objective

To design and build a **GraphRAG-based system** for academic literature review that:
1. Extracts structured knowledge (methods, datasets, claims, results, authors) from a set of research papers.
2. Builds a knowledge graph connecting papers through shared concepts, methods, datasets, citations, and contradictions.
3. Answers questions using a hybrid of vector retrieval (for single-paper facts) and graph traversal (for cross-paper relationships).
4. Produces more accurate, traceable, and relationally-aware answers than existing plain-RAG PDF summarizer tools.

## Motivation

- Literature reviews require synthesis across papers, not just per-paper summaries — which is exactly where generic RAG tools fall short.
- Personal/academic use case: helps in preparing literature review sections for coursework by surfacing connections and gaps automatically.
- Opportunity to demonstrate, with a measurable benchmark, that domain-structured GraphRAG outperforms generic vector-RAG on relational and synthesis-level questions.

## Limitations of Existing Tools (e.g., ChatPDF-style summarizers)

| Aspect | Generic PDF RAG Tools | This Project (GraphRAG) |
|---|---|---|
| Single-paper Q&A | Good | Good |
| Cross-paper relationships (method overlap, contradictions) | Poor — no structural link between documents | Strong — explicit graph edges |
| Synthesis across multiple papers | Weak, often shallow | Strong — graph traversal + concept clustering |
| Traceability of answers | Limited | Answers linked to specific paper/section nodes |
| Handling of a paper *set* (not a single file) | Not designed for this | Core use case |

## Proposed Approach

1. **Extraction** — Parse papers (PDF) into structured sections and extract entities (Method, Dataset, Claim, Result, Author) using LLM-based structured extraction.
2. **Graph Construction** — Build a knowledge graph with papers, authors, methods, datasets, and concepts as nodes, and relationships like `cites`, `uses_method`, `evaluated_on`, `contradicts`, `extends` as edges.
3. **Hybrid Retrieval** — Route simple factual queries to vector search; route relational/synthesis queries to graph traversal.
4. **Answer Generation** — Generate answers grounded in retrieved graph context and text chunks, with citations back to source papers.
5. **Benchmarking** — Compare system output against a generic PDF-RAG tool on a fixed question set spanning factual, relational, and synthesis-level questions, scored on accuracy and traceability.

## Scope

- Personal/academic project — built and tested on a small set of research papers (starting with the papers collected for a college literature review assignment).
- Not intended as a production/commercial tool; focus is on demonstrating and measuring the accuracy improvement of graph-structured retrieval over standard RAG.

## Tech Stack (planned)

- **Parsing:** PyMuPDF / GROBID
- **Graph:** NetworkX (prototype) → Neo4j (if scaled)
- **LLM:** Claude / GPT API for entity extraction and answer generation
- **Retrieval:** Embedding-based vector search + graph traversal (hybrid router)
- **Interface:** CLI or Streamlit (minimal, functionality-first)

## Success Metrics

- Accuracy and traceability of answers on single-paper factual questions (baseline parity expected).
- Accuracy on cross-paper relational questions (primary differentiator).
- Quality of synthesis answers (e.g., "common research gap across these papers").
- Side-by-side comparison table against a generic PDF summarizer tool on the same question set.

## Status

🚧 In progress — personal project, actively being developed and extended.
