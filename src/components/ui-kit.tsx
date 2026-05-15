import { type ReactNode } from "react";

export function PageHeader({ eyebrow, title, subtitle, actions }: {
  eyebrow?: string; title: ReactNode; subtitle?: string; actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        {eyebrow && <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-2">{eyebrow}</div>}
        <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function LuxeCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`luxe-card rounded-2xl ${className}`}>{children}</div>;
}

export function GoldButton({ children, onClick, className = "", type = "button", disabled }: {
  children: ReactNode; onClick?: () => void; className?: string; type?: "button" | "submit"; disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`gradient-gold text-onyx font-medium px-5 py-2.5 rounded-lg shadow-luxe hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`hairline px-5 py-2.5 rounded-lg text-sm hover:bg-card/60 transition ${className}`}>
      {children}
    </button>
  );
}

export function SetupRequired({ feature, env }: { feature: string; env?: string[] }) {
  return (
    <LuxeCard className="p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="size-10 rounded-lg bg-gold/10 hairline grid place-items-center text-gold shrink-0">⚙</div>
        <div className="flex-1">
          <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-1">Setup required</div>
          <h3 className="font-display text-xl font-semibold">{feature} needs backend connection</h3>
          <p className="text-muted-foreground text-sm mt-2">
            Connect Lovable Cloud (Supabase) and configure AI keys to activate live functionality.
            All UI, scanning animations, and local previews work in standalone mode.
          </p>
          {env && (
            <div className="mt-4 grid gap-1.5 font-mono text-xs">
              {env.map((e) => (
                <div key={e} className="px-3 py-1.5 rounded bg-onyx/60 hairline text-gold/90">{e}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LuxeCard>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <LuxeCard className="p-5">
      <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-bold mt-2 text-gradient-gold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </LuxeCard>
  );
}
