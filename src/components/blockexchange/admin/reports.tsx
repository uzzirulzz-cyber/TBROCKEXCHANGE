"use client";

/**
 * BlockExchange admin — Reports section.
 *
 * UI with recharts. Daily / Weekly / Monthly segmented control. 4 chart cards:
 *  - Revenue (BarChart)
 *  - User Growth (AreaChart)
 *  - Deposits vs Withdrawals (stacked BarChart)
 *  - Trade Volume (LineChart)
 * Export PDF / Export Excel buttons + summary stat row.
 */

import { useMemo, useState } from "react";
import {
  BarChart3,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Users,
  DollarSign,
  CandlestickChart,
} from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  SectionHeader,
  SectionShell,
  StatCard,
  fmtMoney,
} from "./shared";

type Range = "daily" | "weekly" | "monthly";

const RANGES: { id: Range; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const tooltipStyle = {
  background: "rgba(13, 22, 42, 0.95)",
  border: "1px solid rgba(14,165,255,0.3)",
  borderRadius: 10,
  color: "#e8eefc",
  fontSize: 12,
};

function buildSeries(range: Range) {
  const n = range === "daily" ? 7 : range === "weekly" ? 12 : 12;
  const labels =
    range === "daily"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : range === "weekly"
      ? Array.from({ length: 12 }, (_, i) => `W${i + 1}`)
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // deterministic-ish pseudo-random
  const seed = range === "daily" ? 3 : range === "weekly" ? 7 : 11;
  const rand = (i: number, salt: number) => {
    const v = Math.sin(i * 12.9898 + salt * 78.233 + seed) * 43758.5453;
    return v - Math.floor(v);
  };

  return labels.map((l, i) => {
    const revenue = Math.round(2000 + rand(i, 1) * 6000);
    const users = Math.round(50 + rand(i, 2) * 200 + i * (range === "monthly" ? 80 : 10));
    const deposits = Math.round(1500 + rand(i, 3) * 4500);
    const withdrawals = Math.round(800 + rand(i, 4) * 3000);
    const volume = Math.round(8000 + rand(i, 5) * 18000);
    return { label: l, revenue, users, deposits, withdrawals, volume };
  });
}

export function AdminReports() {
  const [range, setRange] = useState<Range>("daily");
  const data = useMemo(() => buildSeries(range), [range]);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalUsers = data.reduce((s, d) => s + d.users, 0);
  const totalVolume = data.reduce((s, d) => s + d.volume, 0);
  const totalDeposits = data.reduce((s, d) => s + d.deposits, 0);

  return (
    <SectionShell>
      <SectionHeader
        title="Reports"
        description="Aggregated platform analytics — revenue, users, deposits, and trade volume."
        icon={BarChart3}
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => toast.info("Exporting PDF…")}>
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.info("Exporting Excel…")}>
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        }
      />

      {/* Range segmented control */}
      <div className="flex items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              range === r.id
                ? "bx-glass text-white ring-1 ring-[#0ea5ff]/40"
                : "bx-glass-soft text-muted-foreground hover:text-white"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${fmtMoney(totalRevenue, 0)}`} accent="emerald" delta={4.8} />
        <StatCard icon={Users} label="New Users" value={totalUsers.toLocaleString()} accent="blue" delta={3.1} />
        <StatCard icon={TrendingUp} label="Total Deposits" value={`$${fmtMoney(totalDeposits, 0)}`} accent="purple" delta={2.7} />
        <StatCard icon={CandlestickChart} label="Trade Volume" value={`$${fmtMoney(totalVolume, 0)}`} accent="amber" delta={6.4} />
      </div>

      {/* 4 charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue */}
        <div className="bx-glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Revenue</h3>
              <p className="text-xs text-muted-foreground">House profit over time</p>
            </div>
          </div>
          <div className="h-[240px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,168,230,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="#8a9bbd" tick={{ fill: "#8a9bbd", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#8a9bbd" tick={{ fill: "#8a9bbd", fontSize: 11 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(14,165,255,0.08)" }} formatter={(v: number) => [`$${fmtMoney(v, 0)}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#0ea5ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User growth */}
        <div className="bx-glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">User Growth</h3>
              <p className="text-xs text-muted-foreground">New signups over time</p>
            </div>
          </div>
          <div className="h-[240px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
                <defs>
                  <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00c853" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#00c853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,168,230,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="#8a9bbd" tick={{ fill: "#8a9bbd", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#8a9bbd" tick={{ fill: "#8a9bbd", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString(), "New Users"]} />
                <Area type="monotone" dataKey="users" stroke="#00c853" strokeWidth={2} fill="url(#usersGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deposits vs withdrawals */}
        <div className="bx-glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Deposits vs Withdrawals</h3>
              <p className="text-xs text-muted-foreground">Net flow per period</p>
            </div>
          </div>
          <div className="h-[240px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,168,230,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="#8a9bbd" tick={{ fill: "#8a9bbd", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#8a9bbd" tick={{ fill: "#8a9bbd", fontSize: 11 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(14,165,255,0.08)" }} formatter={(v: number, n) => [`$${fmtMoney(v, 0)}`, n === "deposits" ? "Deposits" : "Withdrawals"]} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#8a9bbd" }} />
                <Bar dataKey="deposits" stackId="a" fill="#00c853" radius={[0, 0, 0, 0]} />
                <Bar dataKey="withdrawals" stackId="a" fill="#ff3b30" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trade volume */}
        <div className="bx-glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Trade Volume</h3>
              <p className="text-xs text-muted-foreground">Total staked amount per period</p>
            </div>
          </div>
          <div className="h-[240px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,168,230,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="#8a9bbd" tick={{ fill: "#8a9bbd", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#8a9bbd" tick={{ fill: "#8a9bbd", fontSize: 11 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${fmtMoney(v, 0)}`, "Volume"]} />
                <Line type="monotone" dataKey="volume" stroke="#c084fc" strokeWidth={2} dot={{ r: 3, fill: "#c084fc", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
