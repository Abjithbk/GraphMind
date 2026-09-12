import {X,FileText,FlaskConical,Award,Network,BookOpen} from 'lucide-react'
import { useGraphStore } from '@/store/useGraphStore'
import { CustomNodeData } from '@/types'
import {motion , AnimatePresence} from 'framer-motion'

function PaperSummaryCard({ summary }: { summary: string }) {
  // Split the summary into sections by common headers (Problem, Method, Results, Limitations)
  const sections = summary.split(/\n(?=(?:Problem|Method|Results|Limitations|Contributions|Approach|Conclusion)\s*:)/i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-6 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
    >
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-indigo-400" />
        <h4 className="font-semibold text-indigo-300 uppercase tracking-wider text-xs">
          Paper Summary
        </h4>
      </div>
      <div className="space-y-2">
        {sections.map((section, idx) => {
          const trimmed = section.trim();
          if (!trimmed) return null;

          // Check if section starts with a known header
          const headerMatch = trimmed.match(/^(Problem|Method|Results|Limitations|Contributions|Approach|Conclusion)\s*:\s*([\s\S]*)/i);

          if (headerMatch) {
            const [, header, content] = headerMatch;
            return (
              <div key={idx} className="text-xs">
                <span className="font-semibold text-indigo-300/90 capitalize">
                  {header.trim()}:
                </span>{' '}
                <span className="text-foreground/80 leading-relaxed">
                  {content.trim()}
                </span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
              {trimmed}
            </p>
          );
        })}
      </div>
    </motion.div>
  );
}

export function NodeDetailPanel() {
  const { selectedNode, setSelectedNode, nodes, edges } = useGraphStore();

  if (!selectedNode) return null;

  const nodeData = selectedNode.data as CustomNodeData;
  const nodeType = nodeData?.type || "unknown";
  const nodeName = nodeData?.label || "Unknown Node";

  // Find connected nodes
  const connectedEdges = edges.filter(
    (e) => e.source === selectedNode.id || e.target === selectedNode.id
  );

  const getIcon = (type: string) => {
    if (type === "paper") return <FileText className="h-4 w-4 text-indigo-400" />;
    if (type === "method") return <FlaskConical className="h-4 w-4 text-emerald-400" />;
    if (type === "claim") return <Award className="h-4 w-4 text-amber-400" />;
    return <Network className="h-4 w-4 text-zinc-400" />;
  };

  const getTypeColor = (type: string) => {
    if (type === "paper") return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
    if (type === "method") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    if (type === "claim") return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    return "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
  };

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute top-4 right-4 bottom-4 w-80 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex justify-between items-start bg-background/50">
            <div className="flex-1 pr-2">
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border mb-2 ${getTypeColor(nodeType)}`}>
                {getIcon(nodeType)}
                <span className="capitalize">{nodeType}</span>
              </div>
              <h3 className="text-lg font-bold text-foreground leading-tight">{nodeName}</h3>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedNode(null)}
              className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Paper Summary */}
            {nodeType === "paper" && nodeData?.summary && (
              <PaperSummaryCard summary={nodeData.summary} />
            )}

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Connected Nodes ({connectedEdges.length})
              </h4>
              <div className="space-y-2">
                {connectedEdges.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No direct connections.</p>
                ) : (
                  connectedEdges.map((edge) => {
                    const isSource = edge.source === selectedNode.id;
                    const connectedNodeId = isSource ? edge.target : edge.source;
                    const connectedNode = nodes.find((n) => n.id === connectedNodeId);
                    const relation = edge.label || "related_to";
                    const direction = isSource ? "outgoing" : "incoming";

                    if (!connectedNode) return null;
                    
                    // Use the interface here too!
                    const connData = connectedNode.data as CustomNodeData;

                    return (
                      <motion.div
                        key={edge.id}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="p-3 rounded-lg border border-border bg-background/50 hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedNode(connectedNode)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getIcon(connData?.type || 'unknown')}
                          <span className="text-sm font-medium text-foreground truncate">
                            {connData?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono`}>
                            {relation}
                          </span>
                          <span className="italic">({direction})</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}