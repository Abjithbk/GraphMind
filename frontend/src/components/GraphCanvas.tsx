// src/components/GraphCanvas.tsx
"use client";

import { useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  addEdge, 
  useNodesState, 
  useEdgesState,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CustomNode } from './CustomNode';

// Register our custom node type
const nodeTypes = { custom: CustomNode };

// Dummy data to visualize the graph immediately
const initialNodes = [
  { id: '1', type: 'custom', position: { x: 250, y: 50 }, data: { label: 'Attention Is All You Need', type: 'paper' } },
  { id: '2', type: 'custom', position: { x: 100, y: 200 }, data: { label: 'Transformer', type: 'method' } },
  { id: '3', type: 'custom', position: { x: 400, y: 200 }, data: { label: 'Self-Attention', type: 'method' } },
  { id: '4', type: 'custom', position: { x: 250, y: 350 }, data: { label: '15% faster training', type: 'claim' } },
  { id: '5', type: 'custom', position: { x: 50, y: 350 }, data: { label: 'LoRA', type: 'method' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', label: 'uses_method', animated: true },
  { id: 'e1-3', source: '1', target: '3', label: 'uses_method', animated: true },
  { id: 'e1-4', source: '1', target: '4', label: 'makes_claim' },
  { id: 'e2-5', source: '2', target: '5', label: 'extended_by' },
];

export function GraphCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  return (
    <main className="flex-1 relative bg-background h-full">
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
        {/* Subtle dot grid background */}
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3f3f46" />
        
        {/* Interactive Controls */}
        <Controls 
          className="!bg-card !border-border !rounded-lg !shadow-lg [&>button]:!bg-[transparent] [&>button]:!border-0 [&>button]:!text-foreground [&>button]:hover:!bg-muted" 
        />
        
        {/* Minimap for large graphs */}
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

      {/* Graph Legend (Floating Top Right) */}
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