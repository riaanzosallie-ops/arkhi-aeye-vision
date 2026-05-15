import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Sparkles } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton, StatTile } from "@/components/ui-kit";
import { useAuth } from "@/lib/useAuth";
import { aiAsk } from "@/lib/ai.functions";

export const Route = createFileRoute("/investor")({ component: Investor });

const OWNER = "riaanzosallie@gmail.com";

function Investor() {
  const { user, loading } = useAuth();
  const ask = useServerFn(aiAsk);
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  const authed = user?.email?.toLowerCase() === OWNER;
  if (!authed) {
    return (
      <div className="max-w-md mx-auto pt-20">
        <LuxeCard className="p-8 text-center">
          <Lock className="size-10 text-gold mx-auto mb-3" />
          <div className="font-display text-2xl">Investor Mode</div>
          <p className="text-muted-foreground text-sm mt-2">
            Owner-only access. {user ? "This account is not authorized." : "Sign in with the authorized owner email."}
          </p>
        </LuxeCard>
      </div>
    );
  }

  const askInvestor = async () => {
    if (!q.trim()) return;
    setBusy(true); setErr(null); setA(null);
    const res = await ask({ data: { kind: "investor", prompt: q } });
    if (res.ok) setA(res.text);
    else setErr(res.error === "AI_KEY_MISSING" ? "AI setup required" : `AI error: ${res.error}`);
    setBusy(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Owner · RIAANZO"
        title={<>Investor <span className="text-gradient-gold">Mode</span></>}
        subtitle="Revenue model, SaaS pricing, ROI projections, and partner conversion analytics."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="ARR Target Y1" value="AED 4.2M" />
        <StatTile label="Active partners" value="5" />
        <StatTile label="LTV : CAC" value="6.4×" />
        <StatTile label="Avg. retention" value="22mo" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { name: "Starter", price: "AED 2,400", period: "/month", feats: ["1 branch", "Basic AI scanner", "Lead capture"] },
          { name: "Pro", price: "AED 7,800", period: "/month", feats: ["10 branches", "White-label branding", "Snap & Compare API", "Catalogue sync"] },
          { name: "Enterprise", price: "Custom", period: "", feats: ["Unlimited branches", "Dedicated AI tuning", "On-prem deployment", "SLA + support"] },
        ].map((t) => (
          <LuxeCard key={t.name} className={`p-6 ${t.name === "Pro" ? "border-gold" : ""}`}>
            <div className="font-display text-2xl">{t.name}</div>
            <div className="font-display text-4xl mt-3 text-gradient-gold">{t.price}<span className="text-sm text-muted-foreground">{t.period}</span></div>
            <ul className="mt-4 space-y-2 text-sm">
              {t.feats.map(f => <li key={f} className="flex gap-2"><span className="text-gold">✓</span>{f}</li>)}
            </ul>
          </LuxeCard>
        ))}
      </div>

      <LuxeCard className="p-6 mt-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2 flex items-center gap-2"><Sparkles className="size-3.5" />Ask A-Eye for ROI</div>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. ROI for a Pan Emirates 5-store rollout"
            className="flex-1 bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" />
          <GoldButton onClick={askInvestor} disabled={busy}>{busy ? "…" : "Ask"}</GoldButton>
        </div>
        {err && <div className="text-sm text-amber-300 mt-3">{err}</div>}
        {a && <div className="text-sm whitespace-pre-wrap mt-4">{a}</div>}
      </LuxeCard>
    </div>
  );
}
