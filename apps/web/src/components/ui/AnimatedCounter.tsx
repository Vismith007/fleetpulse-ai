import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
import { cn } from '../../lib/utils';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  decimals = 0,
  duration = 600,
  suffix = '',
  prefix = '',
  className,
}: AnimatedCounterProps) {
  const animated = useAnimatedCounter(value, duration, decimals);
  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{animated.toFixed(decimals)}{suffix}
    </span>
  );
}
