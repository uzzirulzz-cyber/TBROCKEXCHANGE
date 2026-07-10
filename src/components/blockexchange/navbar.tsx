"use client";

import { useAuth, type View } from "@/lib/auth-store";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import {
  Home as HomeIcon, BarChart3, CandlestickChart, Wallet as WalletIcon,
  Star, ArrowDownToLine, ArrowUpFromLine, History, User as UserIcon,
  Bell, Settings as SettingsIcon, Menu, ChevronDown,
} from "lucide-react";

interface NavbarProps {
  /** Hide nav links (e.g. on auth view) */
  minimal?: boolean;
}

// Primary nav — always visible on desktop
const PRIMARY_NAV: { label: string; view: View; requiresAuth?: boolean; icon: any }[] = [
  { label: "Home", view: "home", icon: HomeIcon },
  { label: "Markets", view: "markets", icon: BarChart3 },
  { label: "Trade", view: "trade", requiresAuth: true, icon: CandlestickChart },
  { label: "Wallet", view: "wallet", requiresAuth: true, icon: WalletIcon },
];

// Secondary nav — collapsed into "More" dropdown on desktop, shown inline on mobile
const SECONDARY_NAV: { label: string; view: View; requiresAuth?: boolean; icon: any }[] = [
  { label: "Watchlist", view: "watchlist", requiresAuth: true, icon: Star },
  { label: "Assets", view: "assets", requiresAuth: true, icon: WalletIcon },
  { label: "Deposit", view: "deposit", requiresAuth: true, icon: ArrowDownToLine },
  { label: "Withdraw", view: "withdraw", requiresAuth: true, icon: ArrowUpFromLine },
  { label: "History", view: "history", requiresAuth: true, icon: History },
  { label: "Profile", view: "profile", requiresAuth: true, icon: UserIcon },
  { label: "Notifications", view: "notifications", requiresAuth: true, icon: Bell },
  { label: "Settings", view: "settings", requiresAuth: true, icon: SettingsIcon },
];

const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export function Navbar({ minimal = false }: NavbarProps) {
  const { user, view, navigate, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (v: View) => {
    navigate(v);
    setMobileOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bx-glass shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]" : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => go("home")}
            className="flex items-center transition-transform hover:scale-[1.02] shrink-0"
            aria-label="BlockExchange home"
          >
            <Logo size={36} tagline={false} />
          </button>

          {!minimal && (
            <>
              {/* Desktop primary nav */}
              <nav className="hidden lg:flex items-center gap-1">
                {PRIMARY_NAV.map((item) => {
                  const active = view === item.view;
                  const blocked = item.requiresAuth && !user;
                  return (
                    <button
                      key={item.view}
                      onClick={() => go(item.view)}
                      className={cn(
                        "relative px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5",
                        active
                          ? "text-white"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                      {blocked && (
                        <span className="text-[10px] text-[#0ea5ff]">🔒</span>
                      )}
                      {active && (
                        <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-[#0ea5ff] to-transparent" />
                      )}
                    </button>
                  );
                })}

                {/* More dropdown for secondary nav */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1",
                        SECONDARY_NAV.some((i) => i.view === view)
                          ? "text-white"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      )}
                    >
                      More <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 bg-[#0a1428] border-white/10">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Account</DropdownMenuLabel>
                    {SECONDARY_NAV.map((item) => {
                      const blocked = item.requiresAuth && !user;
                      return (
                        <DropdownMenuItem
                          key={item.view}
                          onClick={() => go(item.view)}
                          disabled={blocked}
                          className="flex items-center gap-2 cursor-pointer focus:bg-white/5"
                        >
                          <item.icon className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                          {blocked && <span className="ml-auto text-[10px]">🔒</span>}
                          {view === item.view && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0ea5ff]" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>

              {/* Right side: auth state */}
              <div className="hidden lg:flex items-center gap-2">
                {user ? (
                  <>
                    {(user.role === "SUB_AGENT" || user.role === "SUPER_ADMIN") ? (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-[#2196F3] to-[#0D47A1] hover:opacity-90 text-white bx-glow"
                        onClick={() => navigate(user.role === "SUPER_ADMIN" ? "admin" : "subagent")}
                      >
                        Dashboard
                      </Button>
                    ) : (
                      <button
                        onClick={() => go("wallet")}
                        className="px-3 py-1.5 rounded-lg bx-glass-soft text-sm hover:bg-white/10 transition-colors"
                      >
                        <span className="text-muted-foreground">Balance</span>{" "}
                        <span className="font-semibold text-[#00c853]">
                          {(Number(user.balance) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => go("notifications")}
                      className="relative p-2 rounded-lg bx-glass-soft hover:bg-white/10 transition-colors"
                      aria-label="Notifications"
                    >
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                    </button>
                    <button
                      onClick={() => go("profile")}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bx-glass-soft hover:bg-white/10 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bx-blue-gradient flex items-center justify-center text-xs font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs leading-tight text-left">
                        <div className="font-medium text-white max-w-[100px] truncate">{user.name}</div>
                        <div className="text-muted-foreground uppercase tracking-wider text-[10px]">
                          {user.role === "SUPER_ADMIN"
                            ? "Super Admin"
                            : user.role === "SUB_AGENT"
                            ? `Agent · ${user.invitationCode ?? ""}`
                            : `UID ${user.uid ?? "—"}`}
                        </div>
                      </div>
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-white"
                      onClick={logout}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-white"
                      onClick={() => navigate("login")}
                    >
                      Login
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-[#2196F3] to-[#0D47A1] hover:opacity-90 text-white bx-glow"
                      onClick={() => navigate("register")}
                    >
                      Register
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile toggle */}
              <button
                className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Mobile menu — all 11 items + auth */}
        {!minimal && mobileOpen && (
          <div className="lg:hidden pb-4 bx-fade-in space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {ALL_NAV.map((item) => {
              const blocked = item.requiresAuth && !user;
              const active = view === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => go(item.view)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm",
                    active ? "bx-glass text-white" : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {blocked && <span className="ml-auto text-[10px]">🔒</span>}
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0ea5ff]" />}
                </button>
              );
            })}
            <div className="pt-2 mt-2 border-t border-white/5 flex items-center gap-2">
              {user ? (
                <>
                  <div className="flex-1 text-sm">
                    <div className="text-white font-medium truncate">{user.name}</div>
                    <div className="text-[#00c853]">{(Number(user.balance) || 0).toLocaleString()} USDT</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={logout}>Logout</Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => { navigate("login"); setMobileOpen(false); }}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-[#2196F3] to-[#0D47A1] text-white"
                    onClick={() => { navigate("register"); setMobileOpen(false); }}
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
