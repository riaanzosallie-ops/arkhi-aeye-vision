import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton, StatTile } from "@/components/ui-kit";

export const Route = createFileRoute("/investor")({ component: Investor });

const OWNER = "riaanzosallie@gmail.com";
const KEY = "arkhi2:investorEmail";

function Investor() {
  const [email, setEmail] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved?.toLowerCase() === OWNER) setAuthed(true);
  }, []);

  const submit = () => {
    if (email.trim().toLowerCase() === OWNER) {
      localStorage.setItem(KEY, email.trim().toLowerCase());
      setAuthed(true);
    } else {
      alert("Owner-only access.");
    }
  };

  if (!authed) {
    return (
      <div className="max-w-md mx-auto pt-20">
        <LuxeCard className="p-8 text-center">
          <Lock className="size-10 text-gold mx-auto mb-3" />
          <div className="font-display text-2xl">Investor Mode</div>
          <p className="text-muted-foreground text-sm mt-2">Owner-only access. Enter authorized email.</p>
          <input
            value={email} onChange={(e) => setEmail(e.target.value)}
            type="email" placeholder="email@example.com"
            className="w-full mt-5 bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm"
          />
          <GoldButton onClick={submit} className="w-full mt-3">Enter</GoldButton>
        </LuxeCard>
      </div>
    );
  }

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
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">Pitch dashboard</div>
        <p className="text-sm text-muted-foreground">
          Arkhi 2 turns furniture browsing into AI-validated buying. White-labeled for UAE retailers,
          it lifts in-store conversion by quantifying fit, style, and clearance before purchase — and
          retains customers via persistent home profiles.
        </p>
      </LuxeCard>
    </div>
  );
}
