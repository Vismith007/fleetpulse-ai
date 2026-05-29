import { useMemo } from 'react';
import {
  DollarSign, Clock, TrendingUp, TrendingDown,
  BarChart3, Activity, Target, Wrench,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import { useFleet } from '../store/fleetStore';
import { GlowCard } from '../components/ui/GlowCard';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { cn } from '../lib/utils';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  accent: string;
  glowColor?: 'blue' | 'emerald' | 'amber' | 'red' | 'none';
  sub: string;
  trend?: number;
}

function KpiCard({ icon, label, value, decimals = 0, prefix = '', suffix = '', accent, glowColor = 'none', sub, trend }: KpiProps) {
  return (
    <GlowCard glowColor={glowColor} className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/80 ring-1 ring-zinc-700/50">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400',
          )}>
            {trend >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
        <div className="flex items-baseline gap-0.5">
          {prefix && <span className={cn('text-sm font-semibold', accent)}>{prefix}</span>}
          <AnimatedCounter value={value} decimals={decimals} className={cn('text-2xl font-bold', accent)} />
          {suffix && <span className={cn('text-sm font-medium', accent)}>{suffix}</span>}
        </div>
        <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>
      </div>
    </GlowCard>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function BusinessAnalyticsView() {
  const { state } = useFleet();
  const { devices, alerts, aiInsights } = state;

  // ── Computed KPIs ──────────────────────────────────────────────────────────

  // MTTR: mean time to recover — simulate from offline device uptime patterns
  const mttrHours = useMemo(() => {
    const offlineDevices = devices.filter((d) => d.status === 'offline');
    if (offlineDevices.length === 0) return 1.4;
    return Math.max(0.5, Math.min(24, offlineDevices.reduce((s, d) => s + d.uptimeSeconds / 3600, 0) / offlineDevices.length * 0.02 + 1.2));
  }, [devices]);

  // MTBF: mean time between failures — based on average uptime
  const mtbfDays = useMemo(() => {
    if (devices.length === 0) return 45;
    const avgUptime = devices.reduce((s, d) => s + d.uptimeSeconds, 0) / devices.length;
    return Math.round(avgUptime / 86400);
  }, [devices]);

  // Fleet utilization
  const utilizationPct = useMemo(() => {
    if (devices.length === 0) return 0;
    return Math.round((devices.filter((d) => d.status === 'online').length / devices.length) * 100);
  }, [devices]);

  // Downtime cost (assume $220/hr per offline device)
  const downtimeCost = useMemo(() => {
    const offlineCount = devices.filter((d) => d.status === 'offline').length;
    return offlineCount * 220;
  }, [devices]);

  // Projected savings from AI recommendations
  const projectedSavings = useMemo(() => {
    const highRiskCount = devices.filter((d) => d.aiRiskLevel === 'critical' || d.aiRiskLevel === 'high').length;
    return highRiskCount * 1840; // avg cost avoidance per prevented failure
  }, [devices]);

  // Avg anomaly score
  const avgAnomaly = useMemo(() =>
    devices.length > 0 ? devices.reduce((s, d) => s + d.anomalyScore, 0) / devices.length : 0,
    [devices],
  );

  // ── Chart data ─────────────────────────────────────────────────────────────

  // Availability trend (simulate 7 days)
  const availabilityTrend = useMemo(() => {
    const base = utilizationPct;
    return Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      availability: Math.max(60, Math.min(100, base + (Math.random() - 0.5) * 10)),
      target: 95,
    }));
  }, [utilizationPct]);

  // Cost breakdown
  const costBreakdown = useMemo(() => [
    { category: 'Planned Maint.', cost: Math.round(devices.length * 85), color: '#60a5fa' },
    { category: 'Emergency Repair', cost: downtimeCost, color: '#f87171' },
    { category: 'Part Replacement', cost: Math.round(devices.filter((d) => d.battery < 20).length * 120), color: '#fb923c' },
    { category: 'Labor', cost: Math.round(devices.length * 42), color: '#a78bfa' },
  ], [devices, downtimeCost]);

  // Performance benchmark
  const perfBenchmark = useMemo(() => [
    { metric: 'Availability', yours: utilizationPct, industry: 92 },
    { metric: 'MTBF (days)', yours: Math.min(100, mtbfDays), industry: 45 },
    { metric: 'Response Time', yours: Math.max(20, 100 - mttrHours * 4), industry: 72 },
    { metric: 'AI Coverage', yours: Math.round((aiInsights.length / Math.max(1, devices.length)) * 100), industry: 60 },
  ], [utilizationPct, mtbfDays, mttrHours, aiInsights.length, devices.length]);

  // Alert cost trend (12h)
  const alertCostTrend = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      hour: `${i + 1}h`,
      cost: Math.round(Math.random() * 800 + 200),
      alerts: Math.floor(Math.random() * 8),
    }));
  }, []);

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Business Analytics</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Executive KPIs & operational intelligence · {devices.length} devices</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          icon={<Clock className="h-4 w-4 text-blue-400" />}
          label="MTTR"
          value={mttrHours}
          decimals={1}
          suffix="h"
          accent="text-blue-400"
          glowColor="blue"
          sub="Mean time to recover"
          trend={-12}
        />
        <KpiCard
          icon={<Activity className="h-4 w-4 text-emerald-400" />}
          label="MTBF"
          value={mtbfDays}
          suffix="d"
          accent="text-emerald-400"
          glowColor="emerald"
          sub="Mean time between failures"
          trend={8}
        />
        <KpiCard
          icon={<Target className="h-4 w-4 text-purple-400" />}
          label="Utilization"
          value={utilizationPct}
          suffix="%"
          accent={utilizationPct >= 90 ? 'text-emerald-400' : utilizationPct >= 70 ? 'text-amber-400' : 'text-red-400'}
          glowColor={utilizationPct >= 90 ? 'emerald' : 'amber'}
          sub="Fleet availability"
        />
        <KpiCard
          icon={<DollarSign className="h-4 w-4 text-red-400" />}
          label="Downtime Cost"
          value={downtimeCost}
          prefix="$"
          accent={downtimeCost > 1000 ? 'text-red-400' : 'text-amber-400'}
          glowColor={downtimeCost > 1000 ? 'red' : 'none'}
          sub="Current hour estimate"
        />
        <KpiCard
          icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
          label="Projected Savings"
          value={projectedSavings}
          prefix="$"
          accent="text-emerald-400"
          glowColor="emerald"
          sub="AI-driven prevention"
          trend={23}
        />
        <KpiCard
          icon={<BarChart3 className="h-4 w-4 text-amber-400" />}
          label="Avg Risk Score"
          value={avgAnomaly}
          decimals={1}
          suffix="/100"
          accent={avgAnomaly > 50 ? 'text-red-400' : avgAnomaly > 30 ? 'text-amber-400' : 'text-emerald-400'}
          sub="Fleet anomaly index"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

        {/* Availability trend */}
        <GlowCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-400">Fleet Availability vs Target</p>
            <span className="text-[10px] text-zinc-600">7-day view</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={availabilityTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="avGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '6px', fontSize: '11px' }} labelStyle={{ color: '#71717a' }} />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="availability" stroke="#10b981" strokeWidth={2} fill="url(#avGrad)" dot={false} name="Availability %" />
              <Line type="monotone" dataKey="target" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Target %" />
            </AreaChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* Cost breakdown */}
        <GlowCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-400">Operational Cost Breakdown</p>
            <span className="text-[10px] text-zinc-600">Current period</span>
          </div>
          <div className="space-y-2.5">
            {costBreakdown.map((item) => {
              const total = costBreakdown.reduce((s, c) => s + c.cost, 0);
              const pct = total > 0 ? (item.cost / total) * 100 : 0;
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-zinc-400">{item.category}</span>
                    <span className="text-zinc-300 font-medium">${item.cost.toLocaleString()} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800">
                    <div className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            })}
            <div className="border-t border-zinc-800 pt-2 flex justify-between text-xs font-semibold">
              <span className="text-zinc-400">Total</span>
              <span className="text-zinc-100">${costBreakdown.reduce((s, c) => s + c.cost, 0).toLocaleString()}</span>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

        {/* Performance benchmark */}
        <GlowCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-400">Performance vs Industry Benchmark</p>
            <span className="text-[10px] text-zinc-600">Normalized 0–100</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={perfBenchmark} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
              <XAxis dataKey="metric" tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '6px', fontSize: '11px' }} labelStyle={{ color: '#71717a' }} />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
              <Bar dataKey="yours" fill="#60a5fa" name="Your Fleet" radius={[3, 3, 0, 0]} />
              <Bar dataKey="industry" fill="#27272a" name="Industry Avg" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* Alert cost trend */}
        <GlowCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-400">Alert-Driven Cost Trend</p>
            <span className="text-[10px] text-zinc-600">Last 12 hours</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={alertCostTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} />
              <YAxis yAxisId="cost" tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="alerts" orientation="right" tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '6px', fontSize: '11px' }} labelStyle={{ color: '#71717a' }} />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
              <Line yAxisId="cost" type="monotone" dataKey="cost" stroke="#f87171" strokeWidth={1.5} dot={false} name="Cost $" />
              <Line yAxisId="alerts" type="monotone" dataKey="alerts" stroke="#fb923c" strokeWidth={1.5} dot={false} name="Alerts" />
            </LineChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>

      {/* ROI summary */}
      <GlowCard glowColor="emerald" className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <p className="text-xs font-medium text-zinc-400">AI-Driven ROI Summary</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RoiItem
            label="Failures Prevented"
            value={`${devices.filter((d) => d.aiRiskLevel === 'critical').length} critical`}
            sub="This week"
            accent="text-emerald-400"
          />
          <RoiItem
            label="Cost Avoidance"
            value={`$${projectedSavings.toLocaleString()}`}
            sub="Projected"
            accent="text-emerald-400"
          />
          <RoiItem
            label="MTTR Improvement"
            value="-18%"
            sub="vs last month"
            accent="text-blue-400"
          />
          <RoiItem
            label="Maintenance Efficiency"
            value="+34%"
            sub="Proactive vs reactive"
            accent="text-purple-400"
          />
        </div>
      </GlowCard>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoiItem({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-lg bg-zinc-800/40 border border-zinc-800 p-3">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className={cn('text-lg font-bold mt-0.5', accent)}>{value}</p>
      <p className="text-[10px] text-zinc-600">{sub}</p>
    </div>
  );
}
