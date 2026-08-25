import {create} from 'zustand'
import { CustomNodeData, GraphState } from '@/types'

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
    const paperNodes = nodes.filter((n) => (n.data as CustomNodeData)?.type === 'paper');
    return paperNodes.map((p) => ({
      title: (p.data as CustomNodeData)?.label || 'Unknown Paper',
      author: 'Unknown Author',
      year: 'Unknown Year'
    }));
  },
}));