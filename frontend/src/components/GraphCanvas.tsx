// src/components/GraphCanvas.tsx
"use client";

import { useCallback } from 'react';
import { 
  ReactFlow, Background, Controls, MiniMap, addEdge, 
  useNodesState, useEdgesState, BackgroundVariant 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from './CustomNode';
import { useGraphStore } from '@/store/useGraphStore';
import { Loader2 } from 'lucide-react';

const nodeTypes = { custom: CustomNode };

export function GraphCanvas() {
  // 1. Get real data from the store
  const { nodes: storeNodes, edges: storeEdges, isLoading } = useGraphStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Sync store updates to React Flow
  if (storeNodes.length !== nodes.length) {
    setNodes(storeNodes);
    setEdges(storeEdges);
  }

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
        <MiniMap className="!bg-card !border-border !rounded-lg !shadow-lg" />
      </ReactFlow>

      {/* Legend (Remains the same) */}
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

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}