import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  head: () => ({ meta: [{ title: "Set new password · ARKHI 2" }] }),
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery session in the URL hash. Wait for it to land.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (pw !== pw2) { setErr("Passwords do not match."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setDone(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate({ to: "/auth" }), 1500);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not update password.");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto pt-6 pb-24">
      <PageHeader eyebrow="Account" title={<>Set a new <span className="text-gradient-gold">password</span></>} />
      <LuxeCard className="p-6">
        {!ready ? (
          <div className="text-sm text-muted-foreground">Verifying reset link…</div>
        ) : done ? (
          <div className="text-sm text-emerald-400">Password updated. Redirecting to sign in…</div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">New password</label>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} className="w-full mt-1 bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Confirm new password</label>
              <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={8} className="w-full mt-1 bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" />
            </div>
            {err && <div className="text-xs text-red-400">{err}</div>}
            <GoldButton type="submit" className="w-full" disabled={busy}>{busy ? "Updating…" : "Update password"}</GoldButton>
            <div className="text-center text-xs text-muted-foreground pt-2">
              <Link to="/auth" className="text-gold">Back to sign in</Link>
            </div>
          </form>
        )}
      </LuxeCard>
    </div>
  );
}
