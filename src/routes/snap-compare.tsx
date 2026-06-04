import { createFileRoute } from "@tanstack/react-router";
import { trackAi } from "@/lib/analytics";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Upload } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";
import { useAuth } from "@/lib/useAuth";
import { uploadUserFile } from "@/lib/upload";
import { supabase } from "@/integrations/supabase/client";
import { aiAsk } from "@/lib/ai.functions";
import { homeProfileContext } from "@/lib/homeContext";

export const Route = createFileRoute("/snap-compare")({ component: SnapCompare });

function SnapCompare() {
  const { user } = useAuth();
  const ask = useServerFn(aiAsk);
  const [item, setItem] = useState<string | null>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [itemPath, setItemPath] = useState<string | null>(null);
  const [roomPath, setRoomPath] = useState<string | null>(null);
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const itemRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef<HTMLInputElement>(null);

  const pick = async (bucket: "item-photos" | "room-photos", f: File, setUrl: (s: string) => void, setPath: (p: string | null) => void) => {
    setUrl(URL.createObjectURL(f));
    setPath(null);
    if (user) {
      const up = await uploadUserFile(bucket, f);
      if (up.ok) setPath(up.path);
    }
  };

  const analyze = async () => {
    setBusy(true);
    setAiErr(null);
    setAiText(null);
    const prompt = `${homeProfileContext()}\n\nFurniture item ${itemPath ?? "(local)"} vs room ${roomPath ?? "(local)"}. Item dims: width ${width || "?"}cm × depth ${depth || "?"}cm.\nDecide: Will it fit? Will it match the saved room/style? Should the customer buy now, hold, or pick an alternative? Suggest matching add-ons and an estimated basket value.`;
    const res = await ask({ data: { kind: "snap", prompt } });
    if (res.ok) {
      setAiText(res.text);
      if (user) {
        await supabase.from("scans").insert({
          user_id: user.id, kind: "snap", image_path: itemPath, secondary_path: roomPath,
          result: { width, depth, feedback: res.text },
        });
      }
    } else {
      setAiErr(res.error === "AI_KEY_MISSING" ? "AI setup required" : `AI error: ${res.error}`);
    }
    setBusy(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Fit Intelligence"
        title={<>Snap & <span className="text-gradient-gold">Compare</span></>}
        subtitle="Photograph any furniture or item, place it against your saved room, and let A-Eye tell you if it fits."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Slot label="Furniture / Item" url={item} onPick={() => itemRef.current?.click()} icon={<Camera className="size-8" />} />
        <Slot label="Room Reference" url={room} onPick={() => roomRef.current?.click()} icon={<Upload className="size-8" />} />
        <input ref={itemRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && pick("item-photos", e.target.files[0], setItem, setItemPath)} />
        <input ref={roomRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && pick("room-photos", e.target.files[0], setRoom, setRoomPath)} />
      </div>

      <LuxeCard className="p-6 mt-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Width (cm)" value={width} onChange={setWidth} placeholder="e.g. 220" />
          <Field label="Depth (cm)" value={depth} onChange={setDepth} placeholder="e.g. 95" />
          <div className="flex items-end">
            <GoldButton onClick={analyze} className="w-full" disabled={busy || (!item && !room)}>{busy ? "Analyzing…" : "Run A-Eye comparison"}</GoldButton>
          </div>
        </div>
        {!user && <div className="text-xs text-muted-foreground mt-3">Sign in to save uploads & results to your cloud.</div>}
      </LuxeCard>

      {(aiText || aiErr) && (
        <LuxeCard className="p-6 mt-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">A-Eye verdict</div>
          {aiErr && <div className="text-sm text-amber-300">{aiErr}</div>}
          {aiText && <div className="text-sm whitespace-pre-wrap">{aiText}</div>}
        </LuxeCard>
      )}
    </div>
  );
}

function Slot({ label, url, onPick, icon }: { label: string; url: string | null; onPick: () => void; icon: React.ReactNode }) {
  return (
    <LuxeCard className="aspect-[4/3] relative overflow-hidden grain">
      {url ? (
        <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <button onClick={onPick} className="absolute inset-0 flex flex-col items-center justify-center gap-3 hover:bg-gold/5 transition">
          <div className="size-16 rounded-2xl gradient-gold grid place-items-center text-onyx">{icon}</div>
          <div className="font-display text-xl">{label}</div>
          <div className="text-xs text-muted-foreground">Tap to upload</div>
        </button>
      )}
      {url && (
        <button onClick={onPick} className="absolute bottom-3 right-3 hairline bg-onyx/80 backdrop-blur rounded-md px-3 py-1.5 text-xs">Replace</button>
      )}
    </LuxeCard>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
      />
    </label>
  );
}
