"use client";

/**
 * BlockExchange admin — Payments section.
 *
 * UI-only. Tabs for: Bank Accounts | Crypto Wallets | Cards | Gateways | Manual.
 */

import { useState } from "react";
import {
  CreditCard,
  Banknote,
  Bitcoin,
  Wallet,
  Plug,
  Copy,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  StatusBadge,
  fmtMoney,
} from "./shared";

const notifyAction = () => toast.info("Select an action to proceed");

interface BankAccount {
  id: string;
  bank: string;
  holder: string;
  iban: string;
  status: string;
}

const BANKS: BankAccount[] = [
  { id: "b1", bank: "HSBC UK", holder: "BlockExchange Ltd", iban: "GB29 NWBK 6016 1331 9268 19", status: "APPROVED" },
  { id: "b2", bank: "Deutsche Bank", holder: "BlockExchange Ltd", iban: "DE89 3704 0044 0532 0130 00", status: "APPROVED" },
  { id: "b3", bank: "DBS Singapore", holder: "BlockExchange Asia", iban: "SG-MBR-0001-2345-6789", status: "PENDING" },
  { id: "b4", bank: "Chase Bank", holder: "BlockExchange Inc", iban: "US64 SVBK 6000 0000 0000 0000", status: "APPROVED" },
];

interface CryptoWallet {
  id: string;
  symbol: string;
  network: string;
  address: string;
  color: string;
}

const CRYPTO_WALLETS: CryptoWallet[] = [
  { id: "w1", symbol: "BTC", network: "Bitcoin Mainnet", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", color: "#f7931a" },
  { id: "w2", symbol: "ETH", network: "ERC-20", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", color: "#627eea" },
  { id: "w3", symbol: "USDT", network: "TRC-20", address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE", color: "#26a17b" },
  { id: "w4", symbol: "BNB", network: "BEP-20", address: "bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46sq", color: "#f3ba2f" },
];

interface Card {
  id: string;
  brand: string;
  last4: string;
  holder: string;
  expiry: string;
  status: string;
}

const CARDS: Card[] = [
  { id: "c1", brand: "Visa", last4: "4242", holder: "Operations Account", expiry: "08/27", status: "APPROVED" },
  { id: "c2", brand: "Mastercard", last4: "5519", holder: "Operations Account", expiry: "11/26", status: "APPROVED" },
  { id: "c3", brand: "Visa", last4: "0010", holder: "Treasury", expiry: "03/28", status: "PENDING" },
];

const GATEWAYS = [
  { id: "stripe", name: "Stripe", desc: "Card payments via Stripe Connect", enabled: true, key: "sk_live_••••••••••••••••••••••••3Q8z" },
  { id: "paypal", name: "PayPal", desc: "PayPal checkout & subscriptions", enabled: true, key: "AY••••••••••••••••••••••••••k9P" },
  { id: "manual", name: "Manual / Bank Transfer", desc: "Operator-approved deposits & withdrawals", enabled: true, key: "—" },
  { id: "coinbase", name: "Coinbase Commerce", desc: "Crypto deposits via Coinbase", enabled: false, key: "••••••••••••••••••••" },
];

interface ManualTxn {
  id: string;
  type: "Deposit" | "Withdraw";
  user: string;
  amount: number;
  method: string;
  status: string;
  date: string;
}

const MANUAL: ManualTxn[] = [
  { id: "m1", type: "Deposit", user: "Alice Carter", amount: 1500, method: "Bank Wire", status: "PENDING", date: "2026-07-08" },
  { id: "m2", type: "Withdraw", user: "Hiro Tanaka", amount: 4800, method: "USDT-TRC20", status: "PENDING", date: "2026-07-08" },
  { id: "m3", type: "Deposit", user: "Tom Becker", amount: 220, method: "Card", status: "APPROVED", date: "2026-07-07" },
];

export function AdminPayments() {
  const [gatewayStates, setGatewayStates] = useState<Record<string, boolean>>(
    Object.fromEntries(GATEWAYS.map((g) => [g.id, g.enabled]))
  );

  return (
    <SectionShell>
      <SectionHeader
        title="Payments"
        description="Configure deposit & withdrawal channels — banks, crypto wallets, cards, gateways, and manual ops."
        icon={CreditCard}
      />

      <Tabs defaultValue="bank" className="space-y-4">
        <TabsList className="bg-background/40">
          <TabsTrigger value="bank"><Banknote className="w-3.5 h-3.5" />Bank Accounts</TabsTrigger>
          <TabsTrigger value="crypto"><Bitcoin className="w-3.5 h-3.5" />Crypto Wallets</TabsTrigger>
          <TabsTrigger value="cards"><CreditCard className="w-3.5 h-3.5" />Cards</TabsTrigger>
          <TabsTrigger value="gateways"><Plug className="w-3.5 h-3.5" />Gateways</TabsTrigger>
          <TabsTrigger value="manual"><Wallet className="w-3.5 h-3.5" />Manual</TabsTrigger>
        </TabsList>

        {/* Bank accounts */}
        <TabsContent value="bank">
          <div className="bx-glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Bank Accounts</h3>
                <p className="text-xs text-muted-foreground">Bank accounts used for wire deposits/withdrawals.</p>
              </div>
              <Button size="sm" variant="outline" onClick={notifyAction}>
                <Plus className="w-4 h-4" />
                Add Bank
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs uppercase">Bank</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">Account Holder</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">IBAN</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {BANKS.map((b) => (
                  <TableRow key={b.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="text-sm font-medium text-white">{b.bank}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.holder}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{b.iban}</TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-[#0ea5ff]" onClick={notifyAction}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[#ff3b30] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]" onClick={notifyAction}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Crypto wallets */}
        <TabsContent value="crypto">
          <div className="bx-glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Crypto Wallets</h3>
                <p className="text-xs text-muted-foreground">Hot wallet addresses for crypto deposits.</p>
              </div>
              <Button size="sm" variant="outline" onClick={notifyAction}>
                <Plus className="w-4 h-4" />
                Add Wallet
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CRYPTO_WALLETS.map((w) => (
                <div key={w.id} className="bx-glass-soft rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: `${w.color}22`, color: w.color }}>
                        {w.symbol[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{w.symbol}</div>
                        <div className="text-[10px] text-muted-foreground">{w.network}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-[#0ea5ff]" onClick={() => { navigator.clipboard?.writeText(w.address); toast.success("Address copied"); }}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-[#0ea5ff]" onClick={notifyAction}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground break-all bg-background/40 rounded-md px-2 py-1.5">{w.address}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Cards */}
        <TabsContent value="cards">
          <div className="bx-glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Card Accounts</h3>
                <p className="text-xs text-muted-foreground">Cards used for payouts and refund operations.</p>
              </div>
              <Button size="sm" variant="outline" onClick={notifyAction}>
                <Plus className="w-4 h-4" />
                Add Card
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CARDS.map((c) => (
                <div key={c.id} className="bx-glass-soft rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[#0ea5ff]/15 blur-2xl" />
                  <div className="flex items-center justify-between relative">
                    <CreditCard className="w-6 h-6 text-[#0ea5ff]" />
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-4 text-lg font-mono tracking-wider text-white">•••• {c.last4}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{c.holder}</span>
                    <span>{c.expiry}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{c.brand}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Gateways */}
        <TabsContent value="gateways">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GATEWAYS.map((g) => (
              <div key={g.id} className="bx-glass rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0ea5ff]/15 text-[#0ea5ff] ring-1 ring-[#0ea5ff]/30 flex items-center justify-center">
                      <Plug className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{g.name}</div>
                      <div className="text-xs text-muted-foreground">{g.desc}</div>
                    </div>
                  </div>
                  <Switch
                    checked={gatewayStates[g.id]}
                    onCheckedChange={(v) => {
                      setGatewayStates((s) => ({ ...s, [g.id]: v }));
                      notifyAction();
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">API Key</Label>
                  <Input value={g.key} readOnly className="bg-background/40 font-mono text-xs" />
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-3 text-muted-foreground hover:text-white" onClick={notifyAction}>
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Configuration
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Manual */}
        <TabsContent value="manual">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bx-glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Manual Deposits</h3>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs uppercase">User</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase">Amount</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase">Method</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MANUAL.filter((m) => m.type === "Deposit").map((m) => (
                    <TableRow key={m.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="text-sm text-white">{m.user}</TableCell>
                      <TableCell className="text-sm font-medium tabular-nums text-[#00c853]">${fmtMoney(m.amount, 2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.method}</TableCell>
                      <TableCell><StatusBadge status={m.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="bx-glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Manual Withdrawals</h3>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs uppercase">User</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase">Amount</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase">Method</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MANUAL.filter((m) => m.type === "Withdraw").map((m) => (
                    <TableRow key={m.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="text-sm text-white">{m.user}</TableCell>
                      <TableCell className="text-sm font-medium tabular-nums text-[#ff3b30]">${fmtMoney(m.amount, 2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.method}</TableCell>
                      <TableCell><StatusBadge status={m.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </SectionShell>
  );
}
