import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";
import { aiAsk } from "@/lib/ai.functions";
import { homeProfileContext } from "@/lib/homeContext";

export const Route = createFileRoute("/pricing")({ component: Pricing });

const ITEMS = [
  { name: "Modular sofa, 3-seater", store: "Pan Emirates", price: "AED 4,200", fit: 92, style: 88 },
  { name: "Oak coffee table 120cm", store: "Danube Home", price: "AED 1,150", fit: 88, style: 81 },
  { name: "Linen curtains, beige", store: "IKEA UAE", price: "AED 320", fit: 95, style: 84 },
  { name: "Floor lamp, brass arc", store: "Home Centre", price: "AED 690", fit: 90, style: 92 },
  { name: "Wool area rug 200x300", store: "Amazon UAE", price: "AED 880", fit: 85, style: 87 },
];

function Pricing() {
  const ask = useServerFn(aiAsk);
  const total = ITEMS.reduce((s, i) => s + parseInt(i.price.replace(/\D/g, "")), 0);
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const suggest = async () => {
    if (!q.trim()) return;
    setBusy(true); setErr(null); setA(null);
    const res = await ask({ data: { kind: "pricing", prompt: `${homeProfileContext()}\n\nCustomer request: ${q}` } });
    if (res.ok) setA(res.text);
    else setErr(res.error === "AI_KEY_MISSING" ? "AI setup required" : `AI error: ${res.error}`);
    setBusy(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Shopping Intelligence"
        title={<>Pricing & <span className="text-gradient-gold">Purchase Finder</span></>}
        subtitle="A-Eye-curated full-room shopping plans across UAE retailers — fit, style, and confidence-to-purchase scoring. Estimated price ranges; catalogue integration required for live SKUs."
        actions={<GoldButton>Export list</GoldButton>}
      />

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <LuxeCard className="p-5"><div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Items</div><div className="font-display text-3xl text-gradient-gold mt-2">{ITEMS.length}</div></LuxeCard>
        <LuxeCard className="p-5"><div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Estimated total</div><div className="font-display text-3xl text-gradient-gold mt-2">AED {total.toLocaleString()}</div></LuxeCard>
        <LuxeCard className="p-5"><div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Avg fit score</div><div className="font-display text-3xl text-gradient-gold mt-2">90%</div></LuxeCard>
      </div>

      <LuxeCard className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <tr className="border-b border-border/50">
              <th className="text-left p-4">Item</th>
              <th className="text-left p-4 hidden sm:table-cell">Store</th>
              <th className="text-right p-4">Price</th>
              <th className="text-right p-4 hidden md:table-cell">Fit</th>
              <th className="text-right p-4 hidden md:table-cell">Style</th>
            </tr>
          </thead>
          <tbody>
            {ITEMS.map((i) => (
              <tr key={i.name} className="border-b border-border/30 last:border-0 hover:bg-card/40">
                <td className="p-4">{i.name}</td>
                <td className="p-4 hidden sm:table-cell text-muted-foreground">{i.store}</td>
                <td className="p-4 text-right text-gold">{i.price}</td>
                <td className="p-4 text-right hidden md:table-cell">{i.fit}%</td>
                <td className="p-4 text-right hidden md:table-cell">{i.style}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </LuxeCard>

      <LuxeCard className="p-6 mt-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2 flex items-center gap-2"><Sparkles className="size-3.5" />Ask A-Eye for purchase suggestions</div>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Suggest a 4-piece living room set under AED 8,000"
            className="flex-1 bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" />
          <GoldButton onClick={suggest} disabled={busy}>{busy ? "…" : "Suggest"}</GoldButton>
        </div>
        {err && <div className="text-sm text-amber-300 mt-3">{err}</div>}
        {a && <div className="text-sm whitespace-pre-wrap mt-4">{a}</div>}
      </LuxeCard>
    </div>
  );
}
