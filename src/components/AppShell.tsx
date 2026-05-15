import { Link, useLocation } from "@tanstack/react-router";
import {
  Home, LayoutGrid, House, ScanLine, Camera, Map, ShoppingBag,
  Building2, TrendingUp, FolderKanban, MessagesSquare, User2, Eye,
} from "lucide-react";
import { type ReactNode, useState } from "react";

export const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/design", label: "Design Space", icon: LayoutGrid },
  { to: "/home-profile", label: "My Home", icon: House },
  { to: "/scanner", label: "A-Eye Scanner", icon: ScanLine },
  { to: "/snap-compare", label: "Snap & Compare", icon: Camera },
  { to: "/floor-plan", label: "Floor Plan AI", icon: Map },
  { to: "/pricing", label: "Pricing & Buy", icon: ShoppingBag },
  { to: "/companies", label: "Company Hub", icon: Building2 },
  { to: "/investor", label: "Investor Mode", icon: TrendingUp },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/chat", label: "A-Eye Chat", icon: MessagesSquare },
  { to: "/profile", label: "Profile", icon: User2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const isLanding = loc.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl sticky top-0 h-screen">
        <BrandMark />
        <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
          {NAV.map((n) => (
            <NavItem key={n.to} {...n} active={loc.pathname === n.to} />
          ))}
        </nav>
        <div className="p-4 text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">
          Powered by Arkhi A-Eye
          <div className="text-gold/70 mt-1">© RIAANZO</div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2">
          <Eye className="size-5 text-gold" />
          <span className="font-display font-bold tracking-tight">ARKHI<span className="text-gold">2</span></span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="size-9 rounded-md hairline grid place-items-center"
          aria-label="Menu"
        >
          <LayoutGrid className="size-4" />
        </button>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl pt-16 px-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="grid grid-cols-2 gap-2">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="luxe-card rounded-xl p-4 flex flex-col gap-2"
                onClick={() => setOpen(false)}
              >
                <n.icon className="size-5 text-gold" />
                <span className="text-sm font-medium">{n.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <main className={`flex-1 min-w-0 ${isLanding ? "" : "px-4 lg:px-10 py-6 lg:py-10"} pb-24 lg:pb-10`}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="grid grid-cols-5">
          {NAV.slice(0, 5).map((n) => {
            const active = loc.pathname === n.to;
            return (
              <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-1 py-2 text-[10px] ${active ? "text-gold" : "text-muted-foreground"}`}>
                <n.icon className="size-4" />
                <span className="truncate max-w-[60px]">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-3 px-5 h-20 border-b border-border/50">
      <div className="size-9 rounded-lg gradient-gold grid place-items-center text-onyx shadow-luxe">
        <Eye className="size-5" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className="font-display font-bold text-lg tracking-tight">ARKHI<span className="text-gold">2</span></div>
        <div className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground">A-Eye Space Vision</div>
      </div>
    </Link>
  );
}

function NavItem({ to, label, icon: Icon, active }: { to: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
        active
          ? "bg-gold/10 text-foreground hairline"
          : "text-muted-foreground hover:text-foreground hover:bg-card/60"
      }`}
    >
      <Icon className={`size-4 ${active ? "text-gold" : ""}`} />
      <span>{label}</span>
      {active && <span className="ml-auto size-1.5 rounded-full bg-gold animate-pulse-gold" />}
    </Link>
  );
}
