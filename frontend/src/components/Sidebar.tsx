// src/components/Sidebar.tsx
"use client";

import { useState } from "react";
import { 
  Upload, Network, Library, MessageSquare, FolderOpen, 
  Settings, User, CheckCircle2, MoreVertical 
} from "lucide-react";

export function Sidebar() {
  const [papers] = useState([
    { id: 1, title: "Attention Is All You Need", author: "Vaswani et al.", year: "2017" },
    { id: 2, title: "Graph RAG for Review", author: "Microsoft Research", year: "2024" },
    { id: 3, title: "LLM Architectures", author: "Meta AI", year: "2023" },
    { id: 4, title: "Retriever Analysis", author: "DeepMind", year: "2022" },
  ]);

  return (
    <aside className="w-80 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Logo & Brand */}
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
          <button className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors">
            Process Files
          </button>
        </div>
      </div>

      {/* Paper List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Knowledge Base</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{papers.length} Loaded</span>
        </div>
        <div className="space-y-2">
          {papers.map((paper) => (
            <PaperItem key={paper.id} paper={paper} />
          ))}
        </div>
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

function NavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"}`}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function PaperItem({ paper }: { paper: any }) {
  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-sidebar-accent/50 transition-all cursor-pointer">
      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{paper.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{paper.author} • {paper.year}</p>
      </div>
      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-all">
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}