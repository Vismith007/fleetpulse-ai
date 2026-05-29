import { memo } from 'react';
import { Thermometer, Clock, Wifi } from 'lucide-react';
import type { Device } from '@fleetpulse/types';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from '../../lib/utils';
import { DeviceIcon } from './DeviceIcon';
import { StatusPill } from '../ui/StatusPill';
import { BatteryBar } from '../ui/BatteryBar';
import { AnomalyBadge } from '../ui/AnomalyBadge';

interface DeviceCardProps {
  device: Device;
  onClick: (device: Device) => void;
}

function getTempColor(temp: number): string {
  if (temp > 75) return 'text-red-400';
  if (temp > 55) return 'text-amber-400';
  if (temp > 40) return 'text-orange-400';
  return 'text-zinc-300';
}

function getCardGlow(device: Device): string {
  if (device.aiRiskLevel === 'critical') return 'border-red-900/60 shadow-red-500/10 shadow-lg';
  if (device.aiRiskLevel === 'high')     return 'border-orange-900/50 shadow-orange-500/8 shadow-md';
  if (device.status === 'offline')       return 'border-zinc-800/40 opacity-60';
  if (device.status === 'warning')       return 'border-amber-900/50';
  return 'border-zinc-800/60 hover:border-zinc-700/60';
}

function SignalBar({ strength }: { strength: number }) {
  // strength: -100 to -30 dBm
  const pct = Math.round(((strength + 100) / 70) * 100);
  const color = pct > 66 ? 'text-emerald-400' : pct > 33 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className={cn('flex items-end gap-0.5', color)} title={`${strength} dBm`}>
      {[25, 50, 75, 100].map((threshold) => (
        <div
          key={threshold}
          className={cn(
            'w-1 rounded-sm transition-all',
            pct >= threshold ? 'opacity-100' : 'opacity-20',
          )}
          style={{ height: `${threshold / 100 * 10 + 3}px`, backgroundColor: 'currentColor' }}
        />
      ))}
    </div>
  );
}

export const DeviceCard = memo(function DeviceCard({ device, onClick }: DeviceCardProps) {
  return (
    <button
      onClick={() => onClick(device)}
      className={cn(
        'group relative flex w-full flex-col gap-3 rounded-xl border bg-zinc-900/80 p-4 text-left',
        'backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800/80',
        getCardGlow(device),
      )}
    >
      {/* Critical glow overlay */}
      {device.aiRiskLevel === 'critical' && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-red-500/5 animate-pulse" />
      )}

      {/* Top edge highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-zinc-600/20 to-transparent" />

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
            device.status === 'offline' ? 'bg-zinc-800' : 'bg-zinc-800 group-hover:bg-zinc-700',
          )}>
            <DeviceIcon type={device.type} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100 group-hover:text-white">
              {device.name}
            </p>
            <p className="text-xs capitalize text-zinc-500">{device.model}</p>
          </div>
        </div>
        <StatusPill status={device.status} className="flex-shrink-0" />
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Thermometer className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
          <span className={cn('font-medium tabular-nums', getTempColor(device.temperature))}>
            {device.temperature.toFixed(1)}°C
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Wifi className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
          <SignalBar strength={device.signalStrength} />
        </div>
        <div className="flex items-center justify-end gap-1 text-zinc-500">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(device.lastSeen)}</span>
        </div>
      </div>

      {/* CPU/Memory mini bars */}
      <div className="grid grid-cols-2 gap-2">
        <MiniMetric label="CPU" value={device.cpuUsage} color="blue" />
        <MiniMetric label="MEM" value={device.memoryUsage} color="purple" />
      </div>

      {/* Battery */}
      <BatteryBar value={device.battery} />

      {/* AI badge */}
      {device.aiRiskLevel !== 'low' && (
        <div className="flex items-center justify-between pt-0.5">
          <AnomalyBadge score={device.anomalyScore} riskLevel={device.aiRiskLevel} />
          {device.aiPrediction && (
            <p className="ml-2 truncate text-[10px] text-zinc-500 italic">
              {device.aiPrediction.slice(0, 45)}…
            </p>
          )}
        </div>
      )}
    </button>
  );
});

function MiniMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'purple';
}) {
  const colorClass = color === 'blue' ? 'bg-blue-500' : 'bg-purple-500';
  const warningClass = value > 80 ? 'bg-amber-500' : value > 90 ? 'bg-red-500' : colorClass;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-zinc-500">
        <span>{label}</span>
        <span className="tabular-nums">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn('h-full rounded-full transition-all duration-700', warningClass)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
