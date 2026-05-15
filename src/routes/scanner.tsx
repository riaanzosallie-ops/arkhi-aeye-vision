import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, ScanLine, X, Sparkles } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton, GhostButton } from "@/components/ui-kit";

export const Route = createFileRoute("/scanner")({ component: ScannerPage });

const STAGES = [
  "Upload received",
  "Analysing dimensions",
  "Detecting lighting",
  "Detecting colours",
  "Detecting furniture",
  "Estimating room size",
  "Checking spacing",
  "Generating recommendations",
  "Calculating redesign pricing",
];

function ScannerPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [stage, setStage] = useState(-1);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stage < 0 || done) return;
    if (stage >= STAGES.length) { setDone(true); return; }
    const t = setTimeout(() => setStage((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [stage, done]);

  const onFile = (f: File) => {
    setImageUrl(URL.createObjectURL(f));
    setDone(false);
    setStage(0);
  };

  const reset = () => { setImageUrl(null); setStage(-1); setDone(false); };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Live AI"
        title={<>A-Eye <span className="text-gradient-gold">Scanner</span></>}
        subtitle="Upload a room photo. Watch A-Eye analyze dimensions, lighting, color, furniture, spacing, and recommendations in real time."
        actions={imageUrl ? <GhostButton onClick={reset}>New scan</GhostButton> : undefined}
      />

      <div className="grid lg:grid-cols-5 gap-6">
        {/* SCAN AREA */}
        <div className="lg:col-span-3">
          <LuxeCard className="relative aspect-[4/3] overflow-hidden grain">
            {!imageUrl ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 hover:bg-gold/5 transition"
              >
                <div className="size-20 rounded-2xl gradient-gold grid place-items-center text-onyx shadow-luxe">
                  <Upload className="size-9" />
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl">Upload a room</div>
                  <div className="text-sm text-muted-foreground mt-1">JPG, PNG, HEIC up to 20MB</div>
                </div>
              </button>
            ) : (
              <>
                <img src={imageUrl} alt="Room" className={`absolute inset-0 w-full h-full object-cover transition ${done ? "" : "brightness-50"}`} />
                {!done && (
                  <>
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_20px_var(--gold)] animate-scan" />
                    <div className="absolute inset-0 ring-1 ring-gold/30" />
                    <div className="absolute top-4 left-4 hairline rounded-md px-3 py-1.5 text-xs bg-onyx/70 backdrop-blur flex items-center gap-2">
                      <ScanLine className="size-3.5 text-gold animate-pulse" />
                      <span>A-Eye scanning…</span>
                    </div>
                  </>
                )}
                {done && (
                  <div className="absolute top-4 left-4 hairline rounded-md px-3 py-1.5 text-xs bg-onyx/70 backdrop-blur flex items-center gap-2">
                    <Sparkles className="size-3.5 text-gold" />
                    <span>Analysis complete</span>
                  </div>
                )}
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </LuxeCard>

          {imageUrl && (
            <div className="flex gap-2 mt-3">
              <GhostButton onClick={() => fileRef.current?.click()}>Replace</GhostButton>
              <GhostButton onClick={reset}><X className="inline size-4 mr-1" />Clear</GhostButton>
            </div>
          )}
        </div>

        {/* STAGE PANEL */}
        <div className="lg:col-span-2 space-y-4">
          <LuxeCard className="p-5">
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-3">Pipeline</div>
            <ol className="space-y-2">
              {STAGES.map((label, i) => {
                const state = stage > i || done ? "done" : stage === i ? "active" : "pending";
                return (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <span className={`size-5 rounded-full grid place-items-center text-[10px] ${
                      state === "done" ? "bg-gold text-onyx" :
                      state === "active" ? "hairline text-gold animate-pulse-gold" :
                      "border border-border text-muted-foreground"
                    }`}>{state === "done" ? "✓" : i + 1}</span>
                    <span className={state === "pending" ? "text-muted-foreground" : ""}>{label}</span>
                  </li>
                );
              })}
            </ol>
          </LuxeCard>

          {done && (
            <LuxeCard className="p-5">
              <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-3">Result preview</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Room Score", "82"],
                  ["Layout", "A-"],
                  ["Lighting", "Warm"],
                  ["Est. Width", "4.2m"],
                  ["Est. Depth", "5.1m"],
                  ["Clearance", "OK"],
                ].map(([k, v]) => (
                  <div key={k} className="hairline rounded-lg px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                    <div className="font-display text-xl text-gradient-gold">{v}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Estimated from image. Confirm dimensions manually for purchase accuracy.
              </p>
              <div className="mt-4 flex gap-2">
                <GoldButton>Save to Home Profile</GoldButton>
              </div>
            </LuxeCard>
          )}
        </div>
      </div>
    </div>
  );
}
