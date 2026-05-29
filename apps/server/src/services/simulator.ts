import { v4 as uuidv4 } from 'uuid';
import type { Device, DeviceStatus, DeviceType, Telemetry, AIRiskLevel } from '@fleetpulse/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function randomIp(): string {
  return `192.168.${randomInt(1, 5)}.${randomInt(10, 254)}`;
}

function computeAnomalyScore(device: Device): number {
  let score = 0;
  // Temperature deviation from 25°C baseline
  const tempDeviation = Math.abs(device.temperature - 25);
  score += clamp(tempDeviation * 1.2, 0, 40);
  // Battery
  if (device.battery < 10) score += 25;
  else if (device.battery < 20) score += 15;
  else if (device.battery < 35) score += 8;
  // Status
  if (device.status === 'offline') score += 20;
  else if (device.status === 'warning') score += 10;
  // CPU spike
  if (device.cpuUsage > 85) score += 10;
  else if (device.cpuUsage > 70) score += 5;
  // Signal
  if (device.signalStrength < -85) score += 5;
  return clamp(Math.round(score), 0, 100);
}

function computeAIRisk(score: number): AIRiskLevel {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

const AI_PREDICTIONS: Record<AIRiskLevel, string[]> = {
  critical: [
    'Thermal runaway likely within 2–4 hours. Immediate intervention required.',
    'Component failure probability >85%. Schedule emergency maintenance.',
    'Cascading failure risk detected. Isolate device from network.',
    'Critical anomaly pattern matches pre-failure signature from Fleet DB.',
  ],
  high: [
    'Elevated failure probability within 12 hours. Monitor closely.',
    'Abnormal thermal behavior detected. Reduced performance expected.',
    'Battery degradation accelerating. Replacement recommended within 48h.',
    'Signal instability suggests hardware fault. Diagnostic scan advised.',
  ],
  medium: [
    'Performance degradation detected. Schedule maintenance within 7 days.',
    'Temperature trending above baseline. Check ventilation.',
    'Memory utilization elevated. Consider firmware update.',
    'Battery drain rate 2× above fleet average.',
  ],
  low: [
    'Operating within normal parameters.',
    'No anomalies detected. Fleet health nominal.',
    'All metrics within expected ranges.',
    null as unknown as string,
  ],
};

function pickPrediction(risk: AIRiskLevel): string | null {
  const pool = AI_PREDICTIONS[risk].filter(Boolean);
  if (pool.length === 0) return null;
  if (risk === 'low' && Math.random() > 0.3) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const MODELS: Record<DeviceType, string[]> = {
  sensor:   ['PX-4100', 'SensorCore v2', 'ThermoMesh 3', 'EdgeSense Pro'],
  gateway:  ['GW-8000', 'NetBridge X1', 'OmniGate Pro', 'CloudEdge 5G'],
  actuator: ['ActuatorX-7', 'PneumaDrive 2', 'ServoLink 4', 'FlowControl R'],
};

interface DeviceSeed {
  name: string;
  type: DeviceType;
  lat: number;
  lng: number;
  initTemp: number;
  initBattery: number;
  initCpu: number;
  initMemory: number;
  initSignal: number;
}

const DEVICE_SEEDS: DeviceSeed[] = [
  { name: 'Temp Sensor Alpha',   type: 'sensor',   lat: 37.7749, lng: -122.4194, initTemp: 22,  initBattery: 88, initCpu: 12,  initMemory: 34, initSignal: -52 },
  { name: 'Gateway Hub-1',       type: 'gateway',  lat: 37.7750, lng: -122.4180, initTemp: 35,  initBattery: 72, initCpu: 45,  initMemory: 61, initSignal: -41 },
  { name: 'Actuator Valve-A',    type: 'actuator', lat: 37.7751, lng: -122.4170, initTemp: 19,  initBattery: 95, initCpu: 8,   initMemory: 22, initSignal: -63 },
  { name: 'Pressure Sensor-B',   type: 'sensor',   lat: 37.7760, lng: -122.4150, initTemp: 24,  initBattery: 45, initCpu: 19,  initMemory: 41, initSignal: -71 },
  { name: 'Motion Detector-1',   type: 'sensor',   lat: 37.7770, lng: -122.4160, initTemp: 21,  initBattery: 60, initCpu: 6,   initMemory: 29, initSignal: -58 },
  { name: 'Gateway Hub-2',       type: 'gateway',  lat: 37.7780, lng: -122.4140, initTemp: 38,  initBattery: 80, initCpu: 62,  initMemory: 74, initSignal: -38 },
  { name: 'Relay Actuator-C',    type: 'actuator', lat: 37.7790, lng: -122.4130, initTemp: 28,  initBattery: 12, initCpu: 31,  initMemory: 55, initSignal: -77 },
  { name: 'Humidity Sensor-D',   type: 'sensor',   lat: 37.7800, lng: -122.4120, initTemp: 20,  initBattery: 99, initCpu: 4,   initMemory: 18, initSignal: -44 },
  { name: 'CO₂ Sensor-E',        type: 'sensor',   lat: 37.7810, lng: -122.4110, initTemp: 23,  initBattery: 33, initCpu: 14,  initMemory: 37, initSignal: -69 },
  { name: 'Gateway Hub-3',       type: 'gateway',  lat: 37.7820, lng: -122.4100, initTemp: 72,  initBattery: 55, initCpu: 88,  initMemory: 82, initSignal: -35 },
  { name: 'Pump Actuator-F',     type: 'actuator', lat: 37.7830, lng: -122.4090, initTemp: 31,  initBattery: 77, initCpu: 38,  initMemory: 48, initSignal: -54 },
  { name: 'Vibration Sensor-G',  type: 'sensor',   lat: 37.7840, lng: -122.4080, initTemp: 18,  initBattery: 91, initCpu: 7,   initMemory: 24, initSignal: -60 },
];

// ─── In-memory state ──────────────────────────────────────────────────────────

export const deviceMap = new Map<string, Device>();
export const telemetryHistory = new Map<string, Telemetry[]>();

const MAX_HISTORY = 50;

// ─── Initialise fleet ─────────────────────────────────────────────────────────

export function initSimulator(): void {
  DEVICE_SEEDS.forEach((seed, i) => {
    const id = uuidv4();
    const typeModels = MODELS[seed.type];
    const model = typeModels[i % typeModels.length] ?? typeModels[0] ?? 'Unknown';
    const anomalyScore = 0;
    const aiRiskLevel: AIRiskLevel = 'low';

    const device: Device = {
      id,
      name: seed.name,
      type: seed.type,
      status: 'online',
      battery: seed.initBattery,
      temperature: seed.initTemp,
      lastSeen: new Date().toISOString(),
      location: { lat: seed.lat, lng: seed.lng },
      firmwareVersion: `v${randomInt(2, 4)}.${randomInt(0, 9)}.${randomInt(0, 20)}`,
      signalStrength: seed.initSignal,
      cpuUsage: seed.initCpu,
      memoryUsage: seed.initMemory,
      uptimeSeconds: randomInt(3600, 86400 * 30),
      anomalyScore,
      aiRiskLevel,
      aiPrediction: null,
      ipAddress: randomIp(),
      model,
      serialNumber: `FP-${seed.type.toUpperCase().slice(0, 3)}-${String(1000 + i).padStart(4, '0')}`,
    };
    deviceMap.set(id, device);
    telemetryHistory.set(id, []);
  });
}

// ─── Status derivation ────────────────────────────────────────────────────────

function deriveStatus(device: Device): DeviceStatus {
  if (device.battery < 15 || device.temperature > 75 || device.cpuUsage > 90) return 'warning';
  if (device.status === 'offline') return Math.random() < 0.05 ? 'online' : 'offline';
  if (Math.random() < 0.015) return 'offline';
  return 'online';
}

// ─── Tick ─────────────────────────────────────────────────────────────────────

export function tickSimulator(): void {
  const now = new Date().toISOString();

  for (const [id, device] of deviceMap) {
    if (manualOfflineSet.has(id)) {
      // Pinned offline — only update lastSeen
      deviceMap.set(id, { ...device, lastSeen: now });
      continue;
    }

    const tempDelta = randomBetween(-0.8, 0.8);
    const batteryDrain = randomBetween(0, 0.25);
    const cpuDelta = randomBetween(-3, 3);
    const memDelta = randomBetween(-1.5, 1.5);
    const signalDelta = randomBetween(-2, 2);

    const newTemp = parseFloat(clamp(device.temperature + tempDelta, 15, 90).toFixed(1));
    const newBattery = parseFloat(clamp(device.battery - batteryDrain, 0, 100).toFixed(1));
    const newCpu = parseFloat(clamp(device.cpuUsage + cpuDelta, 1, 99).toFixed(1));
    const newMemory = parseFloat(clamp(device.memoryUsage + memDelta, 5, 98).toFixed(1));
    const newSignal = Math.round(clamp(device.signalStrength + signalDelta, -100, -30));

    // Build a partial device to compute score
    const partial: Device = {
      ...device,
      temperature: newTemp,
      battery: newBattery,
      cpuUsage: newCpu,
      signalStrength: newSignal,
    };

    const anomalyScore = computeAnomalyScore(partial);
    const aiRiskLevel = computeAIRisk(anomalyScore);
    // Only update prediction occasionally to avoid flicker
    const aiPrediction =
      Math.random() < 0.05 ? pickPrediction(aiRiskLevel) : device.aiPrediction;

    const updatedDevice: Device = {
      ...device,
      temperature: newTemp,
      battery: newBattery,
      cpuUsage: newCpu,
      memoryUsage: newMemory,
      signalStrength: newSignal,
      lastSeen: now,
      uptimeSeconds: device.status !== 'offline' ? device.uptimeSeconds + 2 : device.uptimeSeconds,
      status: deriveStatus({ ...device, temperature: newTemp, battery: newBattery, cpuUsage: newCpu }),
      anomalyScore,
      aiRiskLevel,
      aiPrediction,
    };

    deviceMap.set(id, updatedDevice);

    // Telemetry history
    const history = telemetryHistory.get(id) ?? [];
    history.push({
      deviceId: id,
      timestamp: now,
      temperature: newTemp,
      battery: newBattery,
      status: updatedDevice.status,
      cpuUsage: newCpu,
      memoryUsage: newMemory,
      signalStrength: newSignal,
    });
    if (history.length > MAX_HISTORY) history.shift();
    telemetryHistory.set(id, history);
  }
}

// ─── Manual toggle ────────────────────────────────────────────────────────────

const manualOfflineSet = new Set<string>();

export function toggleDevice(id: string): Device | null {
  const device = deviceMap.get(id);
  if (!device) return null;
  if (device.status === 'offline') {
    manualOfflineSet.delete(id);
    const updated: Device = { ...device, status: 'online', lastSeen: new Date().toISOString() };
    deviceMap.set(id, updated);
    return updated;
  } else {
    manualOfflineSet.add(id);
    const updated: Device = { ...device, status: 'offline', lastSeen: new Date().toISOString() };
    deviceMap.set(id, updated);
    return updated;
  }
}

// ─── Getters ──────────────────────────────────────────────────────────────────

export function getAllDevices(): Device[] {
  return Array.from(deviceMap.values());
}

export function getDevice(id: string): Device | undefined {
  return deviceMap.get(id);
}

export function getDeviceHistory(id: string): Telemetry[] {
  return (telemetryHistory.get(id) ?? []).slice(-50);
}
