"use client";

/**
 * BlockExchange admin — Wallet Management section.
 *
 * UI-only (mock data) — covers:
 *  - 3 top summary cards (Total Platform Balance / Pending Deposits / Pending Withdrawals)
 *  - Pending Deposits table (Approve/Reject)
 *  - Pending Withdrawals table (Approve/Reject/Freeze)
 *  - Adjust Balance form (Select user, amount, Credit/Debit, reason)
 *  - Transaction History mini table
 *  - "Freeze All Withdrawals" master toggle
 */

import { useState } from "react";
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Snowflake,
  Check,
  X,
  Save,
  History,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SectionHeader,
  SectionShell,
  StatCard,
  StatusBadge,
  fmtDateShort,
  fmtMoney,
} from "./shared";

interface PendingTxn {
  id: string;
  user: string;
  email: string;
  amount: number;
  method: string;
  date: string;
}

const PENDING_DEPOSITS: PendingTxn[] = [
  { id: "dep_001", user: "Alice Carter", email: "alice@example.com", amount: 1500, method: "USDT-TRC20", date: "2026-07-08T10:22:00Z" },
  { id: "dep_002", user: "Marcus Lee", email: "marcus@example.com", amount: 750, method: "BTC", date: "2026-07-08T09:14:00Z" },
  { id: "dep_003", user: "Priya Sharma", email: "priya@example.com", amount: 3000, method: "Bank Wire", date: "2026-07-08T08:01:00Z" },
  { id: "dep_004", user: "Tom Becker", email: "tom@example.com", amount: 220, method: "Card", date: "2026-07-07T22:48:00Z" },
];

const PENDING_WITHDRAWALS: PendingTxn[] = [
  { id: "wd_101", user: "Hiro Tanaka", email: "hiro@example.com", amount: 4800, method: "USDT-ERC20", date: "2026-07-08T11:02:00Z" },
  { id: "wd_102", user: "Eva Novak", email: "eva@example.com", amount: 1250, method: "ETH", date: "2026-07-08T10:35:00Z" },
  { id: "wd_103", user: "Liam Walsh", email: "liam@example.com", amount: 950, method: "Bank Wire", date: "2026-07-08T07:50:00Z" },
  { id: "wd_104", user: "Zara Khan", email: "zara@example.com", amount: 5400, method: "USDT-TRC20", date: "2026-07-07T19:12:00Z" },
];

interface LedgerEntry {
  id: string;
  type: "Deposit" | "Withdraw" | "Trade Profit" | "Trade Loss" | "Bonus";
  user: string;
  amount: number;
  status: string;
  date: string;
}

const LEDGER: LedgerEntry[] = [
  { id: "tx_9001", type: "Deposit", user: "Alice Carter", amount: 1500, status: "APPROVED", date: "2026-07-07T14:22:00Z" },
  { id: "tx_9002", type: "Trade Profit", user: "Marcus Lee", amount: 240, status: "APPROVED", date: "2026-07-07T14:08:00Z" },
  { id: "tx_9003", type: "Withdraw", user: "Priya Sharma", amount: 800, status: "PENDING", date: "2026-07-07T12:40:00Z" },
  { id: "tx_9004", type: "Trade Loss", user: "Tom Becker", amount: -100, status: "APPROVED", date: "2026-07-07T11:15:00Z" },
  { id: "tx_9005", type: "Bonus", user: "Hiro Tanaka", amount: 50, status: "APPROVED", date: "2026-07-06T20:02:00Z" },
  { id: "tx_9006", type: "Withdraw", user: "Eva Novak", amount: 600, status: "REJECTED", date: "2026-07-06T18:48:00Z" },
];

const TYPE_COLORS: Record<LedgerEntry["type"], string> = {
  Deposit: "#00c853",
  Withdraw: "#f5a623",
  "Trade Profit": "#00c853",
  "Trade Loss": "#ff3b30",
  Bonus: "#c084fc",
};

const notifyAction = () => toast.info("Select an action from the controls above.");

export function AdminWallet() {
  const [freezeAll, setFreezeAll] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("alice@example.com");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [reason, setReason] = useState("");

  return (
    <SectionShell>
      <SectionHeader
        title="Wallet Management"
        description="Approve deposits/withdrawals, adjust user balances, and audit the platform ledger."
        icon={Wallet}
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bx-glass-soft">
            <Snowflake className={`w-3.5 h-3.5 ${freezeAll ? "text-[#ff3b30]" : "text-muted-foreground"}`} />
            <span className="text-xs text-muted-foreground">Freeze All Withdrawals</span>
            <Switch
              checked={freezeAll}
              onCheckedChange={(v) => {
                setFreezeAll(v);
                toast.info(`Withdrawals ${v ? "frozen globally" : "unfrozen"}`);
              }}
            />
          </div>
        }
      />

      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Wallet} label="Total Platform Balance" value="$2,840,512" accent="blue" delta={2.4} />
        <StatCard icon={ArrowDownToLine} label="Pending Deposits" value={`$${fmtMoney(PENDING_DEPOSITS.reduce((s, d) => s + d.amount, 0), 0)}`} accent="emerald" sublabel={`${PENDING_DEPOSITS.length} requests`} />
        <StatCard icon={ArrowUpFromLine} label="Pending Withdrawals" value={`$${fmtMoney(PENDING_WITHDRAWALS.reduce((s, w) => s + w.amount, 0), 0)}`} accent="red" sublabel={`${PENDING_WITHDRAWALS.length} requests`} />
      </div>

      {freezeAll && (
        <div className="bx-glass rounded-xl p-4 flex items-start gap-3 border-l-2 border-[#ff3b30]">
          <AlertTriangle className="w-5 h-5 text-[#ff3b30] mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Withdrawals are frozen globally</div>
            <div className="text-xs text-muted-foreground">No withdrawal requests will be processed until this is turned off.</div>
          </div>
        </div>
      )}

      {/* Pending deposits + withdrawals */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PendingTxnTable title="Pending Deposits" rows={PENDING_DEPOSITS} mode="deposit" />
        <PendingTxnTable title="Pending Withdrawals" rows={PENDING_WITHDRAWALS} mode="withdraw" />
      </div>

      {/* Adjust balance + transaction history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Adjust Balance */}
        <div className="bx-glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Adjust User Balance</h3>
          <p className="text-xs text-muted-foreground mb-4">Manually credit or debit a user account.</p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full bg-background/40">
                  <SelectValue placeholder="Select user…" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set([...PENDING_DEPOSITS, ...PENDING_WITHDRAWALS])).map((t) => (
                    <SelectItem key={t.id} value={t.email}>
                      {t.user} — {t.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (USDT)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Direction</Label>
                <div className="flex gap-2 h-9">
                  <button
                    type="button"
                    onClick={() => setDirection("credit")}
                    className={`flex-1 rounded-md text-xs font-medium border ${
                      direction === "credit"
                        ? "bg-[#00c853]/15 text-[#00c853] border-[#00c853]/40"
                        : "bg-background/40 text-muted-foreground border-white/10"
                    }`}
                  >
                    + Credit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("debit")}
                    className={`flex-1 rounded-md text-xs font-medium border ${
                      direction === "debit"
                        ? "bg-[#ff3b30]/15 text-[#ff3b30] border-[#ff3b30]/40"
                        : "bg-background/40 text-muted-foreground border-white/10"
                    }`}
                  >
                    − Debit
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason / Note</Label>
              <Textarea
                placeholder="e.g. Promotional credit, manual correction…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-background/40 min-h-[70px]"
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#2196F3] to-[#0D47A1] text-white"
              onClick={() => {
                if (!amount || Number.isNaN(Number(amount))) {
                  toast.error("Enter a valid amount");
                  return;
                }
                notifyAction();
                setAmount("");
                setReason("");
              }}
            >
              <Save className="w-4 h-4" />
              Apply Adjustment
            </Button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bx-glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <History className="w-4 h-4 text-[#0ea5ff]" />
            Transaction History
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Recent platform ledger entries</p>
          <div className="max-h-[330px] overflow-y-auto bx-scroll">
            <Table>
              <TableHeader className="sticky top-0 bg-[#0d162a]/95 backdrop-blur z-10">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs uppercase">Type</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">User</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">Amount</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LEDGER.map((e) => (
                  <TableRow key={e.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <Badge style={{ background: `${TYPE_COLORS[e.type]}22`, color: TYPE_COLORS[e.type], border: `1px solid ${TYPE_COLORS[e.type]}55` }}>
                        {e.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-white">{e.user}</TableCell>
                    <TableCell className={`text-sm font-medium tabular-nums ${e.amount > 0 ? "text-[#00c853]" : "text-[#ff3b30]"}`}>
                      {e.amount > 0 ? "+" : ""}${fmtMoney(e.amount, 2)}
                    </TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDateShort(e.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function PendingTxnTable({ title, rows, mode }: { title: string; rows: PendingTxn[]; mode: "deposit" | "withdraw" }) {
  return (
    <div className="bx-glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <Badge variant="secondary">{rows.length} pending</Badge>
      </div>
      <div className="max-h-[280px] overflow-y-auto bx-scroll">
        <Table>
          <TableHeader className="sticky top-0 bg-[#0d162a]/95 backdrop-blur z-10">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs uppercase">User</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase">Amount</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase">Method</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase">Date</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className="border-white/5 hover:bg-white/[0.02]">
                <TableCell>
                  <div className="text-sm text-white truncate max-w-[120px]">{r.user}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[120px]">{r.email}</div>
                </TableCell>
                <TableCell className="text-sm font-medium tabular-nums text-[#00c853]">${fmtMoney(r.amount, 2)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.method}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDateShort(r.date)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[#00c853] hover:bg-[#00c853]/10 hover:text-[#00c853]"
                      onClick={notifyAction}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[#ff3b30] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
                      onClick={notifyAction}
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                    {mode === "withdraw" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[#f5a623] hover:bg-[#f5a623]/10 hover:text-[#f5a623]"
                        onClick={notifyAction}
                      >
                        <Snowflake className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
