import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, User2 } from "lucide-react";
import { PageHeader, LuxeCard, GoldButton, GhostButton } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!user) return null;

  const display = (user.user_metadata?.display_name as string) || user.email?.split("@")[0] || "Friend";
  const username = (user.user_metadata?.username as string) || "";

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader eyebrow="Welcome back" title={<>Hello, <span className="text-gradient-gold">{display}</span></>} />
      <LuxeCard className="p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="size-14 rounded-2xl gradient-gold grid place-items-center text-onyx"><User2 className="size-7" /></div>
          <div>
            <div className="font-display text-xl">{display}</div>
            <div className="text-sm text-muted-foreground">{user.email}{username && <> · @{username}</>}</div>
          </div>
          <GhostButton onClick={logout} className="ml-auto"><LogOut className="inline size-4 mr-1" />Sign out</GhostButton>
        </div>
      </LuxeCard>
      <LuxeCard className="p-5 mt-4 text-sm text-muted-foreground">
        ✓ Cloud sync active · Rooms, projects and uploads save to your account.
      </LuxeCard>
      <div className="mt-6 flex gap-3">
        <Link to="/floor-plan"><GoldButton>Open Floor Plan AI</GoldButton></Link>
        <Link to="/scanner"><GhostButton>Scanner</GhostButton></Link>
      </div>
    </div>
  );
}
