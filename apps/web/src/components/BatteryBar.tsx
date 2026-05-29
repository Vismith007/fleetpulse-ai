import { cn } from '../lib/utils';

interface BatteryBarProps {
  value: number; // 0–100
  className?: string;
}

function getBatteryColor(value: number): string {
  if (value < 15) return 'bg-red-500';
  if (value < 30) return 'bg-amber-500';
  return 'bg-green-500';
}

export function BatteryBar({ value, className }: BatteryBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-700">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-700', getBatteryColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-zinc-400">{pct.toFixed(0)}%</span>
    </div>
  );
}
