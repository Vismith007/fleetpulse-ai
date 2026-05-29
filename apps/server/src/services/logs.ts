import { v4 as uuidv4 } from 'uuid';
import type { Device, LogEntry, LogLevel } from '@fleetpulse/types';

const MAX_LOGS = 200;
const logStore: LogEntry[] = [];

// ─── Log templates ────────────────────────────────────────────────────────────

interface LogTemplate {
  level: LogLevel;
  message: (device: Device) => string;
  condition: (device: Device) => boolean;
  weight: number; // relative probability
}

const TEMPLATES: LogTemplate[] = [
  { level: 'info',  message: () => `Telemetry packet transmitted. Seq=${Math.floor(Math.random() * 99999)}`,                          condition: () => true,                            weight: 40 },
  { level: 'debug', message: () => `Heartbeat ACK received. RTT=${Math.round(Math.random() * 12 + 1)}ms`,                             condition: () => true,                            weight: 20 },
  { level: 'info',  message: (d) => `Status sync: temp=${d.temperature.toFixed(1)}°C bat=${d.battery.toFixed(1)}%`,                    condition: () => true,                            weight: 15 },
  { level: 'info',  message: (d) => `Signal strength: ${d.signalStrength} dBm (RSSI)`,                                                  condition: () => true,                            weight: 8  },
  { level: 'warn',  message: (d) => `Temperature threshold approaching: ${d.temperature.toFixed(1)}°C / 75°C limit`,                   condition: (d) => d.temperature > 60,             weight: 10 },
  { level: 'warn',  message: (d) => `Battery low warning: ${d.battery.toFixed(1)}% remaining`,                                         condition: (d) => d.battery < 25,                weight: 10 },
  { level: 'error', message: () => `Packet loss detected on uplink channel. Retransmitting...`,                                        condition: (d) => d.signalStrength < -80,         weight: 5  },
  { level: 'error', message: () => `CPU watchdog timeout. Process restarted automatically.`,                                           condition: (d) => d.cpuUsage > 85,               weight: 4  },
  { level: 'warn',  message: (d) => `Memory usage elevated: ${d.memoryUsage.toFixed(1)}% — GC triggered`,                              condition: (d) => d.memoryUsage > 75,             weight: 6  },
  { level: 'info',  message: (d) => `OTA check: firmware ${d.firmwareVersion} is current`,                                             condition: () => Math.random() < 0.1,             weight: 3  },
  { level: 'debug', message: () => `Config sync completed. Hash=0x${Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase()}`,condition: () => Math.random() < 0.15,            weight: 5  },
  { level: 'info',  message: (d) => `Device reconnected after ${Math.round(Math.random() * 30 + 5)}s offline period`,                  condition: (d) => d.status === 'online' && Math.random() < 0.05, weight: 2 },
  { level: 'error', message: () => `Authentication token expired. Refreshing...`,                                                      condition: () => Math.random() < 0.02,            weight: 1  },
  { level: 'warn',  message: (d) => `I2C bus timeout on sensor channel 2. Retrying...`,                                                condition: (d) => d.type === 'sensor' && Math.random() < 0.08, weight: 3 },
  { level: 'info',  message: (d) => `Actuator command executed: state=ACTIVE duration=2500ms`,                                         condition: (d) => d.type === 'actuator',          weight: 5  },
];

function weightedPick(device: Device): LogTemplate | null {
  const eligible = TEMPLATES.filter((t) => t.condition(device));
  if (eligible.length === 0) return null;
  const total = eligible.reduce((sum, t) => sum + t.weight, 0);
  let r = Math.random() * total;
  for (const t of eligible) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return eligible[eligible.length - 1] ?? null;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export function generateLogs(devices: Device[]): LogEntry[] {
  const newLogs: LogEntry[] = [];
  const now = new Date().toISOString();

  for (const device of devices) {
    // ~30% chance per device per tick (2 s)
    if (Math.random() > 0.3) continue;

    const template = weightedPick(device);
    if (!template) continue;

    const entry: LogEntry = {
      id: uuidv4(),
      deviceId: device.id,
      deviceName: device.name,
      level: template.level,
      message: template.message(device),
      timestamp: now,
    };

    newLogs.push(entry);
    logStore.unshift(entry);
  }

  if (logStore.length > MAX_LOGS) logStore.splice(MAX_LOGS);
  return newLogs;
}

export function getAllLogs(): LogEntry[] {
  return logStore.slice(0, 100);
}

export function getDeviceLogs(deviceId: string): LogEntry[] {
  return logStore.filter((l) => l.deviceId === deviceId).slice(0, 30);
}
