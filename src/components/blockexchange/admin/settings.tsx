"use client";

/**
 * BlockExchange admin — Settings section.
 *
 * UI-only. Sectioned form: General / Trading / Maintenance / SEO / SMTP / SMS / API Keys.
 * All Save actions surface a "" toast.
 */

import { useState } from "react";
import {
  Settings as SettingsIcon,
  Upload,
  Palette,
  CandlestickChart,
  Wrench,
  Search,
  Mail,
  MessageSquare,
  KeyRound,
  Plus,
  Trash2,
  Save,
  TestTube,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "./shared";

const notifyAction = () => toast.info(" settings not persisted");

const COLORS = ["#0ea5ff", "#2196f3", "#00c853", "#c084fc", "#f5a623", "#ff3b30"];

interface ApiKey {
  id: string;
  label: string;
  key: string;
  created: string;
}

const INITIAL_KEYS: ApiKey[] = [
  { id: "k1", label: "Production Web", key: "bx_live_••••••••••••••••••••3Q8z", created: "2026-05-12" },
  { id: "k2", label: "Mobile App", key: "bx_live_••••••••••••••••••••k9Pm", created: "2026-06-01" },
  { id: "k3", label: "Partner Integration", key: "bx_live_••••••••••••••••••••wZ2v", created: "2026-06-22" },
];

export function AdminSettings() {
  const [siteName, setSiteName] = useState("BlockExchange");
  const [heroTitle, setHeroTitle] = useState("Trade • Invest • Grow");
  const [heroSubtitle, setHeroSubtitle] = useState("Lightning-fast crypto binary options with up to 50% returns in 120s.");
  const [accent, setAccent] = useState("#0ea5ff");

  const [p30, setP30] = useState("20");
  const [p60, setP60] = useState("30");
  const [p120, setP120] = useState("50");
  const [tradeTimer, setTradeTimer] = useState("60");
  const [minTrade, setMinTrade] = useState("10");
  const [maxTrade, setMaxTrade] = useState("10000");

  const [maintenance, setMaintenance] = useState(false);
  const [maintMsg, setMaintMsg] = useState("We're performing scheduled maintenance. Please check back shortly.");

  const [metaTitle, setMetaTitle] = useState("BlockExchange — Crypto Trading Platform");
  const [metaDesc, setMetaDesc] = useState("Trade crypto binary options with up to 50% returns in 120s.");
  const [metaKeywords, setMetaKeywords] = useState("crypto, bitcoin, trading, binary options, ethereum");

  const [smtpHost, setSmtpHost] = useState("smtp.sendgrid.net");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("apikey");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("no-reply@blockexchange.io");

  const [smsProvider, setSmsProvider] = useState("twilio");
  const [smsKey, setSmsKey] = useState("");
  const [smsSender, setSmsSender] = useState("BLOCKX");

  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);

  return (
    <SectionShell>
      <SectionHeader
        title="Settings"
        description="Configure general, trading, maintenance, SEO, SMTP, SMS, and API keys."
        icon={SettingsIcon}
      />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-background/40 flex-wrap h-auto">
          <TabsTrigger value="general"><Palette className="w-3.5 h-3.5" />General</TabsTrigger>
          <TabsTrigger value="trading"><CandlestickChart className="w-3.5 h-3.5" />Trading</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="w-3.5 h-3.5" />Maintenance</TabsTrigger>
          <TabsTrigger value="seo"><Search className="w-3.5 h-3.5" />SEO</TabsTrigger>
          <TabsTrigger value="smtp"><Mail className="w-3.5 h-3.5" />SMTP</TabsTrigger>
          <TabsTrigger value="sms"><MessageSquare className="w-3.5 h-3.5" />SMS</TabsTrigger>
          <TabsTrigger value="api"><KeyRound className="w-3.5 h-3.5" />API Keys</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <div className="bx-glass rounded-xl p-5 space-y-4 max-w-2xl">
            <div>
              <h3 className="text-sm font-semibold text-white">General</h3>
              <p className="text-xs text-muted-foreground">Site branding and homepage content.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bx-blue-gradient flex items-center justify-center text-white font-bold text-2xl">B</div>
              <Button variant="outline" size="sm" onClick={notifyAction}>
                <Upload className="w-4 h-4" />
                Upload Logo
              </Button>
            </div>
            <Field label="Site Name">
              <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="bg-background/40" />
            </Field>
            <Field label="Theme Color">
              <div className="flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setAccent(c); notifyAction(); }}
                    className={`w-8 h-8 rounded-full transition-all ${accent === c ? "ring-2 ring-offset-2 ring-offset-[#0d162a]" : ""}`}
                    style={{ background: c, boxShadow: accent === c ? `0 0 0 2px ${c}` : "none" }}
                    aria-label={`Theme ${c}`}
                  />
                ))}
              </div>
            </Field>
            <Field label="Homepage Hero Title">
              <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className="bg-background/40" />
            </Field>
            <Field label="Homepage Hero Subtitle">
              <Textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} className="bg-background/40 min-h-[60px]" />
            </Field>
            <SaveButton onClick={notifyAction} />
          </div>
        </TabsContent>

        {/* Trading */}
        <TabsContent value="trading">
          <div className="bx-glass rounded-xl p-5 space-y-4 max-w-2xl">
            <div>
              <h3 className="text-sm font-semibold text-white">Trading Configuration</h3>
              <p className="text-xs text-muted-foreground">Payout rates, trade timer, and amount limits.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="30s Payout %">
                <Input value={p30} onChange={(e) => setP30(e.target.value)} className="bg-background/40" />
              </Field>
              <Field label="60s Payout %">
                <Input value={p60} onChange={(e) => setP60(e.target.value)} className="bg-background/40" />
              </Field>
              <Field label="120s Payout %">
                <Input value={p120} onChange={(e) => setP120(e.target.value)} className="bg-background/40" />
              </Field>
            </div>
            <Field label="Default Trading Timer">
              <Select value={tradeTimer} onValueChange={setTradeTimer}>
                <SelectTrigger className="w-full bg-background/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="120">120 seconds</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min Trade Amount (USDT)">
                <Input type="number" value={minTrade} onChange={(e) => setMinTrade(e.target.value)} className="bg-background/40" />
              </Field>
              <Field label="Max Trade Amount (USDT)">
                <Input type="number" value={maxTrade} onChange={(e) => setMaxTrade(e.target.value)} className="bg-background/40" />
              </Field>
            </div>
            <SaveButton onClick={notifyAction} />
          </div>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance">
          <div className="bx-glass rounded-xl p-5 space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Maintenance Mode</h3>
                <p className="text-xs text-muted-foreground">Pause the platform for users with a custom banner.</p>
              </div>
              <Switch checked={maintenance} onCheckedChange={(v) => { setMaintenance(v); notifyAction(); }} />
            </div>
            <Field label="Maintenance Message">
              <Textarea value={maintMsg} onChange={(e) => setMaintMsg(e.target.value)} className="bg-background/40 min-h-[80px]" />
            </Field>
            <SaveButton onClick={notifyAction} />
          </div>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <div className="bx-glass rounded-xl p-5 space-y-4 max-w-2xl">
            <div>
              <h3 className="text-sm font-semibold text-white">SEO</h3>
              <p className="text-xs text-muted-foreground">Meta tags for search engine indexing.</p>
            </div>
            <Field label="Meta Title">
              <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="bg-background/40" />
            </Field>
            <Field label="Meta Description">
              <Textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} className="bg-background/40 min-h-[60px]" />
            </Field>
            <Field label="Meta Keywords (comma-separated)">
              <Input value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} className="bg-background/40" />
            </Field>
            <SaveButton onClick={notifyAction} />
          </div>
        </TabsContent>

        {/* SMTP */}
        <TabsContent value="smtp">
          <div className="bx-glass rounded-xl p-5 space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">SMTP</h3>
                <p className="text-xs text-muted-foreground">Email server configuration.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.info(" test email not sent")}>
                <TestTube className="w-4 h-4" />
                Send Test Email
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="SMTP Host">
                <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="bg-background/40" />
              </Field>
              <Field label="Port">
                <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="bg-background/40" />
              </Field>
              <Field label="Username">
                <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="bg-background/40" />
              </Field>
              <Field label="Password">
                <Input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="••••••••" className="bg-background/40" />
              </Field>
            </div>
            <Field label="From Email">
              <Input value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} className="bg-background/40" />
            </Field>
            <SaveButton onClick={notifyAction} />
          </div>
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms">
          <div className="bx-glass rounded-xl p-5 space-y-4 max-w-2xl">
            <div>
              <h3 className="text-sm font-semibold text-white">SMS Provider</h3>
              <p className="text-xs text-muted-foreground">2FA & notification SMS gateway.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Provider">
                <Select value={smsProvider} onValueChange={setSmsProvider}>
                  <SelectTrigger className="w-full bg-background/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="vonage">Vonage</SelectItem>
                    <SelectItem value="aws_sns">AWS SNS</SelectItem>
                    <SelectItem value="messagebird">MessageBird</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Sender ID">
                <Input value={smsSender} onChange={(e) => setSmsSender(e.target.value)} className="bg-background/40" />
              </Field>
            </div>
            <Field label="API Key">
              <Input type="password" value={smsKey} onChange={(e) => setSmsKey(e.target.value)} placeholder="••••••••" className="bg-background/40" />
            </Field>
            <SaveButton onClick={notifyAction} />
          </div>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api">
          <div className="bx-glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">API Keys</h3>
                <p className="text-xs text-muted-foreground">Manage keys for third-party integrations.</p>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#2196F3] to-[#0D47A1] text-white"
                onClick={() => {
                  setKeys((ks) => [
                    {
                      id: `k${Date.now()}`,
                      label: "New Key",
                      key: `bx_live_${Math.random().toString(36).slice(2, 10)}${"•".repeat(16)}`,
                      created: new Date().toISOString().slice(0, 10),
                    },
                    ...ks,
                  ]);
                  notifyAction();
                }}
              >
                <Plus className="w-4 h-4" />
                Generate New Key
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs uppercase">Label</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">Key</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">Created</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="text-sm font-medium text-white">{k.label}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{k.key}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{k.created}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[#ff3b30] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
                        onClick={() => {
                          setKeys((ks) => ks.filter((x) => x.id !== k.id));
                          notifyAction();
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {keys.length === 0 && (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                      No API keys. Generate one above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-3">
              <Badge variant="secondary">Tip: rotate keys every 90 days</Badge>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </SectionShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function SaveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button className="bg-gradient-to-r from-[#2196F3] to-[#0D47A1] text-white" onClick={onClick}>
      <Save className="w-4 h-4" />
      Save Changes
    </Button>
  );
}
