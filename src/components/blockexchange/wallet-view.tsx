"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, TrendingUp, Wallet as WalletIcon, CreditCard, Settings as SettingsIcon,
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, History, Eye, EyeOff,
  Home as HomeIcon, User, Snowflake, Loader2, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-store";
import { COINS, formatPrice, type Coin } from "@/lib/market-data";
import { ALL_PAYMENT_METHODS } from "@/lib/fiat-countries";
import { Toaster as SonnerToaster, toast } from "sonner";

interface Overview {
  totalAssetValue: number; availableBalance: number; frozenFunds: number; creditBalance: number;
  totalProfitGenerated: number; fundsInTrading: number; pendingDeposits: number; pendingWithdrawals: number;
  totalEarnings: number; walletLocked: boolean; accountStatus: string; tradingCycleStatus: string; lastUpdated: string;
}

/** Live price simulation for the coins list (24h change %). */
function useLivePrices() {
  const [prices, setPrices] = useState<{ price: number; change: number; sparkline: number[] }[]>(
    COINS.map((c) => ({ price: c.basePrice, change: (Math.random() - 0.45) * 12, sparkline: Array.from({ length: 12 }, () => c.basePrice * (0.97 + Math.random() * 0.06)) }))
  );
  useEffect(() => {
    const t = setInterval(() => {
      setPrices((prev) => prev.map((p, i) => {
        const coin = COINS[i];
        const delta = (Math.random() - 0.5) * coin.basePrice * 0.002;
        const newPrice = Math.max(p.price + delta, coin.basePrice * 0.5);
        const newSpark = [...p.sparkline.slice(1), newPrice];
        const change = ((newPrice - newSpark[0]) / newSpark[0]) * 100;
        return { price: newPrice, change, sparkline: newSpark };
      }));
    }, 2500);
    return () => clearInterval(t);
  }, []);
  return prices;
}

// iPhone-style theme tokens — matches Profile/Settings views
const T = {
  bg: "#000000",              // pure black
  card: "#1C1C1E",            // iOS system gray 6
  border: "#38383A",          // iOS separator
  accent: "#0A84FF",          // iOS system blue
  accentLight: "#0A84FF",
  gradientFrom: "#0A84FF",    // iOS blue gradient
  gradientTo: "#0D47A1",      // deep blue
  positive: "#30D158",        // iOS system green
  negative: "#FF453A",        // iOS system red
  text: "#FFFFFF",
  textSec: "#8E8E93",         // iOS tertiary label
  textDim: "#48484A",
};

export function WalletView() {
  const { user, navigate } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "deposit" | "withdraw" | "transfer">(null);
  const [hideBalance, setHideBalance] = useState(false);
  const prices = useLivePrices();

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [ovRes, txRes] = await Promise.all([
        fetch("/api/wallet", { headers: { "x-user-id": user.id } }),
        fetch("/api/wallet/transactions", { headers: { "x-user-id": user.id } }),
      ]);
      const ov = await ovRes.json();
      const tx = await txRes.json();
      if (ov.overview) setOverview(ov.overview);
      setDeposits(tx.deposits || []); setWithdrawals(tx.withdrawals || []);
      setLogs(tx.walletLogs || []); setTrades(tx.trades || []);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (!user) {
    return <main className="flex-1 pt-20 flex items-center justify-center"><Button onClick={() => navigate("login")}>Please login</Button></main>;
  }

  // Build "Your Assets" list — coins sorted by market value
  const totalBalance = overview?.availableBalance ?? 0;
  const holdings = COINS.map((coin, i) => {
    const weight = [0.25, 0.18, 0.10, 0.08, 0.05, 0.03, 0.02, 0.02, 0.01, 0.01][i] || 0.01;
    const qty = (totalBalance * 0.6 * weight) / prices[i].price;
    const value = qty * prices[i].price;
    return { coin, qty, value, price: prices[i].price, change: prices[i].change, sparkline: prices[i].sparkline };
  }).filter((h) => h.value > 0.01).sort((a, b) => b.value - a.value);

  const totalHoldingsValue = holdings.reduce((s, h) => s + h.value, 0);
  const btcEquivalent = totalBalance / 67420.55; // approx BTC price
  const fmtMoney = (v: number) => hideBalance ? "••••••" : `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <>
      <SonnerToaster richColors position="top-center" />
      <main className="flex-1 pt-14 pb-24" style={{ background: T.bg, minHeight: "100vh" }}>
        <div className="mx-auto w-full max-w-[430px] px-4">

          {/* ===== HERO HEADER (navy → purple gradient) ===== */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden p-6 mb-4"
            style={{ background: `linear-gradient(135deg, ${T.gradientFrom} 0%, ${T.gradientTo} 100%)` }}
          >
            {/* Glow orbs */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(156,39,176,0.3), transparent 70%)" }} />

            {/* User row */}
            <div className="relative flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white font-bold text-lg border border-white/20">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{user.name}</div>
                  <div className="text-white/60 text-[11px] font-mono">{user.uid}</div>
                </div>
              </div>
              <button
                onClick={() => setHideBalance((v) => !v)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Toggle balance"
              >
                {hideBalance ? <EyeOff className="w-4 h-4 text-white/70" /> : <Eye className="w-4 h-4 text-white/70" />}
              </button>
            </div>

            {/* Total Balance */}
            <div className="relative">
              <div className="text-white/70 text-xs font-medium uppercase tracking-wider">Total Balance</div>
              <div className="text-white text-4xl font-bold mt-1 tabular-nums">
                {fmtMoney(overview?.totalAssetValue ?? 0)}
              </div>
              <div className="text-white/50 text-xs mt-1">
                ≈ {hideBalance ? "•••" : btcEquivalent.toFixed(4)} BTC
              </div>
              {/* Profit indicator */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,230,118,0.15)" }}>
                <TrendingUp className="w-3 h-3" style={{ color: T.positive }} />
                <span className="text-xs font-medium" style={{ color: T.positive }}>
                  {hideBalance ? "•••" : `+${(overview?.totalProfitGenerated ?? 0).toFixed(2)} USDT`}
                </span>
              </div>
            </div>
          </motion.div>

          {/* ===== ACTION BUTTONS ROW (5 buttons) ===== */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-5 gap-2 mb-5"
          >
            <ActionButton icon={Plus} label="Add" color={T.positive} onClick={() => setModal("deposit")} disabled={overview?.walletLocked} />
            <ActionButton icon={ArrowUpFromLine} label="Trade" color={T.accentLight} onClick={() => navigate("trade")} />
            <ActionButton icon={WalletIcon} label="Wallet" color="#2196f3" onClick={() => document.getElementById("history")?.scrollIntoView({ behavior: "smooth" })} />
            <ActionButton icon={CreditCard} label="Deposit" color="#FF9F0A" onClick={() => navigate("deposit")} />
            <ActionButton icon={SettingsIcon} label="Settings" color={T.textSec} onClick={() => navigate("settings")} />
          </motion.div>

          {/* ===== ASSETS SUMMARY (Frozen / Available / In Trading) ===== */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-2 mb-5"
          >
            <SummaryCard label="Available" value={fmtMoney(overview?.availableBalance ?? 0)} accent={T.positive} />
            <SummaryCard label="Frozen" value={fmtMoney(overview?.frozenFunds ?? 0)} accent={T.negative} icon={Snowflake} />
            <SummaryCard label="In Trading" value={fmtMoney(overview?.fundsInTrading ?? 0)} accent="#f5a623" />
          </motion.div>

          {/* ===== YOUR ASSETS — coins list with sparklines ===== */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl p-4 mb-5"
            style={{ background: T.card, border: `1px solid ${T.border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: T.text }}>Your Assets</h3>
              <span className="text-[10px]" style={{ color: T.textDim }}>By Market Value</span>
            </div>

            {loading ? (
              <div className="py-8 text-center" style={{ color: T.textSec }}><Loader2 className="w-5 h-5 animate-spin inline" /></div>
            ) : holdings.length === 0 || totalBalance === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm mb-3" style={{ color: T.textSec }}>No assets yet. Add funds to start.</p>
                <Button size="sm" className="text-white" style={{ background: T.accent }} onClick={() => setModal("deposit")}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Funds
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {holdings.map((h, i) => (
                  <CoinRow key={h.coin.symbol} holding={h} hideBalance={hideBalance} delay={i * 0.03} />
                ))}
              </div>
            )}
          </motion.div>

          {/* ===== NFT + STAKING CARDS ===== */}
          {!loading && holdings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-3 mb-5"
            >
              <PromoCard
                title="NFT"
                desc="Claim your NFT"
                buttonText="Claim"
                gradient="linear-gradient(135deg, #6a1b9a, #28006b)"
                icon={Sparkles}
              />
              <PromoCard
                title="Staking"
                desc="Earn passive income"
                buttonText="Stake"
                gradient="linear-gradient(135deg, #00838f, #004d40)"
                icon={TrendingUp}
              />
            </motion.div>
          )}

          {/* ===== QUICK ACTIONS (Withdraw / Transfer / History) ===== */}
          {!loading && holdings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-3 gap-2 mb-5"
            >
              <ActionButton icon={ArrowUpFromLine} label="Withdraw" color={T.negative} onClick={() => setModal("withdraw")} disabled={overview?.walletLocked} />
              <ActionButton icon={ArrowLeftRight} label="Transfer" color="#2196f3" onClick={() => setModal("transfer")} disabled={overview?.walletLocked} />
              <ActionButton icon={History} label="History" color={T.accentLight} onClick={() => document.getElementById("history")?.scrollIntoView({ behavior: "smooth" })} />
            </motion.div>
          )}

          {/* ===== TRANSACTION HISTORY ===== */}
          <motion.div
            id="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-4"
            style={{ background: T.card, border: `1px solid ${T.border}` }}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: T.text }}>Transaction History</h3>
            <Tabs defaultValue="all">
              <TabsList className="mb-3 flex flex-wrap h-auto gap-1">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="deposits" className="text-xs">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawals" className="text-xs">Withdrawals</TabsTrigger>
                <TabsTrigger value="trades" className="text-xs">Trades</TabsTrigger>
              </TabsList>
              <TabsContent value="all"><LogList logs={logs} loading={loading} hideBalance={hideBalance} /></TabsContent>
              <TabsContent value="deposits"><TxList items={deposits} type="deposit" loading={loading} hideBalance={hideBalance} /></TabsContent>
              <TabsContent value="withdrawals"><TxList items={withdrawals} type="withdraw" loading={loading} hideBalance={hideBalance} /></TabsContent>
              <TabsContent value="trades"><TxList items={trades} type="trade" loading={loading} hideBalance={hideBalance} /></TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {/* Bottom Tab Navigation */}
        <BottomTabBar active="wallet" navigate={navigate} />
      </main>

      {/* Modals */}
      <DepositModal open={modal === "deposit"} onClose={() => setModal(null)} onDone={load} userId={user.id} />
      <WithdrawModal open={modal === "withdraw"} onClose={() => setModal(null)} onDone={load} userId={user.id} balance={overview?.availableBalance ?? 0} />
      <TransferModal open={modal === "transfer"} onClose={() => setModal(null)} onDone={load} userId={user.id} balance={overview?.availableBalance ?? 0} />
    </>
  );
}

/* ===== Sub-components ===== */

function ActionButton({ icon: Icon, label, color, onClick, disabled }: any) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex flex-col items-center gap-1.5 disabled:opacity-40">
      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <span className="text-[10px]" style={{ color: T.textSec }}>{label}</span>
    </button>
  );
}

function SummaryCard({ label, value, accent, icon: Icon }: any) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      {Icon && <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: accent }} />}
      <div className="text-sm font-bold tabular-nums" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] mt-0.5" style={{ color: T.textSec }}>{label}</div>
    </div>
  );
}

function CoinRow({ holding, hideBalance, delay }: { holding: { coin: Coin; qty: number; value: number; price: number; change: number; sparkline: number[] }; hideBalance: boolean; delay: number }) {
  const up = holding.change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors"
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: holding.coin.color }}>
        {holding.coin.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: T.text }}>{holding.coin.name}</div>
        <div className="text-[11px]" style={{ color: T.textSec }}>{holding.coin.symbol} · {formatPrice(holding.price, holding.coin.pair)}</div>
      </div>
      {/* Sparkline */}
      <div className="w-14 h-7 shrink-0">
        <Sparkline data={holding.sparkline} color={up ? T.positive : T.negative} />
      </div>
      {/* Value + change */}
      <div className="text-right shrink-0 min-w-[70px]">
        <div className="text-sm font-semibold tabular-nums" style={{ color: T.text }}>
          {hideBalance ? "••••" : `$${holding.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        </div>
        <div className="text-[11px] font-medium" style={{ color: up ? T.positive : T.negative }}>
          {up ? "+" : ""}{holding.change.toFixed(2)}%
        </div>
      </div>
    </motion.div>
  );
}

function PromoCard({ title, desc, buttonText, gradient, icon: Icon }: any) {
  return (
    <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: gradient }}>
      <Icon className="w-6 h-6 text-white/80 mb-2" />
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="text-[11px] text-white/70 mb-3">{desc}</div>
      <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "rgba(255,255,255,0.15)" }}>
        {buttonText}
      </button>
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${20 - ((v - min) / range) * 18}`).join(" ");
  return (
    <svg width="100%" height="28" viewBox="0 0 100 20" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogList({ logs, loading, hideBalance }: any) {
  if (loading) return <div className="py-6 text-center" style={{ color: T.textSec }}><Loader2 className="w-4 h-4 animate-spin inline" /></div>;
  if (!logs.length) return <div className="py-6 text-center text-sm" style={{ color: T.textSec }}>No transactions yet</div>;
  return (
    <div className="max-h-72 overflow-y-auto space-y-1.5">
      {logs.slice(0, 20).map((l: any) => (
        <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0`} style={{ background: l.amount >= 0 ? "rgba(0,230,118,0.1)" : "rgba(255,82,82,0.1)" }}>
              {l.amount >= 0 ? <ArrowDownToLine className="w-3.5 h-3.5" style={{ color: T.positive }} /> : <ArrowUpFromLine className="w-3.5 h-3.5" style={{ color: T.negative }} />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: T.text }}>{l.type.replace(/_/g, " ")}</div>
              <div className="text-[10px]" style={{ color: T.textSec }}>{new Date(l.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          <div className="text-xs font-semibold tabular-nums" style={{ color: l.amount >= 0 ? T.positive : T.negative }}>
            {hideBalance ? "•••" : `${l.amount >= 0 ? "+" : ""}${l.amount.toFixed(2)}`}
          </div>
        </div>
      ))}
    </div>
  );
}

function TxList({ items, type, loading, hideBalance }: any) {
  if (loading) return <div className="py-6 text-center" style={{ color: T.textSec }}><Loader2 className="w-4 h-4 animate-spin inline" /></div>;
  if (!items.length) return <div className="py-6 text-center text-sm" style={{ color: T.textSec }}>No {type}s yet</div>;
  return (
    <div className="max-h-72 overflow-y-auto space-y-1.5">
      {items.slice(0, 20).map((r: any) => (
        <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: T.text }}>{r.method || r.symbol || r.reference || r.type}</div>
            <div className="text-[10px]" style={{ color: T.textSec }}>{new Date(r.createdAt).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px]">{r.status || r.result}</Badge>
            <span className="text-xs font-semibold tabular-nums" style={{ color: T.text }}>{hideBalance ? "•••" : r.amount}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== Bottom Tab Bar ===== */
function BottomTabBar({ active, navigate }: { active: string; navigate: (v: any) => void }) {
  const tabs = [
    { key: "home", label: "Home", icon: HomeIcon, view: "home" },
    { key: "trade", label: "Trade", icon: TrendingUp, view: "trade" },
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
              <tab.icon className="w-5 h-5" style={{ color: isActive ? T.accentLight : T.textDim }} />
              <span className="text-[10px] font-medium" style={{ color: isActive ? T.accentLight : T.textDim }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== Modals ===== */
function DepositModal({ open, onClose, onDone, userId }: any) {
  const [amount, setAmount] = useState(""); const [method, setMethod] = useState("USDT"); const [reference, setReference] = useState(""); const [loading, setLoading] = useState(false);
  async function submit() {
    const amt = Number(amount); if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setLoading(true);
    try { const res = await fetch("/api/wallet/deposit", { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": userId }, body: JSON.stringify({ amount: amt, method, reference }) }); const d = await res.json(); if (!res.ok) { toast.error(d.error); return; } toast.success("Deposit request submitted — pending approval"); setAmount(""); setReference(""); onClose(); onDone(); } finally { setLoading(false); }
  }
  const ALL_METHODS = ["USDT","BTC","ETH","BNB","TRX","BANK","CARD","WIRE","SEPA","UPI","IMPS","NEFT","RTGS","BKASH","NAGAD","ROCKET","JAZZCASH","EASYPASA","PAYNOW","PAYID","DUITNOW","PROMPTPAY","PIX","SPEI","INTERAC","FPS","EFT","MADA","KNET","ALIPAY","WECHAT","KAKAO","DANA","OVO","GOPAY","GCASH","MAYA","MOMO","ESewA","KHALTI"];
  return <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent className="bx-glass max-w-sm"><DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5" style={{ color: T.positive }} /> Add Funds</DialogTitle><DialogDescription>Submit a deposit request for admin approval.</DialogDescription></DialogHeader><div className="space-y-3"><div><Label>Amount (USDT)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" /></div><div><Label>Payment Method</Label><Select value={method} onValueChange={setMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="max-h-60">{ALL_METHODS.map((m) => <SelectItem key={m} value={m}>{ALL_PAYMENT_METHODS[m] || m}</SelectItem>)}</SelectContent></Select></div><div><Label>Reference / Txn ID</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} /></div><Button onClick={submit} disabled={loading} className="w-full text-white" style={{ background: `linear-gradient(135deg, ${T.positive}, #00c853)` }}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}</Button></div></DialogContent></Dialog>;
}
function WithdrawModal({ open, onClose, onDone, userId, balance }: any) {
  const [amount, setAmount] = useState(""); const [method, setMethod] = useState("USDT"); const [destination, setDestination] = useState(""); const [loading, setLoading] = useState(false);
  async function submit() {
    const amt = Number(amount); if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; } if (amt > balance) { toast.error("Insufficient balance"); return; }
    setLoading(true);
    try { const res = await fetch("/api/wallet/withdraw", { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": userId }, body: JSON.stringify({ amount: amt, method, destination }) }); const d = await res.json(); if (!res.ok) { toast.error(d.error); return; } toast.success("Withdrawal request submitted"); setAmount(""); setDestination(""); onClose(); onDone(); } finally { setLoading(false); }
  }
  const ALL_METHODS = ["USDT","BTC","ETH","BNB","TRX","BANK","CARD","WIRE","SEPA","UPI","IMPS","NEFT","RTGS","BKASH","NAGAD","ROCKET","JAZZCASH","EASYPASA","PAYNOW","PAYID","DUITNOW","PROMPTPAY","PIX","SPEI","INTERAC","FPS","EFT","MADA","KNET","ALIPAY","WECHAT","KAKAO","DANA","OVO","GOPAY","GCASH","MAYA","MOMO","ESewA","KHALTI"];
  return <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent className="bx-glass max-w-sm"><DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpFromLine className="w-5 h-5" style={{ color: T.negative }} /> Withdraw Funds</DialogTitle><DialogDescription>Available: {balance.toLocaleString()} USDT</DialogDescription></DialogHeader><div className="space-y-3"><div><Label>Amount (USDT)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div><div><Label>Withdrawal Method</Label><Select value={method} onValueChange={setMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="max-h-60">{ALL_METHODS.map((m) => <SelectItem key={m} value={m}>{ALL_PAYMENT_METHODS[m] || m}</SelectItem>)}</SelectContent></Select></div><div><Label>Destination (wallet address / bank account / mobile number)</Label><Input value={destination} onChange={(e) => setDestination(e.target.value)} /></div><Button onClick={submit} disabled={loading} className="w-full text-white" style={{ background: `linear-gradient(135deg, ${T.negative}, #d32f2f)` }}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}</Button></div></DialogContent></Dialog>;
}
function TransferModal({ open, onClose, onDone, userId, balance }: any) {
  const [recipientEmail, setRecipientEmail] = useState(""); const [amount, setAmount] = useState(""); const [note, setNote] = useState(""); const [loading, setLoading] = useState(false);
  async function submit() {
    const amt = Number(amount); if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; } if (amt > balance) { toast.error("Insufficient balance"); return; } if (!recipientEmail) { toast.error("Recipient email required"); return; }
    setLoading(true);
    try { const res = await fetch("/api/wallet/transfer", { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": userId }, body: JSON.stringify({ recipientEmail, amount: amt, note }) }); const d = await res.json(); if (!res.ok) { toast.error(d.error); return; } toast.success(`Transferred ${amt} USDT`); setAmount(""); setRecipientEmail(""); setNote(""); onClose(); onDone(); } finally { setLoading(false); }
  }
  return <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent className="bx-glass max-w-sm"><DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="w-5 h-5" style={{ color: "#2196f3" }} /> Transfer Funds</DialogTitle><DialogDescription>Available: {balance.toLocaleString()} USDT</DialogDescription></DialogHeader><div className="space-y-3"><div><Label>Recipient Email</Label><Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} /></div><div><Label>Amount (USDT)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div><div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div><Button onClick={submit} disabled={loading} className="w-full text-white" style={{ background: "linear-gradient(135deg, #2196f3, #0d47a1)" }}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transfer"}</Button></div></DialogContent></Dialog>;
}
