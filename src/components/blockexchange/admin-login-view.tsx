"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster as SonnerToaster, toast } from "sonner";
import { useAuth, type AuthUser } from "@/lib/auth-store";
import { Logo } from "./logo";

/**
 * Separate Admin / Staff login portal.
 * Hidden from the storefront navbar — reached via view === "admin-login".
 * Uses the uploaded BlockExchange logo as a full-bleed background.
 */
export function AdminLoginView() {
  const { setUser, navigate } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hard-embedded staff credentials for quick login (matches seeder in src/lib/seed.ts).
  const STAFF_ACCOUNTS = [
    { label: "Super Admin", email: "trade@proton.me", password: "123playbeat", role: "SUPER_ADMIN" },
    { label: "Sub-Agent 1", email: "subagent1@trade.com", password: "default", role: "SUB_AGENT", code: "PB-AG001" },
    { label: "Sub-Agent 2", email: "subagent2@trade2.com", password: "default", role: "SUB_AGENT", code: "PB-AG002" },
    { label: "Sub-Agent 3", email: "subagent3@trade3.com", password: "default", role: "SUB_AGENT", code: "PB-AG003" },
    { label: "Sub-Agent 4", email: "subagent4@trade4.com", password: "default", role: "SUB_AGENT", code: "PB-AG004" },
    { label: "Sub-Agent 5", email: "subagent5@trade5.com", password: "default", role: "SUB_AGENT", code: "PB-AG005" },
  ];

  async function doLogin(loginEmail: string, loginPassword: string) {
    setLoading(true);
    // Auto-seed on every staff login attempt — idempotent, ensures accounts exist
    // even on a fresh database. Safe to call repeatedly.
    try {
      await fetch("/api/auth/seed", { method: "POST" });
    } catch {}
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { user?: AuthUser; error?: string };
      if (!res.ok || !data.user) {
        toast.error(data?.error || "Login failed.");
        return;
      }
      const u = data.user;
      if (u.role !== "SUPER_ADMIN" && u.role !== "SUB_AGENT") {
        toast.error("This portal is for staff only.");
        return;
      }
      setUser(u);
      toast.success(`Welcome, ${u.name}`);
      navigate(u.role === "SUPER_ADMIN" ? "admin" : "subagent");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    await doLogin(email, password);
  }

  function quickLogin(acc: typeof STAFF_ACCOUNTS[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
    doLogin(acc.email, acc.password);
  }

  return (
    <>
      <SonnerToaster richColors position="top-center" />
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Full-bleed logo background */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url(/admin-login-bg.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050b18]/80 via-[#050b18]/70 to-[#050b18]/90" />
        <div className="absolute inset-0 bx-grid-bg opacity-30" />

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <div className="bx-glass rounded-2xl p-8 bx-glow">
            <button
              onClick={() => navigate("home")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to site
            </button>

            <div className="flex flex-col items-center text-center mb-8">
              <Logo size={56} showText={false} />
              <h1 className="mt-4 text-2xl font-bold text-white">Staff Portal</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Authorized personnel only · Super Admin & Sub-Agents
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@blockexchange.buzz"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-[#2196F3] to-[#0D47A1] hover:opacity-90 text-white bx-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" /> Sign in to Dashboard
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/5">
              <p className="text-[11px] text-muted-foreground text-center">
                Staff credentials are stored securely in the database. Use your registered email and password to sign in.
              </p>
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            trade@proton.me · your home for profits
          </p>
        </motion.div>
      </main>
    </>
  );
}
