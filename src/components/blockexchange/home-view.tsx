"use client";

/**
 * BlockExchange — Home (landing) view.
 *
 * Renders the full landing page when `view === "home"`. The parent page.tsx is
 * responsible for showing <Navbar /> and <Footer />; this component only renders
 * the hero + marketing sections between them.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  BadgeCheck,
  CandlestickChart,
  Headset,
  Shield,
  Wallet,
  Zap,
} from "lucide-react";
import { COINS, formatPrice, type Coin } from "@/lib/market-data";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------ live prices ------------------------------ */

interface LivePrice {
  price: number;
  change: number; // 24h % change
}

/** Random-walk price simulation. Updates every 2s for the "live" feel. */
function useLivePrices(): LivePrice[] {
  const [prices, setPrices] = useState<LivePrice[]>(() =>
    COINS.map((c) => ({
      price: c.basePrice,
      change: (Math.random() - 0.5) * 8,
    }))
  );

  useEffect(() => {
    const t = setInterval(() => {
      setPrices((prev) =>
        prev.map((p, i) => {
          const drift = (Math.random() - 0.5) * COINS[i].basePrice * 0.004;
          const next = Math.max(p.price + drift, COINS[i].basePrice * 0.5);
          const change = ((next - COINS[i].basePrice) / COINS[i].basePrice) * 100;
          return { price: next, change };
        })
      );
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return prices;
}

/** Generate a tiny sparkline dataset (20 points) seeded off the coin's base. */
function genSparkline(base: number, points = 20): { v: number }[] {
  const data: { v: number }[] = [];
  let v = base * 0.98;
  const vol = base * 0.012;
  for (let i = 0; i < points; i++) {
    v = Math.max(v + (Math.random() - 0.48) * vol, base * 0.5);
    data.push({ v });
  }
  return data;
}

/* -------------------------------- content -------------------------------- */

type LucideIcon = typeof Zap;

const FLOATING_COINS = [
  { icon: "₿", color: "#f7931a", top: "12%", left: "8%", delay: 0, size: 56 },
  { icon: "Ξ", color: "#627eea", top: "22%", left: "86%", delay: 1.5, size: 48 },
  { icon: "◎", color: "#9945ff", top: "68%", left: "5%", delay: 0.8, size: 52 },
  { icon: "B", color: "#f3ba2f", top: "72%", left: "92%", delay: 2.2, size: 44 },
  { icon: "Ð", color: "#c2a633", top: "46%", left: "94%", delay: 3, size: 40 },
  { icon: "₳", color: "#3b82f6", top: "85%", left: "75%", delay: 1.2, size: 50 },
];

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Zap, title: "Live Crypto Prices", desc: "Real-time market data for 8 top cryptocurrencies with sub-second updates." },
  { icon: Shield, title: "Secure Wallet", desc: "Bank-grade encryption keeps your funds safe at all times." },
  { icon: ArrowDownToLine, title: "Instant Deposits", desc: "Top up your wallet instantly via bank, card, or crypto and start trading in seconds." },
  { icon: ArrowUpFromLine, title: "Fast Withdrawals", desc: "Request payouts any time — processed and settled in minutes." },
  { icon: CandlestickChart, title: "Binary Trading", desc: "30s / 60s / 120s contracts. Predict UP or DOWN and earn up to 50%." },
  { icon: Headset, title: "24/7 Support", desc: "Round-the-clock human support across all major time zones." },
  { icon: BadgeCheck, title: "KYC Verification", desc: "Compliant identity verification for a safe trading environment." },
  { icon: Wallet, title: "Multi-Currency", desc: "Trade in USDT, BTC, ETH and more from a single wallet." },
];

const RETURNS = [
  { duration: "30 Seconds", pct: 20, color: "#0ea5ff" },
  { duration: "60 Seconds", pct: 30, color: "#2196f3" },
  { duration: "120 Seconds", pct: 50, color: "#00c853" },
];

const HERO_STATS = ["$2.4B+ Volume", "8 Coins", "50% Max Returns", "24/7 Support"];

const BOTTOM_STATS = [
  { value: "50K+", label: "Active Traders" },
  { value: "$2.4B+", label: "Volume" },
  { value: "8", label: "Cryptocurrencies" },
  { value: "99.9%", label: "Uptime" },
];

/* ------------------------------ sub-blocks ------------------------------- */

function FloatingCoins() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {FLOATING_COINS.map((c, i) => (
        <motion.span
          key={i}
          className="absolute font-bold select-none"
          style={{
            top: c.top,
            left: c.left,
            color: c.color,
            fontSize: c.size,
            opacity: 0.18,
            textShadow: `0 0 24px ${c.color}`,
          }}
          initial={{ y: 0, x: 0 }}
          animate={{
            y: [0, -24, 0, 18, 0],
            x: [0, 12, -8, 6, 0],
          }}
          transition={{
            duration: 12 + i,
            delay: c.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {c.icon}
        </motion.span>
      ))}
    </div>
  );
}

function MiniCandlestick() {
  const [bars, setBars] = useState<{ h: number; up: boolean }[]>(() =>
    Array.from({ length: 20 }, () => ({
      h: 25 + Math.random() * 70,
      up: Math.random() > 0.45,
    }))
  );

  useEffect(() => {
    const t = setInterval(() => {
      setBars((prev) => [
        ...prev.slice(1),
        { h: 20 + Math.random() * 75, up: Math.random() > 0.42 },
      ]);
    }, 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bx-glass rounded-2xl p-5 bx-glow w-full max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#f7931a]">₿</span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">BTC/USDT</div>
            <div className="text-[10px] text-muted-foreground">Live preview</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] text-[#00c853] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] bx-pulse-dot" />
          LIVE
        </span>
      </div>

      <div className="h-44 flex items-end gap-1.5">
        {bars.map((b, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              background: b.up
                ? "linear-gradient(180deg,#00e676,#00c853)"
                : "linear-gradient(180deg,#ff6b6b,#ff3b30)",
              opacity: 0.55 + (b.h / 100) * 0.45,
              boxShadow: b.up
                ? "0 0 8px rgba(0,200,83,0.4)"
                : "0 0 8px rgba(255,59,48,0.4)",
            }}
            animate={{ height: `${b.h}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="bx-glass-soft rounded-lg py-2">
          <div className="text-[10px] text-muted-foreground">24h High</div>
          <div className="text-xs font-semibold text-[#00c853]">$68,420</div>
        </div>
        <div className="bx-glass-soft rounded-lg py-2">
          <div className="text-[10px] text-muted-foreground">24h Low</div>
          <div className="text-xs font-semibold text-[#ff3b30]">$65,180</div>
        </div>
        <div className="bx-glass-soft rounded-lg py-2">
          <div className="text-[10px] text-muted-foreground">Volume</div>
          <div className="text-xs font-semibold text-white">$1.2B</div>
        </div>
      </div>
    </div>
  );
}

function TickerTape({ prices }: { prices: LivePrice[] }) {
  // Duplicate COINS list so the marquee loops seamlessly.
  const items = useMemo(() => [...COINS, ...COINS], []);
  return (
    <div className="relative overflow-hidden bx-glass border-y border-white/5">
      <div className="flex w-max bx-ticker-track">
        {items.map((coin, i) => {
          const p = prices[i % COINS.length];
          if (!p) return null;
          const up = p.change >= 0;
          return (
            <div
              key={`${coin.symbol}-${i}`}
              className="flex items-center gap-2 px-5 py-3 border-r border-white/5 whitespace-nowrap"
            >
              <span className="text-base font-bold" style={{ color: coin.color }}>
                {coin.icon}
              </span>
              <span className="text-sm font-semibold text-white">{coin.symbol}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                ${formatPrice(p.price, coin.pair)}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  up ? "text-[#00c853]" : "text-[#ff3b30]"
                )}
              >
                {up ? "▲" : "▼"} {Math.abs(p.change).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  index,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.08 }}
      className="bx-glass rounded-2xl p-5 hover:bx-glow hover:border-[#0ea5ff]/40 transition-all group"
    >
      <div className="w-11 h-11 rounded-xl bx-blue-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="text-white" size={20} />
      </div>
      <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function MarketCard({ coin, live }: { coin: Coin; live: LivePrice }) {
  const navigate = useAuth((s) => s.navigate);
  const spark = useMemo(() => genSparkline(coin.basePrice), [coin.basePrice]);
  const up = live.change >= 0;
  const gradId = `spark-${coin.symbol}`;

  return (
    <motion.button
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      onClick={() => navigate("trade")}
      className="bx-glass rounded-2xl p-5 hover:bx-glow hover:border-[#0ea5ff]/40 transition-all text-left w-full cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold"
            style={{
              background: `${coin.color}22`,
              color: coin.color,
              border: `1px solid ${coin.color}55`,
            }}
          >
            {coin.icon}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">{coin.symbol}</div>
            <div className="text-[11px] text-muted-foreground">{coin.name}</div>
          </div>
        </div>
        <span
          className={cn(
            "px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums",
            up ? "bg-[#00c853]/15 text-[#00c853]" : "bg-[#ff3b30]/15 text-[#ff3b30]"
          )}
        >
          {up ? "+" : ""}
          {live.change.toFixed(2)}%
        </span>
      </div>

      <div className="mt-3 text-xl font-bold text-white tabular-nums">
        ${formatPrice(live.price, coin.pair)}
      </div>

      <div className="h-10 -mx-1 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={coin.color} stopOpacity={0.6} />
                <stop offset="100%" stopColor={coin.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={["dataMin", "dataMax"]} hide />
            <Area
              type="monotone"
              dataKey="v"
              stroke={coin.color}
              strokeWidth={1.8}
              fill={`url(#${gradId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full mt-3 py-2 rounded-lg bg-gradient-to-r from-[#2196F3] to-[#0D47A1] text-white text-xs font-semibold text-center">
        Trade
      </div>
    </motion.button>
  );
}

function SectionHeading({
  tag,
  title,
  sub,
}: {
  tag: string;
  title: ReactNode;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-2xl mx-auto mb-12"
    >
      <span className="inline-block px-3 py-1 rounded-full bx-glass-soft text-xs font-semibold tracking-wider text-[#0ea5ff] uppercase">
        {tag}
      </span>
      <h2 className="mt-4 text-3xl md:text-4xl font-bold text-white">{title}</h2>
      {sub && <p className="mt-3 text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

/* ------------------------------ main view -------------------------------- */

export function HomeView() {
  const navigate = useAuth((s) => s.navigate);
  const user = useAuth((s) => s.user);
  const prices = useLivePrices();

  return (
    <div className="bx-fade-in">
      {/* 1. Hero */}
      <section className="relative pt-24 min-h-screen flex items-center bx-grid-bg overflow-hidden">
        <FloatingCoins />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bx-glass-soft text-xs font-medium text-white/90">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] bx-pulse-dot" />
                🚀 Live • 50,000+ traders
              </span>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
                Trade Crypto Smarter with{" "}
                <span className="bx-text-gradient">BlockExchange</span>
              </h1>

              <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Predict market movements and earn up to 50% returns in minutes. Trade
                binary options on 8 top cryptocurrencies with real-time charts and
                instant settlements.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate("trade")}
                  className="bg-gradient-to-r from-[#2196F3] to-[#0D47A1] hover:opacity-90 text-white bx-glow"
                >
                  Start Trading
                  <ArrowRight size={16} />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => navigate("login")}
                  className="text-white hover:text-white hover:bg-white/5 border border-white/10"
                >
                  Login
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
                {HERO_STATS.map((s) => (
                  <span
                    key={s}
                    className="text-xs md:text-sm text-muted-foreground"
                  >
                    <span className="text-white font-semibold">{s.split(" ")[0]}</span>{" "}
                    {s.split(" ").slice(1).join(" ")}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right: mini candlestick preview (hidden on mobile) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="hidden lg:flex justify-center"
            >
              <div className="w-full flex flex-col items-end gap-2">
                <div className="text-xs text-muted-foreground pr-2">
                  Live BTC/USDT preview
                </div>
                <MiniCandlestick />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Live ticker tape */}
      <TickerTape prices={prices} />

      {/* 3. Features grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="Features"
            title={<>Everything you need to <span className="bx-text-gradient">trade smarter</span></>}
            sub="A complete crypto trading toolkit — built for speed, security and instant payouts."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                desc={f.desc}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Live market */}
      <section className="py-20 border-y border-white/5 bx-glass-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="Markets"
            title={<>Live <span className="bx-text-gradient">crypto markets</span></>}
            sub="Real-time prices across 8 top cryptocurrencies. Click any coin to start trading."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {COINS.map((coin, i) => (
              <MarketCard key={coin.symbol} coin={coin} live={prices[i]} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Trading returns showcase — CUSTOMERS ONLY (hidden from storefront/guests) */}
      {user && user.role === "CUSTOMER" && (
      <section className="py-20 border-y border-white/5 bx-glass-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="Returns"
            title={<>Higher timeframes, <span className="bx-text-gradient">higher payouts</span></>}
            sub="Pick a duration, predict the market, and earn up to 50% on every winning trade."
          />
          <div className="grid md:grid-cols-3 gap-6">
            {RETURNS.map((r, i) => (
              <motion.div
                key={r.duration}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="relative bx-glass rounded-2xl p-8 text-center bx-glow"
                style={{ borderColor: `${r.color}55` }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${r.color}, transparent)` }}
                />
                <div className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                  {r.duration}
                </div>
                <div
                  className="mt-4 text-6xl font-extrabold tabular-nums"
                  style={{
                    background: `linear-gradient(180deg, ${r.color}, #ffffff)`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {r.pct}%
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  return on every winning trade
                </div>
                <Button
                  onClick={() => navigate("trade")}
                  className="mt-6 w-full text-white"
                  style={{
                    background: `linear-gradient(135deg, ${r.color}, #0d47a1)`,
                  }}
                >
                  Trade {r.duration.split(" ")[0]}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* 7. CTA banner */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bx-glass bx-glow px-6 py-12 md:py-16 text-center"
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(600px 300px at 20% 0%, rgba(14,165,255,0.5), transparent 60%), radial-gradient(500px 300px at 80% 100%, rgba(33,150,243,0.4), transparent 60%)",
              }}
              aria-hidden
            />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Ready to start trading?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Join BlockExchange today, open your account in seconds, and start trading 8 top cryptocurrencies with up to 50% returns.
              </p>
              <div className="mt-7">
                <Button
                  size="lg"
                  onClick={() => navigate("register")}
                  className="bg-gradient-to-r from-[#2196F3] to-[#0D47A1] hover:opacity-90 text-white bx-glow"
                >
                  Register Now
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 8. Stats strip */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {BOTTOM_STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-extrabold bx-text-gradient">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Earn Opportunities */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
              Opportunities to Earn More
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-8 max-w-xl mx-auto">
              Maximize your earnings with these proven strategies on BlockExchange
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🎯",
                title: "Binary Trading",
                desc: "Predict UP or DOWN on 10 cryptocurrencies. Win up to 50% returns in 30-120 seconds.",
                payout: "Up to 50%",
                color: "#0A84FF",
              },
              {
                icon: "👥",
                title: "Refer & Earn $30",
                desc: "Invite friends with your referral code. You and your friend each earn $30 USD when they complete simple trade actions.",
                payout: "$30 per friend",
                color: "#30D158",
              },
              {
                icon: "💎",
                title: "VIP Rewards",
                desc: "Trade more to climb VIP tiers — from VIP-1 to Prime_Diamond. Higher tiers unlock better payouts and exclusive perks.",
                payout: "Up to 💎 Diamond",
                color: "#BF5AF2",
              },
            ].map((opp, i) => (
              <motion.div
                key={opp.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bx-glass rounded-2xl p-6 hover:bx-glow transition-all"
              >
                <div className="text-4xl mb-3">{opp.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{opp.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{opp.desc}</p>
                <div
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: `${opp.color}22`, color: opp.color }}
                >
                  {opp.payout}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Testimonials */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
              What Our Traders Say
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Real stories from real BlockExchange users
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah K.",
                role: "🥇 superVIP Trader",
                avatar: "S",
                avatarColor: "#0A84FF",
                text: "I've been trading on BlockExchange for 3 months. The 120s trades give me the best returns — I turned $100 into $150 in just 2 minutes!",
                profit: "+$2,450",
              },
              {
                name: "Ahmed R.",
                role: "🥈 VIP-2 Trader",
                avatar: "A",
                avatarColor: "#30D158",
                text: "The referral program is amazing. I invited 12 friends and earned $360 in referral bonuses alone. Plus my trades are winning consistently.",
                profit: "+$1,830",
              },
              {
                name: "Maria L.",
                role: "💎 Prime_Diamond",
                avatar: "M",
                avatarColor: "#BF5AF2",
                text: "As a Prime Diamond member, I get the best payouts and priority support. The live chart patterns help me make winning trades every day.",
                profit: "+$5,120",
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bx-glass rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: t.avatarColor }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                  <div className="ml-auto text-sm font-bold" style={{ color: "#30D158" }}>
                    {t.profit}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-sm" style={{ color: "#FFD60A" }}>★</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomeView;
