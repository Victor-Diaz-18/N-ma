import { useState, useRef, useEffect } from "react";
import { useTheme } from "../lib/theme";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { api } from "../lib/api";

export default function AIChatbot({ courseId }) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const s = {
    panel: { background: dark ? "#27272a" : "#fff", borderColor: dark ? "#3f3f46" : "#000" },
    header: { background: "#8BC34A", color: "#18181b" },
    msgUser: { background: "#8BC34A", color: "#18181b", alignSelf: "flex-end", maxWidth: "80%" },
    msgBot: { background: dark ? "#3f3f46" : "#f3f4f6", color: dark ? "#fafafa" : "#1a1a1a", alignSelf: "flex-start", maxWidth: "80%" },
    input: { background: dark ? "#3f3f46" : "#fff", color: dark ? "#fafafa" : "#1a1a1a", borderColor: dark ? "#52525b" : "#d1d5db" },
    fab: { background: "#8BC34A", color: "#18181b" },
  };

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/ai/chat", { course_id: courseId, question: q });
      setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
    } catch (e) {
      const msg = e.response?.status === 429
        ? "Límite de solicitudes alcanzado. Espera unos minutos."
        : "Error al procesar tu pregunta.";
      setMessages((prev) => [...prev, { role: "bot", text: msg }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full nb-shadow nb-press flex items-center justify-center"
        style={{ ...s.fab, position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}
        title="Dudas del curso"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className="w-80 max-w-[calc(100vw-48px)] flex flex-col nb-border nb-shadow"
          style={{ ...s.panel, position: "fixed", bottom: "96px", right: "24px", zIndex: 9999, height: "450px", borderWidth: 2 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 p-3" style={s.header}>
            <Bot className="w-5 h-5" />
            <span className="font-extrabold text-sm uppercase tracking-wide flex-1">
              Asistente IA
            </span>
            <button onClick={() => setOpen(false)} className="nb-press p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-sm font-medium pt-8" style={{ color: dark ? "#71717a" : "#9ca3af" }}>
                <Bot className="w-8 h-8 mx-auto mb-2" style={{ color: dark ? "#71717a" : "#9ca3af" }} />
                Pregúntame lo que quieras sobre el contenido de este curso.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className="flex gap-2" style={{ justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "bot" && (
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1" style={{ background: "#8BC34A", color: "#18181b" }}>
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className="px-3 py-2 text-sm font-medium whitespace-pre-wrap"
                  style={m.role === "user" ? s.msgUser : s.msgBot}
                >
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1" style={{ background: dark ? "#52525b" : "#e5e7eb", color: dark ? "#fafafa" : "#1a1a1a" }}>
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-start">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "#8BC34A", color: "#18181b" }}>
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="px-3 py-2" style={{ background: dark ? "#3f3f46" : "#f3f4f6" }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#8BC34A" }} />
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <div className="p-3" style={{ borderTop: `2px solid ${dark ? "#3f3f46" : "#e5e7eb"}` }}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-3 py-2 nb-border text-sm font-medium"
                style={s.input}
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="nb-press px-3 py-2 nb-border"
                style={{ background: input.trim() ? "#8BC34A" : dark ? "#3f3f46" : "#e5e7eb", color: input.trim() ? "#18181b" : dark ? "#71717a" : "#9ca3af" }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
