import { useState, useEffect, useRef } from 'react';

export function useAnimatedCounter(
  target: number,
  duration = 600,
  decimals = 0,
): number {
  const [current, setCurrent] = useState(target);
  const prevRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = target;
    if (Math.abs(end - start) < 0.01) {
      setCurrent(end);
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = start + (end - start) * eased;
      const rounded = parseFloat(value.toFixed(decimals));
      setCurrent(rounded);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setCurrent(end);
        prevRef.current = end;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, decimals]);

  return current;
}
