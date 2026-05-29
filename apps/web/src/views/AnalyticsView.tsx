import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { useFleet } from '../store/fleetStore';
import { useAnalytics } from '../hooks/useApi';
import { GlowCard } from '../components/ui/GlowCard';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { cn } from '../lib/utils';
import {
  Activity, ShieldCheck, Zap, Clock, TrendingUp, BarChart3,
} from 'lucide-react';

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: '#09090b',
    border: '1px solid #27272a',
    borderRadius: '8px',
    fontSize: '11px',
  },
  labelStyle: { color: '#71717a' },
};

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export function AnalyticsView() {
  const { state } = useFleet();
  const { data, loading, load } = useAnalytics();
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => void load(), 10_000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  const { devices, alerts } = state;
  const health = data?.systemHealth ?? state.systemHealth;

  // Fleet composition for pie chart
  const pieData = [
    { name: 'Sensor',   value: devices.filter((d) => d.type === 'sensor').length,   color: '#60a5fa' },
    { name: 'Gateway',  value: devices.filter((d) => d.type === 'gateway').length,  color: '#a78bfa' },
    { name: 'Actuator', value: devices.filter((d) => d.type === 'actuator').length, color: '#fb923c' },
  ];

  // Temperature distribution
  const tempBuckets = Array.from({ length: 8 }, (_, i) => ({
    range: `${i * 10 + 15}–${i * 10 + 25}°`,
    count: devices.filter((d) => d.temperature >= i * 10 + 15 && d.temperature < i * 10 + 25).length,
  }));

  const alertFreq = data?.alertFrequency ?? [];
  const uptimeStats = (data?.uptimeStats ?? [])
    .sort((a, b) => b.uptimePercent - a.uptimePercent)
    .slice(0, 8);

  return (
    <div className="space-y-6 p-6">
      {/* System health KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Health Score',    value: health?.overallScore ?? 0,       suffix: '%', icon: ShieldCheck, color: 'text-blue-400' },
          { label: 'Fleet Efficiency',value: health?.fleetEfficiency ?? 0,    suffix: '%', icon: Zap,         color: 'text-purple-400' },
          { label: 'Avg Uptime',      value: health?.avgUptimePercent ?? 0,   suffix: '%', icon: Clock,       color: 'text-emerald-400' },
          { label: 'Active Incidents',value: health?.activeIncidents ?? 0,    suffix: '',  icon: Activity,    color: 'text-amber-400' },
          { label: 'Pred. Failures',  value: health?.predictedFailures ?? 0,  suffix: '',  icon: TrendingUp,  color: 'text-red-400' },
          { label: 'Data pts/s',      value: health?.dataPointsPerSecond ?? 0,suffix: '',  icon: BarChart3,   color: 'text-cyan-400' },
        ].map((kpi) => (
          loading
            ? <Skeleton key={kpi.label} className="h-16 rounded-xl" />
            : (
              <GlowCard key={kpi.label} className="px-3 py-2.5 flex items-center gap-2.5">
                <kpi.icon className={cn('h-4 w-4 flex-shrink-0', kpi.color)} />
                <div>
                  <p className="text-[10px] text-zinc-500">{kpi.label}</p>
                  <p className={cn('text-lg font-bold tabular-nums', kpi.color)}>
                    <AnimatedCounter value={kpi.value} decimals={kpi.suffix === '%' ? 1 : 0} suffix={kpi.suffix} />
                  </p>
                </div>
              </GlowCard>
            )
        ))}
      </div>

      {/* Row: Alert frequency + Fleet composition */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Alert frequency (2/3 wide) */}
        <GlowCard className="p-5 lg:col-span-2">
          <SectionHeader title="Alert Frequency" subtitle="Last 12 hours — critical / warning / info" />
          {loading || alertFreq.length === 0 ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={alertFreq} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} axisLine={false} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="critical" fill="#ef4444" radius={[2, 2, 0, 0]} name="Critical" stackId="a" />
                <Bar dataKey="warning"  fill="#f59e0b" radius={[2, 2, 0, 0]} name="Warning"  stackId="a" />
                <Bar dataKey="info"     fill="#3b82f6" radius={[2, 2, 0, 0]} name="Info"     stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlowCard>

        {/* Fleet composition pie */}
        <GlowCard className="p-5">
          <SectionHeader title="Fleet Composition" subtitle="Device type breakdown" />
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                paddingAngle={3}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>

      {/* Row: Temperature distribution + Uptime */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Temperature distribution */}
        <GlowCard className="p-5">
          <SectionHeader title="Temperature Distribution" subtitle="Devices by temperature range (°C)" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tempBuckets} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
              <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Devices">
                {tempBuckets.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.range.startsWith('7') || entry.range.startsWith('8') ? '#ef4444'
                      : entry.range.startsWith('5') || entry.range.startsWith('6') ? '#f59e0b'
                      : '#60a5fa'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* Device uptime chart */}
        <GlowCard className="p-5">
          <SectionHeader title="Device Uptime" subtitle="Top 8 by uptime percentage" />
          {loading || uptimeStats.length === 0 ? (
            <Skeleton className="h-44 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={uptimeStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                <XAxis dataKey="deviceName" tick={{ fontSize: 8, fill: '#52525b' }} tickLine={false}
                  tickFormatter={(v: string) => v.split(' ').pop() ?? v} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} axisLine={false} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, 'Uptime']} />
                <Area type="monotone" dataKey="uptimePercent" stroke="#22c55e" fill="url(#uptimeGrad)"
                  strokeWidth={2} name="Uptime %" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </GlowCard>
      </div>

      {/* Auto-refresh toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setAutoRefresh((v) => !v)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            autoRefresh
              ? 'bg-blue-600/15 text-blue-400 border border-blue-700/30'
              : 'bg-zinc-800 text-zinc-500 border border-zinc-700',
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', autoRefresh ? 'bg-blue-400 animate-pulse' : 'bg-zinc-600')} />
          Auto-refresh {autoRefresh ? 'on' : 'off'}
        </button>
      </div>
    </div>
  );
}
