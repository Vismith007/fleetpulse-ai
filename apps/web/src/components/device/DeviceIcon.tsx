import { Wifi, Cpu, Zap } from 'lucide-react';
import type { DeviceType } from '@fleetpulse/types';
import { cn } from '../../lib/utils';

interface DeviceIconProps {
  type: DeviceType;
  className?: string;
}

const ICON_MAP: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  sensor:   Cpu,
  gateway:  Wifi,
  actuator: Zap,
};

const COLOR_MAP: Record<DeviceType, string> = {
  sensor:   'text-blue-400',
  gateway:  'text-purple-400',
  actuator: 'text-orange-400',
};

export function DeviceIcon({ type, className }: DeviceIconProps) {
  const Icon = ICON_MAP[type];
  return <Icon className={cn('h-4 w-4', COLOR_MAP[type], className)} />;
}
