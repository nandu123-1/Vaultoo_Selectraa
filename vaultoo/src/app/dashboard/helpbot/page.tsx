"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User, Sparkles, Trash2, AlertCircle } from "lucide-react";
import Card from "@/components/ui/Card";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function HelpBotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey there! 👋 I'm **Vaultoo HelpBot**, your AI assistant for all things access management.\n\nAsk me about:\n- How sessions & OTPs work\n- Security best practices\n- Troubleshooting issues\n- Feature explanations\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      // Build history (exclude welcome message)
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/helpbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, history }),
      });

      const data = await res.json();

      if (data.success && data.data?.reply) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setError(data.message || "Failed to get response");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared! How can I help you?",
        timestamp: new Date(),
      },
    ]);
  };

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      // Bold
      let rendered = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-white font-semibold">$1</strong>',
      );
      // Inline code
      rendered = rendered.replace(
        /`(.*?)`/g,
        '<code class="bg-white/10 px-1.5 py-0.5 rounded text-violet-300 text-xs">$1</code>',
      );
      // Bullet points
      if (rendered.startsWith("- ")) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-violet-400 mt-0.5">•</span>
            <span dangerouslySetInnerHTML={{ __html: rendered.slice(2) }} />
          </div>
        );
      }
      // Numbered lists
      const numMatch = rendered.match(/^(\d+)\.\s/);
      if (numMatch) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-violet-400 font-mono text-xs mt-0.5 w-4">
              {numMatch[1]}.
            </span>
            <span
              dangerouslySetInnerHTML={{
                __html: rendered.slice(numMatch[0].length),
              }}
            />
          </div>
        );
      }
      return (
        <p
          key={i}
          className={line === "" ? "h-2" : ""}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            HelpBot
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            AI assistant powered by Google Gemini
          </p>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-violet-500 to-purple-600"
                      : "bg-white/10"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Sparkles className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-white/5 border border-white/5 text-slate-300"
                      : "bg-violet-500/20 border border-violet-500/20 text-slate-200"
                  }`}
                >
                  <div className="space-y-1">{renderContent(msg.content)}</div>
                  <p className="text-[10px] text-slate-600 mt-2">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/5 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about Vaultoo..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium text-sm hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
