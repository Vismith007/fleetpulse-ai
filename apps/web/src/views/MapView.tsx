import { useState, useMemo } from 'react';
import type { Device } from '@fleetpulse/types';
import { useFleet } from '../store/fleetStore';
import { cn } from '../lib/utils';
import { StatusPill } from '../components/ui/StatusPill';
import { AnomalyBadge } from '../components/ui/AnomalyBadge';
import { DeviceIcon } from '../components/device/DeviceIcon';
import { Thermometer, Battery, Wifi } from 'lucide-react';

// ─── Projection ───────────────────────────────────────────────────────────────
// All devices cluster around San Francisco (37.77–37.85 lat, -122.42 – -122.40 lng)
// We map this to a canvas area within the SVG

const MAP_W = 900;
const MAP_H = 500;

// Viewport bounds (slightly wider than device cluster)
const LAT_MIN = 37.768;
const LAT_MAX = 37.790;
const LNG_MIN = -122.426;
const LNG_MAX = -122.400;

const MARGIN = { top: 60, right: 60, bottom: 60, left: 60 };
const PLOT_W = MAP_W - MARGIN.left - MARGIN.right;
const PLOT_H = MAP_H - MARGIN.top - MARGIN.bottom;

function project(lat: number, lng: number): { x: number; y: number } {
  const x = MARGIN.left + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * PLOT_W;
  // Latitude increases upward, SVG y increases downward
  const y = MARGIN.top + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * PLOT_H;
  return { x, y };
}

// ─── Grid lines ───────────────────────────────────────────────────────────────

function GridLines() {
  const latLines = Array.from({ length: 7 }, (_, i) => LAT_MIN + (i * (LAT_MAX - LAT_MIN)) / 6);
  const lngLines = Array.from({ length: 9 }, (_, i) => LNG_MIN + (i * (LNG_MAX - LNG_MIN)) / 8);

  return (
    <g className="opacity-20">
      {latLines.map((lat) => {
        const { x: x1, y } = project(lat, LNG_MIN);
        const { x: x2 }    = project(lat, LNG_MAX);
        return (
          <g key={lat}>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke="#3f3f46" strokeWidth={0.5} />
            <text x={MARGIN.left - 6} y={y + 4} fill="#52525b" fontSize="8" textAnchor="end">
              {lat.toFixed(3)}°
            </text>
          </g>
        );
      })}
      {lngLines.map((lng) => {
        const { x, y: y1 } = project(LAT_MAX, lng);
        const { y: y2 }    = project(LAT_MIN, lng);
        return (
          <g key={lng}>
            <line x1={x} y1={y1} x2={x} y2={y2} stroke="#3f3f46" strokeWidth={0.5} />
            <text x={x} y={MAP_H - MARGIN.bottom + 14} fill="#52525b" fontSize="8" textAnchor="middle">
              {lng.toFixed(3)}°
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ─── Device marker ────────────────────────────────────────────────────────────

const STATUS_COLORS = { online: '#22c55e', offline: '#52525b', warning: '#f59e0b' };
const RISK_GLOW     = { low: 'none', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

function DeviceMarker({
  device,
  selected,
  onClick,
}: {
  device: Device;
  selected: boolean;
  onClick: (d: Device) => void;
}) {
  const { x, y } = project(device.location.lat, device.location.lng);
  const color = STATUS_COLORS[device.status];
  const glow = RISK_GLOW[device.aiRiskLevel];

  return (
    <g
      onClick={() => onClick(device)}
      className="cursor-pointer"
      style={{ filter: glow !== 'none' ? `drop-shadow(0 0 6px ${glow})` : undefined }}
    >
      {/* Pulse ring for online devices */}
      {device.status === 'online' && (
        <>
          <circle cx={x} cy={y} r="14" fill="none" stroke={color} strokeWidth="1" opacity="0.3">
            <animate attributeName="r" values="10;20;10" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* Main marker */}
      <circle
        cx={x} cy={y} r={selected ? 10 : 7}
        fill={color}
        stroke={selected ? '#fff' : 'rgba(0,0,0,0.5)'}
        strokeWidth={selected ? 2 : 1}
        className="transition-all duration-200"
        opacity={device.status === 'offline' ? 0.4 : 1}
      />

      {/* Label */}
      <text
        x={x} y={y - 14}
        fill={selected ? '#fff' : '#a1a1aa'}
        fontSize="9"
        textAnchor="middle"
        fontWeight={selected ? '700' : '400'}
        className="pointer-events-none select-none"
      >
        {device.name.split(' ').pop()}
      </text>
    </g>
  );
}

// ─── Map View ─────────────────────────────────────────────────────────────────

export function MapView({ onSelectDevice }: { onSelectDevice: (d: Device) => void }) {
  const { state } = useFleet();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { devices } = state;

  const hoveredDevice = useMemo(
    () => devices.find((d) => d.id === hoveredId) ?? null,
    [devices, hoveredId],
  );

  return (
    <div className="flex h-full flex-col gap-0 p-6">
      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="font-semibold text-zinc-300">Fleet Map</span>
        {[
          { color: '#22c55e', label: 'Online' },
          { color: '#f59e0b', label: 'Warning' },
          { color: '#52525b', label: 'Offline' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            {label}
          </div>
        ))}
        <span className="ml-auto">{devices.length} devices · SF Bay Area</span>
      </div>

      <div className="flex flex-1 gap-5 min-h-0">
        {/* Map canvas */}
        <div className="relative flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          {/* Scan-line overlay */}
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.05)_2px,rgba(0,0,0,0.05)_4px)]" />
          {/* Corner brackets */}
          <div className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l border-t border-blue-800/50" />
          <div className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r border-t border-blue-800/50" />
          <div className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b border-l border-blue-800/50" />
          <div className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b border-r border-blue-800/50" />

          <svg
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            className="h-full w-full"
            onMouseLeave={() => setHoveredId(null)}
          >
            <defs>
              <radialGradient id="mapBg" cx="50%" cy="50%" r="70%">
                <stop offset="0%"   stopColor="#0a0a12" />
                <stop offset="100%" stopColor="#050508" />
              </radialGradient>
            </defs>
            <rect width={MAP_W} height={MAP_H} fill="url(#mapBg)" />
            <GridLines />

            {/* Heatmap blobs for online devices */}
            {devices.filter((d) => d.status !== 'offline').map((d) => {
              const { x, y } = project(d.location.lat, d.location.lng);
              const riskColor = d.aiRiskLevel === 'critical' ? '#ef4444'
                : d.aiRiskLevel === 'high' ? '#f97316'
                : '#3b82f6';
              return (
                <circle
                  key={`heat-${d.id}`}
                  cx={x} cy={y} r="40"
                  fill={riskColor}
                  opacity="0.04"
                />
              );
            })}

            {devices.map((d) => (
              <g
                key={d.id}
                onMouseEnter={() => setHoveredId(d.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <DeviceMarker
                  device={d}
                  selected={hoveredId === d.id}
                  onClick={onSelectDevice}
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Side panel */}
        <div className="w-64 flex-shrink-0 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950">
          {hoveredDevice ? (
            <DeviceMapCard device={hoveredDevice} onOpen={onSelectDevice} />
          ) : (
            <div className="p-4">
              <p className="mb-3 text-xs font-semibold text-zinc-400">Fleet Status</p>
              <div className="space-y-1">
                {devices.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onSelectDevice(d)}
                    onMouseEnter={() => setHoveredId(d.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-zinc-800/60 transition-colors"
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ background: STATUS_COLORS[d.status] }}
                    />
                    <span className="truncate text-zinc-300">{d.name}</span>
                    {d.aiRiskLevel === 'critical' && (
                      <span className="ml-auto text-red-400 font-bold">!</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeviceMapCard({ device, onOpen }: { device: Device; onOpen: (d: Device) => void }) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
          <DeviceIcon type={device.type} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{device.name}</p>
          <p className="text-[10px] text-zinc-500">{device.model}</p>
        </div>
      </div>
      <StatusPill status={device.status} />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1 text-zinc-400">
          <Thermometer className="h-3 w-3" />
          <span>{device.temperature.toFixed(1)}°C</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <Battery className="h-3 w-3" />
          <span>{device.battery.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <Wifi className="h-3 w-3" />
          <span>{device.signalStrength} dBm</span>
        </div>
      </div>
      {device.aiRiskLevel !== 'low' && (
        <AnomalyBadge score={device.anomalyScore} riskLevel={device.aiRiskLevel} />
      )}
      <button
        onClick={() => onOpen(device)}
        className="w-full rounded-lg bg-blue-600/15 border border-blue-700/30 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-600/25 transition-colors"
      >
        View Details →
      </button>
    </div>
  );
}
