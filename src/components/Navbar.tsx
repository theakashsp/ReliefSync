import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Siren, Map, PlusCircle, Users, ShieldCheck, LogIn, LogOut, Menu, X, Bell, Info } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { HelplineDrawer } from "@/components/HelplineDrawer";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation, type Locale } from "@/lib/i18n";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हि" },
  { code: "kn", label: "ಕ" },
];

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const NAV = [
    { to: "/map", label: t("nav.map"), icon: Map },
    { to: "/submit", label: t("nav.report"), icon: PlusCircle },
    { to: "/volunteer", label: t("nav.volunteer"), icon: Users },
    { to: "/admin", label: t("nav.admin"), icon: ShieldCheck },
    { to: "/about", label: t("nav.about"), icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl gradient-emergency flex items-center justify-center shadow-glow">
              <Siren className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success pulse-ring" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-lg tracking-tight">ReliefLink</span>
            <span className="text-[10px] text-muted-foreground tracking-widest">AI · COORDINATE</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = path === n.to || path.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="hidden sm:flex items-center gap-0.5 glass rounded-lg p-0.5">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium transition-all",
                  locale === l.code
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={`Switch to ${l.code}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Helplines */}
          <HelplineDrawer />

          {/* Notifications bell */}
          <Link
            to="/map"
            className="h-9 w-9 rounded-lg border border-border hover:border-primary/40 flex items-center justify-center transition-all relative"
            aria-label="View live map notifications"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-critical pulse-ring" />
          </Link>

          {user ? (
            <>
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-xs text-muted-foreground">Signed in as</span>
                <span className="text-sm font-medium capitalize">{role}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => signOut().then(() => navigate({ to: "/" }))}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate({ to: "/auth" })} variant="default" size="sm" className="gradient-hero border-0">
              <LogIn className="h-4 w-4 mr-1.5" /> {t("nav.signin")}
            </Button>
          )}
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted text-sm"
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
          {/* Mobile language selector */}
          <div className="flex items-center gap-1 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground mr-2">Language:</span>
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium transition-all",
                  locale === l.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
