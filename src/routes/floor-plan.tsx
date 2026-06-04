import { createFileRoute } from "@tanstack/react-router";
import { trackAi } from "@/lib/analytics";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Map } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton, GhostButton } from "@/components/ui-kit";
import { useAuth } from "@/lib/useAuth";
import { uploadUserFile } from "@/lib/upload";
import { supabase } from "@/integrations/supabase/client";
import { aiAsk } from "@/lib/ai.functions";
import { homeProfileContext } from "@/lib/homeContext";

export const Route = createFileRoute("/floor-plan")({ component: FloorPlan });

function FloorPlan() {
  const { user } = useAuth();
  const ask = useServerFn(aiAsk);
  const [url, setUrl] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [dims, setDims] = useState({ w: "", d: "", h: "", doors: "" });
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const onFile = async (f: File) => {
    setUrl(URL.createObjectURL(f));
    setPath(null);
    if (user) {
      const up = await uploadUserFile("floor-plans", f);
      if (up.ok) setPath(up.path);
    }
  };

  const analyze = async () => {
    setBusy(true); setAiErr(null); setAiText(null);
    const prompt = `${homeProfileContext()}\n\nFloor plan ${path ?? "(local only)"}. Dimensions WxDxH: ${dims.w || "?"}×${dims.d || "?"}×${dims.h || "?"}m, doors: ${dims.doors || "?"}.\nDeliver zoning, recommended partner products per zone (Pan Emirates / Danube Home / IKEA UAE / Home Centre), full-room shopping list, estimated AED redesign budget range, and customer next step.`;
    const res = await trackAi("floorplan", () => ask({ data: { kind: "floorplan", prompt } }));
    if (res.ok) {
      setAiText(res.text);
      if (user) {
        await supabase.from("scans").insert({
          user_id: user.id, kind: "floorplan", image_path: path, result: { dims, feedback: res.text },
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
        eyebrow="Spatial AI"
        title={<>Floor <span className="text-gradient-gold">Plan AI</span></>}
        subtitle="Upload, sketch or enter dimensions. A-Eye zones the space, suggests placements, and generates a redesign budget."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <LuxeCard className="lg:col-span-2 aspect-[4/3] relative overflow-hidden grain">
          {url ? (
            <img src={url} alt="floor plan" className="absolute inset-0 w-full h-full object-contain bg-onyx" />
          ) : (
            <button onClick={() => ref.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="size-16 rounded-2xl gradient-gold grid place-items-center text-onyx"><Upload className="size-8" /></div>
              <div className="font-display text-2xl">Upload floor plan</div>
              <div className="text-xs text-muted-foreground">PDF, JPG, PNG, sketches accepted</div>
            </button>
          )}
          <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </LuxeCard>

        <div className="space-y-4">
          <LuxeCard className="p-5">
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-3">Manual dimensions</div>
            <div className="grid grid-cols-2 gap-2">
              <input value={dims.w} onChange={(e) => setDims({ ...dims, w: e.target.value })} placeholder="Width (m)" className="bg-input/40 hairline rounded px-3 py-2 text-sm" />
              <input value={dims.d} onChange={(e) => setDims({ ...dims, d: e.target.value })} placeholder="Depth (m)" className="bg-input/40 hairline rounded px-3 py-2 text-sm" />
              <input value={dims.h} onChange={(e) => setDims({ ...dims, h: e.target.value })} placeholder="Height (m)" className="bg-input/40 hairline rounded px-3 py-2 text-sm" />
              <input value={dims.doors} onChange={(e) => setDims({ ...dims, doors: e.target.value })} placeholder="Doors" className="bg-input/40 hairline rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2 mt-4">
              <GoldButton className="flex-1" onClick={analyze} disabled={busy}>{busy ? "Analyzing…" : "Analyze"}</GoldButton>
              <GhostButton><Map className="inline size-4" /></GhostButton>
            </div>
            {!user && <div className="text-xs text-muted-foreground mt-2">Sign in to save plans to your cloud.</div>}
          </LuxeCard>

          {(aiText || aiErr) && (
            <LuxeCard className="p-5">
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">A-Eye plan</div>
              {aiErr && <div className="text-sm text-amber-300">{aiErr}</div>}
              {aiText && <div className="text-sm whitespace-pre-wrap">{aiText}</div>}
            </LuxeCard>
          )}
        </div>
      </div>
    </div>
  );
}
