import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { resolveUsernameToEmail, checkUsernameAvailable } from "@/lib/auth.functions";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in · ARKHI 2" }] }),
});

const USERNAME_RE = /^[A-Za-z0-9_.-]{2,32}$/;

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const resolve = useServerFn(resolveUsernameToEmail);
  const checkAvail = useServerFn(checkUsernameAvailable);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState(""); // email or username (signin)
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/profile" });
  }, [user, loading, navigate]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setOk(null); setBusy(true);
    try {
      const res = await resolve({ data: { identifier: identifier.trim() } });
      if (!res.ok) {
        setErr(res.error === "USERNAME_NOT_FOUND" ? "No account found with that username." : "Could not resolve account.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: res.email, password: pw });
      if (error) throw error;
      navigate({ to: "/profile" });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Sign in failed.");
    } finally { setBusy(false); }
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setOk(null);
    const uname = username.trim();
    if (!USERNAME_RE.test(uname)) { setErr("Username must be 2–32 chars, letters/numbers/._- only, no spaces."); return; }
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (pw !== pw2) { setErr("Passwords do not match."); return; }
    setBusy(true);
    try {
      const a = await checkAvail({ data: { username: uname } });
      if (!a.available) { setErr("That username is taken."); return; }
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw,
        options: {
          emailRedirectTo: `${window.location.origin}/profile`,
          data: { display_name: fullName.trim() || uname, username: uname, full_name: fullName.trim() },
        },
      });
      if (error) throw error;
      setOk("Account created. Check your email if confirmation is required, then sign in.");
      setMode("signin");
      setIdentifier(uname);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Sign up failed.");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto pt-6 pb-24">
      <PageHeader
        eyebrow="Account"
        title={<>{mode === "signin" ? "Sign in" : "Create account"} <span className="text-gradient-gold">·</span></>}
        subtitle="Use your username or email to access your saved Arkhi reports."
      />
      <LuxeCard className="p-6">
        <div className="flex gap-2 mb-6 text-xs">
          <button type="button" onClick={() => setMode("signin")} className={`flex-1 py-2 rounded-md hairline ${mode === "signin" ? "bg-gold/10 text-gold" : "text-muted-foreground"}`}>Sign in</button>
          <button type="button" onClick={() => setMode("signup")} className={`flex-1 py-2 rounded-md hairline ${mode === "signup" ? "bg-gold/10 text-gold" : "text-muted-foreground"}`}>Create account</button>
        </div>

        {mode === "signin" ? (
          <form onSubmit={onSignIn} className="space-y-4">
            <Field label="Username or email">
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" className="input" />
            </Field>
            <PasswordField label="Password" value={pw} onChange={setPw} show={show} setShow={setShow} autoComplete="current-password" />
            {err && <div className="text-xs text-red-400">{err}</div>}
            {ok && <div className="text-xs text-emerald-400">{ok}</div>}
            <GoldButton type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</GoldButton>
            <div className="flex justify-between text-xs text-muted-foreground pt-2">
              <Link to="/forgot-password" className="text-gold">Forgot password?</Link>
              <button type="button" className="text-gold" onClick={() => setMode("signup")}>Create account</button>
            </div>
          </form>
        ) : (
          <form onSubmit={onSignUp} className="space-y-4">
            <Field label="Full name">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="input" />
            </Field>
            <Field label="Username (no spaces)">
              <input value={username} onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))} required minLength={2} maxLength={32} pattern="[A-Za-z0-9_.\-]{2,32}" className="input" />
            </Field>
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" autoComplete="email" />
            </Field>
            <PasswordField label="Password (min 8)" value={pw} onChange={setPw} show={show} setShow={setShow} autoComplete="new-password" minLength={8} />
            <PasswordField label="Confirm password" value={pw2} onChange={setPw2} show={show} setShow={setShow} autoComplete="new-password" minLength={8} />
            {err && <div className="text-xs text-red-400">{err}</div>}
            {ok && <div className="text-xs text-emerald-400">{ok}</div>}
            <GoldButton type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</GoldButton>
            <div className="text-center text-xs text-muted-foreground pt-2">
              Have an account? <button type="button" className="text-gold" onClick={() => setMode("signin")}>Sign in</button>
            </div>
          </form>
        )}
      </LuxeCard>
      <div className="text-center text-xs text-muted-foreground mt-4">
        Just exploring? <Link to="/floor-plan" className="text-gold">Try Preview Access</Link> — upload a floor plan without an account.
      </div>
      <style>{`
        .input { width:100%; background:hsl(var(--input)/0.4); border:1px solid hsl(var(--border)); border-radius:8px; padding:10px 12px; font-size:14px; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, setShow, autoComplete, minLength }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; setShow: (b: boolean) => void; autoComplete?: string; minLength?: number;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required minLength={minLength}
          autoComplete={autoComplete}
          className="input pr-10"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground p-1.5">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </Field>
  );
}
