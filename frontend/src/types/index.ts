import { Edge, Node } from "@xyflow/react";

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

export interface Paper {
  id: string;
  title: string;
  author: string;
  year: string | number;
  status: "processed" | "pending" | "error";
}

export interface CustomNodeData {
  label?: string;
  type?: string;
}

export interface GraphApiNode {
  name: string;
  type: string;
}

export interface GraphApiEdge {
  source: string;
  target: string;
  type: string;
}

export interface ExtractionResponse {
  papers_processed: number;
  total_nodes: number;
  total_edges: number;
  nodes: GraphApiNode[];
  edges: GraphApiEdge[];
}

export interface ChatRequest {
  message: string;
  nodes: GraphApiNode[];
  edges: GraphApiEdge[];
}

export interface LoadedPaperSummary {
  title: string;
  author: string;
  year: string;
}

export interface GraphState {
  nodes: Node[];
  edges: Edge[];
  papers: Paper[];
  isLoading: boolean;
  highlightedNode: string | null;
  selectedNode: Node | null;
  searchQuery: string;
  activeFilters: string[];
  setGraph: (nodes: Node[], edges: Edge[]) => void;
  setPapers: (papers: Paper[]) => void;
  setLoading: (loading: boolean) => void;
  addPaper: (paper: Paper) => void;
  setHighlightedNode: (nodeId: string | null) => void;
  setSelectedNode: (node: Node | null) => void;
  setSearchQuery: (query: string) => void;
  toggleFilter: (type: string) => void;
  getLoadedPapers: () => LoadedPaperSummary[];
}
