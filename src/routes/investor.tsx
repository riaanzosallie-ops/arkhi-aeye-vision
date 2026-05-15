import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Sparkles, Eye, EyeOff, LogOut } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton, GhostButton, StatTile } from "@/components/ui-kit";
import { useAuth } from "@/lib/useAuth";
import { aiAsk } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/investor")({ component: Investor });

const OWNER = "riaanzosallie@gmail.com";
const REMEMBER_KEY = "arkhi2:remember";

function OwnerLogin({ wrongAccount, currentEmail }: { wrongAccount: boolean; currentEmail?: string }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reset, setReset] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    if (error) setErr(error.message);
    setBusy(false);
  };

  const sendReset = async () => {
    if (!email.trim()) { setErr("Enter your owner email first."); return; }
    setErr(null); setResetMsg(null); setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/profile`,
    });
    if (error) setErr(error.message);
    else setResetMsg("Reset email sent. Check your inbox.");
    setBusy(false);
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <div className="max-w-md mx-auto pt-10">
      <LuxeCard className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-lg gradient-gold grid place-items-center text-onyx"><Lock className="size-5" /></div>
          <div>
            <div className="font-display text-2xl">Owner access required</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Investor & owner dashboard</div>
          </div>
        </div>
        {wrongAccount && (
          <div className="text-xs text-amber-300 mb-4 hairline rounded-lg p-3">
            Signed in as <span className="text-foreground">{currentEmail}</span>. This account is not the owner.
            <button onClick={signOut} className="text-gold ml-1 underline">Sign out</button>
          </div>
        )}
        {reset ? (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Owner email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" />
            </div>
            {err && <div className="text-xs text-red-400">{err}</div>}
            {resetMsg && <div className="text-xs text-emerald-300">{resetMsg}</div>}
            <div className="flex gap-2">
              <GoldButton onClick={sendReset} disabled={busy} className="flex-1">{busy ? "…" : "Send reset link"}</GoldButton>
              <GhostButton onClick={() => setReset(false)}>Back</GhostButton>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mt-1 bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Password</label>
              <div className="relative mt-1">
                <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} className="w-full bg-input/40 hairline rounded-lg px-3 py-2.5 pr-10 text-sm" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground p-1.5">
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
              <button type="button" onClick={() => setReset(true)} className="text-gold">Forgot password?</button>
            </div>
            {err && <div className="text-xs text-red-400">{err}</div>}
            <GoldButton type="submit" className="w-full" disabled={busy}>{busy ? "…" : "Sign in to owner dashboard"}</GoldButton>
            <div className="text-[11px] text-center text-muted-foreground">Owner access required. Investor data, revenue, and partner commercials are hidden from normal users.</div>
          </form>
        )}
      </LuxeCard>
    </div>
  );
}

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
    return <OwnerLogin wrongAccount={Boolean(user)} currentEmail={user?.email ?? undefined} />;
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
        title={<>Welcome back, <span className="text-gradient-gold">Owner</span></>}
        subtitle="Confidence-to-purchase technology for furniture retailers. SaaS + white-label + commission. UAE first, then GCC."
        actions={<GhostButton onClick={() => supabase.auth.signOut()}><LogOut className="inline size-4 mr-1" />Sign out</GhostButton>}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="ARR Target Y1" value="AED 4.2M" />
        <StatTile label="Active partners" value="5" />
        <StatTile label="LTV : CAC" value="6.4×" />
        <StatTile label="Avg. retention" value="22mo" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {[
          ["Problem", "Customers can't visualize furniture in their own homes — hesitation kills conversion."],
          ["Solution", "Arkhi scans the customer's real home and recommends retailer products with fit, style, and purchase confidence scores."],
          ["Commercial Engine", "Retailers pay monthly to white-label Arkhi and convert room scans into product sales."],
          ["My Home Profile", "Permanent home intelligence keeps the customer connected for repeat purchases."],
          ["Snap & Compare", "Turns the showroom into an AI-powered purchase assistant via QR scanning."],
          ["Expansion", "UAE first → GCC furniture market. White-label to Pan Emirates, Danube Home, IKEA UAE, Home Centre."],
        ].map(([t, d]) => (
          <LuxeCard key={t} className="p-5">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{t}</div>
            <div className="text-sm text-foreground/90 mt-2">{d}</div>
          </LuxeCard>
        ))}
      </div>

      <LuxeCard className="p-6 mb-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-3">Revenue streams</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {["Monthly SaaS", "White-label licensing", "Product sales commission", "Lead generation", "AI design packages", "Retailer analytics"].map(s => (
            <div key={s} className="hairline rounded px-3 py-2">{s}</div>
          ))}
        </div>
      </LuxeCard>

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

      <RoiCalculator />

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

function RoiCalculator() {
  const [scans, setScans] = useState(2000);
  const [conv, setConv] = useState(8); // %
  const [aov, setAov] = useState(4500); // AED
  const [comm, setComm] = useState(6); // %
  const [sub, setSub] = useState(7800); // AED/mo

  const sales = scans * (conv / 100);
  const partnerSales = sales * aov;
  const monthlyRevenue = sub + partnerSales * (comm / 100);
  const annualRevenue = monthlyRevenue * 12;
  const roi = sub > 0 ? (monthlyRevenue / sub) : 0;

  const Field = ({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix?: string }) => (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">{label}</div>
      <div className="flex items-center gap-2">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="flex-1 bg-input/40 hairline rounded-lg px-3 py-2 text-sm" />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );

  return (
    <LuxeCard className="p-6 mt-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-3">Partner ROI calculator</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Field label="Monthly scans" value={scans} onChange={setScans} />
        <Field label="Conversion" value={conv} onChange={setConv} suffix="%" />
        <Field label="Avg order value" value={aov} onChange={setAov} suffix="AED" />
        <Field label="Commission" value={comm} onChange={setComm} suffix="%" />
        <Field label="Subscription" value={sub} onChange={setSub} suffix="AED/mo" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <div className="hairline rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Monthly partner sales influenced</div>
          <div className="font-display text-2xl text-gradient-gold mt-1">AED {Math.round(partnerSales).toLocaleString()}</div>
        </div>
        <div className="hairline rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Monthly Arkhi revenue</div>
          <div className="font-display text-2xl text-gradient-gold mt-1">AED {Math.round(monthlyRevenue).toLocaleString()}</div>
        </div>
        <div className="hairline rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Annual Arkhi revenue</div>
          <div className="font-display text-2xl text-gradient-gold mt-1">AED {Math.round(annualRevenue).toLocaleString()}</div>
        </div>
        <div className="hairline rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">ROI multiple</div>
          <div className="font-display text-2xl text-gradient-gold mt-1">{roi.toFixed(1)}×</div>
        </div>
      </div>
    </LuxeCard>
  );
}
