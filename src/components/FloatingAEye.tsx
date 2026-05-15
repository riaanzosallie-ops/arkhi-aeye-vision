import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, X, Send, Sparkles } from "lucide-react";
import { aiAsk } from "@/lib/ai.functions";
import { homeProfileContext } from "@/lib/homeContext";

type Msg = { role: "user" | "ai"; text: string };

const ROUTE_CONTEXT: Record<string, { kind: string; hint: string }> = {
  "/home-profile": { kind: "chat", hint: "the user's saved rooms, uploads, and home preferences" },
  "/design": { kind: "chat", hint: "redesign directions, styles and design journey" },
  "/scanner": { kind: "scanner", hint: "the room currently being analyzed" },
  "/snap-compare": { kind: "snap", hint: "comparing a furniture item to the user's saved room" },
  "/floor-plan": { kind: "floorplan", hint: "floor plan, dimensions and zoning" },
  "/companies": { kind: "chat", hint: "Company Hub partner value, white-label, lead capture" },
  "/investor": { kind: "investor", hint: "ROI, SaaS tiers, white-label, commercial model" },
  "/pricing": { kind: "pricing", hint: "UAE retailers and full-room shopping plans" },
  "/projects": { kind: "chat", hint: "the user's design projects" },
  "/chat": { kind: "chat", hint: "general A-Eye consultant questions" },
  "/profile": { kind: "chat", hint: "the user's account" },
  "/": { kind: "chat", hint: "the Arkhi 2 platform overview" },
};

export function FloatingAEye() {
  const loc = useLocation();
  const ask = useServerFn(aiAsk);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const ctx = ROUTE_CONTEXT[loc.pathname] ?? ROUTE_CONTEXT["/"];

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  useEffect(() => { setMsgs([]); }, [loc.pathname]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setMsgs(m => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    const prompt = `Context: user is on ${loc.pathname} (${ctx.hint}).\n${homeProfileContext()}\n\nUser: ${text}`;
    const res = await ask({ data: { kind: ctx.kind, prompt } });
    setMsgs(m => [...m, { role: "ai", text: res.ok ? res.text : (res.error === "AI_KEY_MISSING" ? "AI setup required." : `Sorry — ${res.error}`) }]);
    setBusy(false);
  };

  return (
    <>
      {/* Floating button — sits above mobile bottom-nav (h≈64px) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Ask A-Eye"
        className={`fixed z-40 bottom-20 right-4 lg:bottom-6 lg:right-6 ${open ? "hidden" : ""} group`}
      >
        <span className="absolute inset-0 rounded-full bg-gold/30 blur-xl animate-pulse-gold" aria-hidden />
        <span className="relative flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full gradient-gold text-onyx shadow-luxe">
          <Eye className="size-5" />
          <span className="hidden sm:inline text-xs font-semibold tracking-wide">Ask A-Eye</span>
        </span>
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-end lg:justify-end" role="dialog" aria-label="A-Eye assistant">
          <div className="absolute inset-0 bg-onyx/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full lg:w-[420px] lg:m-6 lg:rounded-2xl bg-card hairline shadow-luxe flex flex-col max-h-[85vh] lg:max-h-[640px] rounded-t-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="size-8 rounded-full gradient-gold grid place-items-center text-onyx"><Eye className="size-4" /></span>
                <div>
                  <div className="text-sm font-display">A-Eye</div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{loc.pathname === "/" ? "Companion" : loc.pathname.slice(1).replace(/-/g, " ")}</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="hairline size-8 rounded-md grid place-items-center"><X className="size-4" /></button>
            </div>

            <div ref={scroller} className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              {msgs.length === 0 && (
                <div className="text-muted-foreground text-sm flex gap-2">
                  <Sparkles className="size-4 text-gold shrink-0 mt-0.5" />
                  <span>Hi — I'm A-Eye, your luxury design companion. Ask me anything about this screen and I'll help.</span>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : ""}>
                  {m.role === "user" ? (
                    <span className="inline-block bg-gold/10 hairline rounded-2xl px-3 py-2 text-sm">{m.text}</span>
                  ) : (
                    <div className="whitespace-pre-wrap text-foreground/90 text-sm leading-relaxed">{m.text}</div>
                  )}
                </div>
              ))}
              {busy && <div className="text-xs text-muted-foreground italic">A-Eye is thinking…</div>}
            </div>

            <div className="p-3 border-t border-border/60 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Ask A-Eye…"
                className="flex-1 bg-input/40 hairline rounded-lg px-3 py-2 text-sm"
              />
              <button onClick={send} disabled={busy} className="size-10 rounded-lg gradient-gold text-onyx grid place-items-center disabled:opacity-50">
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
