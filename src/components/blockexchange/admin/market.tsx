"use client";

/**
 * BlockExchange admin — Market Management section.
 *
 * UI-only. Lists the 8 COINS with per-coin enable switch + price/change,
 * supports Add/Edit/Remove via dialogs, and has a Maintenance Mode master
 * toggle with a warning banner when on.
 */

import { useState } from "react";
import {
  Coins,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Settings2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  fmtMoney,
} from "./shared";
import { COINS, type Coin } from "@/lib/market-data";

interface MarketCoin extends Coin {
  live: boolean;
  change24h: number;
}

const INITIAL: MarketCoin[] = COINS.map((c, i) => ({
  ...c,
  live: true,
  change24h: ((i % 5) - 2) * 1.6 + (Math.random() - 0.5) * 2,
}));

const notifyAction = () => toast.info("Select an action to proceed");

export function AdminMarket() {
  const [coins, setCoins] = useState<MarketCoin[]>(INITIAL);
  const [maintenance, setMaintenance] = useState(false);
  const [livePrices, setLivePrices] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<MarketCoin | null>(null);
  const [removing, setRemoving] = useState<MarketCoin | null>(null);

  const toggleLive = (sym: string, v: boolean) => {
    setCoins((cs) => cs.map((c) => (c.symbol === sym ? { ...c, live: v } : c)));
    toast.info(` ${sym} ${v ? "live" : "maintenance"}`);
  };

  return (
    <SectionShell>
      <SectionHeader
        title="Market Management"
        description="Configure tradable pairs, manage pricing feed, and toggle maintenance mode."
        icon={Coins}
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-[#2196F3] to-[#0D47A1] text-white">
                <Plus className="w-4 h-4" />
                Add Coin
              </Button>
            </DialogTrigger>
            <AddCoinDialog
              onClose={() => setAddOpen(false)}
              onAdd={(c) => {
                setCoins((cs) => [
                  ...cs,
                  { ...c, live: true, change24h: 0 },
                ]);
                setAddOpen(false);
                notifyAction();
              }}
            />
          </Dialog>
        }
      />

      {/* Master toggles + maintenance banner */}
      <div className="bx-glass rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Toggle
            label="Maintenance Mode"
            checked={maintenance}
            onChange={(v) => {
              setMaintenance(v);
              toast.info(` maintenance mode ${v ? "ON" : "OFF"}`);
            }}
            accent="#f5a623"
          />
          <Toggle
            label="Live Prices Feed"
            checked={livePrices}
            onChange={(v) => {
              setLivePrices(v);
              notifyAction();
            }}
            accent="#00c853"
          />
        </div>
        <Badge variant="secondary">{coins.length} pairs listed</Badge>
      </div>

      {maintenance && (
        <div className="bx-glass rounded-xl p-4 flex items-start gap-3 border-l-2 border-[#f5a623]">
          <AlertTriangle className="w-5 h-5 text-[#f5a623] mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Market is in maintenance mode</div>
            <div className="text-xs text-muted-foreground">All trading is paused. Users will see a maintenance banner on the trading screen.</div>
          </div>
        </div>
      )}

      {/* Coin table */}
      <div className="bx-glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider px-4">Coin</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Name</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Base Price</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">24h Change</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Trading Status</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-right px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coins.map((c) => (
              <TableRow key={c.symbol} className="border-white/5 hover:bg-white/[0.02]">
                <TableCell className="px-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold"
                      style={{ background: `${c.color}22`, color: c.color }}
                    >
                      {c.icon}
                    </div>
                    <span className="font-medium text-white">{c.symbol}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.name}</TableCell>
                <TableCell className="text-sm tabular-nums">${fmtMoney(c.basePrice, c.precision)}</TableCell>
                <TableCell>
                  <span className={`text-sm font-medium tabular-nums ${c.change24h >= 0 ? "text-[#00c853]" : "text-[#ff3b30]"}`}>
                    {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={c.live} onCheckedChange={(v) => toggleLive(c.symbol, v)} />
                    <Badge className={c.live ? "bg-[#00c853]/15 text-[#00c853] border-[#00c853]/30" : "bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/30"}>
                      {c.live ? "Live" : "Maintenance"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Dialog open={editing?.symbol === c.symbol} onOpenChange={(o) => !o && setEditing(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-[#0ea5ff]" onClick={() => setEditing(c)}>
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <EditCoinDialog
                        coin={c}
                        onClose={() => setEditing(null)}
                        onSave={() => {
                          setEditing(null);
                          notifyAction();
                        }}
                      />
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[#ff3b30] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
                      onClick={() => setRemoving(c)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Remove confirm dialog */}
      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#f5a623]" />
              Remove {removing?.symbol}?
            </DialogTitle>
            <DialogDescription>
              This will delist {removing?.name} ({removing?.symbol}) from the trading platform. Existing open trades will still settle.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemoving(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removing) {
                  setCoins((cs) => cs.filter((c) => c.symbol !== removing.symbol));
                  notifyAction();
                }
                setRemoving(null);
              }}
            >
              <Trash2 className="w-4 h-4" />
              Remove Coin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  accent,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full" style={{ background: checked ? accent : "#8a9bbd" }} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function CoinFormFields({
  symbol,
  name,
  basePrice,
  color,
  onChange,
}: {
  symbol: string;
  name: string;
  basePrice: string;
  color: string;
  onChange: (patch: { symbol?: string; name?: string; basePrice?: string; color?: string }) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Symbol</Label>
        <Input value={symbol} onChange={(e) => onChange({ symbol: e.target.value.toUpperCase() })} className="bg-background/40" placeholder="BTC" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Name</Label>
        <Input value={name} onChange={(e) => onChange({ name: e.target.value })} className="bg-background/40" placeholder="Bitcoin" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Base Price (USD)</Label>
        <Input type="number" value={basePrice} onChange={(e) => onChange({ basePrice: e.target.value })} className="bg-background/40" placeholder="0.00" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Brand Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="w-9 h-9 rounded-md bg-transparent border border-white/10 cursor-pointer"
          />
          <Input value={color} onChange={(e) => onChange({ color: e.target.value })} className="bg-background/40" />
        </div>
      </div>
    </div>
  );
}

function AddCoinDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (c: Coin) => void;
}) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [color, setColor] = useState("#0ea5ff");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#0ea5ff]" />
          Add New Trading Pair
        </DialogTitle>
        <DialogDescription>Register a new coin for the BlockExchange trading platform.</DialogDescription>
      </DialogHeader>
      <CoinFormFields
        symbol={symbol}
        name={name}
        basePrice={basePrice}
        color={color}
        onChange={(p) => {
          if (p.symbol !== undefined) setSymbol(p.symbol);
          if (p.name !== undefined) setName(p.name);
          if (p.basePrice !== undefined) setBasePrice(p.basePrice);
          if (p.color !== undefined) setColor(p.color);
        }}
      />
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          className="bg-gradient-to-r from-[#2196F3] to-[#0D47A1] text-white"
          onClick={() =>
            onAdd({
              symbol: symbol || "NEW",
              name: name || "New Coin",
              pair: `${symbol || "NEW"}/USDT`,
              basePrice: Number(basePrice) || 1,
              color,
              icon: symbol?.charAt(0) ?? "★",
              precision: Number(basePrice) < 1 ? 5 : 2,
            })
          }
        >
          <Settings2 className="w-4 h-4" />
          Add Pair
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditCoinDialog({
  coin,
  onClose,
  onSave,
}: {
  coin: MarketCoin;
  onClose: () => void;
  onSave: () => void;
}) {
  const [symbol, setSymbol] = useState(coin.symbol);
  const [name, setName] = useState(coin.name);
  const [basePrice, setBasePrice] = useState(String(coin.basePrice));
  const [color, setColor] = useState(coin.color);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-[#0ea5ff]" />
          Edit {coin.symbol}
        </DialogTitle>
        <DialogDescription>Update the configuration for this trading pair.</DialogDescription>
      </DialogHeader>
      <CoinFormFields
        symbol={symbol}
        name={name}
        basePrice={basePrice}
        color={color}
        onChange={(p) => {
          if (p.symbol !== undefined) setSymbol(p.symbol);
          if (p.name !== undefined) setName(p.name);
          if (p.basePrice !== undefined) setBasePrice(p.basePrice);
          if (p.color !== undefined) setColor(p.color);
        }}
      />
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button className="bg-gradient-to-r from-[#2196F3] to-[#0D47A1] text-white" onClick={onSave}>
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
