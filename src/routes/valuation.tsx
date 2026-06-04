import { createFileRoute } from "@tanstack/react-router";
import { trackAi } from "@/lib/analytics";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Camera, FileDown, ShieldCheck, Trash2, Plus, Loader2, Save, Share2 } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton, GhostButton, StatTile } from "@/components/ui-kit";
import { useAuth } from "@/lib/useAuth";
import { uploadUserFile } from "@/lib/upload";
import { signedRoomUrl } from "@/lib/signedUrl";
import { supabase } from "@/integrations/supabase/client";
import { aiValuate } from "@/lib/ai.functions";

export const Route = createFileRoute("/valuation")({ component: Valuation });

type Img = { local: string; path: string | null; file: File };
type Item = {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  description: string;
  estimated_low_value: number;
  estimated_mid_value: number;
  estimated_high_value: number;
  condition_assumption: string;
  confidence_score: number;
  image_reference: string;
  comparable_replacement_used: boolean;
  replacement_notes: string;
  requires_user_review: boolean;
};

const CURRENCIES = ["AED", "USD", "GBP", "ZAR", "EUR"] as const;

function uid() { return Math.random().toString(36).slice(2, 10); }

function Valuation() {
  const { user } = useAuth();
  const valuate = useServerFn(aiValuate);
  const [imgs, setImgs] = useState<Img[]>([]);
  const [roomName, setRoomName] = useState("");
  const [currency, setCurrency] = useState<string>("AED");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const onPick = async (files: FileList | null) => {
    if (!files) return;
    const next: Img[] = Array.from(files).slice(0, 8 - imgs.length).map(f => ({ local: URL.createObjectURL(f), path: null, file: f }));
    setImgs(prev => [...prev, ...next]);
    if (user) {
      for (let i = 0; i < next.length; i++) {
        const up = await uploadUserFile("room-photos", next[i].file);
        if (up.ok) {
          setImgs(prev => prev.map(p => p.local === next[i].local ? { ...p, path: up.path } : p));
        }
      }
    }
  };

  const removeImg = (local: string) => setImgs(prev => prev.filter(p => p.local !== local));

  const analyze = async () => {
    setErr(null);
    setItems([]);
    setSavedReportId(null);
    setShareUrl(null);
    if (imgs.length === 0) { setErr("Please upload at least one image."); return; }
    if (!user) { setErr("Sign in to run valuation."); return; }
    const withPaths = imgs.filter(i => i.path);
    if (withPaths.length === 0) { setErr("Images are still uploading — please wait a moment."); return; }
    setBusy(true);
    const urls: string[] = [];
    for (const i of withPaths) {
      const u = await signedRoomUrl(i.path!, "room-photos");
      if (u) urls.push(u);
    }
    if (urls.length === 0) { setBusy(false); setErr("Could not prepare images for analysis."); return; }
    const res = await trackAi("valuation", () => valuate({ data: { imageUrls: urls, currency, roomName: roomName || "Untitled Space" } }));
    if (!res.ok) {
      setErr(res.error === "AI_KEY_MISSING" ? "AI setup required" : res.error === "AI_CREDITS" ? "AI credits exhausted — top up workspace credits." : `Analysis failed: ${res.error}`);
      setBusy(false);
      return;
    }
    const mapped: Item[] = res.items.map(it => ({
      id: uid(),
      item_name: String(it.item_name ?? "Unidentified item"),
      category: String(it.category ?? "Other"),
      quantity: Math.max(1, Math.round(Number(it.quantity ?? 1))),
      description: String(it.description ?? ""),
      estimated_low_value: Math.max(0, Number(it.estimated_low_value ?? 0)),
      estimated_mid_value: Math.max(0, Number(it.estimated_mid_value ?? 0)),
      estimated_high_value: Math.max(0, Number(it.estimated_high_value ?? 0)),
      condition_assumption: String(it.condition_assumption ?? "Good"),
      confidence_score: Math.min(100, Math.max(0, Math.round(Number(it.confidence_score ?? 60)))),
      image_reference: String(it.image_reference ?? "image_1"),
      comparable_replacement_used: Boolean(it.comparable_replacement_used ?? false),
      replacement_notes: String(it.replacement_notes ?? ""),
      requires_user_review: Boolean(it.requires_user_review ?? false),
    }));
    setItems(mapped);
    setBusy(false);
  };

  const totals = items.reduce((acc, it) => {
    acc.low += it.estimated_low_value * it.quantity;
    acc.mid += it.estimated_mid_value * it.quantity;
    acc.high += it.estimated_high_value * it.quantity;
    if (it.confidence_score >= 75) acc.highConf++;
    if (it.comparable_replacement_used) acc.comparable++;
    if (it.requires_user_review) acc.review++;
    return acc;
  }, { low: 0, mid: 0, high: 0, highConf: 0, comparable: 0, review: 0 });

  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));
  const addItem = () => setItems(prev => [...prev, {
    id: uid(), item_name: "New item", category: "Other", quantity: 1, description: "",
    estimated_low_value: 0, estimated_mid_value: 0, estimated_high_value: 0,
    condition_assumption: "Good", confidence_score: 50, image_reference: "manual",
    comparable_replacement_used: false, replacement_notes: "", requires_user_review: true,
  }]);

  const exportCSV = () => {
    const header = ["Item","Category","Qty","Description","Currency","Low","Mid","High","Condition","Confidence %","Comparable","Notes","Review"];
    const rows = items.map(it => [
      it.item_name, it.category, it.quantity, it.description, currency,
      it.estimated_low_value, it.estimated_mid_value, it.estimated_high_value,
      it.condition_assumption, it.confidence_score,
      it.comparable_replacement_used ? "Yes" : "No",
      it.replacement_notes, it.requires_user_review ? "Yes" : "No",
    ]);
    rows.push([]);
    rows.push(["Totals","","","","",totals.low, totals.mid, totals.high, "", "", "", "", ""]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = u; a.download = `valuation-${(roomName || "space").replace(/\s+/g,"-")}.csv`; a.click();
    URL.revokeObjectURL(u);
  };

  const exportPDF = () => { window.print(); };

  const saveReport = async () => {
    if (!user) { setErr("Sign in to save."); return; }
    setErr(null);
    const { data: rep, error } = await supabase.from("arkhi_valuation_reports").insert({
      user_id: user.id,
      room_name: roomName || "Untitled Space",
      currency,
      total_low_estimate: totals.low,
      total_mid_estimate: totals.mid,
      total_high_estimate: totals.high,
      detected_item_count: items.length,
      confidence_summary: { high_confidence: totals.highConf, comparable: totals.comparable, review: totals.review },
      report_status: "saved",
      image_paths: imgs.map(i => i.path).filter(Boolean),
    }).select("id").single();
    if (error || !rep) { setErr(`Save failed: ${error?.message}`); return; }
    const itemsRows = items.map(it => ({
      report_id: rep.id, user_id: user.id,
      item_name: it.item_name, category: it.category, quantity: it.quantity, description: it.description,
      estimated_low_value: it.estimated_low_value, estimated_mid_value: it.estimated_mid_value, estimated_high_value: it.estimated_high_value,
      currency, condition_assumption: it.condition_assumption, confidence_score: it.confidence_score,
      image_reference: it.image_reference, comparable_replacement_used: it.comparable_replacement_used,
      replacement_notes: it.replacement_notes, requires_user_review: it.requires_user_review,
    }));
    if (itemsRows.length) await supabase.from("arkhi_valuation_items").insert(itemsRows);
    setSavedReportId(rep.id);
  };

  const shareReport = async () => {
    if (!savedReportId || !user) { setErr("Save the report first."); return; }
    const token = crypto.randomUUID();
    const { error } = await supabase.from("arkhi_valuation_exports").insert({
      report_id: savedReportId, user_id: user.id, export_type: "share_link", share_token: token,
    });
    if (error) { setErr(`Share failed: ${error.message}`); return; }
    setShareUrl(`${window.location.origin}/valuation?share=${token}`);
  };

  useEffect(() => () => { imgs.forEach(i => URL.revokeObjectURL(i.local)); }, []); // eslint-disable-line

  return (
    <div className="max-w-7xl mx-auto print:max-w-none">
      <PageHeader
        eyebrow="Valuation"
        title={<>AI <span className="text-gradient-gold">Valuation</span></>}
        subtitle="Upload one or more images of a room, office or showroom. A-Eye detects every visible item and estimates a realistic replacement value."
      />

      <div className="grid lg:grid-cols-3 gap-6 print:hidden">
        <LuxeCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Images</div>
            <div className="text-xs text-muted-foreground">{imgs.length}/8</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {imgs.map(i => (
              <div key={i.local} className="relative aspect-square rounded-lg overflow-hidden hairline">
                <img src={i.local} className="absolute inset-0 w-full h-full object-cover" alt="" />
                {!i.path && <div className="absolute inset-0 grid place-items-center bg-onyx/60 text-[10px]"><Loader2 className="size-4 animate-spin text-gold" /></div>}
                <button onClick={() => removeImg(i.local)} className="absolute top-1.5 right-1.5 size-7 grid place-items-center rounded-md bg-onyx/80 hairline">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            {imgs.length < 8 && (
              <>
                <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-lg hairline flex flex-col items-center justify-center gap-1 hover:bg-gold/5 transition">
                  <Upload className="size-5 text-gold" /><span className="text-[10px] uppercase tracking-wider">Upload</span>
                </button>
                <button onClick={() => camRef.current?.click()} className="aspect-square rounded-lg hairline flex flex-col items-center justify-center gap-1 hover:bg-gold/5 transition">
                  <Camera className="size-5 text-gold" /><span className="text-[10px] uppercase tracking-wider">Camera</span>
                </button>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
          <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPick(e.target.files)} />
        </LuxeCard>

        <LuxeCard className="p-5 space-y-3">
          <Field label="Space name" value={roomName} onChange={setRoomName} placeholder="e.g. Master Bedroom" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">Currency</div>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <GoldButton onClick={analyze} disabled={busy || imgs.length === 0} className="w-full">
            {busy ? "Analyzing space…" : "Analyze Space for Valuation"}
          </GoldButton>
          {!user && <div className="text-xs text-muted-foreground">Sign in on the Profile tab to run live valuations.</div>}
          {err && <div className="text-xs text-amber-300">{err}</div>}
        </LuxeCard>
      </div>

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
            <StatTile label="Items" value={items.length} />
            <StatTile label={`Total mid (${currency})`} value={Math.round(totals.mid).toLocaleString()} hint={`${Math.round(totals.low).toLocaleString()} – ${Math.round(totals.high).toLocaleString()}`} />
            <StatTile label="High confidence" value={totals.highConf} />
            <StatTile label="Comparable est." value={totals.comparable} />
            <StatTile label="Needs review" value={totals.review} />
          </div>

          <LuxeCard className="mt-6 p-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border/60 print:hidden">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Itemized valuation</div>
                <div className="font-display text-lg">{roomName || "Untitled Space"} · {new Date().toLocaleDateString()}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <GhostButton onClick={addItem}><span className="inline-flex items-center gap-1"><Plus className="size-3.5" />Add item</span></GhostButton>
                <GhostButton onClick={exportCSV}><span className="inline-flex items-center gap-1"><FileDown className="size-3.5" />CSV</span></GhostButton>
                <GhostButton onClick={exportPDF}><span className="inline-flex items-center gap-1"><FileDown className="size-3.5" />PDF</span></GhostButton>
                {user && <GhostButton onClick={saveReport}><span className="inline-flex items-center gap-1"><Save className="size-3.5" />Save</span></GhostButton>}
                {savedReportId && <GhostButton onClick={shareReport}><span className="inline-flex items-center gap-1"><Share2 className="size-3.5" />Share</span></GhostButton>}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="text-left p-3">Item</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-right p-3">Qty</th>
                    <th className="text-right p-3">Low</th>
                    <th className="text-right p-3">Mid</th>
                    <th className="text-right p-3">High</th>
                    <th className="text-right p-3">Conf.</th>
                    <th className="text-left p-3">Notes</th>
                    <th className="p-3 print:hidden"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id} className="border-b border-border/40 align-top">
                      <td className="p-3">
                        <input value={it.item_name} onChange={(e) => updateItem(it.id, { item_name: e.target.value })} className="w-full bg-transparent focus:outline-none font-medium" />
                        <div className="text-[11px] text-muted-foreground">{it.description}</div>
                        {it.comparable_replacement_used && <div className="text-[10px] mt-1 inline-block px-2 py-0.5 rounded bg-gold/10 text-gold">Comparable replacement</div>}
                        {it.requires_user_review && <div className="text-[10px] mt-1 ml-1 inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">Review</div>}
                      </td>
                      <td className="p-3">
                        <input value={it.category} onChange={(e) => updateItem(it.id, { category: e.target.value })} className="w-full bg-transparent focus:outline-none" />
                      </td>
                      <td className="p-3 text-right">
                        <input type="number" min={1} value={it.quantity} onChange={(e) => updateItem(it.id, { quantity: Math.max(1, parseInt(e.target.value || "1", 10)) })} className="w-14 text-right bg-transparent focus:outline-none" />
                      </td>
                      <td className="p-3 text-right"><input type="number" value={it.estimated_low_value} onChange={(e) => updateItem(it.id, { estimated_low_value: Number(e.target.value) })} className="w-20 text-right bg-transparent focus:outline-none" /></td>
                      <td className="p-3 text-right"><input type="number" value={it.estimated_mid_value} onChange={(e) => updateItem(it.id, { estimated_mid_value: Number(e.target.value) })} className="w-20 text-right bg-transparent focus:outline-none text-gold" /></td>
                      <td className="p-3 text-right"><input type="number" value={it.estimated_high_value} onChange={(e) => updateItem(it.id, { estimated_high_value: Number(e.target.value) })} className="w-20 text-right bg-transparent focus:outline-none" /></td>
                      <td className="p-3 text-right text-xs">{it.confidence_score}%</td>
                      <td className="p-3 text-xs text-muted-foreground">{it.replacement_notes || it.condition_assumption}</td>
                      <td className="p-3 print:hidden">
                        <button onClick={() => removeItem(it.id)} className="text-muted-foreground hover:text-amber-400"><Trash2 className="size-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="font-display">
                  <tr>
                    <td className="p-3" colSpan={3}>Totals ({currency})</td>
                    <td className="p-3 text-right">{Math.round(totals.low).toLocaleString()}</td>
                    <td className="p-3 text-right text-gold">{Math.round(totals.mid).toLocaleString()}</td>
                    <td className="p-3 text-right">{Math.round(totals.high).toLocaleString()}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </LuxeCard>

          {shareUrl && (
            <LuxeCard className="mt-4 p-4 text-xs flex items-center gap-2 print:hidden">
              <ShieldCheck className="size-4 text-gold" />
              Share link: <code className="bg-onyx/60 px-2 py-1 rounded text-gold break-all">{shareUrl}</code>
            </LuxeCard>
          )}

          <LuxeCard className="mt-4 p-4 text-xs text-muted-foreground flex gap-2">
            <ShieldCheck className="size-4 text-gold shrink-0 mt-0.5" />
            Arkhi AI provides estimated replacement valuations based on visual analysis and comparable market items. This is not a certified appraisal. Final acceptance may require review by a licensed valuation professional.
          </LuxeCard>
        </>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold" />
    </label>
  );
}
