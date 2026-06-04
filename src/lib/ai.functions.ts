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

async function callAI(system: string, prompt: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI_KEY_MISSING");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
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
You are A-Eye — a luxury design companion. The user may ask anything about their saved rooms, redesigning, style, budgets, or the Arkhi journey. Be warm, helpful, and inspiring. Use any My Home Profile context provided. Keep answers tight and beautifully written. Mention partner stores only when genuinely useful.`,

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
You are A-Eye Shopping Assistant for UAE customers. Build full-room shopping plans across Pan Emirates, Danube Home, IKEA UAE, Home Centre, Amazon UAE. Each item: category, retailer, estimated price range (AED), fit %, style %. End with: total estimated basket and a warm note. Keep it inspirational, not pushy.`,

      investor: `${ARKHI_CORE}
You are A-Eye Investor Analyst (owner-only context). Frame Arkhi 2 as confidence-to-purchase tech for furniture retailers. Revenue streams: monthly SaaS, white-label licensing, product sales commission, lead generation, AI design packages, retailer analytics. Answer with concrete numbers (AED, %, multiples), tying to scans → leads → conversion → basket → ROI multiple. UAE first, then GCC.`,
    };
    const system = systems[data.kind] ?? systems.chat;
    try {
      const text = await callAI(system, data.prompt);
      return { ok: true as const, text };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false as const, error: msg };
    }
  });

export const aiStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { configured: Boolean(process.env.LOVABLE_API_KEY) };
});

// ─── AI Insurance Valuation ────────────────────────────────────────────
const VALUATION_SYSTEM = `${ARKHI_CORE}
You are A-Eye Insurance Valuator. From the provided room/space images, detect every visible valuable item (furniture, appliances, electronics, decor, lighting, artwork, rugs, accessories). Group obvious duplicates with quantity. For each item, ALWAYS return a realistic replacement-cost estimate in the requested currency. Never leave a value blank. If you cannot identify the exact item, use the closest comparable replacement and set comparable_replacement_used=true, with a note. Be insurance-practical, not speculative on brand/model. Output ONLY valid JSON matching this shape (no prose, no markdown fences):

{"items":[{"item_name":"3-Seater Velvet Sofa","category":"Furniture","quantity":1,"description":"Mid-century styled velvet sofa, dark teal","estimated_low_value":2800,"estimated_mid_value":3500,"estimated_high_value":4500,"condition_assumption":"Good","confidence_score":82,"image_reference":"image_1","comparable_replacement_used":false,"replacement_notes":"","requires_user_review":false}]}

Rules:
- estimated_low/mid/high MUST be positive numbers in the requested currency.
- confidence_score 0-100 integer.
- image_reference uses "image_1", "image_2", ... in the order provided.
- If item is unknown/discontinued, still provide a comparable replacement estimate and set comparable_replacement_used=true with replacement_notes "Exact item unavailable. Estimated using closest comparable replacement." Optionally set requires_user_review=true.
- If item has low resale value, still estimate; set replacement_notes "Low insurance value — included for record completeness."
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
      const raw = json?.choices?.[0]?.message?.content ?? "";
      let parsed: { items?: unknown[] } = {};
      try { parsed = JSON.parse(stripJson(raw)); } catch { return { ok: false as const, error: "AI_PARSE_FAIL", raw }; }
      const items = Array.isArray(parsed.items) ? parsed.items : [];
      return { ok: true as const, items, currency };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  });
