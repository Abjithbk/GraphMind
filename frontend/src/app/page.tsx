"use client"
import { Sidebar } from "@/components/Sidebar";
import { GraphCanvas } from "@/components/GraphCanvas";
import { ChatPanel } from "@/components/ChatPanel";
import { NodeDetailPanel } from "@/components/NodeDetailPanel";

export default function Dashboard() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 relative">
        <GraphCanvas />
        <NodeDetailPanel/>
      </div>
      <ChatPanel />
    </div>
  );
}