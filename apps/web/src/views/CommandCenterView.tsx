import { useMemo } from 'react';
import {
  Activity, AlertTriangle, Brain, CheckCircle2, Clock,
  Cpu, Shield, TrendingUp, Wifi, Zap, BarChart3, ServerCrash,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFleet } from '../store/fleetStore';
import { GlowCard } from '../components/ui/GlowCard';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { AnomalyBadge } from '../components/ui/AnomalyBadge';
import { StatusPill } from '../components/ui/StatusPill';
import { cn } from '../lib/utils';
import { formatRelativeTime } from '../lib/utils';
import type { Device } from '@fleetpulse/types';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  accent: string;
  glowColor?: 'blue' | 'emerald' | 'amber' | 'red' | 'none';
  sub?: string;
  trend?: { value: number; label: string };
}

function KpiCard({ icon, label, value, decimals = 0, suffix = '', accent, glowColor = 'none', sub, trend }: KpiCardProps) {
  return (
    <GlowCard glowColor={glowColor} className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/80 ring-1 ring-zinc-700/50">
          {icon}
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            trend.value >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400',
          )}>
            <TrendingUp className={cn('h-2.5 w-2.5', trend.value < 0 && 'rotate-180')} />
            {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
        <div className="flex items-baseline gap-1">
          <AnimatedCounter value={value} decimals={decimals} className={cn('text-2xl font-bold', accent)} />
          {suffix && <span className={cn('text-sm font-medium', accent)}>{suffix}</span>}
        </div>
        {sub && <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>}
      </div>
    </GlowCard>
  );
}

// ─── Health Ring ──────────────────────────────────────────────────────────────

function HealthRing({ score }: { score: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#27272a" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-zinc-100">{score}</span>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wide">score</span>
      </div>
    </div>
  );
}

// ─── Live Event row ───────────────────────────────────────────────────────────

function EventRow({ device }: { device: Device }) {
  const isAI = device.aiRiskLevel === 'critical' || device.aiRiskLevel === 'high';
  const icon = device.status === 'offline'
    ? <ServerCrash className="h-3.5 w-3.5 text-red-400" />
    : device.status === 'warning'
    ? <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
    : <Brain className="h-3.5 w-3.5 text-orange-400" />;

  const label = device.status === 'offline'
    ? 'Device offline'
    : device.status === 'warning'
    ? 'Warning threshold exceeded'
    : 'AI risk elevated';

  if (!isAI && device.status === 'online') return null;

  return (
    <div className="flex items-start gap-3 rounded-lg bg-zinc-900/50 px-3 py-2.5">
      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-zinc-800">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-200 truncate">{device.name}</span>
          <StatusPill status={device.status} />
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">{label}</p>
        {device.aiPrediction && (
          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 italic">{device.aiPrediction}</p>
        )}
      </div>
      <AnomalyBadge score={device.anomalyScore} riskLevel={device.aiRiskLevel} />
    </div>
  );
}

// ─── Sparkline data helper ────────────────────────────────────────────────────

function buildSparkData(devices: Device[]) {
  // Simulate 12 recent health snapshots from current device data with slight jitter
  const base = devices.length > 0
    ? devices.reduce((s, d) => s + (100 - d.anomalyScore), 0) / devices.length
    : 80;

  return Array.from({ length: 12 }, (_, i) => ({
    t: `${11 - i}m`,
    score: Math.max(0, Math.min(100, Math.round(base + (Math.random() - 0.5) * 8))),
  })).reverse();
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function CommandCenterView({ onSelectDevice }: { onSelectDevice: (device: Device) => void }) {
  const { state } = useFleet();
  const { devices, alerts, aiInsights, systemHealth } = state;

  const onlineCount   = devices.filter((d) => d.status === 'online').length;
  const warningCount  = devices.filter((d) => d.status === 'warning').length;
  const offlineCount  = devices.filter((d) => d.status === 'offline').length;
  const criticalCount = devices.filter((d) => d.aiRiskLevel === 'critical').length;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;

  const avgAnomalyScore = useMemo(() =>
    devices.length > 0 ? devices.reduce((s, d) => s + d.anomalyScore, 0) / devices.length : 0,
    [devices],
  );

  const fleetHealthScore = useMemo(() =>
    Math.round(100 - avgAnomalyScore * 0.6 - (offlineCount / Math.max(1, devices.length)) * 20),
    [avgAnomalyScore, offlineCount, devices.length],
  );

  const avgBattery = useMemo(() =>
    devices.length > 0 ? devices.reduce((s, d) => s + d.battery, 0) / devices.length : 0,
    [devices],
  );

  const avgSignal = useMemo(() =>
    devices.length > 0 ? devices.reduce((s, d) => s + d.signalStrength, 0) / devices.length : -70,
    [devices],
  );

  const criticalDevices = useMemo(() =>
    devices
      .filter((d) => d.status !== 'online' || d.aiRiskLevel === 'critical' || d.aiRiskLevel === 'high')
      .sort((a, b) => b.anomalyScore - a.anomalyScore)
      .slice(0, 6),
    [devices],
  );

  const recentInsights = aiInsights.slice(0, 4);
  const sparkData = useMemo(() => buildSparkData(devices), [devices]);

  const networkHealthPct = useMemo(() => {
    // -30 = 100%, -100 = 0%; clamp
    return Math.round(Math.max(0, Math.min(100, ((avgSignal + 100) / 70) * 100)));
  }, [avgSignal]);

  const availabilityPct = devices.length > 0
    ? Math.round((onlineCount / devices.length) * 100)
    : 0;

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Command Center</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Real-time fleet intelligence · {devices.length} devices monitored</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-800/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={<Activity className="h-4 w-4 text-blue-400" />}
          label="Fleet Availability"
          value={availabilityPct}
          suffix="%"
          accent={availabilityPct >= 90 ? 'text-emerald-400' : availabilityPct >= 70 ? 'text-amber-400' : 'text-red-400'}
          glowColor={availabilityPct >= 90 ? 'emerald' : availabilityPct >= 70 ? 'amber' : 'red'}
          sub={`${onlineCount} / ${devices.length} online`}
          trend={{ value: 2, label: 'vs 1h ago' }}
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
          label="Active Incidents"
          value={criticalAlerts + warningCount}
          accent={criticalAlerts > 0 ? 'text-red-400' : 'text-amber-400'}
          glowColor={criticalAlerts > 0 ? 'red' : 'amber'}
          sub={`${criticalAlerts} critical · ${warningCount} warning`}
        />
        <KpiCard
          icon={<Brain className="h-4 w-4 text-purple-400" />}
          label="AI Risk Devices"
          value={criticalCount}
          accent={criticalCount > 0 ? 'text-red-400' : 'text-zinc-100'}
          glowColor={criticalCount > 2 ? 'red' : 'none'}
          sub="critical / high AI risk"
        />
        <KpiCard
          icon={<Zap className="h-4 w-4 text-emerald-400" />}
          label="Avg Battery"
          value={avgBattery}
          decimals={1}
          suffix="%"
          accent={avgBattery >= 50 ? 'text-emerald-400' : avgBattery >= 25 ? 'text-amber-400' : 'text-red-400'}
          glowColor="emerald"
          sub="fleet-wide"
        />
      </div>

      {/* Middle section: Fleet Health + Spark + Network + Events */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

        {/* Fleet health score */}
        <GlowCard
          glowColor={fleetHealthScore >= 80 ? 'emerald' : fleetHealthScore >= 60 ? 'amber' : 'red'}
          className="p-5 flex flex-col items-center justify-center gap-3"
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Fleet Health Index</p>
          <HealthRing score={fleetHealthScore} />
          <div className="grid grid-cols-3 gap-2 w-full text-center">
            <div>
              <p className="text-base font-bold text-emerald-400">{onlineCount}</p>
              <p className="text-[10px] text-zinc-600">Online</p>
            </div>
            <div>
              <p className="text-base font-bold text-amber-400">{warningCount}</p>
              <p className="text-[10px] text-zinc-600">Warning</p>
            </div>
            <div>
              <p className="text-base font-bold text-red-400">{offlineCount}</p>
              <p className="text-[10px] text-zinc-600">Offline</p>
            </div>
          </div>
        </GlowCard>

        {/* Health trend sparkline */}
        <GlowCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Health Score Trend</p>
            <span className="text-[10px] text-zinc-600">Last 12 min</span>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart data={sparkData} margin={{ top: 2, right: 2, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: '#52525b' }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#52525b' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '6px', fontSize: '10px' }}
                labelStyle={{ color: '#71717a' }}
              />
              <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={1.5} fill="url(#healthGrad)" dot={false} name="Score" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3">
            <div className="flex items-center gap-2">
              <Wifi className="h-3.5 w-3.5 text-blue-400" />
              <div>
                <p className="text-[10px] text-zinc-500">Network Health</p>
                <p className={cn('text-sm font-bold', networkHealthPct >= 70 ? 'text-blue-400' : 'text-amber-400')}>
                  {networkHealthPct}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-orange-400" />
              <div>
                <p className="text-[10px] text-zinc-500">Avg CPU Load</p>
                <p className="text-sm font-bold text-orange-400">
                  {devices.length > 0
                    ? (devices.reduce((s, d) => s + d.cpuUsage, 0) / devices.length).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
            </div>
          </div>
        </GlowCard>

        {/* System health from WS */}
        <GlowCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-medium text-zinc-400">System Intelligence</p>
          </div>
          {systemHealth ? (
            <div className="space-y-2.5">
              <MetricBar label="Fleet Efficiency" value={systemHealth.fleetEfficiency} color="blue" />
              <MetricBar label="Avg Uptime" value={systemHealth.avgUptimePercent} color="emerald" />
              <MetricBar label="Overall Score" value={systemHealth.overallScore} color="purple" />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <MiniStat label="Active Incidents" value={systemHealth.activeIncidents} accent="text-amber-400" />
                <MiniStat label="Resolved Today" value={systemHealth.resolvedToday} accent="text-emerald-400" />
                <MiniStat label="Predicted Failures" value={systemHealth.predictedFailures} accent="text-red-400" />
                <MiniStat label="Data pts/sec" value={systemHealth.dataPointsPerSecond} accent="text-blue-400" />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-zinc-700">
              <BarChart3 className="h-8 w-8" />
            </div>
          )}
        </GlowCard>
      </div>

      {/* Bottom section: live events + AI insights */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

        {/* Live Critical Events */}
        <GlowCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-medium text-zinc-400">Live Critical Events</p>
            </div>
            <span className="rounded-full bg-red-500/80 px-1.5 text-[9px] font-semibold text-white">
              {criticalDevices.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {criticalDevices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-zinc-700">
                <CheckCircle2 className="h-8 w-8 text-emerald-700" />
                <p className="text-xs text-zinc-600">All devices operating normally</p>
              </div>
            ) : (
              criticalDevices.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onSelectDevice(d)}
                  className="w-full text-left"
                >
                  <EventRow device={d} />
                </button>
              ))
            )}
          </div>
        </GlowCard>

        {/* Recent AI Insights */}
        <GlowCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <p className="text-xs font-medium text-zinc-400">Recent AI Insights</p>
            </div>
            <span className="text-[10px] text-zinc-600">{aiInsights.length} total</span>
          </div>
          <div className="space-y-2">
            {recentInsights.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-zinc-700">
                <Brain className="h-8 w-8" />
                <p className="text-xs">Analyzing fleet patterns…</p>
              </div>
            ) : (
              recentInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    'rounded-lg border p-3 space-y-1',
                    insight.severity === 'critical' ? 'border-red-800/40 bg-red-950/20' :
                    insight.severity === 'high' ? 'border-orange-800/40 bg-orange-950/20' :
                    'border-amber-800/40 bg-amber-950/20',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      'text-xs font-semibold',
                      insight.severity === 'critical' ? 'text-red-400' :
                      insight.severity === 'high' ? 'text-orange-400' : 'text-amber-400',
                    )}>{insight.title}</p>
                    <span className="flex-shrink-0 text-[10px] text-zinc-600">{formatRelativeTime(insight.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">{insight.deviceName} · {insight.confidence}% confidence</p>
                  {insight.recommendedAction && (
                    <p className="text-[11px] text-zinc-400 italic line-clamp-1">{insight.recommendedAction}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </GlowCard>
      </div>

      {/* Maintenance forecast strip */}
      <GlowCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-zinc-400" />
          <p className="text-xs font-medium text-zinc-400">Maintenance Forecast</p>
          <span className="ml-auto text-[10px] text-zinc-600">Next 7 days</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ForecastItem
            label="Immediate Action"
            count={devices.filter((d) => d.aiRiskLevel === 'critical').length}
            color="text-red-400"
            bg="bg-red-950/30 border-red-800/30"
          />
          <ForecastItem
            label="High Priority"
            count={devices.filter((d) => d.aiRiskLevel === 'high').length}
            color="text-orange-400"
            bg="bg-orange-950/30 border-orange-800/30"
          />
          <ForecastItem
            label="Scheduled (7d)"
            count={devices.filter((d) => d.aiRiskLevel === 'medium').length}
            color="text-amber-400"
            bg="bg-amber-950/30 border-amber-800/30"
          />
          <ForecastItem
            label="Routine Monitoring"
            count={devices.filter((d) => d.aiRiskLevel === 'low').length}
            color="text-emerald-400"
            bg="bg-emerald-950/30 border-emerald-800/30"
          />
        </div>
      </GlowCard>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricBar({ label, value, color }: { label: string; value: number; color: 'blue' | 'emerald' | 'purple' }) {
  const colorMap = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-zinc-500">{label}</span>
        <span className="text-[11px] font-medium text-zinc-300">{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800">
        <div
          className={cn('h-1.5 rounded-full transition-all duration-700', colorMap[color])}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-md bg-zinc-800/40 px-2 py-1.5">
      <p className="text-[9px] text-zinc-600 uppercase tracking-wide">{label}</p>
      <p className={cn('text-sm font-bold', accent)}>{value}</p>
    </div>
  );
}

function ForecastItem({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <div className={cn('rounded-lg border p-3 flex flex-col gap-1', bg)}>
      <p className={cn('text-xl font-bold', color)}>{count}</p>
      <p className="text-[11px] text-zinc-500">{label}</p>
    </div>
  );
}
