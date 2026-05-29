// ─── Device ──────────────────────────────────────────────────────────────────

export type DeviceType = 'sensor' | 'gateway' | 'actuator';
export type DeviceStatus = 'online' | 'offline' | 'warning';
export type AIRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DeviceLocation {
  lat: number;
  lng: number;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  battery: number;           // 0–100 %
  temperature: number;       // °C
  lastSeen: string;          // ISO 8601
  location: DeviceLocation;
  // Enterprise fields
  firmwareVersion: string;
  signalStrength: number;    // dBm: -100 (weak) to -30 (strong)
  cpuUsage: number;          // 0–100 %
  memoryUsage: number;       // 0–100 %
  uptimeSeconds: number;
  anomalyScore: number;      // 0–100; higher = more anomalous
  aiRiskLevel: AIRiskLevel;
  aiPrediction: string | null;
  ipAddress: string;
  model: string;
  serialNumber: string;
}

// ─── Telemetry ────────────────────────────────────────────────────────────────

export interface Telemetry {
  deviceId: string;
  timestamp: string;
  temperature: number;
  battery: number;
  status: DeviceStatus;
  cpuUsage: number;
  memoryUsage: number;
  signalStrength: number;
}

// ─── Alert ────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
}

// ─── Log Entry ────────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  deviceId: string;
  deviceName: string;
  level: LogLevel;
  message: string;
  timestamp: string;
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

export type AIInsightType = 'prediction' | 'anomaly' | 'recommendation' | 'maintenance';

export type AIInsightCategory =
  | 'thermal_anomaly'
  | 'battery_degradation'
  | 'signal_instability'
  | 'network_congestion'
  | 'firmware_risk'
  | 'security_threat'
  | 'performance_optimization'
  | 'maintenance_scheduling'
  | 'predictive_failure'
  | 'fleet_efficiency';

export type MaintenancePriority = 'immediate' | 'high' | 'medium' | 'low';

export interface AIInsight {
  id: string;
  deviceId: string;
  deviceName: string;
  type: AIInsightType;
  severity: AIRiskLevel;
  category: AIInsightCategory;
  title: string;
  description: string;
  confidence: number;                  // 0–100 %
  riskScore: number;                   // 0–100 composite risk
  recommendedAction: string;
  businessImpact: string;
  maintenancePriority: MaintenancePriority;
  timestamp: string;
  estimatedTimeToFailure: string | null;
  affectedMetric: string;
}

// ─── System Health ────────────────────────────────────────────────────────────

export interface SystemHealth {
  overallScore: number;          // 0–100
  fleetEfficiency: number;       // 0–100
  activeIncidents: number;
  resolvedToday: number;
  avgUptimePercent: number;
  predictedFailures: number;
  dataPointsPerSecond: number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AlertFrequencyPoint {
  hour: string;
  critical: number;
  warning: number;
  info: number;
}

export interface UptimeStat {
  deviceId: string;
  deviceName: string;
  uptimePercent: number;
}

export interface AnalyticsSnapshot {
  alertFrequency: AlertFrequencyPoint[];
  uptimeStats: UptimeStat[];
  systemHealth: SystemHealth;
}

// ─── WebSocket messages ───────────────────────────────────────────────────────

export interface FleetWSMessage {
  type: 'fleet';
  payload: Device[];
}

export interface AlertWSMessage {
  type: 'alert';
  payload: Alert;
}

export interface LogWSMessage {
  type: 'log';
  payload: LogEntry;
}

export interface AIInsightWSMessage {
  type: 'ai_insight';
  payload: AIInsight;
}

export interface SystemHealthWSMessage {
  type: 'system_health';
  payload: SystemHealth;
}

export type WSMessage =
  | FleetWSMessage
  | AlertWSMessage
  | LogWSMessage
  | AIInsightWSMessage
  | SystemHealthWSMessage;

// ─── REST response shapes ─────────────────────────────────────────────────────

export interface DeviceDetailResponse {
  device: Device;
  history: Telemetry[];
  recentLogs: LogEntry[];
  aiInsights: AIInsight[];
}
