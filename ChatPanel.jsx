import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { streamChat } from "../api";

export default function ChatPanel({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const question = input.trim();
    if (!question || isStreaming) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);

    // Placeholder assistant message that we'll fill in as tokens stream in
    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: "", citations: {}, isStreaming: true },
    ]);
    setIsStreaming(true);

    await streamChat(
      { sessionId, question },
      {
        onCitations: (citations) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              citations,
            };
            return updated;
          });
        },
        onToken: (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, text: last.text + token };
            return updated;
          });
        },
        onDone: () => {
          setIsStreaming(false);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              isStreaming: false,
            };
            return updated;
          });
        },
        onError: (message) => {
          setIsStreaming(false);
          setError(message);
          setMessages((prev) => prev.slice(0, -1)); // remove the empty placeholder
        },
      }
    );
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-8 py-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber">
              Sheet 02 / Query
            </p>
            <p className="mt-2 max-w-sm font-body text-sm text-blueprint-muted">
              Ask anything about the documents you uploaded. Every claim in
              the answer links back to its exact source.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            text={msg.text}
            citations={msg.citations}
            isStreaming={msg.isStreaming}
          />
        ))}
      </div>

      <div className="border-t border-blueprint-border px-8 py-5">
        {error && (
          <p className="mb-3 rounded-sm border border-red-400/30 bg-red-400/10 px-4 py-2 font-mono text-xs text-red-300">
            {error}
          </p>
        )}
        <div className="flex items-end gap-3 rounded-sm border border-blueprint-border bg-blueprint-panel px-4 py-3 focus-within:border-teal">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a question about your documents…"
            className="flex-1 resize-none bg-transparent font-body text-sm text-blueprint-line placeholder:text-blueprint-muted focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 rounded-sm bg-amber p-2 text-blueprint-panel transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
