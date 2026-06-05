import { createFileRoute, Link } from "@tanstack/react-router";
import { trackAi } from "@/lib/analytics";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, FileText, Printer, Copy, Share2, Download, Save, Lock } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton, GhostButton } from "@/components/ui-kit";
import { useAuth } from "@/lib/useAuth";
import { uploadUserFile } from "@/lib/upload";
import { signedRoomUrl } from "@/lib/signedUrl";
import { supabase } from "@/integrations/supabase/client";
import { aiFloorPlan } from "@/lib/ai.functions";

export const Route = createFileRoute("/floor-plan")({ component: FloorPlan });

type RoomScores = {
  space_efficiency?: number; luxury_potential?: number; family_friendly?: number;
  natural_flow?: number; storage?: number; resale?: number;
};
type Room = {
  name: string; width_m?: number; length_m?: number; area_m2?: number;
  doors?: number; windows?: number;
  recommended_furniture?: string[]; layout_notes?: string;
  lighting?: string[]; storage?: string[]; optimization?: string[];
  scores?: RoomScores;
  renovation?: { budget_aed?: number; midrange_aed?: number; luxury_aed?: number };
  boq?: {
    flooring_m2?: number; paint_wall_m2?: number; ceiling_m2?: number; skirting_m?: number;
    doors?: number; windows?: number;
    estimated_cost_aed?: Record<string, number>;
  };
};
type InsItem = {
  name: string; category?: string; quantity?: number;
  replacement_aed?: number; market_aed?: number; depreciated_aed?: number; insurance_aed?: number;
  comparable_used?: boolean; notes?: string; confidence?: number;
};
type Report = {
  detection_status?: "ok" | "failed";
  pipeline?: { ocr_ran?: boolean; room_detection_ran?: boolean; area_calculation_ran?: boolean };
  property?: { name?: string; total_internal_area_m2?: number; currency?: string };
  rooms?: Room[];
  property_scores?: Record<string, number>;
  commercial?: Record<string, string | number>;
  boq_totals?: Record<string, number>;
  renovation_totals?: { budget_aed?: number; midrange_aed?: number; luxury_aed?: number };
  insurance?: { enabled?: boolean; items?: InsItem[] };
  confidence?: Record<string, number>;
  clarification_needed?: string[];
};

const fmtAED = (n?: number) => (typeof n === "number" ? `AED ${n.toLocaleString()}` : "—");
const pct = (n?: number) => (typeof n === "number" ? `${Math.round(n)}%` : "—");

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("file_read_failed"));
    r.readAsDataURL(f);
  });
}

type Stage = "idle" | "uploading" | "analyzing" | "done" | "failed";

function FloorPlan() {
  const { user } = useAuth();
  const analyze = useServerFn(aiFloorPlan);
  const [url, setUrl] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; type: string; size: number } | null>(null);
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const ref = useRef<HTMLInputElement>(null);

  const runWith = async (sourceUrl: string, cloudPath: string | null) => {
    setBusy(true); setStage("analyzing"); setErr(null); setReport(null);
    try {
      console.info("[floor-plan] analyze start", { source: sourceUrl.slice(0, 32) });
      const res = await trackAi("floorplan", () => analyze({ data: { imageUrls: [sourceUrl], notes } }));
      if (res.ok) {
        try {
          const parsed = JSON.parse(res.reportJson) as Report;
          setReport(parsed);
          setStage(parsed.detection_status === "failed" ? "failed" : "done");
          if (user && cloudPath) {
            await supabase.from("scans").insert({
              user_id: user.id, kind: "floorplan", image_path: cloudPath, result: parsed as never,
            });
          }
        } catch {
          setErr("AI returned an unreadable report."); setStage("failed");
        }
      } else {
        setErr(
          res.error === "AI_KEY_MISSING" ? "AI setup required" :
          res.error === "AI_HALLUCINATION_BLOCKED" ? "AI response was generic, not grounded in the image. Please re-run or upload a clearer plan." :
          `AI error: ${res.error}`,
        );
        setStage("failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (f: File) => {
    setUrl(URL.createObjectURL(f));
    setPath(null);
    setReport(null);
    setErr(null);
    setFileMeta({ name: f.name, type: f.type || "unknown", size: f.size });
    setStage("uploading");
    console.info("[floor-plan] file received", { name: f.name, type: f.type, size: f.size });

    let data: string | null = null;
    try { data = await fileToDataUrl(f); setDataUrl(data); }
    catch { setErr("Could not read the uploaded file."); setStage("failed"); return; }

    let signed: string | null = null;
    let cloudPath: string | null = null;
    if (user) {
      const up = await uploadUserFile("floor-plans", f);
      if (up.ok) {
        cloudPath = up.path;
        setPath(up.path);
        signed = await signedRoomUrl(up.path, "floor-plans");
      }
    }
    void runWith(signed ?? data, cloudPath);
  };

  const rerun = () => {
    if (!dataUrl) { setErr("Upload a floor plan first."); return; }
    void runWith(dataUrl, path);
  };

  const printReport = () => window.print();
  const hasFile = Boolean(url);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Floor Plan Intelligence"
        title={<>A-Eye <span className="text-gradient-gold">Spatial Report</span></>}
        subtitle="Upload a floor plan. A-Eye OCRs labels, reads dimensions, computes areas, and returns a room-by-room intelligence report with renovation costs, BOQ, valuation, and AI scoring."
      />

      <div className="grid lg:grid-cols-3 gap-6 print:hidden">
        <LuxeCard className="lg:col-span-2 aspect-[4/3] relative overflow-hidden grain">
          {url ? (
            <img src={url} alt="floor plan" className="absolute inset-0 w-full h-full object-contain bg-onyx" />
          ) : (
            <button onClick={() => ref.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="size-16 rounded-2xl gradient-gold grid place-items-center text-onyx"><Upload className="size-8" /></div>
              <div className="font-display text-2xl">Upload floor plan</div>
              <div className="text-xs text-muted-foreground">JPG / PNG / PDF page export</div>
            </button>
          )}
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </LuxeCard>

        <div className="space-y-4">
          <LuxeCard className="p-5">
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-3">Optional context</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Apartment in JVC Dubai, 2BR, ceiling 3.0m, renovation budget AED 80k"
              className="w-full bg-input/40 hairline rounded px-3 py-2 text-sm h-24"
            />
            <div className="flex gap-2 mt-4">
              <GoldButton className="flex-1" onClick={rerun} disabled={busy || !hasFile}>
                {busy ? "Analyzing plan…" : hasFile ? "Re-run Intelligence" : "Upload a floor plan to begin"}
              </GoldButton>
              <GhostButton onClick={() => ref.current?.click()}><Upload className="inline size-4" /></GhostButton>
            </div>
            {err && <div className="text-sm text-amber-300 mt-3">{err}</div>}
          </LuxeCard>

          <DebugPanel fileMeta={fileMeta} stage={stage} cloudUploaded={Boolean(path)} report={report} />

          {report && stage === "done" && (
            <LuxeCard className="p-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Executive report ready</div>
                <div className="text-sm text-muted-foreground">{report.rooms?.length ?? 0} rooms • {report.property?.total_internal_area_m2 ?? "—"} m²</div>
              </div>
              <GoldButton onClick={printReport}><Printer className="inline size-4 mr-1" /> Export PDF</GoldButton>
            </LuxeCard>
          )}
        </div>
      </div>

      {hasFile && stage === "failed" && (
        <LuxeCard className="p-5 mt-6 border border-amber-400/40">
          <div className="text-[10px] uppercase tracking-[0.3em] text-amber-300 mb-2">Property Detection Report — Analysis Failed</div>
          <div className="font-display text-xl mb-2">Unable to detect room labels or dimensions.</div>
          <div className="text-sm text-muted-foreground">Recommendations:</div>
          <ul className="list-disc pl-5 text-sm text-amber-200/90 space-y-1 mt-2">
            <li>Upload a higher-resolution image.</li>
            <li>Upload a PDF page exported as PNG/JPG.</li>
            <li>Ensure room labels and printed dimensions are readable.</li>
          </ul>
          {report?.clarification_needed && report.clarification_needed.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-amber-200/90 space-y-1 mt-3">
              {report.clarification_needed.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          )}
        </LuxeCard>
      )}

      {report && stage === "done" && (
        <div id="arkhi-report" className="mt-8 space-y-6 print:mt-0">
          <ReportHeader report={report} />
          <DetectionReport report={report} />
          <PropertyOverview report={report} />
          <RoomBreakdown rooms={report.rooms ?? []} />
          <RenovationSummary report={report} />
          <BoqSummary report={report} />
          <InsuranceSection ins={report.insurance} />
          <CommercialSection commercial={report.commercial} />
          <ScoresSection scores={report.property_scores} />
          <ConfidenceSection confidence={report.confidence} clarifications={report.clarification_needed} />
          <div className="text-[10px] text-muted-foreground text-center pt-4">
            ARKHI A-Eye Spatial Intelligence — estimates based on UAE 2024–2025 market references. Confirm dimensions and quantities with site survey before contracting.
          </div>
        </div>
      )}
    </div>
  );
}

function DebugPanel({
  fileMeta, stage, cloudUploaded, report,
}: {
  fileMeta: { name: string; type: string; size: number } | null;
  stage: Stage;
  cloudUploaded: boolean;
  report: Report | null;
}) {
  const ocrRan = Boolean(report?.pipeline?.ocr_ran);
  const roomRan = Boolean(report?.pipeline?.room_detection_ran);
  const areaRan = Boolean(report?.pipeline?.area_calculation_ran);
  const rooms = report?.rooms ?? [];
  const dimsFound = rooms.filter(r => r.width_m && r.length_m).length;
  const conf = report?.confidence?.overall;
  const row = (k: string, v: string, tone: "ok" | "warn" | "muted" = "muted") => (
    <div className="flex justify-between text-xs py-1 border-b border-white/5">
      <span className="text-muted-foreground">{k}</span>
      <span className={tone === "ok" ? "text-gold" : tone === "warn" ? "text-amber-300" : "text-foreground/80"}>{v}</span>
    </div>
  );
  return (
    <LuxeCard className="p-4">
      <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">Debug — Detection Pipeline</div>
      {row("File Received", fileMeta ? "YES" : "NO", fileMeta ? "ok" : "warn")}
      {fileMeta && row("File", `${fileMeta.name} • ${(fileMeta.size / 1024).toFixed(0)} KB`)}
      {row("Cloud Upload", cloudUploaded ? "YES" : "NO (inline)")}
      {row("Stage", stage.toUpperCase(), stage === "failed" ? "warn" : stage === "done" ? "ok" : "muted")}
      {row("OCR Run", ocrRan ? "YES" : "NO", ocrRan ? "ok" : "warn")}
      {row("Room Detection", roomRan ? "YES" : "NO", roomRan ? "ok" : "warn")}
      {row("Rooms Detected", String(rooms.length), rooms.length > 0 ? "ok" : "warn")}
      {row("Dimensions Found", String(dimsFound), dimsFound > 0 ? "ok" : "warn")}
      {row("Area Calculation", areaRan ? "YES" : "NO", areaRan ? "ok" : "warn")}
      {row("Confidence", typeof conf === "number" ? `${Math.round(conf)}%` : "—", typeof conf === "number" && conf >= 55 ? "ok" : "warn")}
    </LuxeCard>
  );
}

function ReportHeader({ report }: { report: Report }) {
  return (
    <div className="flex items-end justify-between border-b border-gold/30 pb-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold">A-Eye Executive Report</div>
        <h2 className="font-display text-3xl">{report.property?.name ?? "Property Analysis"}</h2>
      </div>
      <div className="text-right text-sm">
        <div className="text-gold">Total Internal Area</div>
        <div className="font-display text-2xl">{report.property?.total_internal_area_m2 ?? "—"} m²</div>
      </div>
    </div>
  );
}

function DetectionReport({ report }: { report: Report }) {
  const rooms = report.rooms ?? [];
  const overall = report.confidence?.overall;
  return (
    <LuxeCard className="p-5">
      <SectionTitle label="Property Detection Report" />
      <div className="grid grid-cols-3 gap-3 mt-3">
        <Pill label="Rooms Detected" value={String(rooms.length)} />
        <Pill label="Total Area" value={`${report.property?.total_internal_area_m2 ?? "—"} m²`} />
        <Pill label="Confidence" value={typeof overall === "number" ? `${Math.round(overall)}%` : "—"} />
      </div>
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">Room Breakdown</div>
        <ul className="space-y-1 text-sm">
          {rooms.map((r, i) => (
            <li key={i} className="flex items-baseline justify-between border-b border-white/5 py-1">
              <span><span className="text-gold mr-2">Detected:</span>{r.name}</span>
              <span className="text-muted-foreground text-xs">
                {r.width_m && r.length_m ? `${r.width_m}m × ${r.length_m}m` : "dimensions unreadable"} {r.area_m2 ? `• ${r.area_m2} m²` : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </LuxeCard>
  );
}



function PropertyOverview({ report }: { report: Report }) {
  const rooms = report.rooms ?? [];
  return (
    <LuxeCard className="p-5">
      <SectionTitle icon={<FileText className="size-4" />} label="Property Overview" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
        {rooms.map((r, i) => (
          <div key={i} className="hairline rounded-lg p-3 text-sm">
            <div className="font-display text-lg">{r.name}</div>
            <div className="text-muted-foreground text-xs">
              {r.width_m && r.length_m ? `${r.width_m}m × ${r.length_m}m` : ""} {r.area_m2 ? `• ${r.area_m2} m²` : ""}
            </div>
            <div className="text-xs text-muted-foreground">Doors {r.doors ?? 0} • Windows {r.windows ?? 0}</div>
          </div>
        ))}
      </div>
    </LuxeCard>
  );
}

function RoomBreakdown({ rooms }: { rooms: Room[] }) {
  if (!rooms.length) return null;
  return (
    <LuxeCard className="p-5">
      <SectionTitle label="Room-by-Room Intelligence" />
      <div className="space-y-5 mt-3">
        {rooms.map((r, i) => (
          <div key={i} className="hairline rounded-xl p-4">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div className="font-display text-xl">{r.name}</div>
              <div className="text-xs text-gold">{r.area_m2 ?? "—"} m²</div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-3 text-sm">
              <ListBlock title="Recommended Furniture" items={r.recommended_furniture} />
              <ListBlock title="Lighting" items={r.lighting} />
              <ListBlock title="Storage" items={r.storage} />
              <ListBlock title="Optimization" items={r.optimization} />
            </div>
            {r.layout_notes && (
              <div className="text-xs text-muted-foreground mt-3"><span className="text-gold">Layout:</span> {r.layout_notes}</div>
            )}
            {r.scores && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                <Score label="Space" v={r.scores.space_efficiency} />
                <Score label="Luxury" v={r.scores.luxury_potential} />
                <Score label="Flow" v={r.scores.natural_flow} />
                <Score label="Storage" v={r.scores.storage} />
                <Score label="Family" v={r.scores.family_friendly} />
                <Score label="Resale" v={r.scores.resale} />
              </div>
            )}
            {r.renovation && (
              <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                <Pill label="Budget" value={fmtAED(r.renovation.budget_aed)} />
                <Pill label="Mid-Range" value={fmtAED(r.renovation.midrange_aed)} />
                <Pill label="Luxury" value={fmtAED(r.renovation.luxury_aed)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </LuxeCard>
  );
}

function RenovationSummary({ report }: { report: Report }) {
  const t = report.renovation_totals ?? {};
  return (
    <LuxeCard className="p-5">
      <SectionTitle label="Renovation Cost Engine — Property Totals" />
      <div className="grid grid-cols-3 gap-3 mt-3">
        <Pill label="Budget Total" value={fmtAED(t.budget_aed)} />
        <Pill label="Mid-Range Total" value={fmtAED(t.midrange_aed)} />
        <Pill label="Luxury Total" value={fmtAED(t.luxury_aed)} />
      </div>
    </LuxeCard>
  );
}

function BoqSummary({ report }: { report: Report }) {
  const b = report.boq_totals ?? {};
  return (
    <LuxeCard className="p-5">
      <SectionTitle label="Bill of Quantities (BOQ)" />
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3 text-sm">
        <Pill label="Flooring" value={`${b.flooring_m2 ?? 0} m²`} />
        <Pill label="Wall Paint" value={`${b.paint_wall_m2 ?? 0} m²`} />
        <Pill label="Ceiling" value={`${b.ceiling_m2 ?? 0} m²`} />
        <Pill label="Skirting" value={`${b.skirting_m ?? 0} m`} />
        <Pill label="Doors" value={`${b.doors ?? 0}`} />
        <Pill label="Windows" value={`${b.windows ?? 0}`} />
      </div>
      <div className="mt-3 text-sm text-gold">Estimated total: {fmtAED(b.total_cost_aed)}</div>
    </LuxeCard>
  );
}

function InsuranceSection({ ins }: { ins?: Report["insurance"] }) {
  if (!ins?.enabled || !ins.items?.length) {
    return (
      <LuxeCard className="p-5">
        <SectionTitle label="Insurance Valuation" />
        <div className="text-sm text-muted-foreground mt-2">No furniture or fittings visible on the plan. Upload room photos in Valuation mode for an itemized insurance report.</div>
      </LuxeCard>
    );
  }
  return (
    <LuxeCard className="p-5">
      <SectionTitle label="Insurance Valuation" />
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-[0.2em] text-gold">
            <tr>
              <th className="text-left py-1">Item</th>
              <th className="text-right py-1">Qty</th>
              <th className="text-right py-1">Market</th>
              <th className="text-right py-1">Depreciated</th>
              <th className="text-right py-1">Replacement</th>
              <th className="text-right py-1">Insurance</th>
              <th className="text-right py-1">Conf.</th>
            </tr>
          </thead>
          <tbody>
            {ins.items.map((it, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-2">
                  <div>{it.name}</div>
                  {it.comparable_used && <div className="text-[10px] text-amber-300">{it.notes ?? "Closest modern equivalent"}</div>}
                </td>
                <td className="text-right">{it.quantity ?? 1}</td>
                <td className="text-right">{fmtAED(it.market_aed)}</td>
                <td className="text-right">{fmtAED(it.depreciated_aed)}</td>
                <td className="text-right">{fmtAED(it.replacement_aed)}</td>
                <td className="text-right text-gold">{fmtAED(it.insurance_aed)}</td>
                <td className="text-right">{pct(it.confidence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LuxeCard>
  );
}

function CommercialSection({ commercial }: { commercial?: Record<string, string | number> }) {
  if (!commercial) return null;
  const entries = Object.entries(commercial);
  return (
    <LuxeCard className="p-5">
      <SectionTitle label="Commercial Real Estate Metrics" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
        {entries.map(([k, v]) => (
          <Pill key={k} label={k.replace(/_/g, " ")} value={String(v)} />
        ))}
      </div>
    </LuxeCard>
  );
}

function ScoresSection({ scores }: { scores?: Record<string, number> }) {
  if (!scores) return null;
  return (
    <LuxeCard className="p-5">
      <SectionTitle label="A-Eye Spatial Scoring" />
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
        {Object.entries(scores).map(([k, v]) => (
          <Score key={k} label={k.replace(/_/g, " ")} v={v} />
        ))}
      </div>
    </LuxeCard>
  );
}

function ConfidenceSection({ confidence, clarifications }: { confidence?: Record<string, number>; clarifications?: string[] }) {
  return (
    <LuxeCard className="p-5">
      <SectionTitle label="Confidence Engine" />
      {confidence && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
          {Object.entries(confidence).map(([k, v]) => (
            <Score key={k} label={k.replace(/_/g, " ")} v={v} />
          ))}
        </div>
      )}
      {clarifications && clarifications.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-amber-300 mb-2">Clarifications needed</div>
          <ul className="list-disc pl-5 text-sm text-amber-200/90 space-y-1">
            {clarifications.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}
    </LuxeCard>
  );
}

function SectionTitle({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold">
      {icon}{label}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-gold mb-1">{title}</div>
      <ul className="list-disc pl-5 space-y-0.5">
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  );
}

function Score({ label, v }: { label: string; v?: number }) {
  const value = typeof v === "number" ? Math.max(0, Math.min(100, v)) : 0;
  return (
    <div className="hairline rounded-lg p-2 text-center">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-display text-lg text-gold">{typeof v === "number" ? value : "—"}</div>
      <div className="h-1 bg-white/5 rounded mt-1 overflow-hidden">
        <div className="h-full gradient-gold" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="hairline rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-display text-base">{value}</div>
    </div>
  );
}
