import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";

export const Route = createFileRoute("/companies")({ component: Companies });

const PARTNERS = [
  { name: "Pan Emirates", tag: "Furniture · UAE", color: "from-amber-500/30 to-amber-700/10" },
  { name: "Danube Home", tag: "Home · UAE", color: "from-blue-500/30 to-blue-800/10" },
  { name: "IKEA UAE", tag: "Furniture · Global", color: "from-yellow-400/30 to-blue-700/10" },
  { name: "Home Centre", tag: "Home · MENA", color: "from-rose-500/30 to-rose-800/10" },
  { name: "Arkhi", tag: "Native · House", color: "from-amber-300/40 to-amber-700/10" },
];

function Companies() {
  const [active, setActive] = useState(PARTNERS[0].name);
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="White-Label"
        title={<>Company <span className="text-gradient-gold">Hub</span></>}
        subtitle="Partner workspaces with branded experiences, catalogue sync, and lead capture."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {PARTNERS.map((p) => (
          <button key={p.name} onClick={() => setActive(p.name)} className="text-left">
            <LuxeCard className={`p-6 h-full transition ${active === p.name ? "border-gold" : "hover:border-gold/40"}`}>
              <div className={`aspect-[3/2] rounded-lg bg-gradient-to-br ${p.color} mb-4 grid place-items-center font-display text-2xl`}>
                {p.name}
              </div>
              <div className="text-xs text-muted-foreground">{p.tag}</div>
            </LuxeCard>
          </button>
        ))}
      </div>

      <LuxeCard className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-lg gradient-gold grid place-items-center text-onyx font-bold">{active.slice(0, 1)}</div>
          <div>
            <div className="font-display text-xl">{active} workspace</div>
            <div className="text-xs text-muted-foreground">Branded AI planner · Catalogue sync · Lead capture · Analytics</div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {[
            ["Branches", "12"], ["Catalogue items", "1,840"], ["Active leads", "237"], ["Conversion", "18.4%"],
          ].map(([k, v]) => (
            <div key={k} className="hairline rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{k}</div>
              <div className="font-display text-2xl text-gradient-gold mt-1">{v}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-6">
          <GoldButton>Open partner dashboard</GoldButton>
        </div>
      </LuxeCard>
    </div>
  );
}
