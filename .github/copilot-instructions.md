# Copilot Instructions — lit-graphrag

## Project overview
GraphRAG Literature Review Assistant — extracts structured knowledge graphs
(papers, methods, claims, and their relationships) from research PDFs, and
answers cross-paper synthesis questions via a graph-aware chat interface.
Core differentiator vs generic PDF-RAG tools: explicit graph edges between
papers/methods/claims instead of isolated per-document retrieval.

## Repo structure
- `backend/` — FastAPI (Python 3.10+), package-managed with `uv`
  - `src/backend/main.py` — FastAPI app, `/extract` and `/chat` endpoints
  - `src/backend/models/schema.py` — Pydantic models (Entity, Relationship, ExtractionResult)
  - `src/backend/parsers/pdf_parser.py` — PyMuPDF text extraction
  - `src/backend/extractors/openai_ext.py` — LLM calls for extraction + chat (OpenAI-SDK-compatible client)
  - `src/backend/graph/builder.py` — NetworkX graph construction/merging
- `frontend/` — Next.js 14+ (App Router, TypeScript), package-managed with `pnpm`
  - `src/components/` — Sidebar, GraphCanvas (React Flow), ChatPanel, NodeDetailPanel, GraphToolbar, CustomNode
  - `src/store/useGraphStore.ts` — Zustand global state (nodes, edges, filters, selected/highlighted node)
  - `src/lib/api.ts` — backend API client
  - `src/lib/graphMapper.ts` — backend JSON → React Flow nodes/edges

## Conventions
- **Python**: use `uv` for all dependency management (`uv add`, `uv sync`, `uv run`).
  Never suggest `pip install` directly. Lint/format with `ruff` (config in
  `backend/pyproject.toml`, line-length 200). Modern type hints only — `list[str]`,
  `dict[str, Any]`, not `typing.List`/`typing.Dict`.
- **TypeScript/React**: strict typing, no `any` — define local interfaces for
  React Flow `node.data` shapes (e.g. `{ label?: string; type?: string }`) instead
  of casting. Follow React purity rules — no `Date.now()` or other impure calls
  during render; use `crypto.randomUUID()` for stable IDs generated in event handlers.
- **Line endings**: LF only, everywhere (enforced via `.gitattributes` +
  `.editorconfig`). Do not introduce CRLF.
- **Package managers**: `uv` for backend, `pnpm` for frontend. Never suggest
  `npm`/`yarn` commands for this repo.

## LLM integration
- LLM calls go through an OpenAI-SDK-compatible client in `openai_ext.py`
  (`base_url` override pattern — currently OpenRouter/Groq depending on active
  config, model is a Qwen variant). Keep prompts and API calls in this file;
  don't scatter LLM calls elsewhere.
- Never hardcode API keys — always read from `.env` via `os.getenv` /
  `python-dotenv`, and `.env` is gitignored.

## Testing & CI
- CI runs `ruff check`, `ruff format --check` (backend) and `pnpm lint`,
  `pnpm build` (frontend) on every push/PR to `master`.
- No test suite yet — if asked to add tests, use `pytest` for backend
  (place under `backend/tests/`), and prefer small, focused tests for pure
  functions like `build_graph()` and `get_pdf_text()` over end-to-end tests.

## What NOT to do
- Don't restructure the monorepo layout (`backend/` + `frontend/` split) without being asked.
- Don't add `master`→`main` branch renames or touch CI branch triggers.
- Don't reintroduce `typing.List`/`Dict` or `any` types.
- Don't suggest npm/yarn for frontend or pip for backend.