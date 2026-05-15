import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";

export const Route = createFileRoute("/snap-compare")({ component: SnapCompare });

function SnapCompare() {
  const [item, setItem] = useState<string | null>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const itemRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef<HTMLInputElement>(null);

  const analyze = () => setAnalyzed(true);

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
        <input ref={itemRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setItem(URL.createObjectURL(e.target.files[0]))} />
        <input ref={roomRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setRoom(URL.createObjectURL(e.target.files[0]))} />
      </div>

      <LuxeCard className="p-6 mt-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Width (cm)" value={width} onChange={setWidth} placeholder="e.g. 220" />
          <Field label="Depth (cm)" value={depth} onChange={setDepth} placeholder="e.g. 95" />
          <div className="flex items-end">
            <GoldButton onClick={analyze} className="w-full">Run A-Eye comparison</GoldButton>
          </div>
        </div>
      </LuxeCard>

      {analyzed && (
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          {[
            ["Fit Score", "78%"],
            ["Style Match", "91%"],
            ["Clearance", "OK"],
            ["Verdict", "Buy"],
          ].map(([k, v]) => (
            <LuxeCard key={k} className="p-5 text-center">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{k}</div>
              <div className="font-display text-3xl mt-2 text-gradient-gold">{v}</div>
            </LuxeCard>
          ))}
          <LuxeCard className="p-6 md:col-span-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">A-Eye recommendation</div>
            <p>Recommended placement: along the longest wall facing the natural light source. Maintain 60cm walking clearance to the coffee table. A warmer-toned alternative could improve color cohesion.</p>
          </LuxeCard>
        </div>
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
