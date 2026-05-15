import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";

export const Route = createFileRoute("/pricing")({ component: Pricing });

const ITEMS = [
  { name: "Modular sofa, 3-seater", store: "Pan Emirates", price: "AED 4,200", fit: 92, style: 88 },
  { name: "Oak coffee table 120cm", store: "Danube Home", price: "AED 1,150", fit: 88, style: 81 },
  { name: "Linen curtains, beige", store: "IKEA UAE", price: "AED 320", fit: 95, style: 84 },
  { name: "Floor lamp, brass arc", store: "Home Centre", price: "AED 690", fit: 90, style: 92 },
  { name: "Wool area rug 200x300", store: "Amazon UAE", price: "AED 880", fit: 85, style: 87 },
];

function Pricing() {
  const total = ITEMS.reduce((s, i) => s + parseInt(i.price.replace(/\D/g, "")), 0);
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Shopping Intelligence"
        title={<>Pricing & <span className="text-gradient-gold">Purchase Finder</span></>}
        subtitle="A-Eye-curated shopping list across UAE retailers with fit and style scoring."
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
    </div>
  );
}
