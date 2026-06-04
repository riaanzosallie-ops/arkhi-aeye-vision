import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";
import { aiAsk, aiSuggestions } from "@/lib/ai.functions";
import { trackAi } from "@/lib/analytics";
import { homeProfileContext } from "@/lib/homeContext";

export const Route = createFileRoute("/chat")({ component: Chat });

type Msg = { role: "user" | "ai"; text: string };

function Chat() {
  const ask = useServerFn(aiAsk);
  const getSuggestions = useServerFn(aiSuggestions);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "I'm A-Eye — your design companion. Ask me about your rooms, redesigns, UAE pricing, or how Arkhi works." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ctx = homeProfileContext();
      const res = await trackAi("chat_suggestions", () => getSuggestions({ data: { context: ctx } }));
      if (!cancelled && res.ok) setSuggestions(res.suggestions);
    })();
    return () => { cancelled = true; };
  }, [getSuggestions]);

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || busy) return;
    setMsgs(m => [...m, { role: "user", text: t }]);
    setInput("");
    setBusy(true);
    const res = await trackAi("chat", () => ask({ data: { kind: "chat", prompt: `${homeProfileContext()}\n\nUser: ${t}` } }));
    setMsgs(m => [...m, {
      role: "ai",
      text: res.ok
        ? res.text
        : (res.error === "AI_KEY_MISSING"
            ? "⚙ AI setup required."
            : "A-Eye is unavailable right now. Please try again in a moment."),
    }]);
    setBusy(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Design Companion"
        title={<>A-Eye <span className="text-gradient-gold">Chat</span></>}
        subtitle="Live AI design and shopping companion — grounded in real UAE retail data."
      />

      <LuxeCard className="p-4 md:p-6 min-h-[60vh] flex flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "gradient-gold text-onyx" : "hairline bg-card/60"
              }`}>
                {m.role === "ai" && <Sparkles className="inline size-3.5 text-gold mr-1.5" />}
                {m.text}
              </div>
            </div>
          ))}
          {busy && <div className="text-xs text-muted-foreground">A-Eye is thinking…</div>}
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {suggestions.map(s => (
              <button key={s} onClick={() => send(s)} className="text-xs hairline rounded-full px-3 py-1.5 hover:bg-gold/10">{s}</button>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask A-Eye anything…"
            className="flex-1 bg-input/40 hairline rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
          />
          <GoldButton onClick={() => send()} disabled={busy}><Send className="size-4" /></GoldButton>
        </div>
      </LuxeCard>
    </div>
  );
}
