import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, ScanLine, Map, Camera, ShoppingBag } from "lucide-react";
import { PageHeader, LuxeCard } from "@/components/ui-kit";

export const Route = createFileRoute("/design")({ component: DesignSpace });

const TOOLS = [
  { to: "/scanner", icon: ScanLine, t: "Room Scanner", d: "Estimate dimensions, lighting, color, and furniture placement." },
  { to: "/floor-plan", icon: Map, t: "Floor Plan AI", d: "Upload, sketch, or draw layouts. Get AI zoning + budget." },
  { to: "/snap-compare", icon: Camera, t: "Snap & Compare", d: "Test items against your saved rooms before buying." },
  { to: "/pricing", icon: ShoppingBag, t: "Purchase Finder", d: "Live UAE pricing aggregation across major retailers." },
];

function DesignSpace() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Workspace"
        title={<>Design <span className="text-gradient-gold">Space</span></>}
        subtitle="Your central canvas. Pick a module to begin a new design session."
      />
      <div className="grid sm:grid-cols-2 gap-4">
        {TOOLS.map((t) => (
          <Link key={t.to} to={t.to}>
            <LuxeCard className="p-6 h-full hover:border-gold/50 transition group">
              <div className="size-12 rounded-xl gradient-gold grid place-items-center text-onyx mb-4">
                <t.icon className="size-6" />
              </div>
              <div className="font-display text-2xl">{t.t}</div>
              <p className="text-muted-foreground text-sm mt-2">{t.d}</p>
            </LuxeCard>
          </Link>
        ))}
      </div>
      <LuxeCard className="p-6 mt-6">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <LayoutGrid className="size-4 text-gold" />
          More tools (3D walkthroughs, mood boards, palette extractor) ship with the next release.
        </div>
      </LuxeCard>
    </div>
  );
}
