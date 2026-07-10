"use client";

/**
 * BlockExchange admin — Security section.
 *
 * UI-only. Cards: 2FA, Admin Roles, Permissions matrix, IP Whitelist,
 * Audit Logs.
 */

import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  UserCog,
  Network,
  ScrollText,
  Plus,
  Trash2,
  Copy,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  StatusBadge,
  fmtDate,
} from "./shared";

const notifyAction = () => toast.info("Select an action to proceed");

const RECOVERY_CODES = [
  "BX7-A9K2-PQ3M",
  "BX7-5T8W-XZ1N",
  "BX7-L0R6-VB4Y",
  "BX7-C2H9-FJ7D",
  "BX7-Q4E3-MS8K",
  "BX7-N8U1-PT2W",
];

interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Moderator" | "Support";
  lastLogin: string;
  status: string;
}

const ADMINS: AdminAccount[] = [
  { id: "a1", name: "Satoshi Nakamoto", email: "staff@blockexchange.buzz", role: "Super Admin", lastLogin: "2026-07-08T11:42:00Z", status: "ACTIVE" },
  { id: "a2", name: "Vitalik Buterin", email: "vitalik@blockexchange.io", role: "Admin", lastLogin: "2026-07-07T18:30:00Z", status: "ACTIVE" },
  { id: "a3", name: "CZ Zhao", email: "cz@blockexchange.io", role: "Moderator", lastLogin: "2026-07-05T09:12:00Z", status: "ACTIVE" },
  { id: "a4", name: "Brian Armstrong", email: "brian@blockexchange.io", role: "Support", lastLogin: "2026-06-30T22:01:00Z", status: "FROZEN" },
];

const PERMISSIONS = ["View Users", "Edit Users", "Approve Withdrawals", "Manage Markets", "View Reports", "Edit Settings"];
const ROLE_PERMS: Record<AdminAccount["role"], boolean[]> = {
  "Super Admin": [true, true, true, true, true, true],
  Admin: [true, true, true, true, true, false],
  Moderator: [true, false, true, false, true, false],
  Support: [true, false, false, false, false, false],
};

const INITIAL_IPS = ["203.0.113.42", "198.51.100.10", "192.0.2.7"];

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  ip: string;
  timestamp: string;
}

const AUDIT: AuditEntry[] = [
  { id: "log_01", action: "Approved withdrawal $4,800", user: "staff@blockexchange.buzz", ip: "203.0.113.42", timestamp: "2026-07-08T11:42:00Z" },
  { id: "log_02", action: "Froze user eva@example.com", user: "cz@blockexchange.io", ip: "198.51.100.10", timestamp: "2026-07-08T10:35:00Z" },
  { id: "log_03", action: "Updated trading config (BTC payout 30s)", user: "staff@blockexchange.buzz", ip: "203.0.113.42", timestamp: "2026-07-08T09:14:00Z" },
  { id: "log_04", action: "Login successful", user: "vitalik@blockexchange.io", ip: "203.0.113.42", timestamp: "2026-07-07T18:30:00Z" },
  { id: "log_05", action: "Reset password for alice@example.com", user: "staff@blockexchange.buzz", ip: "203.0.113.42", timestamp: "2026-07-07T15:22:00Z" },
  { id: "log_06", action: "Failed login attempt (3x)", user: "unknown@example.com", ip: "45.83.221.99", timestamp: "2026-07-07T08:01:00Z" },
];

export function AdminSecurity() {
  const [twoFA, setTwoFA] = useState(true);
  const [ips, setIps] = useState<string[]>(INITIAL_IPS);
  const [newIp, setNewIp] = useState("");
  const [showCodes, setShowCodes] = useState(false);

  return (
    <SectionShell>
      <SectionHeader
        title="Security"
        description="Two-factor auth, admin roles, permissions, IP whitelist, and audit logs."
        icon={ShieldCheck}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 2FA card */}
        <div className="bx-glass rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#00c853]/15 text-[#00c853] ring-1 ring-[#00c853]/30 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Two-Factor Authentication</h3>
                <p className="text-xs text-muted-foreground">Require TOTP for all admin logins.</p>
              </div>
            </div>
            <Switch checked={twoFA} onCheckedChange={(v) => { setTwoFA(v); notifyAction(); }} />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Recovery codes</Label>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-white" onClick={() => setShowCodes((s) => !s)}>
                <Eye className="w-3.5 h-3.5" />
                {showCodes ? "Hide" : "Reveal"}
              </Button>
            </div>
            <div className={`grid grid-cols-3 gap-2 font-mono text-xs ${showCodes ? "" : "blur-sm select-none"}`}>
              {RECOVERY_CODES.map((c) => (
                <div key={c} className="bx-glass-soft rounded-md px-2 py-1.5 text-center text-[#0ea5ff]">{c}</div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(RECOVERY_CODES.join("\n")); toast.success("Recovery codes copied"); }}>
                <Copy className="w-3.5 h-3.5" />
                Copy All
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-white" onClick={notifyAction}>
                <KeyRound className="w-3.5 h-3.5" />
                Regenerate Codes
              </Button>
            </div>
          </div>
        </div>

        {/* IP whitelist */}
        <div className="bx-glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#0ea5ff]/15 text-[#0ea5ff] ring-1 ring-[#0ea5ff]/30 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">IP Whitelist</h3>
              <p className="text-xs text-muted-foreground">Only these IPs may access the admin panel.</p>
            </div>
          </div>
          <div className="space-y-2 mb-3">
            {ips.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">No IPs whitelisted — admin panel open to any IP.</div>
            )}
            {ips.map((ip) => (
              <div key={ip} className="flex items-center justify-between px-3 py-2 rounded-lg bx-glass-soft">
                <span className="text-sm font-mono text-white">{ip}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-[#ff3b30] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
                  onClick={() => {
                    setIps((l) => l.filter((x) => x !== ip));
                    notifyAction();
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. 203.0.113.50"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              className="bg-background/40"
            />
            <Button
              variant="outline"
              onClick={() => {
                if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(newIp.trim())) {
                  toast.error("Enter a valid IPv4 address");
                  return;
                }
                setIps((l) => [...l, newIp.trim()]);
                setNewIp("");
                notifyAction();
              }}
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Admin roles table */}
      <div className="bx-glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#c084fc]/15 text-[#c084fc] ring-1 ring-[#c084fc]/30 flex items-center justify-center">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Admin Roles</h3>
              <p className="text-xs text-muted-foreground">Team members with admin access.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={notifyAction}>
            <Plus className="w-4 h-4" />
            Add Admin
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs uppercase">Admin</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase">Role</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase">Last Login</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase">Status</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ADMINS.map((a) => (
              <TableRow key={a.id} className="border-white/5 hover:bg-white/[0.02]">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bx-blue-gradient flex items-center justify-center text-xs font-bold text-white">
                      {a.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={
                    a.role === "Super Admin" ? "bg-[#ff3b30]/15 text-[#ff3b30] border-[#ff3b30]/30"
                    : a.role === "Admin" ? "bg-[#0ea5ff]/15 text-[#0ea5ff] border-[#0ea5ff]/30"
                    : a.role === "Moderator" ? "bg-[#c084fc]/15 text-[#c084fc] border-[#c084fc]/30"
                    : "bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/30"
                  }>
                    {a.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDate(a.lastLogin)}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-[#0ea5ff]" onClick={notifyAction}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Permissions matrix */}
      <div className="bx-glass rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#f5a623]/15 text-[#f5a623] ring-1 ring-[#f5a623]/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Permissions Matrix</h3>
            <p className="text-xs text-muted-foreground">Visual map of role capabilities (read-only preview).</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs uppercase tracking-wider text-muted-foreground px-3 py-2">Permission</th>
                {(Object.keys(ROLE_PERMS) as AdminAccount["role"][]).map((r) => (
                  <th key={r} className="text-center text-xs uppercase tracking-wider text-muted-foreground px-3 py-2">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p, i) => (
                <tr key={p} className="border-b border-white/5">
                  <td className="px-3 py-2 text-white">{p}</td>
                  {(Object.keys(ROLE_PERMS) as AdminAccount["role"][]).map((r) => (
                    <td key={r} className="text-center px-3 py-2">
                      <Checkbox checked={ROLE_PERMS[r][i]} onCheckedChange={() => {}} className="mx-auto" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit logs */}
      <div className="bx-glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0ea5ff]/15 text-[#0ea5ff] ring-1 ring-[#0ea5ff]/30 flex items-center justify-center">
              <ScrollText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Audit Logs</h3>
              <p className="text-xs text-muted-foreground">Recent admin actions on the platform.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={notifyAction}>
            <ScrollText className="w-4 h-4" />
            View Full Logs
          </Button>
        </div>
        <div className="max-h-[300px] overflow-y-auto bx-scroll">
          <Table>
            <TableHeader className="sticky top-0 bg-[#0d162a]/95 backdrop-blur z-10">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs uppercase">Action</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase">User</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase">IP</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AUDIT.map((l) => (
                <TableRow key={l.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="text-sm text-white">{l.action}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.user}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{l.ip}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(l.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </SectionShell>
  );
}
