import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Upload, Map } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton, GhostButton, SetupRequired } from "@/components/ui-kit";

export const Route = createFileRoute("/floor-plan")({ component: FloorPlan });

function FloorPlan() {
  const [url, setUrl] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

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
          <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setUrl(URL.createObjectURL(e.target.files[0]))} />
        </LuxeCard>

        <div className="space-y-4">
          <LuxeCard className="p-5">
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-3">Manual dimensions</div>
            <div className="grid grid-cols-2 gap-2">
              {["Width (m)", "Depth (m)", "Height (m)", "Doors"].map((l) => (
                <input key={l} placeholder={l} className="bg-input/40 hairline rounded px-3 py-2 text-sm" />
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <GoldButton className="flex-1">Analyze</GoldButton>
              <GhostButton><Map className="inline size-4" /></GhostButton>
            </div>
          </LuxeCard>

          <SetupRequired feature="Live floor plan AI" env={["VITE_OPENAI_API_KEY"]} />
        </div>
      </div>
    </div>
  );
}
