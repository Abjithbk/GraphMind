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
  selectedNode: Node | null;
  searchQuery: string;
  activeFilters: string[]
  // Actions
  setGraph: (nodes: Node[], edges: Edge[]) => void;
  setPapers: (papers: Paper[]) => void;
  setLoading: (loading: boolean) => void;
  addPaper: (paper: Paper) => void;
  setHighlightedNode: (nodeId:string|null) => void;
  setSelectedNode: (node:Node|null) => void;
  setSearchQuery: (query: string) => void;
  toggleFilter: (type:string) => void;
  getLoadedPapers: () => Array<{title: string,author: string,year:string}>;
}

export const useGraphStore = create<GraphState>((set,get) => ({
  nodes: [],
  edges: [],
  papers: [
    // Dummy data for now, we will replace this with real data later
    { id: '1', title: 'Attention Is All You Need', author: 'Vaswani et al.', year: '2017', status: 'processed' },
    { id: '2', title: 'Graph RAG for Review', author: 'Microsoft Research', year: '2024', status: 'processed' },
  ],
  isLoading: false,
  highlightedNode:null,
  selectedNode:null,
  searchQuery:'',
  activeFilters:['paper','method','claim'],

  setGraph: (nodes, edges) => set({ nodes, edges }),
  setPapers: (papers) => set({ papers }),
  setLoading: (loading) => set({ isLoading: loading }),
  addPaper: (paper) => set((state) => ({ papers: [...state.papers, paper] })),
  setHighlightedNode: (nodeId) => set({highlightedNode:nodeId}),
  setSelectedNode: (node) => set({selectedNode: node}),
  setSearchQuery: (query) => set({searchQuery: query}),
  toggleFilter: (type) => set((state) => {
    const isActive = state.activeFilters.includes(type);
    return {
      activeFilters: isActive ? state.activeFilters.filter((t) => t !== type) : [...state.activeFilters,type]
    }
  }),
    getLoadedPapers: () => {
    const { nodes } = get();
    const paperNodes = nodes.filter((n) => (n.data as any)?.type === 'paper');
    return paperNodes.map((p) => ({
      title: (p.data as any)?.label || 'Unknown Paper',
      author: 'Unknown Author',
      year: 'Unknown Year'
    }));
  },
}));