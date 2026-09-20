"use client";

import { 
  Upload, Network, Library, MessageSquare, FolderOpen, 
  Settings, User, CheckCircle2, Circle,
  Loader2, ChevronDown,
  Trash2, AlertTriangle,
  LucideIcon
} from "lucide-react";
import { useGraphStore } from "@/store/useGraphStore";
import { extractGraphStream, resetKnowledgeBase } from "@/lib/api";
import { mapBackendToReactFlow } from "@/lib/graphMapper";
import { IngestionProgressEvent, LoadedPaperSummary } from "@/types";
import { toast } from 'sonner';
import { useState } from "react";

const INGESTION_STEPS = [
  { id: 1, title: "Parsing PDF Text", desc: "Extracting content and sections" },
  { id: 2, title: "Generating Vector Embeddings", desc: "Indexing chunks in ChromaDB" },
  { id: 3, title: "Extracting Knowledge Graph", desc: "LLM entity & relationship extraction" },
  { id: 4, title: "Generating Paper Profile", desc: "Grounded multi-aspect synthesis" },
];

interface IngestionProgressState {
  paper: string;
  paperIndex: number;
  totalPapers: number;
  step: number;
  stepName: string;
}

export function Sidebar() {
  const { setGraph, setLoading, isLoading, getLoadedPapers, clearGraph } = useGraphStore();
  const [progress, setProgress] = useState<IngestionProgressState | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const loadedPapers = getLoadedPapers();

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      await resetKnowledgeBase();
      clearGraph();
      setShowResetConfirm(false);
      toast.success("Knowledge Base Reset", {
        description: "Neo4j graph and ChromaDB vectors have been cleared.",
        duration: 4000,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to reset knowledge base", {
        description: error instanceof Error ? error.message : "Please check backend connection.",
        duration: 4000,
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleProcessFiles = async () => {
    setLoading(true);
    setProgress({
      paper: "paper1.pdf",
      paperIndex: 1,
      totalPapers: 2,
      step: 1,
      stepName: "Parsing PDF...",
    });

    try {
      const testPaths = [
        "C:/Users/bkabj/Documents/lit-graphrag/backend/src/backend/papers/paper1.pdf",
        "C:/Users/bkabj/Documents/lit-graphrag/backend/src/backend/papers/paper2.pdf"
      ];
      
      const result = await extractGraphStream(testPaths, (event: IngestionProgressEvent) => {
        if (event.type === 'paper_start') {
          setProgress(prev => ({
            paper: event.paper || prev?.paper || 'Unknown Paper',
            paperIndex: event.paper_index || prev?.paperIndex || 1,
            totalPapers: event.total_papers || prev?.totalPapers || 2,
            step: 1,
            stepName: "Parsing PDF...",
          }));
        } else if (event.type === 'step') {
          setProgress(prev => ({
            paper: event.paper || prev?.paper || 'Unknown Paper',
            paperIndex: event.paper_index || prev?.paperIndex || 1,
            totalPapers: event.total_papers || prev?.totalPapers || 2,
            step: event.step || prev?.step || 1,
            stepName: event.name || '',
          }));
        } else if (event.type === 'paper_complete') {
          setProgress(prev => ({
            paper: event.paper || prev?.paper || '',
            paperIndex: event.paper_index || prev?.paperIndex || 1,
            totalPapers: event.total_papers || prev?.totalPapers || 2,
            step: 4,
            stepName: "Paper complete",
          }));
        }
      });

      const { nodes, edges } = mapBackendToReactFlow(result);
      setGraph(nodes, edges);

      toast.success(`Successfully processed ${result.papers_processed} papers!`, {
        description: `${result.total_nodes} nodes and ${result.total_edges} edges created.`,
        duration: 4000
      });

    } catch (error) {
      console.error(error);
      toast.error("Failed to process files.", {
        description: error instanceof Error ? error.message : "Please check your console and ensure the backend is running.",
        duration: 5000
      });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const currentPercent = progress 
    ? Math.min(100, Math.round((((progress.paperIndex - 1) * 4 + progress.step) / (progress.totalPapers * 4)) * 100))
    : 0;

  return (
    <aside className="w-80 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Logo and Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">GraphRAG</h1>
            <p className="text-xs text-muted-foreground">Literature Review Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        <NavItem icon={Library} label="Library" active />
        <NavItem icon={Network} label="Knowledge Graph" />
        <NavItem icon={MessageSquare} label="Research AI" />
        <NavItem icon={FolderOpen} label="Collections" />
      </nav>

      {/* Upload Zone & Live Stepper */}
      <div className="p-4 border-y border-sidebar-border">
        <div className="bg-card rounded-lg border border-border p-4">
          {!isLoading ? (
            <>
              <div className="text-center mb-3">
                <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Upload PDFs or URLs</p>
                <p className="text-xs text-muted-foreground mt-1">Drag & drop or click</p>
              </div>

              <button
                onClick={handleProcessFiles}
                disabled={isLoading}
                className="w-full py-2 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Process Files
              </button>
            </>
          ) : (
            <div className="space-y-3">
              {/* Stepper Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    Paper {progress?.paperIndex} of {progress?.totalPapers}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {currentPercent}%
                </span>
              </div>

              {/* Truncated Paper Name */}
              <p className="text-xs text-muted-foreground truncate font-medium bg-muted/50 px-2 py-1 rounded">
                📄 {progress?.paper}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${currentPercent}%` }}
                />
              </div>

              {/* 4 Steps List */}
              <div className="space-y-2 pt-1">
                {INGESTION_STEPS.map((step) => {
                  const isDone = (progress?.step ?? 1) > step.id;
                  const isCurrent = (progress?.step ?? 1) === step.id;

                  return (
                    <div 
                      key={step.id} 
                      className={`flex items-start gap-2.5 p-1.5 rounded-md transition-colors ${
                        isCurrent ? "bg-primary/5 border border-primary/20" : ""
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : isCurrent ? (
                          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-medium truncate ${
                            isCurrent ? "text-primary font-semibold" : isDone ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {step.title}
                          </p>
                          {isCurrent && (
                            <span className="text-[9px] text-primary animate-pulse font-mono">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Paper List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Knowledge Base
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {loadedPapers.length} Loaded
            </span>
            {loadedPapers.length > 0 && (
              <button
                onClick={() => setShowResetConfirm(true)}
                title="Reset Knowledge Base"
                className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="mb-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-destructive font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>Clear Knowledge Base?</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              This will delete all graph nodes from Neo4j and vector embeddings from ChromaDB.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="px-2.5 py-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {isResetting ? "Clearing..." : "Yes, Clear All"}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground rounded text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loadedPapers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No papers loaded yet
          </p>
        ) : (
          <div className="space-y-2">
            {loadedPapers.map((paperNode,id) => (
              <PaperItem
                key={id}
                paper={paperNode}
              />
            ))}
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Dr. Sarah Chen</p>
              <p className="text-xs text-muted-foreground">Pro Researcher</p>
            </div>
          </div>
          <button 
            onClick={() => setShowResetConfirm(true)}
            title="Reset Knowledge Base"
            className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}


function NavItem({ icon: Icon, label, active = false }: { icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"}`}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function PaperItem({ paper }: { paper: LoadedPaperSummary }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded((e) => !e)}
      className="group flex flex-col p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-sidebar-accent/50 transition-all cursor-pointer"
    >
      {/* Header: Title and Expand Icon */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        <p className="text-sm font-medium text-foreground truncate flex-1">
          {paper.title}
        </p>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Expandable Author/Year */}
      {expanded && (
        <div className="mt-2 text-xs text-muted-foreground border-l-2 border-primary/30 pl-3 ml-6 space-y-0.5">
          <p><span className="font-medium">Author:</span> {paper.author}</p>
          <p><span className="font-medium">Year:</span> {paper.year}</p>
        </div>
      )}
    </div>
  );
}