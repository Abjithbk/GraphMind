import {create} from 'zustand'
import {Node,Edge} from '@xyflow/react'

interface Paper {
    id: string;
    title:string;
    author:string;
    year:string;
    status: 'processed' | 'pending' | 'error'
}

interface GraphState {
  nodes: Node[];
  edges: Edge[];
  papers: Paper[];
  isLoading: boolean;
  highlightedNode:string|null;
  // Actions
  setGraph: (nodes: Node[], edges: Edge[]) => void;
  setPapers: (papers: Paper[]) => void;
  setLoading: (loading: boolean) => void;
  addPaper: (paper: Paper) => void;
  setHighlightedNode: (nodeId:string|null) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  papers: [
    // Dummy data for now, we will replace this with real data later
    { id: '1', title: 'Attention Is All You Need', author: 'Vaswani et al.', year: '2017', status: 'processed' },
    { id: '2', title: 'Graph RAG for Review', author: 'Microsoft Research', year: '2024', status: 'processed' },
  ],
  isLoading: false,
  highlightedNode:null,

  setGraph: (nodes, edges) => set({ nodes, edges }),
  setPapers: (papers) => set({ papers }),
  setLoading: (loading) => set({ isLoading: loading }),
  addPaper: (paper) => set((state) => ({ papers: [...state.papers, paper] })),
  setHighlightedNode: (nodeId) => set({highlightedNode:nodeId})
}));