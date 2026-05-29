import type { DeviceStatus } from '@fleetpulse/types';
import { cn } from '../lib/utils';

interface StatusPillProps {
  status: DeviceStatus;
  className?: string;
}

const STATUS_STYLES: Record<DeviceStatus, string> = {
  online: 'bg-green-500/20 text-green-400 border-green-500/30',
  offline: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const STATUS_DOT: Record<DeviceStatus, string> = {
  online: 'bg-green-400',
  offline: 'bg-zinc-500',
  warning: 'bg-amber-400',
};

export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          STATUS_DOT[status],
          status === 'online' && 'animate-pulse',
        )}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
