import { useState, useMemo } from 'react';
import {
  Cpu, Wifi, AlertTriangle, Thermometer,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { useFleet } from '../store/fleetStore';
import { DeviceCard } from '../components/device/DeviceCard';
import { GlowCard } from '../components/ui/GlowCard';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { DeviceCardSkeleton, StatCardSkeleton } from '../components/ui/SkeletonLoader';
import type { Device, DeviceStatus } from '@fleetpulse/types';
import { cn } from '../lib/utils';

type FilterOption = 'all' | DeviceStatus | 'critical';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  accent?: string;
  glowColor?: 'blue' | 'emerald' | 'amber' | 'red' | 'none';
  trend?: number;
}

function StatCard({ icon, label, value, decimals = 0, suffix = '', accent = 'text-zinc-100', glowColor = 'none', trend }: StatCardProps) {
  return (
    <GlowCard glowColor={glowColor} className="px-4 py-3 flex items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 ring-1 ring-zinc-700/50">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <div className="flex items-baseline gap-1">
          <AnimatedCounter value={value} decimals={decimals} className={cn('text-xl font-bold', accent)} />
          {suffix && <span className={cn('text-sm font-medium', accent)}>{suffix}</span>}
        </div>
      </div>
      {trend !== undefined && (
        <div className={cn(
          'flex items-center gap-0.5 text-xs font-medium',
          trend >= 0 ? 'text-emerald-400' : 'text-red-400',
        )}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </GlowCard>
  );
}

const FILTER_OPTIONS: { id: FilterOption; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'online',   label: 'Online' },
  { id: 'warning',  label: 'Warning' },
  { id: 'offline',  label: 'Offline' },
  { id: 'critical', label: 'AI Critical' },
];

export function DashboardView({ onSelectDevice }: { onSelectDevice: (device: Device) => void }) {
  const { state } = useFleet();
  const [filter, setFilter] = useState<FilterOption>('all');
  const [search, setSearch] = useState('');

  const { devices, alerts, isInitialized } = state;

  const filtered = useMemo(() => {
    let list = devices;
    if (filter !== 'all') {
      list = filter === 'critical'
        ? list.filter((d) => d.aiRiskLevel === 'critical' || d.aiRiskLevel === 'high')
        : list.filter((d) => d.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) => d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q) || d.model.toLowerCase().includes(q),
      );
    }
    return list;
  }, [devices, filter, search]);

  const onlineCount    = devices.filter((d) => d.status === 'online').length;
  const warningCount   = devices.filter((d) => d.status === 'warning').length;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const avgTemp        = devices.length > 0
    ? devices.reduce((s, d) => s + d.temperature, 0) / devices.length
    : 0;

  return (
    <div className="space-y-5 p-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {!isInitialized
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : (
            <>
              <StatCard
                icon={<Cpu className="h-5 w-5 text-blue-400" />}
                label="Fleet Size"
                value={devices.length}
                glowColor="blue"
              />
              <StatCard
                icon={<Wifi className="h-5 w-5 text-emerald-400" />}
                label="Online"
                value={onlineCount}
                suffix={`/ ${devices.length}`}
                accent={onlineCount === devices.length ? 'text-emerald-400' : 'text-zinc-100'}
                glowColor="emerald"
              />
              <StatCard
                icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
                label="Active Alerts"
                value={criticalAlerts + warningCount}
                accent={criticalAlerts > 0 ? 'text-amber-400' : 'text-zinc-100'}
                glowColor={criticalAlerts > 0 ? 'amber' : 'none'}
              />
              <StatCard
                icon={<Thermometer className="h-5 w-5 text-orange-400" />}
                label="Avg Temp"
                value={avgTemp}
                decimals={1}
                suffix="°C"
                accent={avgTemp > 60 ? 'text-orange-400' : 'text-zinc-100'}
              />
            </>
          )}
      </div>

      {/* Filter + Search bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {FILTER_OPTIONS.map((f) => {
            const count = f.id === 'all' ? devices.length
              : f.id === 'critical' ? devices.filter((d) => d.aiRiskLevel === 'critical' || d.aiRiskLevel === 'high').length
              : devices.filter((d) => d.status === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === f.id
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
                )}
              >
                {f.label}
                <span className={cn('ml-1.5 tabular-nums', filter === f.id ? 'opacity-80' : 'opacity-50')}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search devices…"
          className="ml-auto h-8 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700/30"
        />
      </div>

      {/* Device grid */}
      {!isInitialized ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <DeviceCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-20 text-zinc-600">
          <Cpu className="h-10 w-10" />
          <p className="text-sm">{search ? `No results for "${search}"` : `No ${filter} devices`}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((device) => (
            <DeviceCard key={device.id} device={device} onClick={onSelectDevice} />
          ))}
        </div>
      )}
    </div>
  );
}
