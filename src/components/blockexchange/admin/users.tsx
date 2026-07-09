"use client";

/**
 * Brock Exchange admin — User Management section.
 *
 * Fetches real data from GET /api/admin/users.
 * Search by UID / email / name.
 * Real actions wired to PATCH /api/admin/wallet + POST /api/admin/notifications:
 *  - Freeze/Unfreeze Account
 *  - Add Balance / Deduct Balance
 *  - Freeze Funds / Unfreeze Funds
 *  - Send Notification
 *  - View Profile (modal)
 *  - View Trading History (modal)
 *  - View Login History (modal)
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Search, Users as UsersIcon, ShieldCheck, Snowflake, MoreHorizontal,
  Lock, KeyRound, History, BadgeCheck, Ban, RefreshCw, DollarSign,
  TrendingUp, TrendingDown, Bell, Eye, Loader2, Wallet, Mail, Phone,
  Globe, Calendar, User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  RowSkeleton, SectionHeader, SectionShell, StatusBadge,
  type AdminUser, fmtDateShort, fmtMoney,
} from "./shared";
import { getVipLabel, getVipColor } from "@/lib/utils";

interface UsersProps {
  userId: string;
  syncTick: number;
}

function chip(label: string, value: number, accent: string) {
  return (
    <div className="bx-glass-soft rounded-lg px-3 py-2 flex items-center gap-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums" style={{ color: accent }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

export function AdminUsers({ userId, syncTick }: UsersProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog state
  const [profileUser, setProfileUser] = useState<AdminUser | null>(null);
  const [balanceUser, setBalanceUser] = useState<AdminUser | null>(null);
  const [balanceMode, setBalanceMode] = useState<"credit" | "debit" | "freeze" | "unfreeze">("credit");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");
  const [notifUser, setNotifUser] = useState<AdminUser | null>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifType, setNotifType] = useState("info");
  const [historyUser, setHistoryUser] = useState<AdminUser | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyType, setHistoryType] = useState<"trades" | "logins">("trades");

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/admin/users", { headers: { "x-user-id": userId } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ users: AdminUser[] }>;
      })
      .then((data) => !cancelled && setUsers(data.users))
      .catch((err) => toast.error("Failed to load users", { description: String(err) }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [userId, syncTick]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.uid || "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const stats = useMemo(() => {
    const total = users.length;
    const frozen = users.filter((u) => u.frozen).length;
    const admins = users.filter((u) => u.role === "SUPER_ADMIN" || u.role === "admin").length;
    const active = total - frozen;
    return { total, active, frozen, admins };
  }, [users]);

  // ---- Real API actions ----
  async function callWalletApi(targetId: string, action: string, amount?: number, reason?: string) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ userId: targetId, action, amount: amount || 0, reason: reason || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Action failed");
        return false;
      }
      toast.success(`Action ${action} completed`);
      load();
      return true;
    } catch {
      toast.error("Network error");
      return false;
    } finally {
      setActionLoading(false);
    }
  }

  async function handleFreezeToggle(u: AdminUser) {
    const action = u.frozen ? "UNFREEZE_ACCOUNT" : "FREEZE_ACCOUNT";
    await callWalletApi(u.id, action);
  }

  async function handleBalanceSubmit() {
    if (!balanceUser) return;
    const amt = Number(balanceAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    // Map UI mode to API action name (API expects uppercase)
    const actionMap: Record<string, string> = {
      credit: "CREDIT",
      debit: "DEBIT",
      freeze: "FREEZE_FUNDS",
      unfreeze: "UNFREEZE_FUNDS",
    };
    const apiAction = actionMap[balanceMode] || balanceMode.toUpperCase();
    const ok = await callWalletApi(balanceUser.id, apiAction, amt, balanceReason);
    if (ok) {
      setBalanceUser(null);
      setBalanceAmount("");
      setBalanceReason("");
    }
  }

  async function handleNotifSubmit() {
    if (!notifUser) return;
    if (!notifTitle.trim() || !notifBody.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ userId: notifUser.id, title: notifTitle, body: notifBody, type: notifType }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send notification");
        return;
      }
      toast.success(`Notification sent to ${notifUser.name}`);
      setNotifUser(null);
      setNotifTitle("");
      setNotifBody("");
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
    }
  }

  async function viewHistory(u: AdminUser, type: "trades" | "logins") {
    setHistoryUser(u);
    setHistoryType(type);
    setHistoryLoading(true);
    setHistoryData([]);
    try {
      if (type === "trades") {
        const res = await fetch(`/api/admin/trades?userId=${u.id}`, { headers: { "x-user-id": userId } });
        const data = await res.json();
        setHistoryData(data.trades || []);
      } else {
        // Login history — query LoginLog via a direct fetch
        const res = await fetch(`/api/admin/users/${u.id}/logins`, { headers: { "x-user-id": userId } });
        if (res.ok) {
          const data = await res.json();
          setHistoryData(data.logs || []);
        } else {
          setHistoryData([]);
        }
      }
    } catch {
      toast.error("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <SectionShell>
      <SectionHeader
        title="User Management"
        description="Manage user accounts, balances, KYC status, and access controls."
        icon={UsersIcon}
      />

      {/* Stat chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {chip("Total Users", stats.total, "#0ea5ff")}
        {chip("Active", stats.active, "#00c853")}
        {chip("Frozen", stats.frozen, "#ff3b30")}
        {chip("Admins", stats.admins, "#c084fc")}
      </div>

      {/* Search */}
      <div className="bx-glass rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by UID, name, or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-background/40"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {filtered.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bx-glass rounded-xl overflow-hidden">
        <div className="max-h-[520px] overflow-y-auto bx-scroll">
          <Table>
            <TableHeader className="sticky top-0 bg-[#0d162a]/95 backdrop-blur z-10">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider px-4">User</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">UID</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Role</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">VIP</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Balance</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Trades</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-right px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`sk-${i}`} className="border-white/5">
                  <TableCell colSpan={8}><RowSkeleton cols={7} /></TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow className="border-white/5">
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.map((u) => (
                <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                        u.role === "SUPER_ADMIN" || u.role === "admin" ? "bx-blue-gradient text-white" : "bg-white/10 text-slate-200"
                      }`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate max-w-[180px]">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-[#0ea5ff]">{u.uid || "—"}</TableCell>
                  <TableCell>
                    {u.role === "SUPER_ADMIN" || u.role === "admin" ? (
                      <Badge className="bg-[#0ea5ff]/15 text-[#0ea5ff] border-[#0ea5ff]/30">
                        {u.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                      </Badge>
                    ) : u.role === "SUB_AGENT" ? (
                      <Badge className="bg-[#c084fc]/15 text-[#c084fc]">Agent</Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
                      style={{
                        background: `${getVipColor(u.vipLevel)}22`,
                        color: getVipColor(u.vipLevel),
                      }}
                    >
                      {getVipLabel(u.vipLevel)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium tabular-nums text-[#00c853]">
                    ${fmtMoney(u.balance, 2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">{u.tradesCount}</TableCell>
                  <TableCell>
                    {u.frozen ? <StatusBadge status="FROZEN" /> : <StatusBadge status="ACTIVE" />}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setProfileUser(u)}>
                          <Eye className="w-3.5 h-3.5" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => viewHistory(u, "trades")}>
                          <History className="w-3.5 h-3.5" /> Trading History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => viewHistory(u, "logins")}>
                          <KeyRound className="w-3.5 h-3.5" /> Login History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setBalanceUser(u); setBalanceMode("credit"); setBalanceAmount(""); setBalanceReason(""); }}>
                          <TrendingUp className="w-3.5 h-3.5 text-[#00c853]" /> Add Balance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setBalanceUser(u); setBalanceMode("debit"); setBalanceAmount(""); setBalanceReason(""); }}>
                          <TrendingDown className="w-3.5 h-3.5 text-[#ff3b30]" /> Deduct Balance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setBalanceUser(u); setBalanceMode("freeze"); setBalanceAmount(""); setBalanceReason(""); }}>
                          <Snowflake className="w-3.5 h-3.5 text-[#0ea5ff]" /> Freeze Funds
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setBalanceUser(u); setBalanceMode("unfreeze"); setBalanceAmount(""); setBalanceReason(""); }}>
                          <DollarSign className="w-3.5 h-3.5 text-[#00c853]" /> Unfreeze Funds
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setNotifUser(u)}>
                          <Bell className="w-3.5 h-3.5" /> Send Notification
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFreezeToggle(u)}>
                          {u.frozen ? (
                            <><ShieldCheck className="w-3.5 h-3.5 text-[#00c853]" /> Unfreeze Account</>
                          ) : (
                            <><Ban className="w-3.5 h-3.5 text-[#ff3b30]" /> Freeze Account</>
                          )}
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

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filtered.length} users</span>
        <Button variant="ghost" size="sm" onClick={() => toast.info("Export coming soon")} className="text-muted-foreground hover:text-white">
          <RefreshCw className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      {/* ===== Profile Dialog ===== */}
      <Dialog open={!!profileUser} onOpenChange={(v) => !v && setProfileUser(null)}>
        <DialogContent className="bg-[#0a1428] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>Complete account information</DialogDescription>
          </DialogHeader>
          {profileUser && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                <div className="w-14 h-14 rounded-full bx-blue-gradient flex items-center justify-center text-xl font-bold text-white">
                  {profileUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">{profileUser.name}</div>
                  <div className="text-sm text-muted-foreground">{profileUser.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "UID", value: profileUser.uid || "—", icon: UserIcon },
                  { label: "Role", value: profileUser.role, icon: ShieldCheck },
                  { label: "Balance", value: `$${fmtMoney(profileUser.balance, 2)}`, icon: Wallet },
                  { label: "Frozen Funds", value: `$${fmtMoney(profileUser.frozenFunds || 0, 2)}`, icon: Snowflake },
                  { label: "VIP Level", value: getVipLabel(profileUser.vipLevel), icon: BadgeCheck },
                  { label: "KYC Status", value: profileUser.kycStatus || "PENDING", icon: ShieldCheck },
                  { label: "Phone", value: profileUser.phone || "Not set", icon: Phone },
                  { label: "Country", value: profileUser.country || "Not set", icon: Globe },
                  { label: "Trades", value: String(profileUser.tradesCount), icon: TrendingUp },
                  { label: "Status", value: profileUser.frozen ? "FROZEN" : (profileUser.status || "ACTIVE"), icon: Lock },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02]">
                    <f.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">{f.label}</div>
                      <div className="text-white text-sm truncate">{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t border-white/5">
                Joined: {fmtDateShort(profileUser.createdAt)}
                {profileUser.lastLoginAt && ` · Last login: ${fmtDateShort(profileUser.lastLoginAt)}`}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Balance Adjust Dialog ===== */}
      <Dialog open={!!balanceUser} onOpenChange={(v) => !v && setBalanceUser(null)}>
        <DialogContent className="bg-[#0a1428] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>
              {balanceMode === "credit" && "Add Balance"}
              {balanceMode === "debit" && "Deduct Balance"}
              {balanceMode === "freeze" && "Freeze Funds"}
              {balanceMode === "unfreeze" && "Unfreeze Funds"}
            </DialogTitle>
            <DialogDescription>
              {balanceUser?.name} · Current balance: ${fmtMoney(balanceUser?.balance || 0, 2)}
              {balanceMode === "freeze" && ` · Frozen: $${fmtMoney(balanceUser?.frozenFunds || 0, 2)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Amount (USDT)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Reason / Note</Label>
              <Textarea
                placeholder="Enter a reason for this adjustment..."
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                rows={3}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBalanceUser(null)}>Cancel</Button>
            <Button
              onClick={handleBalanceSubmit}
              disabled={actionLoading}
              className={
                balanceMode === "credit" || balanceMode === "unfreeze"
                  ? "bg-gradient-to-r from-[#00c853] to-[#00a040] text-white"
                  : "bg-gradient-to-r from-[#ff3b30] to-[#c62828] text-white"
              }
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Send Notification Dialog ===== */}
      <Dialog open={!!notifUser} onOpenChange={(v) => !v && setNotifUser(null)}>
        <DialogContent className="bg-[#0a1428] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>Send a notification to {notifUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input
                placeholder="Notification title..."
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Message</Label>
              <Textarea
                placeholder="Notification body..."
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                rows={4}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={notifType} onValueChange={setNotifType}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1428] border-white/10">
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNotifUser(null)}>Cancel</Button>
            <Button onClick={handleNotifSubmit} disabled={actionLoading} className="bg-gradient-to-r from-[#2196F3] to-[#0D47A1] text-white">
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <Bell className="w-4 h-4 mr-2" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== History Dialog ===== */}
      <Dialog open={!!historyUser} onOpenChange={(v) => !v && setHistoryUser(null)}>
        <DialogContent className="bg-[#0a1428] border-white/10 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {historyType === "trades" ? "Trading History" : "Login History"} — {historyUser?.name}
            </DialogTitle>
            <DialogDescription>
              UID: {historyUser?.uid} · {historyUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bx-scroll">
            {historyLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading...
              </div>
            ) : historyData.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No {historyType === "trades" ? "trades" : "login records"} found.
              </div>
            ) : historyType === "trades" ? (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#0a1428] border-b border-white/5">
                  <tr className="text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-3 py-2">Symbol</th>
                    <th className="px-3 py-2">Dir</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">Profit</th>
                    <th className="px-3 py-2">Result</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((t: any) => (
                    <tr key={t.id} className="border-b border-white/5">
                      <td className="px-3 py-2 text-white">{t.symbol}</td>
                      <td className="px-3 py-2">
                        <Badge className={t.direction === "UP" ? "bg-[#00c853]/15 text-[#00c853]" : "bg-[#ff3b30]/15 text-[#ff3b30]"}>
                          {t.direction}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right text-white tabular-nums">{Number(t.amount).toFixed(2)}</td>
                      <td className={`px-3 py-2 text-right tabular-nums ${Number(t.profit) >= 0 ? "text-[#00c853]" : "text-[#ff3b30]"}`}>
                        {Number(t.profit) >= 0 ? "+" : ""}{Number(t.profit).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={
                          t.result === "WIN" ? "border-[#00c853]/30 text-[#00c853]" :
                          t.result === "LOSE" ? "border-[#ff3b30]/30 text-[#ff3b30]" :
                          "border-white/10 text-muted-foreground"
                        }>
                          {t.result}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#0a1428] border-b border-white/5">
                  <tr className="text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">IP</th>
                    <th className="px-3 py-2">Success</th>
                    <th className="px-3 py-2">Reason</th>
                    <th className="px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((l: any) => (
                    <tr key={l.id} className="border-b border-white/5">
                      <td className="px-3 py-2 text-white">{l.email}</td>
                      <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{l.ip || "—"}</td>
                      <td className="px-3 py-2">
                        <Badge className={l.success ? "bg-[#00c853]/15 text-[#00c853]" : "bg-[#ff3b30]/15 text-[#ff3b30]"}>
                          {l.success ? "Success" : "Failed"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{l.reason || "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}
