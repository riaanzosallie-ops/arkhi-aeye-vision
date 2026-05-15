import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus, Camera, Upload, X, Trash2, ImageIcon, Sparkles, Heart,
  Palette, Wand2, ScanLine, ArrowLeft, Star, ChevronLeft, ChevronRight,
} from "lucide-react";
import { PageHeader, LuxeCard, GoldButton, GhostButton } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { uploadUserFile } from "@/lib/upload";
import { signedRoomUrl } from "@/lib/signedUrl";
import { aiAsk } from "@/lib/ai.functions";
import { homeProfileContext, getHomePrefs, setHomePrefs, type HomePrefs } from "@/lib/homeContext";
import { parseAnalysis, type ParsedAnalysis, type RoomScores } from "@/lib/parseAnalysis";

export const Route = createFileRoute("/home-profile")({ component: HomeProfile });

const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Dining Room", "Study", "Balcony", "Hallway", "Kids Room", "Outdoor"];
const KEY = "arkhi2:rooms";
const BUCKET = "room-photos";

type Room = {
  id: string;
  name: string;
  type: string;
  photos: number;
  score: number;
  lastScanned: string;
  images?: string[];
  notes?: string;
  width_m?: number | null;
  length_m?: number | null;
  rating?: RoomScores | null;
  warmth_score?: number | null;
  style_category?: string | null;
  analysis?: string | null;
  cover?: string | null; // for ui only — first image path
};

function persistLocal(rooms: Room[]) {
  localStorage.setItem(KEY, JSON.stringify(rooms));
}

function HomeProfile() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState(ROOM_TYPES[0]);
  const [cloud, setCloud] = useState<"unknown" | "ok" | "down">("unknown");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    try { setRooms(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* */ }
  }, []);

  useEffect(() => {
    if (!user) { setCloud("unknown"); return; }
    (async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id,name,type,photos,score,last_scanned,images,notes,width_m,length_m,rating,warmth_score,style_category,analysis")
        .order("created_at", { ascending: false });
      if (error) { setCloud("down"); return; }
      setCloud("ok");
      const cloudRooms: Room[] = (data ?? []).map((r) => {
        const imgs: string[] = Array.isArray(r.images) ? (r.images as string[]) : [];
        return {
          id: r.id, name: r.name, type: r.type,
          photos: r.photos ?? imgs.length, score: r.score ?? 0,
          lastScanned: r.last_scanned ?? "—",
          images: imgs, notes: r.notes ?? "",
          width_m: r.width_m as number | null, length_m: r.length_m as number | null,
          rating: (r.rating as RoomScores | null) ?? null,
          warmth_score: r.warmth_score as number | null,
          style_category: r.style_category as string | null,
          analysis: r.analysis as string | null,
          cover: imgs[0] ?? null,
        };
      });
      setRooms(cloudRooms);
      persistLocal(cloudRooms);
    })();
  }, [user]);

  const updateRoom = async (id: string, patch: Partial<Room>) => {
    setRooms((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch, cover: (patch.images ?? r.images)?.[0] ?? r.cover } : r));
      persistLocal(next);
      return next;
    });
    if (user) {
      const dbPatch: Record<string, unknown> = {};
      if (patch.images) { dbPatch.images = patch.images; dbPatch.photos = patch.images.length; }
      if (patch.notes !== undefined) dbPatch.notes = patch.notes;
      if (patch.width_m !== undefined) dbPatch.width_m = patch.width_m;
      if (patch.length_m !== undefined) dbPatch.length_m = patch.length_m;
      if (patch.rating !== undefined) dbPatch.rating = patch.rating;
      if (patch.warmth_score !== undefined) dbPatch.warmth_score = patch.warmth_score;
      if (patch.style_category !== undefined) dbPatch.style_category = patch.style_category;
      if (patch.analysis !== undefined) dbPatch.analysis = patch.analysis;
      if (patch.score !== undefined) dbPatch.score = patch.score;
      if (patch.lastScanned !== undefined) dbPatch.last_scanned = patch.lastScanned;
      if (Object.keys(dbPatch).length) {
        await supabase.from("rooms").update(dbPatch).eq("id", id);
      }
    }
  };

  const addRoom = async () => {
    if (!name.trim()) return;
    const optimistic: Room = { id: crypto.randomUUID(), name, type, photos: 0, score: 0, lastScanned: "—", images: [] };
    const next = [optimistic, ...rooms];
    setRooms(next); persistLocal(next);
    setName(""); setAdding(false);
    if (user) {
      const { data, error } = await supabase
        .from("rooms").insert({ user_id: user.id, name: optimistic.name, type: optimistic.type })
        .select("id").single();
      if (!error && data) {
        setRooms((prev) => {
          const replaced = prev.map((r) => (r.id === optimistic.id ? { ...r, id: data.id } : r));
          persistLocal(replaced); return replaced;
        });
        setCloud("ok");
      } else setCloud("down");
    }
  };

  const deleteRoom = async (id: string) => {
    if (!confirm("Delete this room and its uploads?")) return;
    setRooms((prev) => { const n = prev.filter((r) => r.id !== id); persistLocal(n); return n; });
    setActiveId(null);
    if (user) await supabase.from("rooms").delete().eq("id", id);
  };

  const active = rooms.find((r) => r.id === activeId) ?? null;

  if (active) {
    return (
      <RoomDetail
        room={active}
        cloud={cloud === "ok"}
        onBack={() => setActiveId(null)}
        onUpdate={(patch) => updateRoom(active.id, patch)}
        onDelete={() => deleteRoom(active.id)}
      />
    );
  }

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
              {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <div className="flex gap-2">
              <GoldButton onClick={addRoom}>Save</GoldButton>
              <button onClick={() => setAdding(false)} className="text-sm text-muted-foreground px-3">Cancel</button>
            </div>
          </div>
        </LuxeCard>
      )}

      <PreferencesCard />

      {rooms.length === 0 ? (
        <LuxeCard className="p-8 sm:p-12 text-center mt-6">
          <Camera className="size-10 text-gold mx-auto mb-3" />
          <div className="font-display text-2xl">Upload your room to begin your design journey</div>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
            Add a room and share a photo — A-Eye will read its mood, warmth and potential, then suggest a luxury direction tailored to your home.
          </p>
          <GoldButton className="mt-5" onClick={() => setAdding(true)}>Add your first room</GoldButton>
        </LuxeCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {rooms.map((r) => (
            <RoomCard key={r.id} room={r} onOpen={() => setActiveId(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoomCard({ room, onOpen }: { room: Room; onOpen: () => void }) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (room.cover) signedRoomUrl(room.cover).then((u) => { if (!cancelled) setThumb(u); });
    else setThumb(null);
    return () => { cancelled = true; };
  }, [room.cover]);

  const overall = room.rating?.overall ?? room.score ?? 0;
  const warmth = room.warmth_score ?? room.rating?.warmth ?? 0;

  return (
    <button onClick={onOpen} className="text-left">
      <LuxeCard className="overflow-hidden hover:border-gold/40 transition">
        <div className="aspect-video relative bg-onyx/60">
          {thumb ? (
            <img src={thumb} alt={room.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <div className="text-center">
                <ImageIcon className="size-8 text-gold/50 mx-auto mb-2" />
                <div className="text-xs">Upload your room to begin</div>
              </div>
            </div>
          )}
          {overall > 0 && (
            <div className="absolute top-2 right-2 bg-onyx/80 hairline backdrop-blur rounded-md px-2 py-1 text-[10px] flex items-center gap-1">
              <Star className="size-3 text-gold" /><span className="font-display">{overall}</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-lg">{room.name}</div>
              <div className="text-xs text-muted-foreground">{room.type}{room.style_category ? ` · ${room.style_category}` : ""}</div>
            </div>
            {warmth > 0 && (
              <div className="text-right">
                <div className="text-[9px] uppercase text-muted-foreground tracking-[0.2em]">Warmth</div>
                <div className="font-display text-lg text-gradient-gold">{warmth}</div>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3 text-[11px]">
            <span className="hairline rounded px-2 py-1 text-muted-foreground">{room.images?.length ?? 0} photos</span>
            <span className="hairline rounded px-2 py-1 text-muted-foreground">{room.lastScanned}</span>
            {room.analysis && <span className="hairline rounded px-2 py-1 text-gold/80">A-Eye ✓</span>}
          </div>
        </div>
      </LuxeCard>
    </button>
  );
}

/* ---------- Room detail with uploads, gallery, AI analysis ---------- */

function RoomDetail({ room, cloud, onBack, onUpdate, onDelete }: {
  room: Room; cloud: boolean;
  onBack: () => void;
  onUpdate: (patch: Partial<Room>) => void | Promise<void>;
  onDelete: () => void;
}) {
  const { user } = useAuth();
  const ask = useServerFn(aiAsk);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const [notes, setNotes] = useState(room.notes ?? "");
  const [width, setWidth] = useState(room.width_m?.toString() ?? "");
  const [length, setLength] = useState(room.length_m?.toString() ?? "");

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisErr, setAnalysisErr] = useState<string | null>(null);

  const [looks, setLooks] = useState<SuggestedLook[] | null>(null);
  const [looksBusy, setLooksBusy] = useState(false);
  const [looksErr, setLooksErr] = useState<string | null>(null);
  const [savedLooks, setSavedLooks] = useState<SuggestedLook[]>([]);

  const [emptyBudget, setEmptyBudget] = useState<"Budget" | "Mid-range" | "Premium" | "Luxury">("Premium");
  const [emptyBusy, setEmptyBusy] = useState(false);
  const [emptyOut, setEmptyOut] = useState<string | null>(null);
  const [emptyErr, setEmptyErr] = useState<string | null>(null);

  const parsed: ParsedAnalysis | null = room.analysis ? parseAnalysis(room.analysis) : null;

  useEffect(() => {
    try { setSavedLooks(JSON.parse(localStorage.getItem(`arkhi2:looks:${room.id}`) || "[]")); } catch { /* */ }
  }, [room.id]);

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    if (!user) { setUploadMsg("Sign in to save uploads to cloud sync. Files won't persist."); return; }
    setUploading(true); setUploadMsg(null);
    const newPaths: string[] = [];
    for (const f of Array.from(files)) {
      const up = await uploadUserFile(BUCKET, f);
      if (up.ok) newPaths.push(up.path);
      else setUploadMsg(up.error);
    }
    const next = [...(room.images ?? []), ...newPaths];
    await onUpdate({ images: next, photos: next.length, lastScanned: new Date().toLocaleDateString() });
    setUploading(false);
    if (newPaths.length) setUploadMsg(cloud ? `${newPaths.length} photo(s) saved.` : "Saved locally — cloud sync setup required.");
  };

  const removeImage = async (path: string) => {
    const next = (room.images ?? []).filter((p) => p !== path);
    await onUpdate({ images: next, photos: next.length });
    if (user) await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
  };

  const analyze = async () => {
    if (!(room.images?.length)) { setAnalysisErr("Upload at least one photo first."); return; }
    setAnalyzing(true); setAnalysisErr(null);
    const dims = (width && length) ? ` Dimensions: ${width} × ${length} m.` : "";
    const prompt = `${homeProfileContext()}\n\nRoom: ${room.name} (${room.type}). ${room.images?.length} photo(s) uploaded.${dims} Notes: ${notes || "none"}.\nGive a warm, emotionally generous A-Eye reading of this room. Compliment what works, gently reveal opportunities, then suggest a direction.`;
    const res = await ask({ data: { kind: "scanner", prompt } });
    if (res.ok) {
      const p = parseAnalysis(res.text);
      await onUpdate({
        analysis: res.text,
        rating: p.scores,
        warmth_score: p.scores.warmth ?? null,
        style_category: p.styleCategory ?? null,
        score: p.scores.overall ?? 0,
        lastScanned: new Date().toLocaleDateString(),
      });
    } else {
      setAnalysisErr(res.error === "AI_KEY_MISSING" ? "AI setup required." : `AI error: ${res.error}`);
    }
    setAnalyzing(false);
  };

  const suggestLooks = async () => {
    setLooksBusy(true); setLooksErr(null); setLooks(null);
    const prompt = `${homeProfileContext()}\n\nRoom context: ${room.name} (${room.type}). ${parsed?.styleCategory ? `Detected style: ${parsed.styleCategory}.` : ""} ${parsed?.mood ? `Mood: ${parsed.mood}.` : ""} ${notes || ""}\nReturn 4 suggested look concepts as JSON.`;
    const res = await ask({ data: { kind: "looks", prompt } });
    if (!res.ok) { setLooksErr(res.error === "AI_KEY_MISSING" ? "AI setup required." : `AI error: ${res.error}`); setLooksBusy(false); return; }
    try {
      const cleaned = res.text.replace(/```json|```/g, "").trim();
      const arr = JSON.parse(cleaned) as SuggestedLook[];
      setLooks(arr);
    } catch {
      setLooksErr("Could not parse looks. Try again.");
    }
    setLooksBusy(false);
  };

  const saveLook = (l: SuggestedLook) => {
    const next = [...savedLooks.filter((x) => x.title !== l.title), l];
    setSavedLooks(next);
    localStorage.setItem(`arkhi2:looks:${room.id}`, JSON.stringify(next));
  };

  const designEmptyRoom = async () => {
    setEmptyBusy(true); setEmptyOut(null); setEmptyErr(null);
    const dims = (width && length) ? `${width} × ${length} m` : "unknown dimensions";
    const prompt = `${homeProfileContext()}\n\nEmpty room: ${room.name} (${room.type}), ${dims}. Notes: ${notes || "none"}.\nDesign a complete ${emptyBudget.toLowerCase()} tier furnishing for this empty space.`;
    const res = await ask({ data: { kind: "empty_room", prompt } });
    if (res.ok) setEmptyOut(res.text);
    else setEmptyErr(res.error === "AI_KEY_MISSING" ? "AI setup required." : `AI error: ${res.error}`);
    setEmptyBusy(false);
  };

  const saveMeta = () => {
    onUpdate({
      notes, width_m: width ? Number(width) : null, length_m: length ? Number(length) : null,
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <button onClick={onBack} className="text-xs text-muted-foreground mb-4 inline-flex items-center gap-1 hover:text-gold">
        <ArrowLeft className="size-3.5" /> Back to My Home
      </button>
      <PageHeader
        eyebrow={room.type}
        title={<>{room.name} <span className="text-gradient-gold">·</span></>}
        subtitle={cloud ? "Cloud sync active." : "Saving locally — cloud sync setup required."}
        actions={
          <div className="flex gap-2">
            <GhostButton onClick={onDelete}><Trash2 className="inline size-4 mr-1" />Delete</GhostButton>
          </div>
        }
      />

      {/* Gallery + uploader */}
      <LuxeCard className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Room gallery</div>
          <div className="flex gap-2">
            <GhostButton onClick={() => camRef.current?.click()}><Camera className="inline size-4 mr-1" />Camera</GhostButton>
            <GoldButton onClick={() => fileRef.current?.click()}><Upload className="inline size-4 mr-1" />Upload</GoldButton>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFiles(e.target.files)} />

        {(room.images?.length ?? 0) === 0 ? (
          <div className="aspect-video grid place-items-center hairline rounded-lg text-center px-4">
            <div>
              <ImageIcon className="size-10 text-gold/60 mx-auto mb-2" />
              <div className="text-sm">Upload your room to begin your design journey.</div>
              <div className="text-xs text-muted-foreground mt-1">JPG, PNG, HEIC. Multiple images supported.</div>
            </div>
          </div>
        ) : (
          <Gallery paths={room.images ?? []} onRemove={removeImage} />
        )}

        {uploading && <div className="text-xs text-muted-foreground mt-3">Uploading…</div>}
        {uploadMsg && <div className="text-xs text-muted-foreground mt-3">{uploadMsg}</div>}
      </LuxeCard>

      {/* Notes + dimensions */}
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <LuxeCard className="p-5 lg:col-span-2">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">Room notes</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveMeta} rows={4}
            placeholder="What do you love about this room? What feels off? Any styles you're drawn to?"
            className="w-full bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" />
        </LuxeCard>
        <LuxeCard className="p-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">Room dimensions</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">
              <div className="text-muted-foreground mb-1">Width (m)</div>
              <input value={width} onChange={(e) => setWidth(e.target.value)} onBlur={saveMeta}
                className="w-full bg-input/40 hairline rounded-lg px-3 py-2 text-sm" inputMode="decimal" />
            </label>
            <label className="text-xs">
              <div className="text-muted-foreground mb-1">Length (m)</div>
              <input value={length} onChange={(e) => setLength(e.target.value)} onBlur={saveMeta}
                className="w-full bg-input/40 hairline rounded-lg px-3 py-2 text-sm" inputMode="decimal" />
            </label>
          </div>
          <div className="text-[11px] text-muted-foreground mt-3">Continue your room journey anytime — everything is saved.</div>
        </LuxeCard>
      </div>

      {/* AI analysis section */}
      <LuxeCard className="p-5 sm:p-6 mt-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Warm A-Eye reading</div>
            <div className="font-display text-xl mt-1">Let's elevate this space together</div>
          </div>
          <GoldButton onClick={analyze} disabled={analyzing}>
            <ScanLine className="inline size-4 mr-1" />{analyzing ? "A-Eye is reading…" : (parsed ? "Re-analyse room" : "Analyse with A-Eye")}
          </GoldButton>
        </div>
        {analysisErr && <div className="text-sm text-amber-300">{analysisErr}</div>}
        {!parsed && !analyzing && !analysisErr && (
          <div className="text-sm text-muted-foreground">A-Eye will read mood, warmth, lighting and balance — celebrating what already works before suggesting a direction.</div>
        )}
        {parsed && <AnalysisPanel parsed={parsed} />}
      </LuxeCard>

      {/* Suggested looks */}
      <LuxeCard className="p-5 sm:p-6 mt-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Suggested look concepts</div>
            <div className="font-display text-xl mt-1">A few luxury directions for your room</div>
          </div>
          <GoldButton onClick={suggestLooks} disabled={looksBusy}><Wand2 className="inline size-4 mr-1" />{looksBusy ? "Curating…" : "Generate looks"}</GoldButton>
        </div>
        {looksErr && <div className="text-sm text-amber-300">{looksErr}</div>}
        {(looks ?? savedLooks.length ? looks ?? savedLooks : null) && (
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            {(looks ?? savedLooks).map((l) => (
              <LookCard
                key={l.title}
                look={l}
                saved={savedLooks.some((x) => x.title === l.title)}
                onSave={() => saveLook(l)}
              />
            ))}
          </div>
        )}
        {!looks && savedLooks.length === 0 && !looksBusy && (
          <div className="text-sm text-muted-foreground">Tap Generate looks to see Contemporary Luxury, Warm Family Living, Scandinavian Calm, Dubai Hotel and more — tailored to this room.</div>
        )}
      </LuxeCard>

      {/* Empty room mode */}
      <LuxeCard className="p-5 sm:p-6 mt-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Empty room design mode</div>
            <div className="font-display text-xl mt-1">Furnish from a blank canvas</div>
          </div>
          <div className="flex gap-1 hairline rounded-lg p-1 text-xs">
            {(["Budget", "Mid-range", "Premium", "Luxury"] as const).map((b) => (
              <button key={b} onClick={() => setEmptyBudget(b)}
                className={`px-3 py-1.5 rounded-md transition ${emptyBudget === b ? "bg-gold text-onyx" : "text-muted-foreground"}`}>{b}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <GoldButton onClick={designEmptyRoom} disabled={emptyBusy}><Sparkles className="inline size-4 mr-1" />{emptyBusy ? "Designing…" : `Design ${emptyBudget} look`}</GoldButton>
        </div>
        {emptyErr && <div className="text-sm text-amber-300 mt-3">{emptyErr}</div>}
        {emptyOut && <div className="text-sm whitespace-pre-wrap mt-4 leading-relaxed">{emptyOut}</div>}
      </LuxeCard>
    </div>
  );
}

/* ---------- Gallery with mobile-friendly slider ---------- */

function Gallery({ paths, onRemove }: { paths: string[]; onRemove: (p: string) => void }) {
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all(paths.map((p) => signedRoomUrl(p).then((u) => [p, u] as const))).then((entries) => {
      if (!cancelled) setUrls(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, [paths]);

  if (!paths.length) return null;
  const idx = Math.min(active, paths.length - 1);
  const cur = paths[idx];

  return (
    <div>
      <div className="relative aspect-video rounded-lg overflow-hidden bg-onyx/60">
        {urls[cur] ? (
          <img src={urls[cur] ?? undefined} alt="Room" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground text-xs">Loading…</div>
        )}
        {paths.length > 1 && (
          <>
            <button onClick={() => setActive((idx - 1 + paths.length) % paths.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-onyx/70 hairline grid place-items-center"><ChevronLeft className="size-4" /></button>
            <button onClick={() => setActive((idx + 1) % paths.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-onyx/70 hairline grid place-items-center"><ChevronRight className="size-4" /></button>
            <div className="absolute bottom-2 right-2 bg-onyx/70 hairline rounded px-2 py-0.5 text-[10px]">{idx + 1} / {paths.length}</div>
          </>
        )}
        <button onClick={() => onRemove(cur)} className="absolute top-2 right-2 size-8 rounded-md bg-onyx/70 hairline grid place-items-center" aria-label="Delete">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
        {paths.map((p, i) => (
          <button key={p} onClick={() => setActive(i)}
            className={`relative aspect-square rounded-md overflow-hidden hairline ${i === idx ? "ring-2 ring-gold" : ""}`}>
            {urls[p] ? <img src={urls[p] ?? undefined} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="bg-onyx/40 absolute inset-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Analysis panel with scores ---------- */

const SCORE_LABELS: Array<[keyof RoomScores, string]> = [
  ["overall", "Overall"], ["comfort", "Comfort"], ["luxury", "Luxury"],
  ["warmth", "Warmth"], ["lighting", "Lighting"], ["spaceEfficiency", "Space"],
  ["styleConsistency", "Style"], ["familyFriendly", "Family"],
];

function AnalysisPanel({ parsed }: { parsed: ParsedAnalysis }) {
  return (
    <div className="space-y-5">
      {parsed.mood && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Room mood</div>
          <p className="text-sm leading-relaxed">{parsed.mood}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {parsed.strengths.length > 0 && (
          <div className="hairline rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-gold mb-2">Strengths</div>
            <ul className="text-sm space-y-1.5">{parsed.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-gold">✓</span>{s}</li>)}</ul>
          </div>
        )}
        {parsed.opportunities.length > 0 && (
          <div className="hairline rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-gold mb-2">Opportunities</div>
            <ul className="text-sm space-y-1.5">{parsed.opportunities.map((s, i) => <li key={i} className="flex gap-2"><span className="text-gold">→</span>{s}</li>)}</ul>
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-gold mb-2">A-Eye scores</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SCORE_LABELS.map(([key, label]) => {
            const v = parsed.scores[key];
            if (v === undefined) return null;
            return (
              <div key={key} className="hairline rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
                <div className="font-display text-2xl text-gradient-gold">{v}</div>
                <div className="h-1 mt-1.5 bg-onyx/60 rounded-full overflow-hidden">
                  <div className="h-full gradient-gold" style={{ width: `${v}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {parsed.styleCategory && (
        <div className="text-sm"><span className="text-muted-foreground">Style read · </span><span className="text-gold">{parsed.styleCategory}</span></div>
      )}
      {parsed.direction && (
        <div className="hairline rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-gold mb-1.5">Suggested direction</div>
          <p className="text-sm leading-relaxed">{parsed.direction}</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {parsed.budget && (
          <div className="hairline rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-gold mb-1.5">Budget guidance</div>
            <p className="text-sm">{parsed.budget}</p>
          </div>
        )}
        {parsed.suggestedLook && (
          <div className="hairline rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-gold mb-1.5">Suggested look</div>
            <p className="text-sm">{parsed.suggestedLook}</p>
          </div>
        )}
      </div>
      {parsed.partners.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Sample design inspiration from partner style collections</div>
          <div className="flex flex-wrap gap-2">{parsed.partners.map((p, i) => <span key={i} className="hairline rounded px-3 py-1.5 text-xs">{p}</span>)}</div>
        </div>
      )}
      {parsed.nextStep && (
        <div className="bg-gold/5 hairline rounded-lg p-4 text-sm">
          <span className="text-gold mr-2">Next step ·</span>{parsed.nextStep}
        </div>
      )}
    </div>
  );
}

/* ---------- Suggested look card ---------- */

type SuggestedLook = {
  title: string; mood: string; budget: string; partner: string; why: string; categories: string[];
};

function LookCard({ look, saved, onSave }: { look: SuggestedLook; saved: boolean; onSave: () => void }) {
  // Deterministic gradient cover based on title hash so each look has its own visual identity
  const hue = Array.from(look.title).reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const cover = `linear-gradient(135deg, hsl(${hue} 45% 18%), hsl(${(hue + 40) % 360} 35% 32%))`;
  return (
    <div className="hairline rounded-xl overflow-hidden">
      <div className="aspect-[16/9] relative" style={{ background: cover }}>
        <div className="absolute inset-0 grid place-items-center text-onyx/0">
          <Palette className="size-10 text-gold/70" />
        </div>
        <div className="absolute bottom-2 left-2 text-[10px] tracking-[0.25em] uppercase text-gold/80">Sample inspiration</div>
      </div>
      <div className="p-4">
        <div className="font-display text-lg">{look.title}</div>
        <div className="text-xs text-muted-foreground italic">{look.mood}</div>
        <p className="text-sm mt-2">{look.why}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {look.categories?.slice(0, 6).map((c) => <span key={c} className="hairline rounded-full px-2 py-0.5 text-[10px]">{c}</span>)}
        </div>
        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="text-gold">{look.budget}</span>
          <span className="text-muted-foreground">{look.partner}</span>
        </div>
        <button onClick={onSave} className={`mt-3 w-full hairline rounded-lg py-2 text-xs flex items-center justify-center gap-1 ${saved ? "text-gold" : ""}`}>
          <Heart className={`size-3.5 ${saved ? "fill-gold text-gold" : ""}`} /> {saved ? "Saved to wishlist" : "Save to wishlist"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Preferences ---------- */

function PreferencesCard() {
  const [prefs, setPrefs] = useState<HomePrefs>({});
  useEffect(() => { setPrefs(getHomePrefs()); }, []);
  const update = (k: keyof HomePrefs, v: string) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    setHomePrefs(next);
  };
  const Field = ({ k, label, placeholder }: { k: keyof HomePrefs; label: string; placeholder: string }) => (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">{label}</div>
      <input value={prefs[k] ?? ""} onChange={(e) => update(k, e.target.value)} placeholder={placeholder}
        className="w-full bg-input/40 hairline rounded-lg px-3 py-2 text-sm" />
    </label>
  );
  return (
    <LuxeCard className="p-6 mt-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-1">Home preferences</div>
      <div className="text-xs text-muted-foreground mb-4">Used by A-Eye to personalise direction, looks and partner inspiration.</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Field k="style" label="Preferred style" placeholder="e.g. modern beige, Japandi" />
        <Field k="budget" label="Budget (AED)" placeholder="e.g. 8,000 – 15,000" />
        <Field k="colors" label="Preferred colours" placeholder="e.g. warm neutrals, brass" />
        <Field k="retailer" label="Preferred retailer" placeholder="Pan Emirates / Danube / IKEA UAE" />
      </div>
    </LuxeCard>
  );
}
