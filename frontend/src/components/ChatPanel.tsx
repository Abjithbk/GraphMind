"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, MessagesSquare } from "lucide-react";
import { useGraphStore } from "@/store/useGraphStore";
import { chatWithGraph } from "@/lib/api";
import { Message } from "@/types";
import { toast } from "sonner";

const SUGGESTED_QUESTIONS = [
  "What are the main methods used in these papers?",
  "What are the key claims regarding efficiency?",
  "How do these papers relate to each other?",
  "What are the common research gaps?"
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { nodes, edges, setHighlightedNode } = useGraphStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text:string) => {
    const messageText = text || input
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { id: crypto.randomUUID() , role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    
    // Create an empty AI message to stream into
    const aiMessageId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: aiMessageId, role: "ai", content: "" }]);
    
    setInput("");
    setIsLoading(true);

    try {
      await chatWithGraph({
        message: messageText,
        nodes: nodes.map(n => ({ name: n.data?.label as string, type: n.data?.type as string })),
        edges: edges.map(e => ({ source: e.source as string, target: e.target as string, type: e.label as string })),
      }, (token) => {
        // Append incoming tokens to the AI message
        setMessages((prev) => 
          prev.map(msg => msg.id === aiMessageId ? { ...msg, content: msg.content + token } : msg)
        );
      });
    } catch (error) {
      console.error(error)
      toast.error("Failed to get response",{
        duration:4000
      })
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "ai", content: "Error connecting to the brain." }]);
    } finally {
      setIsLoading(false);
    }
  };

const handleCitationClick = (citationText: string) => {
  console.log("Clicked citation:", citationText); // Debug log
  const getNodeLabel = (n: (typeof nodes)[number]) =>
    typeof n.data?.label === "string" ? n.data.label : null;
  
  // Try to find node by exact match first
  let node = nodes.find((n) => getNodeLabel(n) === citationText);
  
  // If not found, try partial match (remove " (method)", " (paper)", etc.)
  if (!node) {
    const cleanName = citationText.replace(/\s*\([^)]+\)\s*$/, '');
    console.log("Trying clean name:", cleanName);
    node = nodes.find((n) => {
      const label = getNodeLabel(n);
      return label ? label.toLowerCase().includes(cleanName.toLowerCase()) : false;
    });
  }
  
  // If still not found, try just the first word
  if (!node) {
    const firstName = citationText.split(' ')[0];
    console.log("Trying first word:", firstName);
    node = nodes.find((n) => {
      const label = getNodeLabel(n);
      return label ? label.toLowerCase().startsWith(firstName.toLowerCase()) : false;
    });
  }
  
  if (node) {
    console.log("Found node:", node.id, node.data?.label);
    setHighlightedNode(node.id);
  } else {
    console.warn("Node not found for:", citationText);
  }
};

  // Helper to render text with clickable citations like [Node Name]
  const renderContent = (content: string) => {
    const parts = content.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const nodeName = part.slice(1, -1);
        return (
          <button 
            key={i} 
            onClick={() => handleCitationClick(nodeName)}
            className="mx-1 px-1.5 py-0.5 bg-primary/20 text-primary hover:bg-primary/30 rounded text-xs font-mono font-bold transition-colors"
          >
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
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
          Clear
        </button>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          // BEAUTIFUL EMPTY STATE
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <MessagesSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">How can I help you?</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
              Ask me about connections, shared methods, or key claims in your loaded papers.
            </p>
            <div className="w-full space-y-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="w-full text-left p-3 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-sm text-foreground group"
                >
                  <span className="text-primary mr-2 group-hover:font-bold transition-all">→</span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // MESSAGES
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
                }`}>
                  {msg.role === "ai" ? renderContent(msg.content) : msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </>
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
            onKeyDown={(e) => e.key === "Enter" && handleSend("")}
            placeholder="Ask about cross-paper relationships..."
            disabled={isLoading}
            className="w-full h-10 pl-3 pr-10 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
          <button 
            onClick={() => handleSend("")} 
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