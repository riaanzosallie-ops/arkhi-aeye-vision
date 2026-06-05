import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { resolveUsernameToEmail } from "@/lib/auth.functions";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
  head: () => ({ meta: [{ title: "Reset password · ARKHI 2" }] }),
});

function ForgotPassword() {
  const resolve = useServerFn(resolveUsernameToEmail);
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null); setBusy(true);
    try {
      const r = await resolve({ data: { identifier: identifier.trim() } });
      if (!r.ok) { setErr("No account found with that username or email."); return; }
      const { error } = await supabase.auth.resetPasswordForEmail(r.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMsg("If an account exists, a reset link has been sent.");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not send reset email.");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto pt-6 pb-24">
      <PageHeader eyebrow="Account" title={<>Reset <span className="text-gradient-gold">password</span></>} subtitle="Enter your username or email and we'll send a reset link." />
      <LuxeCard className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Username or email</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full mt-1 bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          {err && <div className="text-xs text-red-400">{err}</div>}
          {msg && <div className="text-xs text-emerald-400">{msg}</div>}
          <GoldButton type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</GoldButton>
          <div className="text-center text-xs text-muted-foreground pt-2">
            <Link to="/auth" className="text-gold">Back to sign in</Link>
          </div>
        </form>
      </LuxeCard>
    </div>
  );
}
