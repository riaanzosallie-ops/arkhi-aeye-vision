import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, LuxeCard } from "@/components/ui-kit";

export const Route = createFileRoute("/projects")({ component: Projects });

const PROJECTS = [
  { name: "Marina Penthouse Refresh", rooms: 4, status: "In progress", budget: "AED 38,500" },
  { name: "Studio Loft Restyle", rooms: 2, status: "Quoted", budget: "AED 14,900" },
  { name: "Family Villa — Phase 1", rooms: 6, status: "Scanning", budget: "AED 92,000" },
];

function Projects() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Workspace"
        title={<>Active <span className="text-gradient-gold">Projects</span></>}
        subtitle="Multi-room redesign sessions with budget tracking and partner allocation."
      />
      <div className="grid lg:grid-cols-3 gap-4">
        {PROJECTS.map((p) => (
          <LuxeCard key={p.name} className="p-6">
            <div className="font-display text-xl">{p.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{p.rooms} rooms · {p.status}</div>
            <div className="font-display text-2xl text-gradient-gold mt-4">{p.budget}</div>
          </LuxeCard>
        ))}
      </div>
    </div>
  );
}
