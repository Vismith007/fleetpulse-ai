import { Cpu, Wifi, AlertTriangle, Thermometer } from 'lucide-react';
import type { Device, Alert } from '@fleetpulse/types';

interface StatsBarProps {
  devices: Device[];
  alerts: Alert[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: string;
}

function StatCard({ icon, label, value, accent = 'text-zinc-100' }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800">
        {icon}
      </div>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className={`text-lg font-bold tabular-nums leading-tight ${accent}`}>{value}</p>
      </div>
    </div>
  );
}

export function StatsBar({ devices, alerts }: StatsBarProps) {
  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const activeAlerts = alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning').length;
  const avgTemp =
    devices.length > 0
      ? (devices.reduce((sum, d) => sum + d.temperature, 0) / devices.length).toFixed(1)
      : '—';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={<Cpu className="h-5 w-5 text-blue-400" />}
        label="Total Devices"
        value={devices.length}
      />
      <StatCard
        icon={<Wifi className="h-5 w-5 text-green-400" />}
        label="Online"
        value={`${onlineCount} / ${devices.length}`}
        accent={onlineCount === devices.length ? 'text-green-400' : 'text-zinc-100'}
      />
      <StatCard
        icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
        label="Active Alerts"
        value={activeAlerts}
        accent={activeAlerts > 0 ? 'text-amber-400' : 'text-zinc-100'}
      />
      <StatCard
        icon={<Thermometer className="h-5 w-5 text-orange-400" />}
        label="Avg Temperature"
        value={avgTemp === '—' ? '—' : `${avgTemp}°C`}
      />
    </div>
  );
}
