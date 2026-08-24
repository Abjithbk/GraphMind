// src/components/GraphCanvas.tsx
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
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CustomNode } from './CustomNode';
import { useGraphStore } from '@/store/useGraphStore';
import { Loader2 } from 'lucide-react';

const nodeTypes = { custom: CustomNode };

function GraphCanvasContent() {
  const { nodes: storeNodes, edges: storeEdges, isLoading, highlightedNode } = useGraphStore();
  const { fitView, setCenter } = useReactFlow(); // Now this works because of the Provider below
  
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Sync store updates to React Flow
  useEffect(() => {
    if (storeNodes.length !== nodes.length || storeNodes.length > 0) {
      setNodes(storeNodes);
      setEdges(storeEdges);
      // Automatically fit the view when new nodes are loaded
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
    }
  }, [storeNodes, storeEdges, setNodes, setEdges, fitView]);

  // Zoom to the highlighted node when clicked in chat
  useEffect(() => {
    if (highlightedNode) {
      const node = nodes.find(n => n.id === highlightedNode);
      if (node) {
        setCenter(node.position.x + 50, node.position.y + 50, { zoom: 1.5, duration: 800 });
      }
    }
  }, [highlightedNode, nodes, setCenter]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  return (
    <main className="flex-1 relative bg-background h-full">
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
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3f3f46" />
        <Controls className="!bg-card !border-border !rounded-lg !shadow-lg [&>button]:!bg-transparent [&>button]:!border-0 [&>button]:!text-foreground [&>button]:hover:!bg-muted" />
        <MiniMap 
          className="!bg-card !border-border !rounded-lg !shadow-lg"
          nodeColor={(node) => {
            if (node.data?.type === 'paper') return '#6366f1'; // Indigo
            if (node.data?.type === 'method') return '#10b981'; // Emerald
            if (node.data?.type === 'claim') return '#f59e0b'; // Amber
            return '#71717a';
          }}
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute top-6 right-6 bg-card/80 backdrop-blur-md p-3 rounded-lg border border-border shadow-lg pointer-events-none">
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

// Wrap the content in the Provider
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