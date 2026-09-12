import { Node, Edge } from '@xyflow/react';
import { ExtractionResponse } from '@/types';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';

interface SimNode extends SimulationNodeDatum {
  id: string;
  nodeType: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string;
  target: string;
}

/**
 * Runs a d3-force simulation to compute node positions.
 * Paper nodes act as cluster centers; method/claim nodes gravitate
 * toward their associated paper via edge links.
 */
function computeForceLayout(
  simNodes: SimNode[],
  simLinks: SimLink[],
): Map<string, { x: number; y: number }> {
  const nodeCount = simNodes.length;

  // Scale spacing based on node count
  const chargeStrength = nodeCount > 30 ? -600 : nodeCount > 15 ? -400 : -250;
  const collisionRadius = nodeCount > 30 ? 80 : 60;

  // Give paper nodes initial spread so they don't cluster together
  const paperNodes = simNodes.filter((n) => n.nodeType === 'paper');
  paperNodes.forEach((node, i) => {
    const angle = (i / Math.max(paperNodes.length, 1)) * 2 * Math.PI;
    const radius = 200 + paperNodes.length * 30;
    node.x = Math.cos(angle) * radius;
    node.y = Math.sin(angle) * radius;
  });

  const simulation = forceSimulation<SimNode>(simNodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(120)
        .strength(0.7),
    )
    .force('charge', forceManyBody<SimNode>().strength(chargeStrength))
    .force('center', forceCenter(0, 0).strength(0.05))
    .force('collision', forceCollide<SimNode>(collisionRadius))
    // Pull paper nodes slightly toward center, let others be positioned by links
    .force(
      'x',
      forceX<SimNode>(0).strength((d) => (d.nodeType === 'paper' ? 0.03 : 0.01)),
    )
    .force(
      'y',
      forceY<SimNode>(0).strength((d) => (d.nodeType === 'paper' ? 0.03 : 0.01)),
    )
    .stop();

  // Run the simulation synchronously (no animation needed, we just want final positions)
  const iterations = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()));
  for (let i = 0; i < iterations; i++) {
    simulation.tick();
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (const node of simNodes) {
    positions.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 });
  }

  return positions;
}

export function mapBackendToReactFlow(data: ExtractionResponse): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Build simulation nodes and links for d3-force
  const simNodes: SimNode[] = data.nodes.map((node, index) => ({
    id: `node-${index}-${node.name}`,
    nodeType: node.type.toLowerCase(),
  }));

  // Build a lookup from label -> sim node id
  const labelToId = new Map<string, string>();
  data.nodes.forEach((node, index) => {
    labelToId.set(node.name, `node-${index}-${node.name}`);
  });

  const simLinks: SimLink[] = [];
  data.edges.forEach((edge) => {
    const sourceId = labelToId.get(edge.source);
    const targetId = labelToId.get(edge.target);
    if (sourceId && targetId) {
      simLinks.push({ source: sourceId, target: targetId });
    }
  });

  // Compute force-directed positions
  const positions = computeForceLayout(simNodes, simLinks);

  // 1. Map Nodes with computed positions
  data.nodes.forEach((node, index) => {
    const id = `node-${index}-${node.name}`;
    const pos = positions.get(id) ?? { x: 0, y: 0 };

    nodes.push({
      id,
      type: 'custom',
      position: { x: pos.x, y: pos.y },
      data: {
        label: node.name,
        type: node.type.toLowerCase(),
        summary: node.summary,
      },
    });
  });

  // 2. Map Edges
  data.edges.forEach((edge, index) => {
    const sourceNode = nodes.find(n => n.data.label === edge.source);
    const targetNode = nodes.find(n => n.data.label === edge.target);

    if (sourceNode && targetNode) {
      edges.push({
        id: `edge-${index}`,
        source: sourceNode.id,
        target: targetNode.id,
        label: edge.type,
        animated: true,
        style: { stroke: '#52525b', strokeWidth: 1.5 },
        labelStyle: { fill: '#d4d4d8', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' },
        labelBgStyle: {
          fill: '#18181b',
          rx: 6,
          ry: 6,
        },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 6,
      });
    }
  });

  return { nodes, edges };
}