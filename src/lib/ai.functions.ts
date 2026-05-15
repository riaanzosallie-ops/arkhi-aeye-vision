import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "google/gemini-2.5-flash";

const ARKHI_CORE = `
ARKHI 2 — A-Eye Space Vision is an AI-powered furniture conversion platform for retailers.
Positioning: "Confidence-to-purchase technology for furniture retailers."
Customer value: scan home → understand fit → visualize partner furniture → compare → buying confidence → purchase plan.
Retailer value: capture room-based leads, recommend catalogue products, grow basket size, reduce hesitation, support showroom staff, drive repeat purchase via My Home Profile, track ROI.
Key UAE partners: Pan Emirates, Danube Home, IKEA UAE, Home Centre.
Every answer must connect back to at least one of: fit, style match, purchase confidence, retailer product recommendation, customer next step, full-room shopping plan, partner conversion opportunity.
Never claim live SKU pricing unless catalogue is connected — use labels: "Estimated price range", "Catalogue integration required", "Partner SKU required".
Be commercial, confident, investor-ready, concise.
`.trim();

const FORMAT_BLOCK = `
When evaluating a room or item, output in this format (omit lines that are not relevant):
Fit Score: <0-100>%
Style Match: <0-100>%
Purchase Confidence: <Low|Medium|High>
Recommended Action: <Buy|Hold|Compare alternative>
Size Warning: <None | brief>
Suggested Partner Product: <retailer + product type>
Upsell Opportunity: <add-ons>
Alternative Item: <if confidence low>
Estimated Basket Value: AED <range>
Customer Next Step: <one short sentence>
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
You are A-Eye Partner Consultant. Answer investor, retailer and operator questions (ROI, white-label, lead capture, basket growth, showroom QR, My Home Profile retention, Snap & Compare in-store flow). Always tie answers to commercial outcomes for the retailer. Keep it tight: bullets, numbers, AED where relevant.`,

      scanner: `${ARKHI_CORE}
You are A-Eye Room Analyst. The customer uploaded a room. Use any My Home Profile context provided. Return a confidence-to-purchase scan: room read (4 short bullets) + recommended partner product + matching add-ons + estimated full-room basket value (AED range) + customer next step.
${FORMAT_BLOCK}`,

      snap: `${ARKHI_CORE}
You are A-Eye Snap & Compare — the in-store / at-home fit judge. The customer is comparing a furniture item to their saved room. Decide: will it fit, does it match, should they buy, what to add, is there a better alternative.
${FORMAT_BLOCK}`,

      floorplan: `${ARKHI_CORE}
You are A-Eye Spatial Planner. From floor plan + dimensions, deliver: zoning, key placements, recommended partner products per zone, full-room shopping list, estimated AED redesign budget range, purchase readiness, and customer next step. Use "Estimated price range" labels — no live SKUs.`,

      pricing: `${ARKHI_CORE}
You are A-Eye Shopping Assistant for UAE customers. Build full-room shopping plans across Pan Emirates, Danube Home, IKEA UAE, Home Centre, Amazon UAE. Each item: category, retailer, estimated price range (AED), fit %, style %. End with: total estimated basket, purchase confidence, suggested upsell.`,

      investor: `${ARKHI_CORE}
You are A-Eye Investor Analyst. Frame Arkhi 2 as confidence-to-purchase tech for furniture retailers. Use these revenue streams: monthly SaaS, white-label licensing, product sales commission, lead generation, AI design packages, retailer analytics. Answer with concrete numbers (AED, %, multiples), tying to scans → leads → conversion → basket → ROI multiple. UAE first, then GCC.`,
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
