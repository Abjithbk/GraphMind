// src/components/ChatPanel.tsx
"use client";

import { MessageSquare, Paperclip, Send } from "lucide-react";

export function ChatPanel() {
  return (
    <aside className="w-96 border-l border-border bg-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Research Assistant</h2>
        </div>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Clear Chat
        </button>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="text-center text-muted-foreground mt-10">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Ask about cross-paper relationships...</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask about cross-paper relationships..."
            className="w-full h-10 pl-3 pr-20 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button className="p-1.5 hover:bg-muted rounded transition-colors">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="p-1.5 bg-primary hover:bg-primary/90 rounded transition-colors">
              <Send className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}