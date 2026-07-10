"use client";

/**
 * BlockExchange admin — Trade Management section.
 *
 * Fetches real data from GET /api/admin/trades.
 * Filter row (All / Active / Settled / Pending), a scrollable trades table
 * with per-row admin actions, a live-trades mini panel with progress bars,
 * and a trading-pairs config card (Switch + profit % inputs).
 */

import { useEffect, useMemo, useState } from "react";
import {
  CandlestickChart,
  CheckCircle2,
  XCircle,
  Timer,
  Ban,
  MoreHorizontal,
  Coins,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DirectionBadge,
  ResultBadge,
  RowSkeleton,
  SectionHeader,
  SectionShell,
  StatusBadge,
  type AdminTrade,
  fmtDate,
  fmtMoney,
  shortId,
} from "./shared";
import { COINS, TRADE_OPTIONS } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface TradesProps {
  userId: string;
  syncTick: number;
}

type FilterTab = "all" | "active" | "settled" | "pending";

const FILTERS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All Trades" },
  { id: "active", label: "Active" },
  { id: "settled", label: "Settled" },
  { id: "pending", label: "Pending" },
];

export function AdminTrades({ userId, syncTick }: TradesProps) {
  const [trades, setTrades] = useState<AdminTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [enabledCoins, setEnabledCoins] = useState<Record<string, boolean>>(
    Object.fromEntries(COINS.map((c) => [c.symbol, true]))
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/trades", { headers: { "x-user-id": userId } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ trades: AdminTrade[] }>;
      })
      .then((data) => !cancelled && setTrades(data.trades))
      .catch((err) => toast.error("Failed to load trades", { description: String(err) }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId, syncTick]);

  const filtered = useMemo(() => {
    if (filter === "all") return trades;
    if (filter === "active") return trades.filter((t) => t.status === "ACTIVE");
    if (filter === "settled") return trades.filter((t) => t.status === "SETTLED");
    if (filter === "pending") return trades.filter((t) => t.result === "PENDING");
    return trades;
  }, [trades, filter]);

  const activeTrades = useMemo(() => trades.filter((t) => t.status === "ACTIVE"), [trades]);

  const notifyAction = () => toast.info("Select an action from the menu to proceed.");

  return (
    <SectionShell>
      <SectionHeader
        title="Trade Management"
        description="Monitor live trades, force settle outcomes, and configure trading pairs."
        icon={CandlestickChart}
      />

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              filter === f.id
                ? "bx-glass text-white ring-1 ring-[#0ea5ff]/40"
                : "bx-glass-soft text-muted-foreground hover:text-white"
            )}
          >
            {f.label}
            <span className="ml-2 text-[10px] opacity-70">
              {f.id === "all"
                ? trades.length
                : f.id === "active"
                ? trades.filter((t) => t.status === "ACTIVE").length
                : f.id === "settled"
                ? trades.filter((t) => t.status === "SETTLED").length
                : trades.filter((t) => t.result === "PENDING").length}
            </span>
          </button>
        ))}
      </div>

      {/* Trades table */}
      <div className="bx-glass rounded-xl overflow-hidden">
        <div className="max-h-[460px] overflow-y-auto bx-scroll">
          <Table>
            <TableHeader className="sticky top-0 bg-[#0d162a]/95 backdrop-blur z-10">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider px-4">ID</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">User</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Symbol</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Dir</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Dur</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Amount</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Entry</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Exit</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Result</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Profit</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Time</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-right px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`sk-${i}`} className="border-white/5">
                    <TableCell colSpan={13}><RowSkeleton cols={7} /></TableCell>
                  </TableRow>
                ))}
              {!loading && filtered.length === 0 && (
                <TableRow className="border-white/5">
                  <TableCell colSpan={13} className="text-center text-sm text-muted-foreground py-10">
                    No trades match this filter.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                filtered.slice(0, 50).map((t) => (
                  <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="px-4 font-mono text-xs text-muted-foreground">{shortId(t.id)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-white truncate max-w-[140px]">{t.user?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[140px]">{t.user?.email ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{t.symbol}</TableCell>
                    <TableCell><DirectionBadge direction={t.direction} /></TableCell>
                    <TableCell className="text-sm tabular-nums">{t.duration}s</TableCell>
                    <TableCell className="text-sm tabular-nums">${fmtMoney(t.amount, 2)}</TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">{fmtMoney(t.entryPrice, 2)}</TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {t.exitPrice != null ? fmtMoney(t.exitPrice, 2) : "—"}
                    </TableCell>
                    <TableCell><ResultBadge result={t.result} /></TableCell>
                    <TableCell className={cn("text-sm font-medium tabular-nums", t.profit > 0 ? "text-[#00c853]" : t.profit < 0 ? "text-[#ff3b30]" : "text-muted-foreground")}>
                      {t.profit > 0 ? "+" : ""}{fmtMoney(t.profit, 2)}
                    </TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(t.createdAt)}</TableCell>
                    <TableCell className="px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={notifyAction}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00c853]" />
                            Force Win
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={notifyAction}>
                            <XCircle className="w-3.5 h-3.5 text-[#ff3b30]" />
                            Force Lose
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={notifyAction} variant="destructive">
                            <Ban className="w-3.5 h-3.5" />
                            Cancel Trade
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Live + config grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live trades */}
        <div className="bx-glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#0ea5ff]" />
                Live Trades
              </h3>
              <p className="text-xs text-muted-foreground">{activeTrades.length} active position(s)</p>
            </div>
            <Badge className="bg-[#0ea5ff]/15 text-[#0ea5ff] border-[#0ea5ff]/30">LIVE</Badge>
          </div>
          <div className="space-y-3 max-h-[260px] overflow-y-auto bx-scroll">
            {activeTrades.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">No active trades right now.</div>
            )}
            {activeTrades.slice(0, 6).map((t) => {
              const total = t.duration;
              const elapsed = Math.min(
                total,
                Math.max(0, Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 1000))
              );
              const remaining = total - elapsed;
              const pct = (elapsed / total) * 100;
              return (
                <div key={t.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <DirectionBadge direction={t.direction} />
                      <span className="text-white font-medium">{t.symbol}</span>
                      <span className="text-muted-foreground">{t.user?.name ?? "—"}</span>
                    </div>
                    <span className="text-muted-foreground tabular-nums">{remaining}s left</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Trading pairs config */}
        <div className="bx-glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#0ea5ff]" />
                Trading Pairs Configuration
              </h3>
              <p className="text-xs text-muted-foreground">Enable/disable pairs + payout rates</p>
            </div>
            <Badge variant="secondary">{COINS.length} pairs</Badge>
          </div>

          {/* Payout rates */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {TRADE_OPTIONS.map((o) => (
              <div key={o.duration} className="bx-glass-soft rounded-lg p-3">
                <Label className="text-xs text-muted-foreground">{o.duration}s payout</Label>
                <Input
                  defaultValue={`${Math.round(o.payoutRate * 100)}%`}
                  className="mt-1 h-8 text-sm font-medium bg-background/40"
                />
              </div>
            ))}
          </div>

          {/* Coin switches */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto bx-scroll pr-1">
            {COINS.map((c) => (
              <div key={c.symbol} className="flex items-center justify-between px-3 py-2 rounded-lg bx-glass-soft">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
                    style={{ background: `${c.color}22`, color: c.color }}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{c.symbol}</div>
                    <div className="text-[10px] text-muted-foreground">{c.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {enabledCoins[c.symbol] ? "Enabled" : "Disabled"}
                  </span>
                  <Switch
                    checked={enabledCoins[c.symbol]}
                    onCheckedChange={(v) => {
                      setEnabledCoins((s) => ({ ...s, [c.symbol]: v }));
                      toast.info(`${c.symbol} ${v ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full mt-4 bg-gradient-to-r from-[#2196F3] to-[#0D47A1] text-white" onClick={notifyAction}>
            <Save className="w-4 h-4" />
            Save Trading Configuration
          </Button>
        </div>
      </div>
    </SectionShell>
  );
}
