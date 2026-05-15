import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";
import { aiAsk } from "@/lib/ai.functions";

export const Route = createFileRoute("/chat")({ component: Chat });

type Msg = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "How does Arkhi integrate with Pan Emirates?",
  "What ROI should we expect?",
  "How does Snap & Compare work in-store?",
  "How does My Home Profile improve retention?",
];

function Chat() {
  const ask = useServerFn(aiAsk);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "I'm A-Eye — your partner consultant. Ask about ROI, white-label, conversion, or AI integration." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || busy) return;
    setMsgs(m => [...m, { role: "user", text: t }]);
    setInput("");
    setBusy(true);
    const res = await ask({ data: { kind: "chat", prompt: t } });
    setMsgs(m => [...m, { role: "ai", text: res.ok ? res.text : (res.error === "AI_KEY_MISSING" ? "⚙ AI setup required." : `AI error: ${res.error}`) }]);
    setBusy(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Partner Consultant"
        title={<>A-Eye <span className="text-gradient-gold">Chat</span></>}
        subtitle="Automated business consultant for investors, partners, and operators."
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

        <div className="flex flex-wrap gap-2 mt-4">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} className="text-xs hairline rounded-full px-3 py-1.5 hover:bg-gold/10">{s}</button>
          ))}
        </div>

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
