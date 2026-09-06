"use client";

import { 
  Upload, Network, Library, MessageSquare, FolderOpen, 
  Settings, User, CheckCircle2,
  Loader2, ChevronDown,
  LucideIcon
} from "lucide-react";
import { useGraphStore } from "@/store/useGraphStore";
import { extractGraph } from "@/lib/api";
import { mapBackendToReactFlow } from "@/lib/graphMapper";
import { LoadedPaperSummary } from "@/types";
import { toast } from 'sonner';
import { useState } from "react";

export function Sidebar() {
  const { setGraph, setLoading, isLoading, getLoadedPapers } = useGraphStore();
  const loadedPapers = getLoadedPapers();

  const handleProcessFiles = async () => {
    setLoading(true);
    toast.loading("Extracting knowledge graph from PDFs..", {
      id: "extract-process",
      duration: 4000
    });

    try {
      const testPaths = [
        "C:/Users/bkabj/Documents/lit-graphrag/backend/src/backend/papers/paper1.pdf",
        "C:/Users/bkabj/Documents/lit-graphrag/backend/src/backend/papers/paper2.pdf"
      ];
      
      const result = await extractGraph(testPaths);
      const { nodes, edges } = mapBackendToReactFlow(result);

      setGraph(nodes, edges);
      toast.success(`Successfully processed ${result.papers_processed} papers!`, {
        id: "extract-process",
        description: `${result.total_nodes} nodes and ${result.total_edges} edges created.`,
        duration: 4000
      });

    } catch (error) {
      console.error(error);
      toast.error("Failed to process files.", {
        id: "extract-process",
        description: "Please check your console and ensure the backend is running.",
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  }

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

      {/* Upload Zone */}
      <div className="p-4 border-y border-sidebar-border">
        <div className="bg-card rounded-lg border border-border p-4">
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
            className="w-full py-2 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Process Files"
            )}
          </button>
        </div>
      </div>

      {/* Paper List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Knowledge Base
          </h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {loadedPapers.length} Loaded
          </span>
        </div>

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
          <button className="p-2 hover:bg-muted rounded-md transition-colors">
            <Settings className="h-4 w-4 text-muted-foreground" />
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