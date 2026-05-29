import type { DeviceStatus } from '@fleetpulse/types';
import { cn } from '../../lib/utils';

interface StatusPillProps {
  status: DeviceStatus;
  className?: string;
}

const STATUS_STYLES: Record<DeviceStatus, string> = {
  online:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  offline: 'bg-zinc-500/15 text-zinc-500 border-zinc-600/25',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
};

const STATUS_DOT: Record<DeviceStatus, string> = {
  online:  'bg-emerald-400',
  offline: 'bg-zinc-600',
  warning: 'bg-amber-400',
};

export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
      STATUS_STYLES[status],
      className,
    )}>
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        STATUS_DOT[status],
        status === 'online' && 'animate-pulse',
      )} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
