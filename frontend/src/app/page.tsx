"use client"
import { Sidebar } from "@/components/Sidebar";
import { GraphCanvas } from "@/components/GraphCanvas";
import { ChatPanel } from "@/components/ChatPanel";

export default function Dashboard() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <GraphCanvas />
      <ChatPanel />
    </div>
  );
}