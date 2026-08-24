// src/components/ChatPanel.tsx
"use client";
import { useState,useRef,useEffect } from "react";
import { Loader2, MessageSquare, Paperclip, Send, Sparkles } from "lucide-react";
import { useGraphStore } from "@/store/useGraphStore";
import { chatWithGraph } from "@/lib/api";
interface Message {
  id:string;
  role: "user" | "ai";
  content: string;
}
export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "ai", content: "Hello! I'm your Research Assistant. Ask me about the connections between your papers, shared methods, or key claims." }
  ]);
  const [input,setInput] = useState("")
  const [isLoading,setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Get current graph state from store to send as context
  const { nodes, edges } = useGraphStore();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send the question AND the current graph context to the backend
      const response = await chatWithGraph({
        message: input,
        nodes: nodes.map(n => ({ name: n.data?.label as string, type: n.data?.type as string })),
        edges: edges.map(e => ({ source: e.source as string, target: e.target as string, type: e.label as string })),
      });

      const aiMessage: Message = { id: (Date.now() + 1).toString(), role: "ai", content: response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "ai", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <aside className="w-96 border-l border-border bg-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Research Assistant</h2>
        </div>
        <button 
          onClick={() => setMessages([])}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear Chat
        </button>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
              msg.role === "user" 
                ? "bg-primary text-primary-foreground" 
                : "bg-card border border-border text-foreground"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about cross-paper relationships..."
            disabled={isLoading}
            className="w-full h-10 pl-3 pr-10 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-1.5 bg-primary hover:bg-primary/90 rounded transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
}