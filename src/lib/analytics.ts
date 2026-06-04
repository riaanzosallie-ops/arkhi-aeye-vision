import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "arkhi2:session";

function sessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function deviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function logPageView(page: string) {
  if (typeof window === "undefined") return;
  // Fire-and-forget; never block UI
  void supabase
    .from("arkhi_page_views")
    .insert({
      page,
      session_id: sessionId(),
      device_type: deviceType(),
      referrer: document.referrer || null,
    })
    .then(() => {});
}

export function logAiUsage(args: {
  kind: string;
  durationMs: number;
  success: boolean;
  errorCode?: string | null;
}) {
  void supabase
    .from("arkhi_ai_usage")
    .insert({
      kind: args.kind,
      duration_ms: Math.round(args.durationMs),
      success: args.success,
      error_code: args.errorCode ?? null,
    })
    .then(() => {});
}

/** Wrap an AI call and log timing + success/failure. Never throws. */
export async function trackAi<T extends { ok: boolean; error?: string }>(
  kind: string,
  fn: () => Promise<T>,
): Promise<T> {
  const t0 = performance.now();
  try {
    const res = await fn();
    logAiUsage({
      kind,
      durationMs: performance.now() - t0,
      success: res.ok,
      errorCode: res.ok ? null : res.error ?? "UNKNOWN",
    });
    return res;
  } catch (e) {
    logAiUsage({
      kind,
      durationMs: performance.now() - t0,
      success: false,
      errorCode: e instanceof Error ? e.message : "THROWN",
    });
    throw e;
  }
}
