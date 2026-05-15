import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ScanLine, Camera, Map, ShoppingBag, Building2, TrendingUp, Sparkles } from "lucide-react";
import { LuxeCard, GoldButton, GhostButton, StatTile } from "@/components/ui-kit";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "ARKHI 2 — A-Eye Space Vision" },
      { name: "description", content: "AI-powered home intelligence: scan rooms, compare furniture, plan redesigns, and shop smarter." },
    ],
  }),
});

const FEATURES = [
  { to: "/scanner", icon: ScanLine, title: "A-Eye Scanner", desc: "Cinematic room analysis with live progress and dimension estimates." },
  { to: "/snap-compare", icon: Camera, title: "Snap & Compare", desc: "Photograph any item — get fit, style and clearance scores instantly." },
  { to: "/floor-plan", icon: Map, title: "Floor Plan AI", desc: "Upload, sketch or draw layouts. AI zones, places and budgets your space." },
  { to: "/pricing", icon: ShoppingBag, title: "Purchase Finder", desc: "Aggregated UAE pricing across Pan Emirates, Danube, IKEA, Home Centre." },
  { to: "/companies", icon: Building2, title: "Company Hub", desc: "White-label retail intelligence for furniture partners." },
  { to: "/investor", icon: TrendingUp, title: "Investor Mode", desc: "ROI, SaaS pricing, conversion analytics — owner only." },
];

function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden px-4 lg:px-12 pt-10 lg:pt-20 pb-20">
        <div className="grid lg:grid-cols-12 gap-10 items-center max-w-7xl mx-auto">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 hairline rounded-full px-3 py-1 mb-6 text-xs">
              <Sparkles className="size-3 text-gold" />
              <span className="text-muted-foreground">Powered by Arkhi A-Eye + Link-Me Ecosystem</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight">
              <span className="text-gradient-gold">A-Eye</span><br/>
              Space Vision.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-xl">
              Design smarter. Compare better. Buy with confidence. The premium AI interior intelligence platform for homes and the UAE's furniture industry.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/scanner"><GoldButton className="text-base">Start Scanning <ArrowRight className="inline size-4 ml-1" /></GoldButton></Link>
              <Link to="/investor"><GhostButton className="text-base">Investor Mode</GhostButton></Link>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-12 max-w-lg">
              <StatTile label="AI Modules" value="9" />
              <StatTile label="Partners" value="5" />
              <StatTile label="Room Types" value="10" />
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] luxe-card rounded-3xl overflow-hidden grain">
              <div className="absolute inset-0 gradient-gold opacity-[0.07]" />
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent animate-scan" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="size-24 rounded-2xl gradient-gold mx-auto grid place-items-center text-onyx shadow-luxe">
                    <ScanLine className="size-12" strokeWidth={1.5} />
                  </div>
                  <div className="font-display text-2xl mt-6">A-Eye Active</div>
                  <div className="text-xs tracking-[0.3em] uppercase text-muted-foreground mt-2">Analyzing • Estimating • Recommending</div>
                </div>
              </div>
              <div className="absolute bottom-4 inset-x-4 grid grid-cols-3 gap-2 text-[10px]">
                {["Layout", "Lighting", "Color"].map(l => (
                  <div key={l} className="hairline rounded-md px-2 py-1.5 bg-onyx/50 text-center text-muted-foreground">{l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="px-4 lg:px-12 max-w-7xl mx-auto pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-2">The Platform</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Twelve modules. One intelligence.</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <Link key={f.to} to={f.to}>
              <LuxeCard className="p-6 h-full hover:border-gold/50 transition group">
                <f.icon className="size-7 text-gold mb-4 group-hover:scale-110 transition" />
                <div className="font-display text-xl font-semibold">{f.title}</div>
                <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
                <div className="text-xs text-gold mt-4 inline-flex items-center gap-1">
                  Open <ArrowRight className="size-3" />
                </div>
              </LuxeCard>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 lg:px-12 max-w-7xl mx-auto pb-20">
        <LuxeCard className="p-8 md:p-14 relative overflow-hidden grain">
          <div className="absolute -right-20 -top-20 size-72 rounded-full gradient-gold opacity-10 blur-3xl" />
          <div className="relative max-w-2xl">
            <h3 className="font-display text-3xl md:text-5xl font-bold">Built for homeowners. Engineered for retailers.</h3>
            <p className="text-muted-foreground mt-4">Pitch ARKHI 2 to Pan Emirates, Danube Home, IKEA UAE and more — branded, white-labeled, conversion-optimized.</p>
            <div className="flex gap-3 mt-6">
              <Link to="/companies"><GoldButton>Company Hub</GoldButton></Link>
              <Link to="/chat"><GhostButton>Talk to A-Eye</GhostButton></Link>
            </div>
          </div>
        </LuxeCard>
      </section>
    </div>
  );
}
