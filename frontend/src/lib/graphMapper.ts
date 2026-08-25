import { Node, Edge } from '@xyflow/react';
import { ExtractionResponse } from './api';

export function mapBackendToReactFlow(data: ExtractionResponse): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 1. Map Nodes
  data.nodes.forEach((node, index) => {
    // Calculate a simple circular layout so nodes don't stack on top of each other
    const angle = (index / data.nodes.length) * 2 * Math.PI;
    const radius = 300; // Spread them out
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    nodes.push({
      id: `node-${index}-${node.name}`, // Ensure unique ID
      type: 'custom', // Matches our CustomNode component
      position: { x, y },
      data: { 
        label: node.name, 
        type: node.type.toLowerCase() // 'paper', 'method', 'claim'
      },
    });
  });

  // 2. Map Edges
  data.edges.forEach((edge, index) => {
    // Find the exact IDs of the source and target nodes we just created
    const sourceNode = nodes.find(n => n.data.label === edge.source);
    const targetNode = nodes.find(n => n.data.label === edge.target);

    if (sourceNode && targetNode) {
      edges.push({
        id: `edge-${index}`,
        source: sourceNode.id,
        target: targetNode.id,
        label: edge.type, // e.g., 'uses_method'
        animated: true,
        style: { stroke: '#52525b', strokeWidth: 1.5 },
        labelStyle: { fill: '#d4d4d8', fontSize: 10, fontWeight: 700,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.05em' },

        labelBgStyle: {
          fill: '#18181b',
          rx:6,
          ry:6
        },
        labelBgPadding:[6,4],
        labelBgBorderRadius:6,
      });
    }
  });

  return { nodes, edges };
}