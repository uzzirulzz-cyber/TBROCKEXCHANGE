"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowUp, ArrowDown, ChevronDown, Loader2, CheckCircle2, XCircle,
  Clock, TrendingUp, TrendingDown, Activity, Timer, Home, Wallet as WalletIcon,
  User, Settings, Search, MoreHorizontal, ArrowUpDown, Coins, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-store";
import {
  COINS, TRADE_OPTIONS, QUICK_AMOUNTS, formatPrice,
  getInitialCandles, tickCandle, nextCandle, type Coin, type Candle,
} from "@/lib/market-data";
import { Toaster as SonnerToaster, toast } from "sonner";

// Exact Dribbble theme colors
const T = {
  bg: "#121212",
  card: "#1E1E1E",
  cardLight: "#252525",
  border: "#2A2A2A",
  accent: "#FF8C00",
  accentSoft: "rgba(255,140,0,0.12)",
  positive: "#00FF00",
  positiveSoft: "rgba(0,255,0,0.1)",
  negative: "#FF3B30",
  negativeSoft: "rgba(255,59,48,0.1)",
  text: "#FFFFFF",
  textSec: "#B0B0B0",
  textDim: "#707070",
};

type Step = "market" | "setup" | "result";

interface ActiveTrade {
  id: string; symbol: string; direction: "UP" | "DOWN"; duration: number;
  amount: number; entryPrice: number; payoutRate: number; remaining: number; expiresAt: number;
}
interface SettledTrade {
  result: "WIN" | "LOSE"; profit: number; entryPrice: number; exitPrice: number;
  amount: number; direction: "UP" | "DOWN"; symbol: string; duration: number;
}
interface RecentTrade {
  id: string; symbol: string; direction: string; amount: number; profit: number; result: string; duration: number; createdAt: string;
}

export function TradeView() {
  const { user, navigate, setUser, updateBalance } = useAuth();
  const [step, setStep] = useState<Step>("market");
  const [selectedCoin, setSelectedCoin] = useState<Coin>(COINS[0]);
  const [direction, setDirection] = useState<"UP" | "DOWN">("UP");
  const [duration, setDuration] = useState<number>(60);
  const [amount, setAmount] = useState<string>("50");
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null);
  const [settled, setSettled] = useState<SettledTrade | null>(null);
  const [settling, setSettling] = useState(false);
  const [recent, setRecent] = useState<RecentTrade[]>([]);
  const [placing, setPlacing] = useState(false);
  const [candles, setCandles] = useState<Candle[]>(() => getInitialCandles(COINS[0].pair, 40));
  const lastPrice = candles[candles.length - 1]?.close ?? selectedCoin.basePrice;
  const firstPrice = candles[0]?.close ?? selectedCoin.basePrice;
  const change24h = ((lastPrice - firstPrice) / firstPrice) * 100;

  useEffect(() => {
    const tick = setInterval(() => {
      setCandles((prev) => prev.length ? [...prev.slice(0, -1), tickCandle(prev[prev.length - 1], selectedCoin)] : prev);
    }, 2000);
    return () => clearInterval(tick);
  }, [selectedCoin]);

  useEffect(() => {
    const push = setInterval(() => {
      setCandles((prev) => prev.length ? [...prev.slice(1), nextCandle(prev[prev.length - 1], selectedCoin)] : prev);
    }, 60000);
    return () => clearInterval(push);
  }, [selectedCoin]);

  const selectCoin = useCallback((coin: Coin) => {
    setSelectedCoin(coin);
    setCandles(getInitialCandles(coin.pair, 40));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/trade/history", { headers: { "x-user-id": user.id } })
      .then((r) => r.json()).then((d) => {
        const trades = d.trades || [];
        setRecent(trades);
        // Check for any ACTIVE trade — resume countdown if found
        // (handles the case where user navigated away during an active trade)
        const active = trades.find((t: any) => t.status === "ACTIVE");
        if (active && !activeTrade && !settling) {
          const expiresAt = new Date(active.expiresAt).getTime();
          const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
          if (remaining > 0) {
            setActiveTrade({
              id: active.id,
              symbol: active.symbol,
              direction: active.direction,
              duration: active.duration,
              amount: Number(active.amount),
              entryPrice: Number(active.entryPrice),
              payoutRate: Number(active.payoutRate),
              remaining,
              expiresAt,
            });
            setStep("result");
          } else {
            // Trade already expired but not settled — settle it now
            settleActiveTradeById(active.id);
          }
        }
      }).catch(() => {});
  }, [user]);

  // Separate settle function that takes a tradeId (for resuming expired trades)
  const settleActiveTradeById = async (tradeId: string) => {
    if (!user || settling) return;
    setSettling(true);
    try {
      const res = await fetch("/api/trade/settle", {
        method: "POST", headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ tradeId }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        updateBalance(Number(data.user.balance));
      }
      setSettled({
        result: data.result || "LOSE", profit: data.profit || 0,
        entryPrice: Number(data.trade?.entryPrice || 0),
        exitPrice: Number(data.trade?.exitPrice || 0),
        amount: Number(data.trade?.amount || 0),
        direction: data.trade?.direction || "UP",
        symbol: data.trade?.symbol || "",
        duration: Number(data.trade?.duration || 0),
      });
      setStep("result");
      fetch("/api/trade/history", { headers: { "x-user-id": user.id } })
        .then((r) => r.json()).then((d) => setRecent(d.trades || []));
    } catch { toast.error("Settlement failed"); }
    setActiveTrade(null);
    setSettling(false);
  };

  useEffect(() => {
    if (!activeTrade) return;
    const t = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeTrade.expiresAt - Date.now()) / 1000));
      setActiveTrade((prev) => prev ? { ...prev, remaining } : null);
      if (remaining <= 0) settleActiveTrade();
    }, 1000);
    return () => clearInterval(t);
  }, [activeTrade]);

  const settleActiveTrade = async () => {
    if (!activeTrade || !user || settling) return;
    setSettling(true); // prevent double-settlement
    try {
      const res = await fetch("/api/trade/settle", {
        method: "POST", headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ tradeId: activeTrade.id }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        // Sync the auth-store balance so navbar + wallet stay fresh
        updateBalance(Number(data.user.balance));
      }
      setSettled({
        result: data.result || "LOSE", profit: data.profit || 0,
        entryPrice: activeTrade.entryPrice, exitPrice: data.trade?.exitPrice || activeTrade.entryPrice,
        amount: activeTrade.amount, direction: activeTrade.direction,
        symbol: activeTrade.symbol, duration: activeTrade.duration,
      });
      setStep("result");
      fetch("/api/trade/history", { headers: { "x-user-id": user.id } })
        .then((r) => r.json()).then((d) => setRecent(d.trades || []));
    } catch { toast.error("Settlement failed"); }
    setActiveTrade(null);
    setSettling(false);
  };

  const placeTrade = async () => {
    if (!user) { navigate("login"); return; }
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt > user.balance) { toast.error("Insufficient balance"); return; }
    setPlacing(true);
    try {
      const res = await fetch("/api/trade/execute", {
        method: "POST", headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ symbol: selectedCoin.pair, direction, duration, amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); return; }
      if (data.user) setUser(data.user);
      setActiveTrade({
        id: data.trade.id, symbol: data.trade.symbol, direction: data.trade.direction,
        duration: data.trade.duration, amount: data.trade.amount, entryPrice: data.trade.entryPrice,
        payoutRate: data.trade.payoutRate, remaining: data.trade.duration,
        expiresAt: Date.now() + data.trade.duration * 1000,
      });
      setStep("result");
      toast.success(`Trade placed — ${direction} ${selectedCoin.symbol} ${duration}s`);
    } catch { toast.error("Network error"); } finally { setPlacing(false); }
  };

  if (!user) {
    return <main className="flex-1 pt-20 flex items-center justify-center"><Button onClick={() => navigate("login")}>Please login</Button></main>;
  }

  return (
    <>
      <SonnerToaster richColors position="top-center" />
      <main className="flex-1 pt-14 pb-24" style={{ background: T.bg, minHeight: "100vh" }}>
        <div className="mx-auto w-full max-w-[430px] px-4">
          <AnimatePresence mode="wait">
            {step === "market" && (
              <motion.div key="market" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <MarketplaceStep coin={selectedCoin} onSelectCoin={selectCoin} candles={candles}
                  lastPrice={lastPrice} change24h={change24h} onTradeNow={() => setStep("setup")} user={user} />
              </motion.div>
            )}
            {step === "setup" && (
              <motion.div key="setup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SetupStep coin={selectedCoin} onSelectCoin={selectCoin} direction={direction} setDirection={setDirection}
                  duration={duration} setDuration={setDuration} amount={amount} setAmount={setAmount}
                  lastPrice={lastPrice} onBack={() => setStep("market")} onPlace={placeTrade} placing={placing} balance={user.balance} />
              </motion.div>
            )}
            {step === "result" && (
              <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ResultStep activeTrade={activeTrade} settled={settled} coin={selectedCoin}
                  onTradeAgain={() => { setSettled(null); setActiveTrade(null); setStep("setup"); }}
                  onBackToMarket={() => { setSettled(null); setActiveTrade(null); setStep("market"); }} recent={recent} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <BottomTabBar active="trade" navigate={navigate} />
      </main>
    </>
  );
}

/* ============ STEP 1: EXPLORE / MARKETPLACE (matches right screen of design) ============ */
function MarketplaceStep({ coin, onSelectCoin, candles, lastPrice, change24h, onTradeNow, user }: any) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"Coins" | "Tokens" | "Sites">("Coins");
  const up = change24h >= 0;
  const filtered = COINS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()));
  const watchlist = COINS.slice(0, 2); // BTC + ETH as watchlist

  return (
    <div>
      {/* Header — "Explore" */}
      <div className="flex items-center justify-between mb-5 pt-4">
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Explore</h1>
        <button className="p-2 rounded-lg" style={{ background: T.card }}>
          <MoreHorizontal className="w-5 h-5" style={{ color: T.textSec }} />
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.textDim }} />
        <input
          placeholder="Search coins, tokens, etc..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
        />
      </div>

      {/* Pinned tabs — Coins / Tokens / Sites (functional) */}
      <div className="flex gap-6 mb-5 border-b" style={{ borderColor: T.border }}>
        {(["Coins", "Tokens", "Sites"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="pb-3 text-sm font-medium relative transition-colors"
            style={{ color: activeTab === tab ? T.accent : T.textSec }}>
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: T.accent }} />}
          </button>
        ))}
      </div>

      {/* === COINS TAB === */}
      {activeTab === "Coins" && (
        <>
      <div className="mb-5">
        <h3 className="text-base font-semibold mb-3" style={{ color: T.text }}>Watchlist</h3>
        <div className="grid grid-cols-2 gap-3">
          {watchlist.map((c) => {
            const ch = (Math.random() - 0.4) * 8;
            return (
              <div key={c.symbol} className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: c.color }}>{c.icon}</div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: T.text }}>{c.name}</div>
                    <div className="text-[11px]" style={{ color: T.textSec }}>{c.symbol}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold mb-1" style={{ color: T.text }}>{formatPrice(c.basePrice, c.pair)}</div>
                <div className="text-xs flex items-center gap-1" style={{ color: ch >= 0 ? T.positive : T.negative }}>
                  {ch >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {ch >= 0 ? "+" : ""}{ch.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold" style={{ color: T.text }}>Trending coins</h3>
          <button className="text-xs" style={{ color: T.textSec }}>View all</button>
        </div>
        <div className="space-y-2">
          {COINS.map((c, i) => {
            const ch = (Math.random() - 0.4) * 10;
            return (
              <div key={c.symbol} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <span className="text-xs w-4" style={{ color: T.textDim }}>{i + 1}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: c.color }}>{c.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: T.text }}>{c.name}</div>
                  <div className="text-[11px]" style={{ color: T.textSec }}>{c.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm" style={{ color: T.text }}>{formatPrice(c.basePrice, c.pair)}</div>
                  <div className="text-[11px]" style={{ color: ch >= 0 ? T.positive : T.negative }}>{ch >= 0 ? "+" : ""}{ch.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
        </>
      )}

      {/* === TOKENS TAB === */}
      {activeTab === "Tokens" && (
        <div className="py-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3" style={{ background: T.accentSoft }}>
            <Coins className="w-7 h-7" style={{ color: T.accent }} />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ color: T.text }}>Token Listing Coming Soon</h3>
          <p className="text-sm mb-4" style={{ color: T.textSec }}>We're adding ERC-20, BEP-20, and SPL token support.</p>
          <button onClick={onTradeNow} className="px-5 py-2 rounded-lg text-sm font-medium text-white" style={{ background: T.accent }}>
            Trade Coins Instead
          </button>
        </div>
      )}

      {/* === SITES TAB === */}
      {activeTab === "Sites" && (
        <div className="space-y-3">
          <p className="text-sm mb-3" style={{ color: T.textSec }}>Trusted partner sites for trading and DeFi:</p>
          {[
            { name: "Brock Exchange DEX", desc: "Decentralized trading with 0.3% fees", icon: "\uD83D\uDD04" },
            { name: "Brock Staking Pool", desc: "Earn up to 12% APY on your crypto", icon: "\uD83D\uDC8E" },
            { name: "Brock NFT Marketplace", desc: "Mint, buy, and sell NFTs", icon: "\uD83C\uDFA8" },
            { name: "Brock Bridge", desc: "Cross-chain transfers at low fees", icon: "\uD83C\uDF09" },
          ].map((site) => (
            <button key={site.name}
              onClick={() => toast.info(site.name + " \u2014 coming soon!")}
              className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors hover:bg-white/5"
              style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: T.accentSoft }}>{site.icon}</div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium" style={{ color: T.text }}>{site.name}</div>
                <div className="text-xs" style={{ color: T.textSec }}>{site.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: T.textDim }} />
            </button>
          ))}
        </div>
      )}

      {/* Trade Now button — orange */}
      <button
        onClick={onTradeNow}
        className="w-full h-14 text-base font-bold rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90 mt-4"
        style={{ background: T.accent, color: "#fff" }}
      >
        Trade Now <ArrowUp className="w-4 h-4 rotate-90" />
      </button>
    </div>
  );
}

/* ============ STEP 2: SETUP (matches left "Swap coin" screen of design) ============ */
function SetupStep({ coin, onSelectCoin, direction, setDirection, duration, setDuration, amount, setAmount, lastPrice, onBack, onPlace, placing, balance }: any) {
  const [showDropdown, setShowDropdown] = useState(false);
  const amt = Number(amount) || 0;
  const option = TRADE_OPTIONS.find((o) => o.duration === duration) ?? TRADE_OPTIONS[0];
  const potentialProfit = amt * option.payoutRate;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pt-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg" style={{ background: T.card }}>
            <ArrowLeft className="w-5 h-5" style={{ color: T.text }} />
          </button>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Trade</h1>
        </div>
      </div>

      {/* Coin selector card */}
      <div className="rounded-xl p-4 mb-3" style={{ background: T.card, border: `1px solid ${T.border}` }}>
        <div className="text-xs mb-2" style={{ color: T.accent }}>Coin</div>
        <div className="relative">
          <button onClick={() => setShowDropdown((v) => !v)}
            className="w-full flex items-center justify-between p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: coin.color }}>{coin.icon}</div>
              <div className="text-left">
                <div className="text-sm font-semibold" style={{ color: T.text }}>{coin.name}</div>
                <div className="text-xs" style={{ color: T.textSec }}>{formatPrice(lastPrice, coin.pair)}</div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} style={{ color: T.textSec }} />
          </button>
          {showDropdown && (
            <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-xl shadow-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              {COINS.map((c) => (
                <button key={c.symbol} onClick={() => { onSelectCoin(c); setShowDropdown(false); }}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: c.color }}>{c.icon}</div>
                  <div className="flex-1"><div className="text-sm" style={{ color: T.text }}>{c.name}</div><div className="text-[11px]" style={{ color: T.textSec }}>{c.symbol}</div></div>
                  <div className="text-xs" style={{ color: T.textSec }}>{formatPrice(c.basePrice, c.pair)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Duration selector — styled like swap fields */}
      <div className="rounded-xl p-4 mb-3" style={{ background: T.card, border: `1px solid ${T.border}` }}>
        <div className="text-xs mb-3" style={{ color: T.accent }}>Duration</div>
        <div className="grid grid-cols-3 gap-2">
          {TRADE_OPTIONS.map((opt) => (
            <button key={opt.duration} onClick={() => setDuration(opt.duration)}
              className="p-3 rounded-xl border transition-all text-center"
              style={duration === opt.duration
                ? { background: T.accentSoft, border: `1px solid ${T.accent}` }
                : { background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}
            >
              <div className="text-lg font-bold" style={{ color: duration === opt.duration ? T.accent : T.text }}>{opt.duration}s</div>
              <div className="text-[10px] mt-0.5" style={{ color: T.textSec }}>{opt.payoutRate * 100}%</div>
            </button>
          ))}
        </div>
      </div>

      {/* Amount — styled like the "From" field in swap screen */}
      <div className="rounded-xl p-4 mb-3" style={{ background: T.card, border: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: T.accent }}>Amount</span>
          <span className="text-[11px]" style={{ color: T.textSec }}>Balance: {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
            className="flex-1 bg-transparent text-2xl font-bold outline-none"
            style={{ color: T.text }}
          />
          <span className="text-sm" style={{ color: T.textSec }}>USDT</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {QUICK_AMOUNTS.map((q) => (
            <button key={q} onClick={() => setAmount(String(q))}
              className="py-1.5 rounded-lg text-xs transition-colors hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, color: T.text }}
            >{q}</button>
          ))}
        </div>
      </div>

      {/* Trade details — like swap slippage/method rows */}
      <div className="rounded-xl p-4 mb-4 space-y-2.5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
        <DetailRow label="Payout Rate" value={`${option.payoutRate * 100}%`} />
        <DetailRow label="Potential Profit" value={`+${potentialProfit.toFixed(2)} USDT`} valueColor={T.positive} />
        <DetailRow label="Total Return" value={`${(amt + potentialProfit).toFixed(2)} USDT`} />
      </div>

      {/* Direction buttons — UP / DOWN */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={() => setDirection("UP")}
          className="flex flex-col items-center gap-1 py-5 rounded-xl border-2 transition-all"
          style={direction === "UP"
            ? { background: T.positiveSoft, border: `2px solid ${T.positive}` }
            : { background: T.card, border: `2px solid ${T.border}` }}
        >
          <ArrowUp className="w-7 h-7" style={{ color: direction === "UP" ? T.positive : T.textSec }} />
          <span className="text-sm font-bold" style={{ color: direction === "UP" ? T.positive : T.textSec }}>BUY UP</span>
          <span className="text-[10px]" style={{ color: T.textSec }}>Price goes up</span>
        </button>
        <button onClick={() => setDirection("DOWN")}
          className="flex flex-col items-center gap-1 py-5 rounded-xl border-2 transition-all"
          style={direction === "DOWN"
            ? { background: T.negativeSoft, border: `2px solid ${T.negative}` }
            : { background: T.card, border: `2px solid ${T.border}` }}
        >
          <ArrowDown className="w-7 h-7" style={{ color: direction === "DOWN" ? T.negative : T.textSec }} />
          <span className="text-sm font-bold" style={{ color: direction === "DOWN" ? T.negative : T.textSec }}>BUY DOWN</span>
          <span className="text-[10px]" style={{ color: T.textSec }}>Price goes down</span>
        </button>
      </div>

      {/* Place trade button — orange */}
      <button onClick={onPlace} disabled={placing}
        className="w-full h-14 text-base font-bold rounded-xl flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: T.accent, color: "#fff" }}
      >
        {placing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Place ${direction} Trade · ${duration}s`}
      </button>
    </div>
  );
}

/* ============ STEP 3: RESULT ============ */
function ResultStep({ activeTrade, settled, coin, onTradeAgain, onBackToMarket, recent }: any) {
  const isPending = !!activeTrade;
  const isWin = settled?.result === "WIN";
  return (
    <div>
      <div className="flex items-center gap-3 mb-5 pt-4">
        <button onClick={onBackToMarket} className="p-2 rounded-lg" style={{ background: T.card }}>
          <ArrowLeft className="w-5 h-5" style={{ color: T.text }} />
        </button>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>{isPending ? "Trade Active" : "Trade Result"}</h1>
      </div>

      {isPending ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl p-6 mb-4 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: T.accentSoft }}>
            <Clock className="w-8 h-8 animate-pulse" style={{ color: T.accent }} />
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ color: T.text }}>Trade Placed!</h2>
          <p className="text-sm mb-4" style={{ color: T.textSec }}>Waiting for settlement…</p>
          <div className="grid grid-cols-2 gap-3 text-left mb-4">
            <DetailBox label="Coin" value={activeTrade.symbol} />
            <DetailBox label="Direction" value={activeTrade.direction} valueColor={activeTrade.direction === "UP" ? T.positive : T.negative} />
            <DetailBox label="Amount" value={`${activeTrade.amount} USDT`} />
            <DetailBox label="Entry Price" value={formatPrice(activeTrade.entryPrice, "BTC/USDT")} />
            <DetailBox label="Duration" value={`${activeTrade.duration}s`} />
            <DetailBox label="Payout" value={`${activeTrade.payoutRate * 100}%`} />
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: T.textSec }}>Settles in</span>
              <span className="font-bold" style={{ color: T.accent }}>{activeTrade.remaining}s</span>
            </div>
            <Progress value={((activeTrade.duration - activeTrade.remaining) / activeTrade.duration) * 100} className="h-2" />
          </div>
        </motion.div>
      ) : settled && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl p-6 mb-4 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ background: isWin ? T.positiveSoft : T.negativeSoft }}>
            {isWin ? <CheckCircle2 className="w-10 h-10" style={{ color: T.positive }} /> : <XCircle className="w-10 h-10" style={{ color: T.negative }} />}
          </motion.div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: isWin ? T.positive : T.negative }}>
            {isWin ? "YOU WIN!" : "YOU LOSE"}
          </h2>
          <p className="text-sm mb-4" style={{ color: T.textSec }}>
            {isWin ? `+${settled.profit.toFixed(2)} USDT profit` : `${settled.profit.toFixed(2)} USDT loss`}
          </p>
          <div className="grid grid-cols-2 gap-3 text-left mb-4">
            <DetailBox label="Coin" value={settled.symbol} />
            <DetailBox label="Direction" value={settled.direction} valueColor={settled.direction === "UP" ? T.positive : T.negative} />
            <DetailBox label="Entry Price" value={formatPrice(settled.entryPrice, "BTC/USDT")} />
            <DetailBox label="Exit Price" value={formatPrice(settled.exitPrice, "BTC/USDT")} />
            <DetailBox label="Amount" value={`${settled.amount} USDT`} />
            <DetailBox label="Duration" value={`${settled.duration}s`} />
          </div>
          <div className="flex gap-2">
            <button onClick={onTradeAgain} className="flex-1 h-12 rounded-xl font-medium" style={{ background: T.accent, color: "#fff" }}>Trade Again</button>
            <button onClick={onBackToMarket} className="flex-1 h-12 rounded-xl font-medium" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.text }}>Marketplace</button>
          </div>
        </motion.div>
      )}

      {/* Recent trades */}
      {recent.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: T.text }}>
            <Activity className="w-4 h-4" style={{ color: T.accent }} /> Recent Trades
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {recent.slice(0, 8).map((t: RecentTrade) => (
              <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: t.direction === "UP" ? T.positiveSoft : T.negativeSoft }}>
                    {t.direction === "UP" ? <ArrowUp className="w-3.5 h-3.5" style={{ color: T.positive }} /> : <ArrowDown className="w-3.5 h-3.5" style={{ color: T.negative }} />}
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: T.text }}>{t.symbol}</div>
                    <div className="text-[10px]" style={{ color: T.textSec }}>{t.duration}s · {t.amount} USDT</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-[9px]">{t.result}</Badge>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: t.profit >= 0 ? T.positive : T.negative }}>{t.profit >= 0 ? "+" : ""}{t.profit.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Bottom Tab Bar ============ */
function BottomTabBar({ active, navigate }: { active: string; navigate: (v: any) => void }) {
  const tabs = [
    { key: "home", label: "Home", icon: Home, view: "home" },
    { key: "trade", label: "Trade", icon: Activity, view: "trade" },
    { key: "wallet", label: "Wallet", icon: WalletIcon, view: "wallet" },
    { key: "profile", label: "Profile", icon: User, view: "home" },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-[430px]" style={{ background: T.card, borderTop: `1px solid ${T.border}` }}>
      <div className="flex items-center justify-around py-2 pb-3">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button key={tab.key} onClick={() => navigate(tab.view as any)} className="flex flex-col items-center gap-1 py-1 px-3">
              <tab.icon className="w-5 h-5" style={{ color: isActive ? T.accent : T.textDim }} />
              <span className="text-[10px] font-medium" style={{ color: isActive ? T.accent : T.textDim }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============ Shared ============ */
function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: T.accent }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: valueColor || T.text }}>{value}</span>
    </div>
  );
}
function DetailBox({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
      <div className="text-[10px]" style={{ color: T.accent }}>{label}</div>
      <div className="text-sm font-semibold mt-0.5" style={{ color: valueColor || T.text }}>{value}</div>
    </div>
  );
}
