import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, LogOut, User2 } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton, GhostButton, SetupRequired } from "@/components/ui-kit";

export const Route = createFileRoute("/profile")({ component: Profile });

const KEY = "arkhi2:user";

function Profile() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem(KEY) || "null")); } catch { /* */ }
  }, []);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pw) return;
    const u = { email: email.trim(), name: email.split("@")[0] };
    if (remember) localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => { localStorage.removeItem(KEY); setUser(null); };

  if (user) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader eyebrow="Welcome back" title={<>Hello, <span className="text-gradient-gold">{user.name}</span></>} />
        <LuxeCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl gradient-gold grid place-items-center text-onyx"><User2 className="size-7" /></div>
            <div>
              <div className="font-display text-xl">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
            <GhostButton onClick={logout} className="ml-auto"><LogOut className="inline size-4 mr-1" />Sign out</GhostButton>
          </div>
        </LuxeCard>
        <div className="mt-4">
          <SetupRequired feature="Persistent cloud accounts" env={["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-10">
      <PageHeader eyebrow="Account" title={<>Sign <span className="text-gradient-gold">in</span></>} />
      <LuxeCard className="p-6">
        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 bg-input/40 hairline rounded-lg px-3 py-2.5 text-sm" required />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Password</label>
            <div className="relative mt-1">
              <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} className="w-full bg-input/40 hairline rounded-lg px-3 py-2.5 pr-10 text-sm" required />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground p-1.5">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
            <button type="button" className="text-gold">Forgot password?</button>
          </div>
          <GoldButton type="submit" className="w-full">Sign in</GoldButton>
          <div className="text-center text-xs text-muted-foreground">
            New here? <button type="button" className="text-gold">Create account</button>
          </div>
        </form>
      </LuxeCard>
    </div>
  );
}
