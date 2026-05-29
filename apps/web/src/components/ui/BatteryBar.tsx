import { cn } from '../../lib/utils';

interface BatteryBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

function getBatteryColor(v: number): string {
  if (v < 15) return 'bg-red-500';
  if (v < 30) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function BatteryBar({ value, className, showLabel = true }: BatteryBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-700', getBatteryColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-8 text-right text-xs tabular-nums text-zinc-500">{pct.toFixed(0)}%</span>
      )}
    </div>
  );
}
