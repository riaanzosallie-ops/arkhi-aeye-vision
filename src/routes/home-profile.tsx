import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Camera } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/home-profile")({ component: HomeProfile });

const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Dining Room", "Study", "Balcony", "Hallway", "Kids Room", "Outdoor"];

type Room = { id: string; name: string; type: string; photos: number; score: number; lastScanned: string };

const KEY = "arkhi2:rooms";

function HomeProfile() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState(ROOM_TYPES[0]);
  const [cloud, setCloud] = useState<"unknown" | "ok" | "down">("unknown");

  useEffect(() => {
    try { setRooms(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* */ }
  }, []);

  useEffect(() => {
    if (!user) { setCloud("unknown"); return; }
    (async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id,name,type,photos,score,last_scanned")
        .order("created_at", { ascending: false });
      if (error) { setCloud("down"); return; }
      setCloud("ok");
      const cloudRooms: Room[] = (data ?? []).map(r => ({
        id: r.id, name: r.name, type: r.type, photos: r.photos ?? 0, score: r.score ?? 0, lastScanned: r.last_scanned ?? "—",
      }));
      // Merge cloud + local; cloud wins on duplicates by id
      setRooms(prev => {
        const map = new Map(prev.map(r => [r.id, r] as const));
        cloudRooms.forEach(r => map.set(r.id, r));
        return Array.from(map.values());
      });
    })();
  }, [user]);

  const persistLocal = (next: Room[]) => {
    setRooms(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const addRoom = async () => {
    if (!name.trim()) return;
    const optimistic: Room = { id: crypto.randomUUID(), name, type, photos: 0, score: 0, lastScanned: "—" };
    persistLocal([...rooms, optimistic]);
    setName(""); setAdding(false);
    if (user) {
      const { data, error } = await supabase
        .from("rooms")
        .insert({ user_id: user.id, name: optimistic.name, type: optimistic.type })
        .select("id")
        .single();
      if (!error && data) {
        // Replace local id with cloud id
        setRooms(prev => prev.map(r => r.id === optimistic.id ? { ...r, id: data.id } : r));
        setCloud("ok");
      } else {
        setCloud("down");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Your Space"
        title={<>My Home <span className="text-gradient-gold">Profile</span></>}
        subtitle={user
          ? (cloud === "ok" ? "Cloud sync active. Rooms saved to your account." : "Cloud sync unavailable — saving locally.")
          : "Sign in to sync rooms across devices. Currently saved locally."}
        actions={<GoldButton onClick={() => setAdding(true)}><Plus className="inline size-4 mr-1" />Add room</GoldButton>}
      />

      {adding && (
        <LuxeCard className="p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Room name" className="bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" />
            <select value={type} onChange={(e) => setType(e.target.value)} className="bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm">
              {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <div className="flex gap-2">
              <GoldButton onClick={addRoom}>Save</GoldButton>
              <button onClick={() => setAdding(false)} className="text-sm text-muted-foreground px-3">Cancel</button>
            </div>
          </div>
        </LuxeCard>
      )}

      {rooms.length === 0 ? (
        <LuxeCard className="p-12 text-center">
          <Camera className="size-10 text-gold mx-auto mb-3" />
          <div className="font-display text-2xl">No rooms yet</div>
          <p className="text-muted-foreground text-sm mt-2">Add your first room to begin building your home intelligence profile.</p>
        </LuxeCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((r) => (
            <LuxeCard key={r.id} className="p-5">
              <div className="aspect-video rounded-lg gradient-gold opacity-20 mb-4" />
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-lg">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase text-muted-foreground">AI Score</div>
                  <div className="font-display text-xl text-gradient-gold">{r.score || "—"}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div className="hairline rounded px-2 py-1.5 text-muted-foreground">{r.photos} photos</div>
                <div className="hairline rounded px-2 py-1.5 text-muted-foreground">{r.lastScanned}</div>
              </div>
              <Link to="/scanner" className="block mt-4 text-xs text-gold">Scan this room →</Link>
            </LuxeCard>
          ))}
        </div>
      )}
    </div>
  );
}
