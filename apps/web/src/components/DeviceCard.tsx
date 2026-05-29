import { Thermometer, Clock } from 'lucide-react';
import type { Device } from '@fleetpulse/types';
import { cn } from '../lib/utils';
import { StatusPill } from './StatusPill';
import { DeviceIcon } from './DeviceIcon';
import { BatteryBar } from './BatteryBar';
import { formatRelativeTime } from '../lib/utils';

interface DeviceCardProps {
  device: Device;
  onClick: (device: Device) => void;
}

function getTempColor(temp: number): string {
  if (temp > 75) return 'text-red-400';
  if (temp > 60) return 'text-amber-400';
  return 'text-zinc-300';
}

export function DeviceCard({ device, onClick }: DeviceCardProps) {
  return (
    <button
      onClick={() => onClick(device)}
      className={cn(
        'group relative flex w-full flex-col gap-3 rounded-xl border bg-zinc-900 p-4 text-left',
        'transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800/80 hover:shadow-lg hover:shadow-black/30',
        device.status === 'offline'
          ? 'border-zinc-700/50 opacity-70'
          : device.status === 'warning'
          ? 'border-amber-800/50'
          : 'border-zinc-800',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800 ring-1 ring-zinc-700">
            <DeviceIcon type={device.type} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100 group-hover:text-white">
              {device.name}
            </p>
            <p className="text-xs capitalize text-zinc-500">{device.type}</p>
          </div>
        </div>
        <StatusPill status={device.status} className="flex-shrink-0" />
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Thermometer className="h-4 w-4 text-zinc-500" />
          <span className={cn('text-sm font-medium tabular-nums', getTempColor(device.temperature))}>
            {device.temperature.toFixed(1)}°C
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(device.lastSeen)}</span>
        </div>
      </div>

      {/* Battery */}
      <BatteryBar value={device.battery} />
    </button>
  );
}
