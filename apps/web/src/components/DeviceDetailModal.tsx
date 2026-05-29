import { useEffect, useState } from 'react';
import { X, MapPin, Power, Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Device, Telemetry } from '@fleetpulse/types';
import { cn } from '../lib/utils';
import { StatusPill } from './StatusPill';
import { DeviceIcon } from './DeviceIcon';
import { BatteryBar } from './BatteryBar';
import { useDeviceDetail, useToggleDevice } from '../hooks/useApi';
import { formatTimestamp } from '../lib/utils';

interface DeviceDetailModalProps {
  device: Device | null;
  onClose: () => void;
  onDeviceUpdated: (device: Device) => void;
}

interface ChartDataPoint {
  time: string;
  temperature: number;
  battery: number;
}

function buildChartData(history: Telemetry[]): ChartDataPoint[] {
  return history.map((h) => ({
    time: formatTimestamp(h.timestamp),
    temperature: h.temperature,
    battery: h.battery,
  }));
}

export function DeviceDetailModal({ device, onClose, onDeviceUpdated }: DeviceDetailModalProps) {
  const { data, loading: detailLoading, fetch: fetchDetail } = useDeviceDetail();
  const { toggle, loading: toggleLoading } = useToggleDevice();
  const [localDevice, setLocalDevice] = useState<Device | null>(device);

  useEffect(() => {
    setLocalDevice(device);
    if (device) {
      void fetchDetail(device.id);
    }
  }, [device, fetchDetail]);

  // Refresh detail every 4 s while modal is open
  useEffect(() => {
    if (!device) return;
    const timer = setInterval(() => void fetchDetail(device.id), 4000);
    return () => clearInterval(timer);
  }, [device, fetchDetail]);

  useEffect(() => {
    if (data) {
      setLocalDevice(data.device);
    }
  }, [data]);

  if (!device) return null;

  const displayDevice = localDevice ?? device;
  const history = data?.history ?? [];
  const chartData = buildChartData(history);

  const handleToggle = async () => {
    const updated = await toggle(displayDevice.id);
    if (updated) {
      setLocalDevice(updated);
      onDeviceUpdated(updated);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 flex w-full max-w-2xl animate-fade-in flex-col gap-5 rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 ring-1 ring-zinc-700">
            <DeviceIcon type={displayDevice.type} className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">{displayDevice.name}</h2>
            <p className="text-xs capitalize text-zinc-500">{displayDevice.type}</p>
          </div>
          <StatusPill status={displayDevice.status} className="ml-auto" />
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetaItem label="Temperature" value={`${displayDevice.temperature.toFixed(1)}°C`} />
          <MetaItem label="Battery" value={`${displayDevice.battery.toFixed(1)}%`} />
          <MetaItem label="Last Seen" value={formatTimestamp(displayDevice.lastSeen)} />
          <MetaItem
            label="Location"
            value={`${displayDevice.location.lat.toFixed(4)}, ${displayDevice.location.lng.toFixed(4)}`}
            icon={<MapPin className="h-3 w-3" />}
          />
          <MetaItem label="Device ID" value={displayDevice.id.slice(0, 8) + '…'} />
          <MetaItem label="Type" value={displayDevice.type} className="capitalize" />
        </div>

        {/* Battery */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-400">Battery Level</p>
          <BatteryBar value={displayDevice.battery} />
        </div>

        {/* Chart */}
        <div>
          <p className="mb-3 text-xs font-medium text-zinc-400">
            Telemetry History
            {detailLoading && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
          </p>
          {chartData.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-zinc-800 text-sm text-zinc-500">
              No history yet — collecting data…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  name="Temp (°C)"
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="battery"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  name="Battery (%)"
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => void handleToggle()}
          disabled={toggleLoading}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
            displayDevice.status === 'offline'
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100',
            toggleLoading && 'cursor-not-allowed opacity-60',
          )}
        >
          {toggleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Power className="h-4 w-4" />
          )}
          {displayDevice.status === 'offline' ? 'Bring Online' : 'Take Offline'}
        </button>
      </div>
    </div>
  );
}

interface MetaItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  className?: string;
}

function MetaItem({ label, value, icon, className }: MetaItemProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={cn('mt-0.5 flex items-center gap-1 text-sm font-medium text-zinc-200', className)}>
        {icon}
        {value}
      </p>
    </div>
  );
}
