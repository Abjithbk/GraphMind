import networkx as nx

from backend.models.schema import ExtractionResult


def build_graph(extractions: list[ExtractionResult]) -> nx.DiGraph:
    """Builds a NetworkX graph from the extracted data."""
    G = nx.DiGraph()

    for data in extractions:
        # Add nodes
        for entity in data.entities:
            G.add_node(entity.name, type=entity.type)

        # Add edges
        for rel in data.relationships:
            G.add_edge(rel.source, rel.target, type=rel.type)

    return G
