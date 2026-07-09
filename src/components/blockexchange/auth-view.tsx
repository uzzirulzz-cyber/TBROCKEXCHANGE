"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Globe,
  Ticket,
  Check,
  Shield,
  Loader2,
  TrendingUp,
  Zap,
  Wallet,
  Headset,
} from "lucide-react";

import { useAuth, type AuthUser } from "@/lib/auth-store";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

// Approved countries with fiat currency support (from src/lib/fiat-countries.ts).
import { FIAT_COUNTRIES, ALL_PAYMENT_METHODS, getMethodsForCountry, getDialCode, getCountryCurrency } from "@/lib/fiat-countries";
const COUNTRIES = FIAT_COUNTRIES.map((c) => c.name);
// Build phone code list — dedupe by dial code (keep first country, so +1 shows 🇺🇸 US not 🇨🇦 CA)
const PHONE_CODES = (() => {
  const seen = new Set<string>();
  const out: { code: string; label: string }[] = [];
  for (const c of FIAT_COUNTRIES) {
    if (seen.has(c.dialCode)) continue;
    seen.add(c.dialCode);
    out.push({ code: c.dialCode, label: `${c.flag} ${c.dialCode} (${c.code})` });
  }
  return out;
})();

const BENEFITS: { label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Live crypto prices", icon: TrendingUp },
  { label: "Up to 50% returns in 120s", icon: Zap },
  { label: "Secure wallet & instant deposits", icon: Wallet },
  { label: "24/7 support", icon: Headset },
];

// Staff credentials are seeded on the backend — never exposed in the UI.

export function AuthView() {
  const { view, setUser, navigate } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(
    view === "register" ? "register" : "login"
  );

  // Sync local tab with store view when the navbar / parent flips view.
  useEffect(() => {
    if (view === "register") setTab("register");
    else if (view === "login") setTab("login");
  }, [view]);

  // ---- Login state ----
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  // ---- Register state ----
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhoneCode, setRegPhoneCode] = useState("+1"); // default +1, accepts all codes
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regReferral, setRegReferral] = useState("");
  const [regCountry, setRegCountry] = useState("");
  const [regTerms, setRegTerms] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        user?: AuthUser;
        error?: string;
        message?: string;
      };
      if (!res.ok || !data.user) {
        toast.error(data?.error || data?.message || "Login failed.");
        return;
      }
      const user = data.user;
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === "SUPER_ADMIN" ? "admin" : "trade");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!regReferral) {
      toast.error("An invitation code from your agent is required to register.");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (regPassword !== regConfirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!regTerms) {
      toast.error("Please accept the Terms of Service to continue.");
      return;
    }
    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone || undefined,
          phoneCode: regPhoneCode,
          country: regCountry || undefined,
          referralCode: regReferral || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        user?: AuthUser;
        error?: string;
        message?: string;
      };
      if (!res.ok || !data.user) {
        toast.error(data?.error || data?.message || "Registration failed.");
        return;
      }
      const user = data.user;
      // Auto-login: set user, then route by role.
      setUser(user);
      toast.success(`Welcome to Brock Exchange, ${user.name}!`);
      navigate(user.role === "SUPER_ADMIN" ? "admin" : "trade");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setRegLoading(false);
    }
  }

  // (Staff login is via the separate /admin portal — no credential hints here.)

  function handleGoogleLogin() {
    toast.error("Google login is not available.");
  }

  return (
    <>
      {/* Sonner Toaster mounted locally so toasts render regardless of parent. */}
      <SonnerToaster richColors position="top-center" />
      <main className="flex-1 pt-16 bx-fade-in min-h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid lg:grid-cols-[45%_55%] gap-8 lg:gap-12 items-stretch">
            {/* ---------------- Left showcase panel ---------------- */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="hidden lg:flex relative overflow-hidden rounded-2xl bx-glass bx-grid-bg p-8 flex-col justify-between min-h-[620px]"
            >
              {/* Animated gradient glows */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(14,165,255,0.35) 0%, rgba(14,165,255,0) 70%)",
                }}
                animate={{ opacity: [0.4, 0.75, 0.4], scale: [1, 1.1, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(33,150,243,0.25) 0%, rgba(33,150,243,0) 70%)",
                }}
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />

              {/* Top: logo + headline + benefits */}
              <div className="relative">
                <Logo size={56} tagline />
                <h2 className="mt-8 text-3xl font-bold leading-tight">
                  <span className="bx-text-gradient">Trade • Invest • Grow</span>
                </h2>
                <p className="mt-3 text-sm text-muted-foreground max-w-sm">
                  The next-generation crypto trading platform. Predict market
                  movements, trade smart, and grow your portfolio with
                  Brock Exchange.
                </p>

                <ul className="mt-8 space-y-3">
                  {BENEFITS.map(({ label, icon: Icon }) => (
                    <li key={label} className="flex items-center gap-3">
                      <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#0ea5ff]/15 border border-[#0ea5ff]/30 text-[#0ea5ff]">
                        <Icon className="w-4 h-4" />
                        {/* Literal check badge per spec. */}
                        <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-[#00c853] border border-background">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      </span>
                      <span className="text-sm text-foreground/90">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom: testimonial card */}
              <div className="relative mt-8">
                <div className="bx-glass-soft rounded-xl p-4 max-w-sm">
                  <p className="text-sm text-foreground/90 italic">
                    &ldquo;Brock Exchange made trading so simple. I made my first
                    500 USDT in a day.&rdquo;
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bx-blue-gradient flex items-center justify-center text-xs font-bold text-white">
                      S
                    </div>
                    <div className="text-xs">
                      <div className="font-medium text-white">Sarah K.</div>
                      <div className="text-muted-foreground uppercase tracking-wider">
                        VIP 3
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ---------------- Right form panel ---------------- */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
              className="flex items-center justify-center"
            >
              <div className="w-full max-w-md bx-glass rounded-2xl p-6 sm:p-8 bx-glow">
                <div className="flex flex-col items-center text-center mb-6">
                  <Logo size={44} tagline={false} />
                </div>

                <Tabs
                  value={tab}
                  onValueChange={(v) => setTab(v as "login" | "register")}
                >
                  <TabsList className="grid grid-cols-2 w-full mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  <div
                    className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mb-5 select-none"
                    aria-hidden
                  >
                    <Shield className="w-3.5 h-3.5 text-[#0ea5ff]" />
                    <span>Secured by Brock Exchange • 256-bit encryption</span>
                  </div>

                  {/* ---------------- LOGIN ---------------- */}
                  <TabsContent value="login">
                    <div className="mb-5">
                      <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                      <p className="text-sm text-muted-foreground mt-1">
                        Login to your Brock Exchange account
                      </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            className="pl-9"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type={showLoginPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="pl-9 pr-9"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-white transition-colors"
                            aria-label={showLoginPassword ? "Hide password" : "Show password"}
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="remember"
                            checked={remember}
                            onCheckedChange={(v) => setRemember(v === true)}
                          />
                          <Label
                            htmlFor="remember"
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            Remember me
                          </Label>
                        </div>
                        <button
                          type="button"
                          className="text-sm text-[#0ea5ff] hover:underline"
                          onClick={() =>
                            toast.info("Password recovery is not available.")
                          }
                        >
                          Forgot password?
                        </button>
                      </div>

                      <Button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full h-10 bg-gradient-to-r from-[#2196F3] to-[#0D47A1] hover:opacity-90 text-white bx-glow"
                      >
                        {loginLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>

                      {/* Google login */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleLogin}
                        className="w-full h-10 bg-transparent"
                      >
                        <GoogleIcon />
                        Continue with Google
                      </Button>
                    </form>

                    {/* Divider + switch */}
                    <div className="flex items-center gap-3 my-5">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-xs text-muted-foreground">or</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        className="text-[#0ea5ff] hover:underline font-medium"
                        onClick={() => setTab("register")}
                      >
                        Register
                      </button>
                    </p>

                  </TabsContent>

                  {/* ---------------- REGISTER ---------------- */}
                  <TabsContent value="register">
                    <div className="mb-5">
                      <h1 className="text-2xl font-bold text-white">
                        Create your account
                      </h1>
                      <p className="text-sm text-muted-foreground mt-1">
                        Open your account in seconds — fund it whenever you're ready
                      </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-3.5">
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-name">Full Name</Label>
                        <div className="relative">
                          <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reg-name"
                            placeholder="John Doe"
                            className="pl-9"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reg-email">Username (Email)</Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reg-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            className="pl-9"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reg-phone">Phone Number</Label>
                        <div className="flex gap-2">
                          {/* Country code selector — defaults to +1, accepts all country codes */}
                          <Select value={regPhoneCode} onValueChange={setRegPhoneCode}>
                            <SelectTrigger id="reg-phone-code" className="w-[140px] shrink-0" aria-label="Country code">
                              <SelectValue placeholder="+1" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                              {PHONE_CODES.map((p, i) => (
                                <SelectItem key={`${p.code}-${i}`} value={p.code}>
                                  {p.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="relative flex-1">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="reg-phone"
                              inputMode="tel"
                              placeholder="555 123 4567"
                              className="pl-9"
                              value={regPhone}
                              onChange={(e) =>
                                setRegPhone(e.target.value.replace(/[^\d\s-]/g, ""))
                              }
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Default country code is +1 — choose any country code from the dropdown.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reg-country">Country</Label>
                        <Select value={regCountry} onValueChange={(v) => {
                          setRegCountry(v);
                          // Auto-set phone code when country changes
                          const dial = getDialCode(v);
                          if (dial) setRegPhoneCode(dial);
                        }}>
                          <SelectTrigger id="reg-country" className="w-full">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reg-password">Password</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reg-password"
                            type={showRegPassword ? "text" : "password"}
                            placeholder="Min. 6 characters"
                            className="pl-9 pr-9"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-white transition-colors"
                            aria-label={showRegPassword ? "Hide password" : "Show password"}
                          >
                            {showRegPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reg-confirm">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reg-confirm"
                            type={showRegPassword ? "text" : "password"}
                            placeholder="Re-enter password"
                            className="pl-9"
                            value={regConfirm}
                            onChange={(e) => setRegConfirm(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reg-referral">
                          Invitation Code <span className="text-[#ff3b30]">*</span>
                        </Label>
                        <div className="relative">
                          <Ticket className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reg-referral"
                            placeholder="e.g. PB-AG001"
                            className="pl-9 uppercase"
                            value={regReferral}
                            onChange={(e) => setRegReferral(e.target.value.toUpperCase())}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Required — get this from your agent. Registration is invite-only.
                        </p>
                      </div>

                      <div className="flex items-start gap-2 pt-1">
                        <Checkbox
                          id="reg-terms"
                          checked={regTerms}
                          onCheckedChange={(v) => setRegTerms(v === true)}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor="reg-terms"
                          className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
                        >
                          I agree to the{" "}
                          <span className="text-[#0ea5ff]">Terms of Service</span> and{" "}
                          <span className="text-[#0ea5ff]">Privacy Policy</span>.
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        disabled={regLoading}
                        className="w-full h-10 bg-gradient-to-r from-[#2196F3] to-[#0D47A1] hover:opacity-90 text-white bx-glow"
                      >
                        {regLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-5">
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="text-[#0ea5ff] hover:underline font-medium"
                        onClick={() => setTab("login")}
                      >
                        Login
                      </button>
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}

/** Inline multi-color Google "G" mark for the social login button. */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
