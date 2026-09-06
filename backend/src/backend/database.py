import os
import re
import unicodedata
from pathlib import Path

from dotenv import load_dotenv
from neo4j import GraphDatabase

dotenv_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

URI = os.environ.get("NEO4J_URI")
USER = os.environ.get("NEO4J_USERNAME")
PASSWORD = os.environ.get("NEO4J_PASSWORD")

if not URI or not PASSWORD:
    raise ValueError("CRITICAL: Neo4j credentials not found in .env file!")

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))


def get_db():
    return driver


def clear_database():
    """Utility function to delete all nodes and relationships (Use with caution!)."""
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
    print("🧹 Database cleared.")


def test_connection():
    """Tests if the connection to Neo4j is working."""
    try:
        with driver.session() as session:
            session.run("RETURN 1 AS num")
            print("Successfully connected to Neo4j!")
    except Exception as e:
        print(f"Failed to connect to Neo4j: {e}")


def _normalize(text: str) -> str:
    """Normalizes text for robust comparison (fixes ligatures, unicode symbols, case)."""
    text = unicodedata.normalize("NFKC", text)  # 'ﬃ' -> 'ffi'
    text = text.lower()
    text = text.replace("×", "x")  # multiplication sign -> letter x
    text = re.sub(r"[‐‑‒–—−]", "-", text)  # all dash variants -> hyphen
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _token_overlap(a: str, b: str) -> float:
    """Scores how similar two names are based on shared words."""
    ta, tb = set(a.split(" ")), set(b.split(" "))
    ta.discard("")
    tb.discard("")
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / min(len(ta), len(tb))


def _resolve_name(raw: str, node_names: list, paper_name: str | None) -> str | None:
    raw_n = _normalize(raw)

    # 1. Exact match after normalization (fixes ﬃ vs ffi, × vs x)
    for name in node_names:
        if _normalize(name) == raw_n:
            return name

    # 2. Filename fallback: "paper2.pdf" -> Paper title
    if raw_n.endswith(".pdf") and paper_name:
        return paper_name

    # 3. Contains match
    for name in node_names:
        n = _normalize(name)
        if n in raw_n or raw_n in n:
            return name

    # 4. Token overlap: "FlashAttention Algorithm" -> "FlashAttention"
    best_name, best_score = None, 0.0
    for name in node_names:
        score = _token_overlap(_normalize(name), raw_n)
        if score > best_score:
            best_name, best_score = name, score
    if best_score >= 0.6:
        return best_name

    # 5. Long unmatched string -> assume it's a paper title variant
    if paper_name and len(raw_n) > 40:
        return paper_name

    return None


def save_graph_to_neo4j(nodes: list, edges: list):
    """
    Ingests extracted nodes and edges into Neo4j using Cypher.
    Uses MERGE to prevent duplicate nodes.
    """
    node_names = [node["name"] for node in nodes]
    print(f"📄 Node names: {node_names}")
    paper_name = next((n["name"] for n in nodes if n["type"].lower() == "paper"), None)

    with driver.session() as session:
        # 1. Create/Merge Nodes
        for node in nodes:
            session.run(
                "MERGE (n:Node {name: $name}) SET n.type = $type",
                name=node["name"],
                type=node["type"],
            )

        created = 0
        skipped = 0

        # 2. Create Relationships (with repaired names)
        for edge in edges:
            source = _resolve_name(edge["source"], node_names, paper_name)
            target = _resolve_name(edge["target"], node_names, paper_name)

            if not source or not target:
                skipped += 1
                print(f"⚠️ Skipped edge: {edge['source']} -> {edge['target']}")
                continue

            rel_type = edge["type"].upper().replace(" ", "_").replace("-", "_")

            session.run(
                f"""
                MATCH (a:Node {{name: $source}})
                MATCH (b:Node {{name: $target}})
                MERGE (a)-[r:{rel_type}]->(b)
                """,
                source=source,
                target=target,
            )
            created += 1

        print(f"✅ Neo4j: {len(nodes)} nodes | {created} relationships created | {skipped} skipped")


def get_graph_from_neo4j():
    """Fetches the full live graph from Neo4j for LLM context."""
    with driver.session() as session:
        node_records = session.run("MATCH (n:Node) RETURN n.name AS name, n.type AS type,n.summary AS summary")
        nodes = [{"name": r["name"], "type": r["type"],"summary": r["summary"]} for r in node_records]

        edge_records = session.run("MATCH (a:Node)-[r]->(b:Node) RETURN a.name AS source, b.name AS target, type(r) AS type")
        edges = [{"source": r["source"], "target": r["target"], "type": r["type"].lower()} for r in edge_records]
    return nodes, edges


def attach_summary_to_paper(paper_title: str, summary: str):
    """Stores the generated profile directly on the Paper node in Neo4j."""
    with driver.session() as session:
        session.run(
            "MATCH (p:Node {name: $name}) SET p.summary = $summary",
            name=paper_title,
            summary=summary,
        )


if __name__ == "__main__":
    test_connection()
