import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Resolves a username (case-insensitive) to its email so the user can sign in
 * with either. Returns `null` if no match. Server-only — uses admin client.
 */
export const resolveUsernameToEmail = createServerFn({ method: "POST" })
  .inputValidator((d: { identifier: string }) =>
    z.object({ identifier: z.string().trim().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data }) => {
    const id = data.identifier.trim();
    // If it already looks like an email, just return it.
    if (id.includes("@")) return { ok: true as const, email: id };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .ilike("username", id)
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    if (!row?.email) return { ok: false as const, error: "USERNAME_NOT_FOUND" };
    return { ok: true as const, email: row.email };
  });

/** Checks if a username is already taken. */
export const checkUsernameAvailable = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string }) =>
    z.object({ username: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9_.-]+$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("username", data.username)
      .maybeSingle();
    return { available: !row };
  });
