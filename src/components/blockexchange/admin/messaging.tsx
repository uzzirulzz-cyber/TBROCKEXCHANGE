"use client";

/**
 * BlockExchange admin — Messaging section.
 *
 * UI-only. 4 cards: Broadcast, Push Notification, Email Campaign, Popup
 * Announcement, plus a recent-messages log table.
 */

import { useState } from "react";
import {
  Megaphone,
  Send,
  Bell,
  Mail,
  Sparkles,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  StatusBadge,
  fmtDate,
} from "./shared";

interface LogEntry {
  id: string;
  type: "Broadcast" | "Push" | "Email" | "Popup";
  title: string;
  audience: string;
  sentAt: string;
  status: string;
}

const LOG: LogEntry[] = [
  { id: "msg_01", type: "Broadcast", title: "Scheduled maintenance — July 10", audience: "All Users", sentAt: "2026-07-07T15:00:00Z", status: "APPROVED" },
  { id: "msg_02", type: "Email", title: "Welcome to BlockExchange VIP", audience: "VIP Users", sentAt: "2026-07-06T12:30:00Z", status: "APPROVED" },
  { id: "msg_03", type: "Push", title: "BTC just broke $68k 🚀", audience: "All Users", sentAt: "2026-07-06T09:15:00Z", status: "APPROVED" },
  { id: "msg_04", type: "Popup", title: "Claim your 50 USDT bonus", audience: "New Users", sentAt: "2026-07-05T18:45:00Z", status: "PENDING" },
];

const notifyAction = () => toast.info(" message not actually delivered");

export function AdminMessaging() {
  const [broadcast, setBroadcast] = useState("");
  const [audience, setAudience] = useState("all");
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupDuration, setPopupDuration] = useState("24");

  return (
    <SectionShell>
      <SectionHeader
        title="Messaging"
        description="Send broadcasts, push notifications, email campaigns, and popup announcements."
        icon={Megaphone}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Broadcast */}
        <div className="bx-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#0ea5ff]/15 text-[#0ea5ff] ring-1 ring-[#0ea5ff]/30 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Broadcast Message</h3>
              <p className="text-xs text-muted-foreground">In-app banner shown to all matched users.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="w-full bg-background/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="users">Users only (non-admin)</SelectItem>
                  <SelectItem value="admins">Admins only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Message</Label>
              <Textarea
                value={broadcast}
                onChange={(e) => setBroadcast(e.target.value)}
                placeholder="Scheduled maintenance on July 10 from 02:00–04:00 UTC…"
                className="bg-background/40 min-h-[90px]"
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#2196F3] to-[#0D47A1] text-white"
              onClick={() => {
                if (!broadcast.trim()) return toast.error("Enter a message first");
                notifyAction();
                setBroadcast("");
              }}
            >
              <Send className="w-4 h-4" />
              Send Broadcast
            </Button>
          </div>
        </div>

        {/* Push notification */}
        <div className="bx-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#c084fc]/15 text-[#c084fc] ring-1 ring-[#c084fc]/30 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Push Notification</h3>
              <p className="text-xs text-muted-foreground">Web push to subscribed devices.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} placeholder="BTC just broke $68k 🚀" className="bg-background/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Body</Label>
              <Textarea value={pushBody} onChange={(e) => setPushBody(e.target.value)} placeholder="Tap to view the live chart…" className="bg-background/40 min-h-[70px]" />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#c084fc] to-[#7c3aed] text-white"
              onClick={() => {
                if (!pushTitle.trim()) return toast.error("Enter a title first");
                notifyAction();
                setPushTitle("");
                setPushBody("");
              }}
            >
              <Send className="w-4 h-4" />
              Send Push
            </Button>
          </div>
        </div>

        {/* Email campaign */}
        <div className="bx-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#00c853]/15 text-[#00c853] ring-1 ring-[#00c853]/30 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Email Campaign</h3>
              <p className="text-xs text-muted-foreground">Bulk email via SMTP.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Welcome to BlockExchange VIP" className="bg-background/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Body</Label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Hi {name}, your VIP status has been upgraded…" className="bg-background/40 min-h-[70px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Recipients</Label>
                <Select defaultValue="vip">
                  <SelectTrigger className="w-full bg-background/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="vip">VIP Users</SelectItem>
                    <SelectItem value="new">New Users (7d)</SelectItem>
                    <SelectItem value="inactive">Inactive (30d)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full bg-gradient-to-r from-[#00c853] to-[#008a3a] text-white"
                  onClick={() => {
                    if (!emailSubject.trim()) return toast.error("Enter a subject");
                    notifyAction();
                    setEmailSubject("");
                    setEmailBody("");
                  }}
                >
                  <Send className="w-4 h-4" />
                  Send Email
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Popup announcement */}
        <div className="bx-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#f5a623]/15 text-[#f5a623] ring-1 ring-[#f5a623]/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Popup Announcement</h3>
              <p className="text-xs text-muted-foreground">Modal popup shown on next page load.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={popupTitle} onChange={(e) => setPopupTitle(e.target.value)} placeholder="Claim your 50 USDT bonus" className="bg-background/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Message</Label>
              <Textarea value={popupMessage} onChange={(e) => setPopupMessage(e.target.value)} placeholder="Deposit at least 100 USDT to qualify…" className="bg-background/40 min-h-[60px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Display (hours)</Label>
                <Input type="number" value={popupDuration} onChange={(e) => setPopupDuration(e.target.value)} className="bg-background/40" />
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full bg-gradient-to-r from-[#f5a623] to-[#c87b00] text-white"
                  onClick={() => {
                    if (!popupTitle.trim()) return toast.error("Enter a title");
                    notifyAction();
                    setPopupTitle("");
                    setPopupMessage("");
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Publish Popup
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent messages log */}
      <div className="bx-glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-[#0ea5ff]" />
            Recent Messages
          </h3>
          <Badge variant="secondary">{LOG.length} entries</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs uppercase">Type</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase">Title</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase">Audience</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase">Sent</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LOG.map((l) => (
              <TableRow key={l.id} className="border-white/5 hover:bg-white/[0.02]">
                <TableCell>
                  <Badge variant="secondary">{l.type}</Badge>
                </TableCell>
                <TableCell className="text-sm text-white">{l.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{l.audience}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDate(l.sentAt)}</TableCell>
                <TableCell><StatusBadge status={l.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionShell>
  );
}
