import { useEffect, useState, useCallback } from 'react';
import {
  X, Power, Loader2, Cpu, HardDrive, Wifi, Thermometer,
  MapPin, Clock, Hash, Layers, Brain, FileText, RefreshCw,
  ShieldAlert, ShieldCheck, ChevronRight, Activity, Wrench,
  CheckCircle2, AlertCircle, Stethoscope,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { Device, Telemetry, LogEntry, AIInsight } from '@fleetpulse/types';
import { cn } from '../../lib/utils';
import { formatTimestamp, formatRelativeTime } from '../../lib/utils';
import { StatusPill } from '../ui/StatusPill';
import { DeviceIcon } from './DeviceIcon';
import { BatteryBar } from '../ui/BatteryBar';
import { AnomalyBadge } from '../ui/AnomalyBadge';
import { useDeviceDetail, useToggleDevice } from '../../hooks/useApi';

// ─── Styles ───────────────────────────────────────────────────────────────────

const LOG_LEVEL_STYLES = {
  debug: 'text-zinc-500',
  info:  'text-blue-400',
  warn:  'text-amber-400',
  error: 'text-red-400',
};

const AI_SEVERITY_STYLES = {
  low:      'border-emerald-800/40 bg-emerald-950/30 text-emerald-400',
  medium:   'border-amber-800/40 bg-amber-950/30 text-amber-400',
  high:     'border-orange-800/40 bg-orange-950/30 text-orange-400',
  critical: 'border-red-800/40 bg-red-950/30 text-red-400',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'telemetry' | 'logs' | 'ai' | 'maintenance' | 'diagnostics';

interface DeviceDetailPanelProps {
  device: Device | null;
  onClose: () => void;
  onDeviceUpdated: (device: Device) => void;
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

function buildChartData(history: Telemetry[]) {
  return history.map((h) => ({
    time: formatTimestamp(h.timestamp),
    temp: h.temperature,
    bat:  h.battery,
    cpu:  h.cpuUsage,
    mem:  h.memoryUsage,
  }));
}

function computeHealthScore(device: Device): number {
  const tempScore    = Math.max(0, 100 - Math.max(0, device.temperature - 40) * 2.5);
  const battScore    = device.battery;
  const cpuScore     = Math.max(0, 100 - device.cpuUsage);
  const memScore     = Math.max(0, 100 - device.memoryUsage);
  const signalScore  = Math.max(0, Math.min(100, ((device.signalStrength + 100) / 70) * 100));
  const anomalyScore = Math.max(0, 100 - device.anomalyScore);
  return Math.round(
    tempScore * 0.2 + battScore * 0.2 + cpuScore * 0.15 +
    memScore * 0.15 + signalScore * 0.1 + anomalyScore * 0.2,
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DeviceDetailPanel({ device, onClose, onDeviceUpdated }: DeviceDetailPanelProps) {
  const { data, loading: detailLoading, fetch: loadDetail } = useDeviceDetail();
  const { toggle, loading: toggleLoading } = useToggleDevice();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [localDevice, setLocalDevice] = useState<Device | null>(device);

  useEffect(() => {
    setLocalDevice(device);
    if (device) void loadDetail(device.id);
  }, [device, loadDetail]);

  useEffect(() => {
    if (!device) return;
    const t = setInterval(() => void loadDetail(device.id), 5000);
    return () => clearInterval(t);
  }, [device, loadDetail]);

  useEffect(() => {
    if (data) setLocalDevice(data.device);
  }, [data]);

  const handleToggle = useCallback(async () => {
    if (!localDevice) return;
    const updated = await toggle(localDevice.id);
    if (updated) { setLocalDevice(updated); onDeviceUpdated(updated); }
  }, [localDevice, toggle, onDeviceUpdated]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const isOpen    = device !== null;
  const d         = localDevice ?? device;
  const history   = data?.history ?? [];
  const logs      = data?.recentLogs ?? [];
  const insights  = data?.aiInsights ?? [];
  const healthScore = d ? computeHealthScore(d) : 0;

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview',     label: 'Overview' },
    { id: 'telemetry',    label: 'Telemetry' },
    { id: 'logs',         label: 'Logs',     badge: logs.filter((l) => l.level === 'error' || l.level === 'warn').length || undefined },
    { id: 'ai',           label: 'AI',       badge: insights.length || undefined },
    { id: 'maintenance',  label: 'Maint.' },
    { id: 'diagnostics',  label: 'Diag.' },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      )}

      <div className={cn(
        'fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}>
        {!d ? null : (
          <>
            {/* ── Header ── */}
            <div className="flex items-center gap-3 border-b border-zinc-800/60 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 ring-1 ring-zinc-700">
                <DeviceIcon type={d.type} className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="truncate text-base font-bold text-zinc-100">{d.name}</h2>
                <p className="text-xs text-zinc-500">{d.model} · {d.serialNumber}</p>
              </div>
              <StatusPill status={d.status} />
              <button onClick={onClose} className="ml-2 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── AI Risk Banner ── */}
            {d.aiRiskLevel !== 'low' && d.aiPrediction && (
              <div className={cn(
                'flex items-start gap-2 border-b px-5 py-3 text-sm',
                AI_SEVERITY_STYLES[d.aiRiskLevel], 'border-current/20',
              )}>
                {d.aiRiskLevel === 'critical'
                  ? <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  : <Brain className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                <p className="leading-snug">{d.aiPrediction}</p>
              </div>
            )}

            {/* ── Tabs ── */}
            <div className="flex gap-0.5 border-b border-zinc-800 px-4 overflow-x-auto scrollbar-none">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex-shrink-0 px-3 py-2.5 text-xs font-medium capitalize transition-colors',
                    activeTab === tab.id
                      ? 'text-blue-400 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-blue-400'
                      : 'text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-1 rounded-full bg-red-500/80 px-1 text-[9px] text-white">{tab.badge}</span>
                  )}
                </button>
              ))}
              {detailLoading && <Loader2 className="ml-auto self-center h-3 w-3 animate-spin text-zinc-600 flex-shrink-0" />}
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto">

              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div className="p-5 space-y-5">
                  {/* Health score */}
                  <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <HealthScoreRing score={healthScore} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-zinc-200">Device Health Score</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                        {healthScore >= 80 ? 'Operating within normal parameters. No action required.'
                          : healthScore >= 60 ? 'Minor anomalies detected. Monitor closely over next 24h.'
                          : 'Significant degradation detected. Maintenance recommended soon.'}
                      </p>
                      <div className="mt-2 flex gap-3">
                        <AnomalyBadge score={d.anomalyScore} riskLevel={d.aiRiskLevel} />
                      </div>
                    </div>
                  </div>

                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <MetaItem icon={Thermometer} label="Temperature" value={`${d.temperature.toFixed(1)}°C`}
                      accent={d.temperature > 70 ? 'text-red-400' : d.temperature > 55 ? 'text-amber-400' : undefined} />
                    <MetaItem icon={Cpu}         label="CPU Usage"   value={`${d.cpuUsage.toFixed(1)}%`}
                      accent={d.cpuUsage > 80 ? 'text-red-400' : undefined} />
                    <MetaItem icon={HardDrive}   label="Memory"      value={`${d.memoryUsage.toFixed(1)}%`}
                      accent={d.memoryUsage > 85 ? 'text-amber-400' : undefined} />
                    <MetaItem icon={Wifi}        label="Signal"      value={`${d.signalStrength} dBm`}
                      accent={d.signalStrength < -85 ? 'text-red-400' : undefined} />
                    <MetaItem icon={Layers}      label="Firmware"    value={d.firmwareVersion} />
                    <MetaItem icon={Hash}        label="IP Address"  value={d.ipAddress} />
                    <MetaItem icon={Clock}       label="Uptime"      value={formatUptime(d.uptimeSeconds)} />
                    <MetaItem icon={MapPin}      label="Location"    value={`${d.location.lat.toFixed(4)}, ${d.location.lng.toFixed(4)}`} />
                    <MetaItem icon={Activity}    label="Last Seen"   value={formatRelativeTime(d.lastSeen)} />
                  </div>

                  {/* Battery */}
                  <section>
                    <p className="mb-1.5 text-xs font-medium text-zinc-400">Battery · {d.battery.toFixed(1)}%</p>
                    <BatteryBar value={d.battery} />
                  </section>

                  {/* Quick metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    <MiniMeter label="CPU" value={d.cpuUsage} color={d.cpuUsage > 80 ? '#ef4444' : '#60a5fa'} />
                    <MiniMeter label="Memory" value={d.memoryUsage} color={d.memoryUsage > 85 ? '#f59e0b' : '#a78bfa'} />
                    <MiniMeter label="Battery" value={d.battery} color={d.battery < 20 ? '#ef4444' : '#10b981'} />
                  </div>
                </div>
              )}

              {/* Tab: Telemetry */}
              {activeTab === 'telemetry' && (
                <div className="p-5 space-y-4">
                  {history.length === 0 ? (
                    <EmptyState icon={RefreshCw} message="Collecting telemetry…" />
                  ) : (
                    <>
                      <p className="text-xs text-zinc-500">Historical sensor data · last {history.length} readings</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={buildChartData(history)} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                          <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '11px' }} labelStyle={{ color: '#71717a' }} />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                          <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={1.5} dot={false} name="Temp °C" />
                          <Line type="monotone" dataKey="bat"  stroke="#22c55e" strokeWidth={1.5} dot={false} name="Battery %" />
                          <Line type="monotone" dataKey="cpu"  stroke="#60a5fa" strokeWidth={1.5} dot={false} name="CPU %" />
                          <Line type="monotone" dataKey="mem"  stroke="#a78bfa" strokeWidth={1.5} dot={false} name="Memory %" />
                        </LineChart>
                      </ResponsiveContainer>
                      {/* Snapshot */}
                      <div className="grid grid-cols-2 gap-2">
                        <TelemetrySnapshot history={history} />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab: Logs */}
              {activeTab === 'logs' && (
                <div className="p-5 space-y-1">
                  {logs.length === 0 ? (
                    <EmptyState icon={FileText} message="No recent logs" />
                  ) : logs.map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))}
                </div>
              )}

              {/* Tab: AI Insights */}
              {activeTab === 'ai' && (
                <div className="p-5 space-y-3">
                  {insights.length === 0 ? (
                    <EmptyState icon={ShieldCheck} message="No anomalies detected" />
                  ) : insights.map((insight) => (
                    <InsightRow key={insight.id} insight={insight} />
                  ))}
                </div>
              )}

              {/* Tab: Maintenance */}
              {activeTab === 'maintenance' && (
                <div className="p-5 space-y-4">
                  <MaintenanceTab device={d} insights={insights} />
                </div>
              )}

              {/* Tab: Diagnostics */}
              {activeTab === 'diagnostics' && (
                <div className="p-5 space-y-4">
                  <DiagnosticsTab device={d} />
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="border-t border-zinc-800 p-4">
              <button
                onClick={() => void handleToggle()}
                disabled={toggleLoading}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all',
                  d.status === 'offline'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200',
                  toggleLoading && 'cursor-not-allowed opacity-50',
                )}
              >
                {toggleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                {d.status === 'offline' ? 'Bring Online' : 'Take Offline'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Health score ring ────────────────────────────────────────────────────────

function HealthScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex-shrink-0">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#27272a" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{score}</span>
        <span className="text-[8px] text-zinc-600">health</span>
      </div>
    </div>
  );
}

// ─── Mini meter bar ───────────────────────────────────────────────────────────

function MiniMeter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-zinc-500">{label}</span>
        <span className="text-[10px] font-medium text-zinc-300">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1 w-full rounded-full bg-zinc-700">
        <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── MetaItem ─────────────────────────────────────────────────────────────────

function MetaItem({
  icon: Icon, label, value, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 px-3 py-2">
      <div className="flex items-center gap-1 text-xs text-zinc-500">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <p className={cn('mt-0.5 truncate text-sm font-medium', accent ?? 'text-zinc-200')}>{value}</p>
    </div>
  );
}

// ─── Telemetry snapshot ───────────────────────────────────────────────────────

function TelemetrySnapshot({ history }: { history: Telemetry[] }) {
  if (history.length < 2) return null;
  const latest = history[history.length - 1];
  const prev   = history[history.length - 2];
  const delta  = (a: number, b: number) => a - b;
  const items = [
    { label: 'Temperature', val: `${latest.temperature.toFixed(1)}°C`, d: delta(latest.temperature, prev.temperature), unit: '°C' },
    { label: 'Battery', val: `${latest.battery.toFixed(1)}%`, d: delta(latest.battery, prev.battery), unit: '%' },
    { label: 'CPU', val: `${latest.cpuUsage.toFixed(1)}%`, d: delta(latest.cpuUsage, prev.cpuUsage), unit: '%' },
    { label: 'Memory', val: `${latest.memoryUsage.toFixed(1)}%`, d: delta(latest.memoryUsage, prev.memoryUsage), unit: '%' },
  ];
  return (
    <>
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5">
          <p className="text-[10px] text-zinc-500">{item.label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-zinc-100">{item.val}</span>
            <span className={cn('text-[10px] font-medium', item.d > 0 ? 'text-red-400' : 'text-emerald-400')}>
              {item.d > 0 ? '+' : ''}{item.d.toFixed(1)}{item.unit}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

// ─── LogRow ───────────────────────────────────────────────────────────────────

function LogRow({ log }: { log: LogEntry }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-zinc-900/60 px-3 py-2 font-mono text-xs">
      <span className="flex-shrink-0 text-zinc-600">{formatTimestamp(log.timestamp)}</span>
      <span className={cn('flex-shrink-0 uppercase font-bold', LOG_LEVEL_STYLES[log.level])}>
        [{log.level}]
      </span>
      <span className="text-zinc-400 leading-relaxed">{log.message}</span>
    </div>
  );
}

// ─── InsightRow ───────────────────────────────────────────────────────────────

function InsightRow({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={cn('rounded-lg border p-3 space-y-1.5', AI_SEVERITY_STYLES[insight.severity])}>
      <button className="w-full text-left" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">{insight.title}</p>
          <span className="flex-shrink-0 text-xs opacity-70">{insight.confidence}%</span>
        </div>
      </button>
      <p className="text-xs opacity-80 leading-snug">{insight.description}</p>
      {expanded && (
        <div className="space-y-1.5 pt-1 border-t border-current/20">
          {insight.recommendedAction && (
            <div className="text-xs">
              <span className="font-semibold opacity-70">Action: </span>
              <span className="opacity-80">{insight.recommendedAction}</span>
            </div>
          )}
          {insight.businessImpact && (
            <div className="text-xs">
              <span className="font-semibold opacity-70">Impact: </span>
              <span className="opacity-80">{insight.businessImpact}</span>
            </div>
          )}
          {insight.riskScore !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] opacity-70">Risk Score:</span>
              <div className="flex-1 h-1 bg-black/20 rounded-full">
                <div className="h-1 rounded-full bg-current opacity-60 transition-all"
                  style={{ width: `${insight.riskScore}%` }} />
              </div>
              <span className="text-[10px] font-semibold">{insight.riskScore}/100</span>
            </div>
          )}
        </div>
      )}
      {insight.estimatedTimeToFailure && (
        <div className="flex items-center gap-1 text-xs font-medium">
          <ChevronRight className="h-3 w-3" />
          TTF: {insight.estimatedTimeToFailure}
        </div>
      )}
      <p className="text-[10px] opacity-50">{formatRelativeTime(insight.timestamp)}</p>
    </div>
  );
}

// ─── Maintenance Tab ──────────────────────────────────────────────────────────

function MaintenanceTab({ device, insights }: { device: Device; insights: AIInsight[] }) {
  const priority = device.aiRiskLevel === 'critical' ? 'immediate' :
    device.aiRiskLevel === 'high' ? 'high' :
    device.aiRiskLevel === 'medium' ? 'medium' : 'low';

  const priorityStyle = {
    immediate: 'text-red-400 border-red-800/40 bg-red-950/30',
    high: 'text-orange-400 border-orange-800/40 bg-orange-950/30',
    medium: 'text-amber-400 border-amber-800/40 bg-amber-950/30',
    low: 'text-emerald-400 border-emerald-800/40 bg-emerald-950/30',
  }[priority];

  const daysUptime = Math.floor(device.uptimeSeconds / 86400);

  const maintenanceTasks = [
    { done: device.battery > 20,   label: 'Battery level acceptable (>20%)',  icon: CheckCircle2 },
    { done: device.temperature < 70, label: 'Temperature within safe range (<70°C)', icon: CheckCircle2 },
    { done: device.cpuUsage < 85,  label: 'CPU load within limits (<85%)',    icon: CheckCircle2 },
    { done: device.signalStrength > -90, label: 'Signal strength adequate (>-90 dBm)', icon: CheckCircle2 },
    { done: parseInt(device.firmwareVersion.split('.')[1] ?? '0', 10) >= 6,
      label: 'Firmware up to date (v2.6+)',                                   icon: CheckCircle2 },
    { done: daysUptime < 90,       label: 'Within 90-day maintenance cycle',  icon: CheckCircle2 },
  ];

  const passCount = maintenanceTasks.filter((t) => t.done).length;

  return (
    <>
      <div className={cn('rounded-lg border p-3', priorityStyle)}>
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          <p className="text-sm font-semibold">Maintenance Priority: {priority.charAt(0).toUpperCase() + priority.slice(1)}</p>
        </div>
        <p className="text-xs opacity-70 mt-1">
          Device has been running for {daysUptime} days. {
            priority === 'immediate' ? 'Requires immediate attention.' :
            priority === 'high' ? 'Schedule within 48 hours.' :
            priority === 'medium' ? 'Schedule within 7 days.' :
            'No urgent maintenance needed.'
          }
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-zinc-400">Health Checklist</p>
          <span className="text-xs text-zinc-500">{passCount}/{maintenanceTasks.length} passed</span>
        </div>
        <div className="space-y-1.5">
          {maintenanceTasks.map((task) => (
            <div key={task.label} className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-xs',
              task.done ? 'bg-emerald-950/20 text-emerald-400' : 'bg-red-950/20 text-red-400',
            )}>
              {task.done
                ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                : <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />}
              {task.label}
            </div>
          ))}
        </div>
      </div>

      {insights.filter((i) => i.maintenancePriority === 'immediate' || i.maintenancePriority === 'high').length > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-400 mb-2">AI Maintenance Recommendations</p>
          <div className="space-y-2">
            {insights
              .filter((i) => i.maintenancePriority === 'immediate' || i.maintenancePriority === 'high')
              .slice(0, 3)
              .map((insight) => (
                <div key={insight.id} className="rounded-md bg-zinc-800/40 border border-zinc-800 p-2.5 text-xs">
                  <p className="font-semibold text-zinc-200">{insight.title}</p>
                  <p className="text-zinc-500 mt-0.5">{insight.recommendedAction}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Diagnostics Tab ──────────────────────────────────────────────────────────

function DiagnosticsTab({ device }: { device: Device }) {
  const checks = [
    { label: 'Network Connectivity', status: device.signalStrength > -90 ? 'pass' : 'fail', detail: `Signal: ${device.signalStrength} dBm` },
    { label: 'Thermal Management', status: device.temperature < 70 ? 'pass' : device.temperature < 80 ? 'warn' : 'fail', detail: `${device.temperature.toFixed(1)}°C` },
    { label: 'Power System', status: device.battery > 20 ? 'pass' : device.battery > 8 ? 'warn' : 'fail', detail: `${device.battery.toFixed(1)}% battery` },
    { label: 'CPU Health', status: device.cpuUsage < 80 ? 'pass' : device.cpuUsage < 90 ? 'warn' : 'fail', detail: `${device.cpuUsage.toFixed(1)}% load` },
    { label: 'Memory Integrity', status: device.memoryUsage < 80 ? 'pass' : device.memoryUsage < 90 ? 'warn' : 'fail', detail: `${device.memoryUsage.toFixed(1)}% used` },
    { label: 'Anomaly Detection', status: device.anomalyScore < 40 ? 'pass' : device.anomalyScore < 70 ? 'warn' : 'fail', detail: `Score: ${device.anomalyScore}/100` },
    { label: 'Device Reachability', status: device.status !== 'offline' ? 'pass' : 'fail', detail: device.status },
  ] as const;

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;

  const statusStyle = {
    pass: 'text-emerald-400 bg-emerald-950/30 border-emerald-800/30',
    warn: 'text-amber-400 bg-amber-950/30 border-amber-800/30',
    fail: 'text-red-400 bg-red-950/30 border-red-800/30',
  };
  const statusIcon = {
    pass: <CheckCircle2 className="h-3.5 w-3.5" />,
    warn: <AlertCircle className="h-3.5 w-3.5" />,
    fail: <AlertCircle className="h-3.5 w-3.5" />,
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Stethoscope className="h-4 w-4 text-zinc-400" />
        <p className="text-xs font-medium text-zinc-400">System Diagnostics</p>
        <div className="ml-auto flex gap-2 text-[10px]">
          <span className="text-emerald-400">{passCount} pass</span>
          <span className="text-amber-400">{warnCount} warn</span>
          <span className="text-red-400">{failCount} fail</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {checks.map((check) => (
          <div key={check.label} className={cn(
            'flex items-center justify-between rounded-md border px-3 py-2 text-xs',
            statusStyle[check.status],
          )}>
            <div className="flex items-center gap-2">
              {statusIcon[check.status]}
              <span className="font-medium">{check.label}</span>
            </div>
            <span className="opacity-70">{check.detail}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
        <p className="text-xs font-medium text-zinc-400">Device Identifiers</p>
        <div className="grid grid-cols-1 gap-1 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-zinc-600">Device ID</span>
            <span className="text-zinc-400">{device.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Serial</span>
            <span className="text-zinc-400">{device.serialNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">IP Address</span>
            <span className="text-zinc-400">{device.ipAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Model</span>
            <span className="text-zinc-400">{device.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Firmware</span>
            <span className="text-zinc-400">{device.firmwareVersion}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Type</span>
            <span className="text-zinc-400 capitalize">{device.type}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-zinc-600">
      <Icon className="h-8 w-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
