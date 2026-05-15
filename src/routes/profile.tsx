import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, LogOut, User2 } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton, GhostButton } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/profile")({ component: Profile });

const REMEMBER_KEY = "arkhi2:remember";

function Profile() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // "Remember me" — if unchecked, sign out when the tab closes.
  useEffect(() => {
    const handler = () => {
      if (localStorage.getItem(REMEMBER_KEY) === "0") {
        void supabase.auth.signOut({ scope: "local" });
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pw,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pw,
        });
        if (error) throw error;
      }
    } catch (e2: unknown) {
      setErr(e2 instanceof Error ? e2.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  if (user) {
    const display = (user.user_metadata?.display_name as string) || user.email?.split("@")[0] || "Friend";
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader eyebrow="Welcome back" title={<>Hello, <span className="text-gradient-gold">{display}</span></>} />
        <LuxeCard className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="size-14 rounded-2xl gradient-gold grid place-items-center text-onyx"><User2 className="size-7" /></div>
            <div>
              <div className="font-display text-xl">{display}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
            <GhostButton onClick={logout} className="ml-auto"><LogOut className="inline size-4 mr-1" />Sign out</GhostButton>
          </div>
        </LuxeCard>
        <LuxeCard className="p-5 mt-4 text-sm text-muted-foreground">
          ✓ Cloud sync active · Rooms, projects and uploads save to your account.
        </LuxeCard>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-10">
      <PageHeader eyebrow="Account" title={<>{mode === "signin" ? "Sign in" : "Create account"} <span className="text-gradient-gold">·</span></>} />
      <LuxeCard className="p-6">
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Display name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" />
            </div>
          )}
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" required />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Password</label>
            <div className="relative mt-1">
              <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} className="w-full bg-input/40 hairline rounded-lg px-3 py-2.5 pr-10 text-sm" required />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground p-1.5">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
          </div>
          {err && <div className="text-xs text-red-400">{err}</div>}
          <GoldButton type="submit" className="w-full" disabled={busy}>{busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}</GoldButton>
          <div className="text-center text-xs text-muted-foreground">
            {mode === "signin" ? "New here? " : "Have an account? "}
            <button type="button" className="text-gold" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </div>
        </form>
      </LuxeCard>
    </div>
  );
}
