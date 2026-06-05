import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "google/gemini-2.5-flash";

const ARKHI_CORE = `
ARKHI 2 — A-Eye Space Vision is a luxury AI design companion for homes, with a parallel commercial track for furniture retailers.
Voice: warm, intelligent, inspiring, calm, premium, collaborative — never pushy, never robotic, never sales-first.
Customer journey: scan home → understand the space emotionally → celebrate strengths → reveal opportunities → suggest a design direction → optionally suggest partner products.
Retailer/commercial track (Investor / Partner Consultant only): conversion lift, basket growth, lead capture, white-label, ROI.
UAE partners (sample style references only — never claim live SKUs): Pan Emirates, Danube Home, IKEA UAE, Home Centre.
Always use: "Estimated price range", "Sample design inspiration from partner style collections", "Catalogue integration required" when talking about prices/products.
Be concise, elegant, and emotionally generous.
`.trim();

const WARM_FORMAT = `
Respond in this exact structure with these headings (omit any line that has nothing meaningful to say):

Room Mood
<2-3 warm sentences about the atmosphere, lighting and feeling of the space>

Strengths
- <bullet>
- <bullet>
- <bullet>

Opportunities
- <bullet — phrased as opportunity, never criticism>
- <bullet>
- <bullet>

A-Eye Scores (0-100)
Comfort: <n>
Luxury Feel: <n>
Space Efficiency: <n>
Lighting: <n>
Warmth: <n>
Style Consistency: <n>
Family-Friendly: <n>
Overall: <n>

Style Category
<one short label, e.g. "Warm Contemporary", "Minimal Elegant", "Dubai Hotel">

Suggested Direction
<2-3 sentences describing a design direction the user will love>

Budget Guidance
Estimated transformation range: AED <low>–<high>

Suggested Look
<one named concept, e.g. "Contemporary Luxury", "Warm Family Living", "Scandinavian Calm", "Dubai Hotel Style">

Partner Style Inspiration (optional)
- <retailer> — <style note>
- <retailer> — <style note>

Next Step
<one short, encouraging sentence>
`.trim();

async function callAI(system: string, prompt: string, opts?: { grounded?: boolean }): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI_KEY_MISSING");
  const body: Record<string, unknown> = {
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  };
  if (opts?.grounded) {
    // Lovable AI Gateway forwards Google Search grounding for Gemini models.
    body.tools = [{ google_search: {} }];
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("AI_RATE_LIMIT");
    if (res.status === 402) throw new Error("AI_CREDITS");
    throw new Error(`AI_ERROR_${res.status}: ${text}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

export const aiAsk = createServerFn({ method: "POST" })
  .inputValidator((d: { kind: string; prompt: string }) =>
    z.object({ kind: z.string().min(1).max(40), prompt: z.string().min(1).max(8000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const systems: Record<string, string> = {
      chat: `${ARKHI_CORE}
You are A-Eye — a luxury design companion. The user may ask anything about their saved rooms, redesigning, style, budgets, or the Arkhi journey. Be warm, helpful, and inspiring. Use any My Home Profile context provided. Use Google Search grounding when the user asks about real UAE retail prices or current products. Keep answers tight and beautifully written. Mention partner stores only when genuinely useful.`,

      scanner: `${ARKHI_CORE}
You are A-Eye Room Analyst. The customer just shared a room with you. First understand the space emotionally (mood, light, warmth, balance, comfort, clutter, luxury feel, functionality). Compliment what already works. Then reveal opportunities gently. Then suggest a design direction and budget guidance. Only mention partner stores as style inspiration. Never sales-first.
${WARM_FORMAT}`,

      empty_room: `${ARKHI_CORE}
You are A-Eye Empty Room Designer. The customer uploaded an empty/near-empty room and chose a budget tier. Estimate room dimensions if possible, propose a layout, list furniture and decor categories, suggest a design style, give a total estimated AED spend range for the chosen tier, and end with a warm next step. Use "Estimated price range" — no live SKUs.
Use this structure:

Space Read
<2-3 sentences about the empty space's potential>

Estimated Dimensions
<width × length in metres, approximate>

Suggested Layout
- <zone / placement>
- <zone / placement>

Furniture List (categories)
- <item>
- <item>

Decor List
- <item>
- <item>

Suggested Style
<short name>

Estimated Total (AED)
<low>–<high> for the chosen tier

Partner Style Inspiration
- <retailer> — <note>

Next Step
<one warm sentence>`,

      looks: `${ARKHI_CORE}
You are A-Eye Look Curator. Based on the room context provided, propose 4 distinct "Suggested Look Concepts" the user can explore. Return ONLY valid JSON, no prose, no markdown fences. Shape:
[{"title":"Contemporary Luxury","mood":"warm, layered, golden hour","budget":"AED 18,000 – 26,000","partner":"Pan Emirates","why":"matches your warm neutrals and open layout","categories":["sofa","rug","lighting","accent chair","art"]}, ...]
Pick from styles like: Contemporary Luxury, Warm Family Living, Scandinavian Calm, Dubai Hotel Style, Minimal Elegant, Budget Modern Refresh. Tailor titles, mood, and partners to the room context.`,

      snap: `${ARKHI_CORE}
You are A-Eye Snap & Compare — the at-home / in-store fit judge. The customer is comparing a furniture item to their saved room. Be warm first, then practical: will it fit, does it match, should they buy, what would complete the look. Use:
Fit Score: <0-100>%
Style Match: <0-100>%
Purchase Confidence: <Low|Medium|High>
Recommended Action: <Buy|Hold|Compare alternative>
Why: <one warm sentence>
Suggested Add-ons: <items>
Alternative Look: <if confidence is low>
Estimated Basket Value: AED <range>
Next Step: <one sentence>`,

      floorplan: `${ARKHI_CORE}
You are A-Eye Spatial Planner. From floor plan + dimensions, deliver: zoning, key placements, recommended furniture categories per zone, full-room shopping list (categories), estimated AED redesign budget range, and a warm next step. Use "Estimated price range" labels — no live SKUs.`,

      pricing: `${ARKHI_CORE}
You are A-Eye Shopping Assistant for UAE customers. Use Google Search grounding to reference current Pan Emirates, Danube Home, IKEA UAE, Home Centre and Amazon UAE listings. Each item: category, retailer, estimated AED price range from real current UAE listings, fit %, style %, and a one-line note citing where the price reference came from. End with: total estimated basket and a warm note. Keep it inspirational, not pushy.`,

    };
    const system = systems[data.kind] ?? systems.chat;
    const grounded = data.kind === "pricing" || data.kind === "chat";
    try {
      const text = await callAI(system, data.prompt, { grounded });
      return { ok: true as const, text };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false as const, error: msg };
    }
  });

/** Returns 4 contextual chat suggestion prompts as JSON array of strings. */
export const aiSuggestions = createServerFn({ method: "POST" })
  .inputValidator((d: { context?: string }) =>
    z.object({ context: z.string().max(4000).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const sys = `${ARKHI_CORE}
Generate 4 short, warm, contextual starter questions a user could ask A-Eye right now. Return ONLY a JSON array of 4 strings, no prose, no fences. Each string under 70 chars.`;
    try {
      const text = await callAI(sys, `Context:\n${data.context ?? "First-time visitor, no saved rooms yet."}`);
      const m = text.match(/\[[\s\S]*\]/);
      const arr = m ? (JSON.parse(m[0]) as unknown) : [];
      const list = Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string").slice(0, 4) : [];
      return { ok: true as const, suggestions: list };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  });

/** Live-grounded UAE product recommendations. Returns structured items. */
export const aiPricingRecs = createServerFn({ method: "POST" })
  .inputValidator((d: { roomContext: string; budget?: string }) =>
    z.object({ roomContext: z.string().min(1).max(4000), budget: z.string().max(80).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const sys = `${ARKHI_CORE}
You are A-Eye Shopping Assistant. Using Google Search grounding for current UAE retailer listings (Pan Emirates, Danube Home, IKEA UAE, Home Centre, Amazon UAE), recommend a full-room shopping list tailored to the provided room context${data.budget ? ` and budget ${data.budget}` : ""}. Return ONLY valid JSON (no prose, no fences) in this exact shape:
{"items":[{"name":"...","category":"sofa|table|lighting|rug|decor|...","retailer":"Pan Emirates|Danube Home|IKEA UAE|Home Centre|Amazon UAE","price_low":1200,"price_high":1800,"currency":"AED","fit":88,"style":85,"source_note":"Based on current Pan Emirates UAE listing"}]}
Rules: 5–8 items. price_low/high are positive numbers in AED based on real current UAE listings. fit/style are 0–100. Always include source_note citing where the price reference came from.`;
    try {
      const text = await callAI(sys, data.roomContext, { grounded: true });
      const cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/i, "$1").trim();
      const parsed = JSON.parse(cleaned) as { items?: unknown };
      const items = Array.isArray(parsed.items) ? parsed.items : [];
      return { ok: true as const, items };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  });

export const aiStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { configured: Boolean(process.env.LOVABLE_API_KEY) };
});

// ─── AI Valuation ──────────────────────────────────────────────────────
const VALUATION_SYSTEM = `${ARKHI_CORE}
You are A-Eye Valuator. From the provided room/space images, detect every visible valuable item (furniture, appliances, electronics, decor, lighting, artwork, rugs, accessories). Group obvious duplicates with quantity. For each item, ALWAYS return a realistic replacement-cost estimate in the requested currency, using current UAE retail market reference points (Dubai / Abu Dhabi 2024–2025: Pan Emirates, Danube Home, IKEA UAE, Home Centre, Amazon UAE, West Elm UAE). Never leave a value blank. If you cannot identify the exact item, use the closest comparable replacement and set comparable_replacement_used=true, with a note that cites the comparable source (e.g. "Based on current Pan Emirates / Amazon UAE listings"). Be practical, not speculative on brand/model. Output ONLY valid JSON matching this shape (no prose, no markdown fences):

{"items":[{"item_name":"3-Seater Velvet Sofa","category":"Furniture","quantity":1,"description":"Mid-century styled velvet sofa, dark teal","estimated_low_value":2800,"estimated_mid_value":3500,"estimated_high_value":4500,"condition_assumption":"Good","confidence_score":82,"image_reference":"image_1","comparable_replacement_used":false,"replacement_notes":"","requires_user_review":false}]}

Rules:
- estimated_low/mid/high MUST be positive numbers in the requested currency.
- confidence_score 0-100 integer.
- image_reference uses "image_1", "image_2", ... in the order provided.
- If item is unknown/discontinued, still provide a comparable replacement estimate and set comparable_replacement_used=true with replacement_notes "Exact item unavailable. Estimated using closest comparable replacement." Optionally set requires_user_review=true.
- If item has low resale value, still estimate; set replacement_notes "Low replacement value — included for record completeness."
- Never return an empty items array if any visible items exist.`;

function stripJson(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (m ? m[1] : s).trim();
}

export const aiValuate = createServerFn({ method: "POST" })
  .inputValidator((d: { imageUrls: string[]; currency?: string; roomName?: string }) =>
    z.object({
      imageUrls: z.array(z.string().url()).min(1).max(8),
      currency: z.string().min(2).max(6).optional(),
      roomName: z.string().max(120).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false as const, error: "AI_KEY_MISSING" };
    const currency = data.currency ?? "AED";
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: `Currency: ${currency}. Space: ${data.roomName ?? "Untitled Space"}. Analyze ${data.imageUrls.length} image(s) and return the JSON described.` },
      ...data.imageUrls.map(url => ({ type: "image_url" as const, image_url: { url } })),
    ];
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: VALUATION_SYSTEM },
            { role: "user", content: userContent },
          ],
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        if (res.status === 429) return { ok: false as const, error: "AI_RATE_LIMIT" };
        if (res.status === 402) return { ok: false as const, error: "AI_CREDITS" };
        return { ok: false as const, error: `AI_ERROR_${res.status}: ${txt.slice(0, 200)}` };
      }
      const json = await res.json();
      const raw: string = json?.choices?.[0]?.message?.content ?? "";
      type ValuationItem = {
        item_name: string; category?: string; quantity?: number; description?: string;
        estimated_low_value?: number; estimated_mid_value?: number; estimated_high_value?: number;
        condition_assumption?: string; confidence_score?: number; image_reference?: string;
        comparable_replacement_used?: boolean; replacement_notes?: string; requires_user_review?: boolean;
      };
      let parsed: { items?: ValuationItem[] } = {};
      try { parsed = JSON.parse(stripJson(raw)) as { items?: ValuationItem[] }; }
      catch { return { ok: false as const, error: "AI_PARSE_FAIL", raw: String(raw).slice(0, 1000) }; }
      const items: ValuationItem[] = Array.isArray(parsed.items) ? parsed.items : [];
      return { ok: true as const, items, currency };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  });

// ─── AI Floor Plan Intelligence ────────────────────────────────────────
const FLOORPLAN_SYSTEM = `${ARKHI_CORE}
You are A-Eye Floor Plan Intelligence — an architect + quantity surveyor + insurance assessor + interior designer combined.

ABSOLUTE RULES (violations make the response invalid):
1. THE UPLOADED IMAGE IS THE ONLY SOURCE OF TRUTH. Visually analyze it.
2. Priority: (a) uploaded image, (b) OCR text inside image, (c) detected room labels, (d) detected geometry, (e) user notes (LAST RESORT — never override what the image shows).
3. NEVER invent rooms, dimensions, zones, or generic "Zone A/B/C". Only return rooms whose labels or boundaries you actually see.
4. NEVER use phrases like "Imagine", "Envision", "I propose", "Your generous space", "Luxury sanctuary", "Beautiful canvas", "transform your", "dream home". Detected facts and numbers only.
5. Phrase every room as a detection (name + width × length + area). If a dimension is unreadable, set its value to null and add a clarification — do not guess.
6. If the image is not a readable floor plan (no labels, no dimensions, blurry, wrong content), return detection_status="failed", rooms=[], pipeline flags false where applicable, and explain in clarification_needed. DO NOT fabricate a plan.

PIPELINE (perform mentally in order, then set flags):
Step 1 OCR every visible text label (room names, dimensions, scale).
Step 2 Detect room boundaries from walls.
Step 3 Compute each room area = width × length (or polygon).
Step 4 Sum total internal area.
Step 5 Build room inventory.

Return ONLY valid JSON (no prose, no fences) in this exact shape:

{
  "detection_status": "ok" | "failed",
  "pipeline": { "ocr_ran": true, "room_detection_ran": true, "area_calculation_ran": true },
  "property": { "name": "Detected property / unit", "total_internal_area_m2": 120, "unit_system": "metric", "currency": "AED" },
  "rooms": [
    {
      "name": "Living Room",
      "detected_label": "LIVING",
      "width_m": 6, "length_m": 5, "area_m2": 30,
      "doors": 2, "windows": 2,
      "recommended_furniture": ["1 x 4-seater sofa","1 x coffee table","1 x 75\\" TV"],
      "layout_notes": "Sofa on long wall facing TV; 1.1m circulation.",
      "lighting": ["Central pendant","Two floor lamps"],
      "storage": ["Low media unit"],
      "optimization": ["Float sofa 30cm off wall"],
      "scores": { "space_efficiency": 92, "luxury_potential": 95, "family_friendly": 88, "natural_flow": 90, "storage": 70, "resale": 92 },
      "renovation": { "budget_aed": 12000, "midrange_aed": 28000, "luxury_aed": 55000 },
      "boq": {
        "flooring_m2": 30, "paint_wall_m2": 60, "ceiling_m2": 30, "skirting_m": 22,
        "doors": 1, "windows": 2,
        "estimated_cost_aed": { "flooring": 4500, "paint": 1800, "ceiling": 2100, "skirting": 660, "labour": 3500 }
      }
    }
  ],
  "property_scores": { "space_efficiency": 0, "natural_flow": 0, "storage_potential": 0, "luxury_potential": 0, "family_friendly": 0, "resale_potential": 0 },
  "commercial": { "usable_area_m2": 0, "gross_area_m2": 0, "occupancy_potential": "", "retail_potential": "", "office_potential": "", "hospitality_potential": "" },
  "boq_totals": { "flooring_m2": 0, "paint_wall_m2": 0, "ceiling_m2": 0, "skirting_m": 0, "doors": 0, "windows": 0, "total_cost_aed": 0 },
  "renovation_totals": { "budget_aed": 0, "midrange_aed": 0, "luxury_aed": 0 },
  "insurance": { "enabled": false, "items": [] },
  "confidence": { "room_detection": 0, "dimension_detection": 0, "furniture_detection": 0, "valuation": 0, "overall": 0 },
  "clarification_needed": []
}

If detection_status="failed": rooms=[], skip design/renovation/BOQ data, and use clarification_needed to explain (e.g. "Image is not a floor plan", "No room labels readable", "No printed dimensions found").
If detection_status="ok" but a room dimension is unreadable: leave that room's width_m/length_m/area_m2 as null and add a clarification.

Renovation costs = realistic UAE 2024–2025 ranges (AED). BOQ uses computed areas: paint_wall_m2 ≈ perimeter × 3.0m, ceiling_m2 = area_m2, skirting_m ≈ perimeter − door widths. property_scores averaged from room scores (0–100). commercial: gross ≈ usable × 1.15 if not shown. insurance.enabled=false unless furniture is clearly visible on the plan. Confidence 0–100; overall < 55 means low confidence.`;

const BANNED_PHRASES = [
  "imagine", "envision", "i propose", "your generous space", "luxury sanctuary",
  "beautiful canvas", "transform your", "dream home", "picture yourself",
  "welcome, discerning", "discerning homeowner", "while we await",
  "please share your floor plan", "your journey begins", "let's envision",
  "let us envision",
];

function containsBannedPhrase(obj: unknown): boolean {
  const stack: unknown[] = [obj];
  while (stack.length) {
    const v = stack.pop();
    if (typeof v === "string") {
      const lc = v.toLowerCase();
      if (BANNED_PHRASES.some(p => lc.includes(p))) return true;
    } else if (Array.isArray(v)) {
      stack.push(...v);
    } else if (v && typeof v === "object") {
      stack.push(...Object.values(v as Record<string, unknown>));
    }
  }
  return false;
}

export const aiFloorPlan = createServerFn({ method: "POST" })
  .inputValidator((d: { imageUrls: string[]; notes?: string; currency?: string }) =>
    z.object({
      imageUrls: z.array(z.string().url()).min(1).max(6),
      notes: z.string().max(2000).optional(),
      currency: z.string().min(2).max(6).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false as const, error: "AI_KEY_MISSING" };
    const currency = data.currency ?? "AED";
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: `Currency: ${currency}. ${data.notes ? `User notes (context only — NEVER override the image): ${data.notes}. ` : ""}Analyze the ${data.imageUrls.length} uploaded floor plan image(s). Perform OCR on every label, detect rooms, compute areas, then return the JSON described. If the image is not a readable floor plan, set detection_status="failed" and explain why — do NOT invent a plan.` },
      ...data.imageUrls.map(url => ({ type: "image_url" as const, image_url: { url } })),
    ];
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: FLOORPLAN_SYSTEM },
            { role: "user", content: userContent },
          ],
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        if (res.status === 429) return { ok: false as const, error: "AI_RATE_LIMIT" };
        if (res.status === 402) return { ok: false as const, error: "AI_CREDITS" };
        return { ok: false as const, error: `AI_ERROR_${res.status}: ${txt.slice(0, 200)}` };
      }
      const json = await res.json();
      const raw: string = json?.choices?.[0]?.message?.content ?? "";
      try {
        const parsed = JSON.parse(stripJson(raw)) as Record<string, unknown>;
        if (containsBannedPhrase(parsed)) {
          return { ok: false as const, error: "AI_HALLUCINATION_BLOCKED" };
        }
        const pipeline = (parsed.pipeline ?? {}) as Record<string, unknown>;
        const rooms = Array.isArray(parsed.rooms) ? parsed.rooms : [];
        const pipelineOk = pipeline.ocr_ran && pipeline.room_detection_ran && pipeline.area_calculation_ran;
        if (!pipelineOk || rooms.length === 0) {
          parsed.detection_status = "failed";
        }
        return { ok: true as const, reportJson: JSON.stringify(parsed) };
      } catch {
        return { ok: false as const, error: "AI_PARSE_FAIL", raw: String(raw).slice(0, 1200) };
      }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  });
