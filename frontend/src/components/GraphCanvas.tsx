"use client";

import { useCallback, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  addEdge, 
  useNodesState, 
  useEdgesState, 
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  type Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CustomNode } from './CustomNode';
import { useGraphStore } from '@/store/useGraphStore';
import { CustomNodeData } from '@/types';
import { Loader2, Network } from 'lucide-react';
import { GraphToolbar } from './GraphToolbar';
import { fetchGraph } from '@/lib/api';
import { mapBackendToReactFlow } from '@/lib/graphMapper';

const nodeTypes = { custom: CustomNode };

function GraphCanvasContent() {
  const { nodes: storeNodes, edges: storeEdges, isLoading, highlightedNode, setSelectedNode, searchQuery, activeFilters,setGraph } = useGraphStore();
  const { fitView, setCenter } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  useEffect(() => {
    if (storeNodes.length !== nodes.length || storeNodes.length > 0) {
      setNodes(storeNodes);
      setEdges(storeEdges);
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
    }
  }, [storeNodes, storeEdges, setNodes, setEdges, fitView, nodes.length]);

  useEffect(() => {
    if (highlightedNode) {
      const node = nodes.find(n => n.id === highlightedNode);
      if (node) {
        setCenter(node.position.x + 50, node.position.y + 50, { zoom: 1.5, duration: 800 });
      }
    }
  }, [highlightedNode, nodes, setCenter]);

    //  Hydrate the UI from Neo4j when the page loads
  useEffect(() => {
    fetchGraph()
      .then((result) => {
        if (result.total_nodes > 0) {
          const { nodes, edges } = mapBackendToReactFlow(result);
          setGraph(nodes, edges);
        }
      })
      .catch((err) => console.error("No saved graph yet:", err));
  }, [setGraph]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const visibleNodes = storeNodes.filter((node) => {
    const data = node.data as CustomNodeData;
    const nodeType = data?.type || 'unknown';
    const nodeName = (data?.label || '').toLowerCase();
    const isTypeActive = activeFilters.includes(nodeType);
    const matchesSearch = searchQuery === '' || nodeName.includes(searchQuery.toLowerCase());
    return isTypeActive && matchesSearch;
  });

  return (
    <main className="flex-1 relative bg-background h-full">
      <GraphToolbar />

      {storeNodes.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none z-0">
          <div className="text-center max-w-md px-6">
            <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-muted/50 border border-border flex items-center justify-center">
              <Network className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No Graph Loaded</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload your research papers using the sidebar to generate an interactive knowledge graph. 
              Connections, methods, and claims will appear here.
            </p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Extracting Knowledge Graph...</p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={visibleNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNode(node)}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3f3f46" />
        <Controls className="!bg-card !border-border !rounded-lg !shadow-lg [&>button]:!bg-transparent [&>button]:!border-0 [&>button]:!text-foreground [&>button]:hover:!bg-muted" />
        <MiniMap 
          className="!bg-card !border-border !rounded-lg !shadow-lg"
          nodeColor={(node) => {
            if (node.data?.type === 'paper') return '#6366f1';
            if (node.data?.type === 'method') return '#10b981';
            if (node.data?.type === 'claim') return '#f59e0b';
            return '#71717a';
          }}
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute top-6 right-6 bg-card/80 backdrop-blur-md p-3 rounded-lg border border-border shadow-lg pointer-events-none z-10">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Graph Legend</p>
        <div className="space-y-2">
          <LegendItem color="bg-indigo-500" label="Research Paper" />
          <LegendItem color="bg-emerald-500" label="Methodology" />
          <LegendItem color="bg-amber-500" label="Claim/Evidence" />
        </div>
      </div>
    </main>
  );
}

export function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCanvasContent />
    </ReactFlowProvider>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}