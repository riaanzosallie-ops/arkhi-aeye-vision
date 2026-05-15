import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/projects")({ component: Projects });

type Project = { id: string; name: string; status: string; budget: string | null; rooms_count: number };

function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [cloud, setCloud] = useState<"unknown" | "ok" | "down">("unknown");

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,status,budget,rooms_count")
      .order("created_at", { ascending: false });
    if (error) { setCloud("down"); return; }
    setCloud("ok");
    setProjects(data ?? []);
  };

  useEffect(() => { void load(); }, [user]);

  const add = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("projects").insert({
      user_id: user.id, name: name.trim(), budget: budget.trim() || null, status: "In progress",
    });
    if (!error) { setName(""); setBudget(""); setAdding(false); void load(); }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Workspace"
        title={<>Active <span className="text-gradient-gold">Projects</span></>}
        subtitle={user
          ? (cloud === "ok" ? "Cloud sync active. Projects saved to your account." : "Cloud sync unavailable.")
          : "Sign in to save and sync your projects."}
        actions={user ? <GoldButton onClick={() => setAdding(v => !v)}>{adding ? "Cancel" : "New project"}</GoldButton> : undefined}
      />

      {adding && (
        <LuxeCard className="p-5 mb-6">
          <div className="grid md:grid-cols-3 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" className="bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" />
            <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget (e.g. AED 38,500)" className="bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" />
            <GoldButton onClick={add}>Save</GoldButton>
          </div>
        </LuxeCard>
      )}

      {projects.length === 0 ? (
        <LuxeCard className="p-12 text-center text-muted-foreground">
          {user ? "No projects yet — create your first." : "Sign in to view your projects."}
        </LuxeCard>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <LuxeCard key={p.id} className="p-6">
              <div className="font-display text-xl">{p.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{p.rooms_count} rooms · {p.status}</div>
              <div className="font-display text-2xl text-gradient-gold mt-4">{p.budget ?? "—"}</div>
            </LuxeCard>
          ))}
        </div>
      )}
    </div>
  );
}
