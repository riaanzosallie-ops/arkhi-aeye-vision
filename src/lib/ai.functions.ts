import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "google/gemini-2.5-flash";

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
    z.object({ kind: z.string().min(1).max(40), prompt: z.string().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const systems: Record<string, string> = {
      chat: "You are A-Eye, a concise luxury interior intelligence consultant for ARKHI 2 — a UAE-focused AI interior platform. Be specific, premium, and short.",
      scanner: "You are A-Eye, an interior space analyst. Given a brief room description, return concise feedback on layout, lighting, color and furniture in 4-6 short bullets.",
      snap: "You are A-Eye fit & style judge. Score furniture vs room from given dimensions/notes. Return: Fit %, Style %, Clearance verdict, 2-line recommendation.",
      floorplan: "You are A-Eye spatial planner. Given dimensions and notes, suggest zoning, placements and a redesign budget range in AED.",
      pricing: "You are A-Eye UAE retail buyer. Suggest items by category with realistic AED prices from IKEA, Pan Emirates, Home Centre, Danube, Amazon UAE.",
      investor: "You are A-Eye investor analyst for ARKHI 2 (white-label SaaS for UAE furniture retailers). Answer ROI, retention, ARR, conversion questions concisely with numbers.",
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
