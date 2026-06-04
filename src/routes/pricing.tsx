import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, ScanLine } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";
import { aiPricingRecs } from "@/lib/ai.functions";
import { homeProfileContext } from "@/lib/homeContext";
import { trackAi } from "@/lib/analytics";

export const Route = createFileRoute("/pricing")({ component: Pricing });

type Item = {
  name: string;
  category?: string;
  retailer: string;
  price_low: number;
  price_high: number;
  currency?: string;
  fit?: number;
  style?: number;
  source_note?: string;
};

function hasSavedRooms(): boolean {
  try {
    const arr = JSON.parse(localStorage.getItem("arkhi2:rooms") || "[]");
    return Array.isArray(arr) && arr.length > 0;
  } catch { return false; }
}

function Pricing() {
  const getRecs = useServerFn(aiPricingRecs);
  const [items, setItems] = useState<Item[] | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const noRooms = typeof window !== "undefined" && !hasSavedRooms();

  const fetchRecs = async (extra?: string) => {
    setBusy(true); setErr(null);
    const ctx = `${homeProfileContext()}${extra ? `\n\nCustomer request: ${extra}` : ""}`;
    const res = await trackAi("pricing_recs", () => getRecs({ data: { roomContext: ctx, budget: undefined } }));
    if (res.ok) setItems(res.items as Item[]);
    else setErr(res.error === "AI_KEY_MISSING" ? "AI setup required" : "A-Eye is unavailable right now. Please try again in a moment.");
    setBusy(false);
  };

  const total = items?.reduce((s, i) => s + ((i.price_low + i.price_high) / 2), 0) ?? 0;
  const avgFit = items?.length ? Math.round(items.reduce((s, i) => s + (i.fit ?? 0), 0) / items.length) : 0;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Shopping Intelligence"
        title={<>Pricing & <span className="text-gradient-gold">Purchase Finder</span></>}
        subtitle="Live UAE retailer recommendations grounded in real Pan Emirates, Danube Home, IKEA UAE, Home Centre and Amazon UAE listings."
        actions={items?.length ? <GoldButton onClick={() => fetchRecs(q)}>{busy ? "…" : "Refresh"}</GoldButton> : null}
      />

      {noRooms && !items && (
        <LuxeCard className="p-10 text-center">
          <ScanLine className="size-10 text-gold mx-auto mb-4" />
          <div className="font-display text-2xl">Run a room scan first</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            A-Eye uses your saved rooms to recommend furniture that actually fits your space. Scan a room or add one in My Home Profile to unlock live UAE shopping recommendations.
          </p>
          <div className="flex gap-2 justify-center mt-6">
            <Link to="/scanner"><GoldButton>Open A-Eye Scanner</GoldButton></Link>
            <Link to="/home-profile"><GoldButton className="opacity-80">My Home Profile</GoldButton></Link>
          </div>
        </LuxeCard>
      )}

      {!noRooms && (
        <>
          {items && items.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <LuxeCard className="p-5"><div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Items</div><div className="font-display text-3xl text-gradient-gold mt-2">{items.length}</div></LuxeCard>
              <LuxeCard className="p-5"><div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Estimated total</div><div className="font-display text-3xl text-gradient-gold mt-2">AED {Math.round(total).toLocaleString()}</div></LuxeCard>
              <LuxeCard className="p-5"><div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Avg fit score</div><div className="font-display text-3xl text-gradient-gold mt-2">{avgFit}%</div></LuxeCard>
            </div>
          )}

          {items && items.length > 0 && (
            <LuxeCard className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4">Item</th>
                    <th className="text-left p-4 hidden sm:table-cell">Store</th>
                    <th className="text-right p-4">Price (AED)</th>
                    <th className="text-right p-4 hidden md:table-cell">Fit</th>
                    <th className="text-right p-4 hidden md:table-cell">Style</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i, idx) => (
                    <tr key={idx} className="border-b border-border/30 last:border-0 hover:bg-card/40">
                      <td className="p-4">
                        <div>{i.name}</div>
                        {i.source_note && <div className="text-[11px] text-muted-foreground mt-0.5">{i.source_note}</div>}
                      </td>
                      <td className="p-4 hidden sm:table-cell text-muted-foreground">{i.retailer}</td>
                      <td className="p-4 text-right text-gold whitespace-nowrap">{i.price_low.toLocaleString()}–{i.price_high.toLocaleString()}</td>
                      <td className="p-4 text-right hidden md:table-cell">{i.fit ?? "—"}%</td>
                      <td className="p-4 text-right hidden md:table-cell">{i.style ?? "—"}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </LuxeCard>
          )}

          {items && items.length === 0 && (
            <LuxeCard className="p-8 text-center text-sm text-muted-foreground">No matching items returned. Try refining your request.</LuxeCard>
          )}

          <LuxeCard className="p-6 mt-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2 flex items-center gap-2"><Sparkles className="size-3.5" />Ask A-Eye for purchase suggestions</div>
            <div className="flex gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Suggest a 4-piece living room set under AED 8,000"
                className="flex-1 bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" />
              <GoldButton onClick={() => fetchRecs(q)} disabled={busy}>{busy ? "…" : items ? "Refresh" : "Get recommendations"}</GoldButton>
            </div>
            {err && <div className="text-sm text-amber-300 mt-3">{err}</div>}
            {!items && !err && !busy && (
              <div className="text-xs text-muted-foreground mt-3">Recommendations are generated live by A-Eye using real UAE retailer listings.</div>
            )}
          </LuxeCard>
        </>
      )}
    </div>
  );
}
