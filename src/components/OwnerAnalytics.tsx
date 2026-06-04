import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { LuxeCard, StatTile, GoldButton } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";

type Range = "1d" | "7d" | "30d";

function rangeStart(range: Range): string {
  const now = new Date();
  const days = range === "1d" ? 1 : range === "7d" ? 7 : 30;
  const d = new Date(now.getTime() - days * 86400000);
  return d.toISOString();
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function OwnerAnalytics() {
  const [tab, setTab] = useState<"live" | "kpi" | "metrics">("live");

  return (
    <LuxeCard className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-gold">Owner Analytics</div>
          <div className="font-display text-2xl mt-1">Live dashboard</div>
        </div>
        <div className="flex gap-1 hairline rounded-lg p-1 text-xs">
          {([
            ["live", "Live Analytics"],
            ["kpi", "Business KPIs"],
            ["metrics", "Owner Targets"],
          ] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-md transition ${tab === k ? "gradient-gold text-onyx" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "live" && <LiveAnalytics />}
      {tab === "kpi" && <BusinessKpis />}
      {tab === "metrics" && <OwnerMetrics />}
    </LuxeCard>
  );
}

// ─── Live traffic + AI usage ────────────────────────────────────────────
function LiveAnalytics() {
  const [range, setRange] = useState<Range>("7d");
  const [pageViews, setPageViews] = useState<Array<{ page: string | null; device_type: string | null; referrer: string | null; session_id: string | null; created_at: string }>>([]);
  const [aiUsage, setAiUsage] = useState<Array<{ kind: string | null; duration_ms: number | null; success: boolean | null; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const since = rangeStart(range);
      const [pv, ai] = await Promise.all([
        supabase.from("arkhi_page_views").select("page,device_type,referrer,session_id,created_at").gte("created_at", since).limit(5000),
        supabase.from("arkhi_ai_usage").select("kind,duration_ms,success,created_at").gte("created_at", since).limit(5000),
      ]);
      if (cancelled) return;
      setPageViews(pv.data ?? []);
      setAiUsage(ai.data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [range]);

  const stats = useMemo(() => {
    const uniqueSessions = new Set(pageViews.map(p => p.session_id).filter(Boolean));
    const topPages = Object.entries(pageViews.reduce<Record<string, number>>((acc, p) => {
      const k = p.page ?? "/";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const devices = pageViews.reduce<Record<string, number>>((acc, p) => {
      const k = p.device_type ?? "unknown";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    const referrers = Object.entries(pageViews.reduce<Record<string, number>>((acc, p) => {
      let host = "direct";
      if (p.referrer) {
        try { host = new URL(p.referrer).hostname || "direct"; } catch { host = "direct"; }
      }
      acc[host] = (acc[host] ?? 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Daily series
    const dayMap: Record<string, { day: string; views: number; ai: number }> = {};
    pageViews.forEach(p => {
      const k = dayKey(p.created_at);
      dayMap[k] = dayMap[k] ?? { day: k, views: 0, ai: 0 };
      dayMap[k].views += 1;
    });
    aiUsage.forEach(a => {
      const k = dayKey(a.created_at);
      dayMap[k] = dayMap[k] ?? { day: k, views: 0, ai: 0 };
      dayMap[k].ai += 1;
    });
    const daily = Object.values(dayMap).sort((a, b) => a.day.localeCompare(b.day));

    const aiByKind = Object.entries(aiUsage.reduce<Record<string, number>>((acc, a) => {
      const k = a.kind ?? "unknown";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {})).map(([kind, count]) => ({ kind, count }));

    const aiSuccess = aiUsage.filter(a => a.success === true).length;
    const aiTotal = aiUsage.length;
    const aiErrorRate = aiTotal ? Math.round(((aiTotal - aiSuccess) / aiTotal) * 100) : 0;
    const aiAvgMs = aiTotal ? Math.round(aiUsage.reduce((s, a) => s + (a.duration_ms ?? 0), 0) / aiTotal) : 0;

    return {
      views: pageViews.length,
      uniques: uniqueSessions.size,
      topPages, devices, referrers, daily, aiByKind,
      aiTotal, aiErrorRate, aiAvgMs,
    };
  }, [pageViews, aiUsage]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{loading ? "Loading…" : `${stats.views.toLocaleString()} views · ${stats.uniques.toLocaleString()} unique sessions`}</div>
        <div className="flex gap-1 hairline rounded-lg p-1 text-xs">
          {(["1d", "7d", "30d"] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-md ${range === r ? "gradient-gold text-onyx" : "text-muted-foreground"}`}>
              {r === "1d" ? "Today" : r === "7d" ? "7 days" : "30 days"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Page views" value={stats.views.toLocaleString()} />
        <StatTile label="Unique sessions" value={stats.uniques.toLocaleString()} />
        <StatTile label="AI calls" value={stats.aiTotal.toLocaleString()} />
        <StatTile label="AI error rate" value={`${stats.aiErrorRate}%`} hint={`Avg ${stats.aiAvgMs}ms`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="hairline rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Daily traffic & AI activity</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", fontSize: 12 }} />
                <Line type="monotone" dataKey="views" stroke="#d4af37" strokeWidth={2} dot={false} name="Views" />
                <Line type="monotone" dataKey="ai" stroke="#88f" strokeWidth={2} dot={false} name="AI calls" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="hairline rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">AI calls by kind</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.aiByKind}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="kind" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", fontSize: 12 }} />
                <Bar dataKey="count" fill="#d4af37" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Panel title="Top pages" rows={stats.topPages} />
        <Panel title="Devices" rows={Object.entries(stats.devices)} />
        <Panel title="Referrers" rows={stats.referrers} />
      </div>
    </div>
  );
}

function Panel({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  const max = rows.reduce((m, [, v]) => Math.max(m, v), 0) || 1;
  return (
    <div className="hairline rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">{title}</div>
      {rows.length === 0 && <div className="text-xs text-muted-foreground">No data yet</div>}
      <div className="space-y-2">
        {rows.map(([label, count]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-foreground/90">{label}</span>
              <span className="text-gold ml-2">{count}</span>
            </div>
            <div className="h-1 bg-onyx rounded mt-1 overflow-hidden">
              <div className="h-full gradient-gold" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Business KPIs (live DB counts) ────────────────────────────────────
function BusinessKpis() {
  const [counts, setCounts] = useState<Record<string, number | null>>({
    rooms: null, scans: null, projects: null, valuations: null, profiles: null, ai_30d: null,
  });

  useEffect(() => {
    (async () => {
      const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
      const [rooms, scans, projects, valuations, profiles, ai30] = await Promise.all([
        supabase.from("rooms").select("*", { count: "exact", head: true }),
        supabase.from("scans").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("arkhi_valuation_reports").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("arkhi_ai_usage").select("*", { count: "exact", head: true }).gte("created_at", since30),
      ]);
      setCounts({
        rooms: rooms.count ?? 0,
        scans: scans.count ?? 0,
        projects: projects.count ?? 0,
        valuations: valuations.count ?? 0,
        profiles: profiles.count ?? 0,
        ai_30d: ai30.count ?? 0,
      });
    })();
  }, []);

  const fmt = (v: number | null) => v === null ? "…" : v.toLocaleString();

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <StatTile label="Registered users" value={fmt(counts.profiles)} />
      <StatTile label="Saved rooms" value={fmt(counts.rooms)} />
      <StatTile label="Total scans" value={fmt(counts.scans)} />
      <StatTile label="Valuation reports" value={fmt(counts.valuations)} />
      <StatTile label="Active projects" value={fmt(counts.projects)} />
      <StatTile label="AI calls (30d)" value={fmt(counts.ai_30d)} />
    </div>
  );
}

// ─── Owner-editable metrics ────────────────────────────────────────────
type Metric = { id: string; metric_key: string; metric_label: string | null; metric_value: string | null; metric_unit: string | null };

const SEED: Array<Pick<Metric, "metric_key" | "metric_label" | "metric_unit">> = [
  { metric_key: "arr_target", metric_label: "ARR Target", metric_unit: "AED" },
  { metric_key: "active_partners", metric_label: "Active partners", metric_unit: "" },
  { metric_key: "ltv_cac", metric_label: "LTV : CAC", metric_unit: "×" },
  { metric_key: "avg_retention", metric_label: "Avg. retention", metric_unit: "months" },
];

function OwnerMetrics() {
  const [rows, setRows] = useState<Metric[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const load = async () => {
    const { data } = await supabase.from("arkhi_business_metrics").select("*");
    const map = new Map<string, Metric>();
    (data ?? []).forEach((r) => map.set(r.metric_key, r as Metric));
    const merged: Metric[] = SEED.map(s => map.get(s.metric_key) ?? ({ id: "", metric_key: s.metric_key, metric_label: s.metric_label ?? null, metric_value: null, metric_unit: s.metric_unit ?? null }));
    setRows(merged);
  };

  useEffect(() => { load(); }, []);

  const save = async (m: Metric) => {
    await supabase.from("arkhi_business_metrics").upsert({
      metric_key: m.metric_key,
      metric_label: m.metric_label,
      metric_value: draft,
      metric_unit: m.metric_unit,
    }, { onConflict: "metric_key" });
    setEditing(null);
    setDraft("");
    load();
  };

  return (
    <div>
      <div className="text-xs text-muted-foreground mb-3">Owner-set targets. Edit any tile inline; values persist to <code className="text-gold">arkhi_business_metrics</code>.</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rows.map(m => (
          <div key={m.metric_key} className="hairline rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{m.metric_label}</div>
            {editing === m.metric_key ? (
              <div className="flex gap-2 mt-2">
                <input value={draft} onChange={e => setDraft(e.target.value)} autoFocus
                  className="flex-1 bg-input/40 hairline rounded px-2 py-1 text-sm" />
                <GoldButton onClick={() => save(m)} className="px-3 py-1 text-xs">Save</GoldButton>
              </div>
            ) : (
              <button onClick={() => { setEditing(m.metric_key); setDraft(m.metric_value ?? ""); }} className="block text-left w-full">
                <div className="font-display text-2xl text-gradient-gold mt-1">
                  {m.metric_value ? `${m.metric_unit && m.metric_unit !== "×" && m.metric_unit !== "months" ? m.metric_unit + " " : ""}${m.metric_value}${m.metric_unit === "×" || m.metric_unit === "months" ? " " + m.metric_unit : ""}` : "—"}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Owner-set target · click to edit</div>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
