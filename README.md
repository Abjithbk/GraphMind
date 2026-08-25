# 🕸️ GraphRAG Literature Review Assistant

> **Turn multiple research PDFs into one connected knowledge graph for cross-paper reasoning.**

GraphRAG Literature Review Assistant is a full-stack app that extracts structured entities and relationships from research papers, builds a unified graph, and enables graph-aware academic Q&A with streaming responses.

## 📚 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture & Tech Stack](#-architecture--tech-stack)
- [📂 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (FastAPI)](#backend-setup-fastapi)
  - [Frontend Setup (Next.js)](#frontend-setup-nextjs)
- [📡 API Documentation](#-api-documentation)
  - [`POST /extract`](#post-extract)
  - [`POST /chat`](#post-chat)
- [🗺️ Roadmap / Future Work](#-roadmap--future-work)
- [📄 License](#-license)

## ✨ Features

- 📄 **Multi-paper extraction pipeline**: Process multiple PDF paths in one request and build a single graph.
- 🧠 **Structured knowledge graph modeling**: Extracts `Paper`, `Method`, and `Claim` entities with typed relationships.
- 🌐 **Unified graph construction**: Merges entities/edges across papers using NetworkX.
- 💬 **Graph-aware AI chat with streaming**: Sends current graph context (`nodes`, `edges`) to the backend and streams tokens back to the UI.
- 🔎 **Clickable in-chat citations**: Bracketed references like `[Transformer]` are clickable and highlight matching graph nodes.
- 🕹️ **Interactive visualization**: React Flow canvas with filtering, node detail panel, and graph exploration controls.

## 🏗️ Architecture & Tech Stack

### Frontend (`/frontend`)

| Layer | Stack |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Graph UI | `@xyflow/react` (React Flow) |
| State | Zustand |
| UI System | shadcn/ui-style components, Tailwind CSS 4, `class-variance-authority`, `tailwind-merge` |
| UX | Framer Motion, Sonner, Lucide icons |

### Backend (`/backend`)

| Layer | Stack |
|---|---|
| API | FastAPI + Uvicorn |
| Validation | Pydantic v2 |
| Graph Engine | NetworkX |
| PDF Parsing | PyMuPDF |
| LLM Integration | OpenAI SDK-compatible client via OpenRouter-style `base_url`, Qwen model (`qwen/qwen-2.5-72b-instruct`) |
| Config | `python-dotenv` (`OPENROUTER_API_KEY`, optional `OPENAI_BASE_URL`) |

## 📂 Project Structure

```text
lit-graphrag/
├── backend/
│   ├── pyproject.toml              # Backend deps, Ruff config, Python requirement
│   └── src/backend/
│       ├── main.py                 # FastAPI app, /extract and /chat endpoints
│       ├── models/schema.py        # Pydantic extraction schemas (Entity/Relationship/ExtractionResult)
│       ├── parser/pdf_parser.py    # PDF text extraction (PyMuPDF)
│       ├── graph/builder.py        # NetworkX graph construction
│       └── extractors/openai_ext.py# LLM extraction + streaming chat calls
├── frontend/
│   ├── package.json                # Frontend deps and scripts (pnpm)
│   └── src/
│       ├── app/                    # Next.js App Router entrypoints
│       ├── components/             # Sidebar, GraphCanvas, ChatPanel, NodeDetailPanel, toolbar, UI primitives
│       ├── lib/
│       │   ├── api.ts              # HTTP client for /extract and /chat
│       │   └── graphMapper.ts      # Backend graph JSON -> React Flow nodes/edges
│       ├── store/useGraphStore.ts  # Global graph/chat/UI state via Zustand
│       └── types/index.ts          # Shared frontend TypeScript interfaces
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS recommended)
- `pnpm` (repo is pinned to `pnpm@11.8.0`)
- Python **3.14+** (as declared in `backend/pyproject.toml`)
- [`uv`](https://docs.astral.sh/uv/)
- A valid LLM API key (currently expected as `OPENROUTER_API_KEY`)

### Backend Setup (FastAPI)

```bash
cd /home/runner/work/lit-graphrag/lit-graphrag/backend
uv sync
```

Create `/home/runner/work/lit-graphrag/lit-graphrag/backend/.env`:

```env
OPENROUTER_API_KEY=your_api_key_here
# Optional override; defaults to OpenRouter-compatible endpoint
OPENAI_BASE_URL=https://openrouter.ai/api/v1
```

Run the backend:

```bash
uv run uvicorn backend.main:app --app-dir src --reload --host 0.0.0.0 --port 8000
```

Backend URL: `http://localhost:8000`

### Frontend Setup (Next.js)

```bash
cd /home/runner/work/lit-graphrag/lit-graphrag/frontend
corepack pnpm install
```

Create `/home/runner/work/lit-graphrag/lit-graphrag/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the frontend:

```bash
corepack pnpm dev
```

Frontend URL: `http://localhost:3000`

## 📡 API Documentation

Base URL: `http://localhost:8000`

### `POST /extract`

Processes multiple PDF paths, extracts entities/relationships for each valid file, builds one unified graph, and returns graph data for visualization.

**Request body**

```json
{
  "pdf_paths": [
    "/absolute/path/to/paper1.pdf",
    "/absolute/path/to/paper2.pdf"
  ]
}
```

**200 Response**

```json
{
  "papers_processed": 2,
  "total_nodes": 12,
  "total_edges": 18,
  "nodes": [
    { "name": "Attention Is All You Need", "type": "Paper" },
    { "name": "Transformer", "type": "Method" },
    { "name": "Improves translation quality", "type": "Claim" }
  ],
  "edges": [
    { "source": "Attention Is All You Need", "target": "Transformer", "type": "uses_method" },
    { "source": "Attention Is All You Need", "target": "Improves translation quality", "type": "makes_claim" }
  ]
}
```

**404 Response** (when no valid PDFs were processed)

```json
{
  "detail": "No valid PDFs were processed."
}
```

### `POST /chat`

Accepts a question plus the current graph context and returns a **streamed plain-text response**.

**Request body**

```json
{
  "message": "What are the shared methods across these papers?",
  "nodes": [
    { "name": "Attention Is All You Need", "type": "Paper" },
    { "name": "Transformer", "type": "Method" }
  ],
  "edges": [
    { "source": "Attention Is All You Need", "target": "Transformer", "type": "uses_method" }
  ]
}
```

**200 Response**

```text
(streamed text/plain chunks)
```

**500 Response**

```json
{
  "detail": "<error message>"
}
```

## 🗺️ Roadmap / Future Work

- 🧭 Hybrid retrieval router (graph traversal + vector search)
- 🗄️ Persistent graph storage (Neo4j migration)
- 🧱 Vector database integration for long-context retrieval
- 🔐 User authentication and project-level workspaces
- 📈 Evaluation and benchmarking suite for cross-paper synthesis quality

## 📄 License

MIT License.
