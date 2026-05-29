import { v4 as uuidv4 } from 'uuid';
import type {
  AIInsight, AIInsightCategory, AIInsightType, AIRiskLevel,
  Device, MaintenancePriority,
} from '@fleetpulse/types';

const MAX_INSIGHTS = 100;
const insightStore: AIInsight[] = [];
const lastInsightTime = new Map<string, number>();
const INSIGHT_COOLDOWN_MS = 20_000;

// ─── Template definition ──────────────────────────────────────────────────────

interface InsightTemplate {
  category: AIInsightCategory;
  type: AIInsightType;
  severity: AIRiskLevel;
  maintenancePriority: MaintenancePriority;
  title: string;
  description: (device: Device) => string;
  affectedMetric: string;
  estimatedTimeToFailure: ((device: Device) => string) | null;
  recommendedAction: string;
  businessImpact: string;
  riskScore: (device: Device) => number;
  condition: (device: Device) => boolean;
}

// ─── 10-category template bank ────────────────────────────────────────────────

const TEMPLATES: InsightTemplate[] = [

  // ── 1. Predictive Failure ─────────────────────────────────────────────────
  {
    category: 'predictive_failure',
    type: 'prediction',
    severity: 'critical',
    maintenancePriority: 'immediate',
    title: 'Imminent Hardware Failure Predicted',
    description: (d) =>
      `Multi-metric convergence on ${d.name}: temperature ${d.temperature.toFixed(1)}°C, ` +
      `CPU ${d.cpuUsage.toFixed(1)}%, anomaly score ${d.anomalyScore}/100. ` +
      `Pattern matches 94% of pre-failure device signatures in historical dataset. ` +
      `Hardware failure expected within 2–4 hours without intervention.`,
    affectedMetric: 'composite',
    estimatedTimeToFailure: (d) => {
      const hours = Math.max(1, Math.round(4 - (d.anomalyScore / 100) * 2));
      return `~${hours} hour${hours !== 1 ? 's' : ''}`;
    },
    recommendedAction: 'Dispatch field technician immediately. Prepare replacement unit and backup configuration. Initiate controlled shutdown to preserve data integrity.',
    businessImpact: 'Unplanned downtime estimated at $4,200–$8,600 per hour. Customer SLA breach risk if not resolved within 2 hours.',
    riskScore: (d) => Math.min(100, 70 + d.anomalyScore * 0.3),
    condition: (d) => d.anomalyScore > 80 && d.temperature > 72 && d.cpuUsage > 82,
  },
  {
    category: 'predictive_failure',
    type: 'prediction',
    severity: 'high',
    maintenancePriority: 'high',
    title: 'Cascading Failure Pattern Emerging',
    description: (d) =>
      `${d.name} is showing early-stage multi-system degradation. Memory at ` +
      `${d.memoryUsage.toFixed(1)}%, signal at ${d.signalStrength} dBm, battery ` +
      `${d.battery.toFixed(1)}%. Combined degradation index exceeds warning threshold. ` +
      `Without action, full failure probability is 73% within 24 hours.`,
    affectedMetric: 'composite',
    estimatedTimeToFailure: (_d) => '~18–24 hours',
    recommendedAction: 'Schedule preventive maintenance within 4 hours. Run full diagnostic suite. Consider load redistribution to adjacent devices.',
    businessImpact: 'Moderate service disruption risk. Proactive replacement costs ~$340 vs reactive emergency repair ~$2,100.',
    riskScore: (d) => Math.min(100, 50 + d.anomalyScore * 0.5),
    condition: (d) => d.anomalyScore > 60 && d.memoryUsage > 75 && d.battery < 30,
  },

  // ── 2. Thermal Anomaly ────────────────────────────────────────────────────
  {
    category: 'thermal_anomaly',
    type: 'prediction',
    severity: 'critical',
    maintenancePriority: 'immediate',
    title: 'Thermal Runaway — Critical Intervention Required',
    description: (d) =>
      `${d.name} is at ${d.temperature.toFixed(1)}°C — ${(d.temperature - 60).toFixed(1)}°C above safe operating limit. ` +
      `Temperature is rising at an estimated 2.3°C/min. Thermal management system appears compromised. ` +
      `Risk of permanent component damage and potential safety hazard if not addressed immediately.`,
    affectedMetric: 'temperature',
    estimatedTimeToFailure: (d) => {
      const hoursLeft = Math.max(0.5, Math.round((90 - d.temperature) / 3));
      return `~${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
    },
    recommendedAction: 'Immediately reduce device load or shut down. Check cooling fan operation, thermal paste integrity, and ambient environment. Clear any airflow obstructions.',
    businessImpact: 'Thermal damage can permanently destroy hardware worth $800–$3,400. Fire risk in enclosed environments. Insurance liability exposure.',
    riskScore: (d) => Math.min(100, 60 + (d.temperature - 78) * 4),
    condition: (d) => d.temperature > 78 && d.status !== 'offline',
  },
  {
    category: 'thermal_anomaly',
    type: 'anomaly',
    severity: 'high',
    maintenancePriority: 'high',
    title: 'Elevated Temperature — Cooling System Check Required',
    description: (d) =>
      `${d.name} is operating at ${d.temperature.toFixed(1)}°C — 2.4 standard deviations above the fleet mean of 48°C. ` +
      `Sustained high temperatures accelerate electromigration and reduce component lifespan by up to 50%. ` +
      `Anomaly score: ${d.anomalyScore}/100.`,
    affectedMetric: 'temperature',
    estimatedTimeToFailure: (_d) => '~12–36 hours',
    recommendedAction: 'Inspect cooling subsystem. Check for dust accumulation on vents. Verify ambient room temperature is within spec. Schedule thermal pad replacement.',
    businessImpact: 'Continued operation at this temperature reduces device MTBF by 40%. Expected lifespan reduction of 8–14 months.',
    riskScore: (d) => Math.min(100, 40 + (d.temperature - 65) * 3),
    condition: (d) => d.temperature > 65 && d.temperature <= 78 && d.status !== 'offline',
  },

  // ── 3. Battery Degradation ────────────────────────────────────────────────
  {
    category: 'battery_degradation',
    type: 'maintenance',
    severity: 'critical',
    maintenancePriority: 'immediate',
    title: 'Critical Battery — Imminent Power Loss',
    description: (d) =>
      `${d.name} battery is at ${d.battery.toFixed(1)}%. At the measured discharge rate of 3.2%/min, ` +
      `device will lose power in approximately 25–35 minutes. ` +
      `Any ongoing data transactions will be interrupted. No graceful shutdown window available.`,
    affectedMetric: 'battery',
    estimatedTimeToFailure: (_d) => '~25–35 minutes',
    recommendedAction: 'Deploy technician immediately with replacement battery. Initiate emergency data sync and state backup now. Route critical workloads to redundant devices.',
    businessImpact: 'Unexpected power loss risks data corruption and loss of in-flight transactions. SLA violation probable. Emergency dispatch cost ~$450.',
    riskScore: (_d) => 95,
    condition: (d) => d.battery < 8 && d.status !== 'offline',
  },
  {
    category: 'battery_degradation',
    type: 'maintenance',
    severity: 'high',
    maintenancePriority: 'high',
    title: 'Accelerated Battery Discharge Pattern',
    description: (d) =>
      `${d.name} battery at ${d.battery.toFixed(1)}% and discharging 2.1× faster than the fleet average. ` +
      `Capacity analysis suggests battery is at ~60% of original capacity, indicating cell degradation. ` +
      `Replacement recommended before next maintenance window to avoid emergency.`,
    affectedMetric: 'battery',
    estimatedTimeToFailure: (_d) => '~6–12 hours',
    recommendedAction: 'Schedule battery replacement within 48 hours. Reduce device polling frequency to extend remaining life. Pre-stage replacement battery at nearest depot.',
    businessImpact: 'Proactive battery swap costs $85 vs emergency replacement with potential data loss costing $1,200+. Affects device availability SLA.',
    riskScore: (d) => Math.min(100, 30 + (20 - d.battery) * 3),
    condition: (d) => d.battery >= 8 && d.battery < 20 && d.status !== 'offline',
  },

  // ── 4. Signal Instability ─────────────────────────────────────────────────
  {
    category: 'signal_instability',
    type: 'anomaly',
    severity: 'high',
    maintenancePriority: 'high',
    title: 'Critical Signal Loss — Communication Unreliable',
    description: (d) =>
      `${d.name} signal strength has dropped to ${d.signalStrength} dBm — below the ${-90} dBm reliability threshold. ` +
      `Packet loss estimated at 34%. Commands may not execute reliably and telemetry data has gaps. ` +
      `Device is at risk of falling offline with no graceful reconnect window.`,
    affectedMetric: 'signalStrength',
    estimatedTimeToFailure: null,
    recommendedAction: 'Check antenna connections and integrity. Survey RF environment for new interference sources. Consider repositioning device or installing a signal repeater.',
    businessImpact: 'Unreliable communication causes missed alerts and delayed commands. If device controls physical infrastructure, safety risk exists.',
    riskScore: (d) => Math.min(100, 40 + Math.abs(d.signalStrength + 90) * 3),
    condition: (d) => d.signalStrength < -90 && d.status !== 'offline',
  },
  {
    category: 'signal_instability',
    type: 'anomaly',
    severity: 'medium',
    maintenancePriority: 'medium',
    title: 'Signal Degradation Trend Detected',
    description: (d) =>
      `${d.name} average signal strength is ${d.signalStrength} dBm, degraded from a baseline of -65 dBm. ` +
      `7-day trend shows consistent weakening of -1.2 dBm/day. Possible antenna wear, ` +
      `environmental interference, or gateway proximity issue.`,
    affectedMetric: 'signalStrength',
    estimatedTimeToFailure: null,
    recommendedAction: 'Log RF survey data for this location. Schedule antenna inspection. Check for new equipment or structural changes near device that could cause interference.',
    businessImpact: 'Gradual signal loss can lead to silent data gaps. Monitoring reliability degraded — alerts may be delayed or lost.',
    riskScore: (d) => Math.min(100, 25 + Math.abs(d.signalStrength + 85) * 2),
    condition: (d) => d.signalStrength >= -90 && d.signalStrength < -80,
  },

  // ── 5. Network Congestion ─────────────────────────────────────────────────
  {
    category: 'network_congestion',
    type: 'anomaly',
    severity: 'medium',
    maintenancePriority: 'medium',
    title: 'Network Saturation Causing Telemetry Delays',
    description: (d) =>
      `${d.name} is experiencing elevated message queue depth and transmission latency. ` +
      `CPU at ${d.cpuUsage.toFixed(1)}% with ${d.memoryUsage.toFixed(1)}% memory consumed by network buffers. ` +
      `Data pipeline throughput reduced by estimated 41%. Backlog may cause stale dashboard readings.`,
    affectedMetric: 'cpuUsage',
    estimatedTimeToFailure: null,
    recommendedAction: 'Review gateway load balancing. Consider enabling QoS prioritization for critical alert traffic. Evaluate message batching to reduce overhead.',
    businessImpact: 'Delayed telemetry creates a false picture of fleet health. Critical alerts may be missed during congestion windows.',
    riskScore: (d) => Math.min(100, 20 + d.cpuUsage * 0.4 + d.memoryUsage * 0.3),
    condition: (d) => d.cpuUsage > 75 && d.memoryUsage > 70 && d.signalStrength < -75,
  },

  // ── 6. Firmware Risk ──────────────────────────────────────────────────────
  {
    category: 'firmware_risk',
    type: 'recommendation',
    severity: 'high',
    maintenancePriority: 'high',
    title: 'Critical Security Vulnerability in Firmware Version',
    description: (d) =>
      `${d.name} is running firmware ${d.firmwareVersion} which contains CVE-2024-38291, a remote code ` +
      `execution vulnerability with CVSS score 9.1. This version has been flagged for mandatory patching. ` +
      `Latest firmware v2.8.1 resolves 3 critical CVEs and improves memory stability.`,
    affectedMetric: 'firmware',
    estimatedTimeToFailure: null,
    recommendedAction: 'Schedule firmware update during next maintenance window (max 72h). Ensure backup of device config. Test update on non-critical device first. Requires 8-minute downtime.',
    businessImpact: 'Unpatched CVE-2024-38291 exposes fleet to lateral movement attack. Compliance violation risk if devices handle regulated data. Audit findings likely.',
    riskScore: (d) => Math.min(100, 55 + d.anomalyScore * 0.3),
    condition: (d) => {
      const minor = parseInt(d.firmwareVersion.split('.')[1] ?? '9', 10);
      return minor < 4 && d.status !== 'offline';
    },
  },
  {
    category: 'firmware_risk',
    type: 'recommendation',
    severity: 'medium',
    maintenancePriority: 'medium',
    title: 'Outdated Firmware — Stability Patches Available',
    description: (d) =>
      `${d.name} is 2 minor versions behind the current stable release. Running ${d.firmwareVersion}. ` +
      `Pending updates include memory leak fix (affects ${d.type} devices specifically), ` +
      `improved watchdog timer behavior, and telemetry compression improvements (-23% bandwidth).`,
    affectedMetric: 'firmware',
    estimatedTimeToFailure: null,
    recommendedAction: 'Include in next scheduled maintenance cycle. Group with other devices at same firmware level for batch update efficiency. No urgent action required.',
    businessImpact: 'Memory leak in current version reduces effective uptime by ~8%. Bandwidth overhead costs ~$12/month per affected device.',
    riskScore: (d) => Math.min(100, 30 + d.anomalyScore * 0.2),
    condition: (d) => {
      const minor = parseInt(d.firmwareVersion.split('.')[1] ?? '9', 10);
      return minor >= 4 && minor < 6 && d.anomalyScore > 25;
    },
  },

  // ── 7. Security Threat ────────────────────────────────────────────────────
  {
    category: 'security_threat',
    type: 'anomaly',
    severity: 'critical',
    maintenancePriority: 'immediate',
    title: 'Anomalous Authentication Attempts Detected',
    description: (d) =>
      `${d.name} (${d.ipAddress}) has logged 847 failed authentication requests in the last 15 minutes — ` +
      `${d.cpuUsage.toFixed(1)}% CPU spike attributed to brute-force pattern. ` +
      `Source IPs span 3 subnets. Possible credential stuffing or targeted intrusion attempt.`,
    affectedMetric: 'cpuUsage',
    estimatedTimeToFailure: null,
    recommendedAction: 'Immediately apply IP blocklist from threat feed. Rotate device credentials. Enable rate limiting. Escalate to security team for forensic analysis. Review adjacent device logs.',
    businessImpact: 'Active intrusion attempt. If compromised, device could be used for lateral movement or data exfiltration. Regulatory notification may be required within 72 hours.',
    riskScore: (d) => Math.min(100, 75 + d.cpuUsage * 0.25),
    condition: (d) => d.cpuUsage > 90 && d.anomalyScore > 70 && d.status !== 'offline',
  },
  {
    category: 'security_threat',
    type: 'anomaly',
    severity: 'high',
    maintenancePriority: 'high',
    title: 'Unusual Outbound Traffic Pattern',
    description: (d) =>
      `${d.name} is generating anomalous outbound network traffic outside of normal operational parameters. ` +
      `Memory footprint (${d.memoryUsage.toFixed(1)}%) suggests an undocumented process is running. ` +
      `Traffic pattern does not match any known firmware behavior profile.`,
    affectedMetric: 'memoryUsage',
    estimatedTimeToFailure: null,
    recommendedAction: 'Isolate device from network segment pending investigation. Capture network traffic for analysis. Verify firmware integrity via hash check. Consider full factory reset.',
    businessImpact: 'Potential data exfiltration or C2 beaconing. If confirmed, incident response costs average $48,000. Customer data exposure liability.',
    riskScore: (d) => Math.min(100, 60 + d.memoryUsage * 0.3),
    condition: (d) => d.memoryUsage > 88 && d.anomalyScore > 55 && d.cpuUsage > 60,
  },

  // ── 8. Performance Optimization ───────────────────────────────────────────
  {
    category: 'performance_optimization',
    type: 'recommendation',
    severity: 'medium',
    maintenancePriority: 'medium',
    title: 'CPU Overload — Process Optimization Recommended',
    description: (d) =>
      `${d.name} is sustaining ${d.cpuUsage.toFixed(1)}% CPU utilization. Analysis indicates ` +
      `telemetry reporting frequency is set to 500ms vs the recommended 2s interval for this device class. ` +
      `Reducing polling frequency could lower CPU by ~35% and extend battery life by 18%.`,
    affectedMetric: 'cpuUsage',
    estimatedTimeToFailure: null,
    recommendedAction: 'Adjust telemetry polling interval to 2000ms. Review background process schedule. Consider offloading edge compute tasks to dedicated gateway. Profile firmware for optimization opportunities.',
    businessImpact: 'Current CPU load reduces device MTBF by 22%. Optimization can extend hardware lifecycle by 14 months, deferring $420 replacement cost per device.',
    riskScore: (d) => Math.min(100, 25 + d.cpuUsage * 0.5),
    condition: (d) => d.cpuUsage > 82 && d.cpuUsage <= 90 && d.anomalyScore < 70,
  },
  {
    category: 'performance_optimization',
    type: 'recommendation',
    severity: 'low',
    maintenancePriority: 'low',
    title: 'Memory Fragmentation Reducing Efficiency',
    description: (d) =>
      `${d.name} shows memory allocation patterns consistent with fragmentation (${d.memoryUsage.toFixed(1)}% in use). ` +
      `Heap analysis indicates 23% of allocated memory is non-contiguous. ` +
      `A scheduled restart and memory defragmentation would restore full operational efficiency.`,
    affectedMetric: 'memoryUsage',
    estimatedTimeToFailure: null,
    recommendedAction: 'Schedule a 90-second maintenance restart during low-traffic window (02:00–04:00 local). No field visit required — can be triggered remotely via API.',
    businessImpact: 'Current fragmentation causes ~12% processing overhead. Remote restart costs 90 seconds downtime vs gradual performance degradation over 2–3 weeks.',
    riskScore: (d) => Math.min(100, 15 + d.memoryUsage * 0.3),
    condition: (d) => d.memoryUsage > 78 && d.memoryUsage <= 88 && d.cpuUsage < 80,
  },

  // ── 9. Maintenance Scheduling ─────────────────────────────────────────────
  {
    category: 'maintenance_scheduling',
    type: 'maintenance',
    severity: 'medium',
    maintenancePriority: 'medium',
    title: 'Scheduled Maintenance Overdue',
    description: (d) =>
      `${d.name} has been in continuous operation for ${Math.floor(d.uptimeSeconds / 86400)} days without a maintenance cycle. ` +
      `Fleet policy requires inspection every 90 days. ` +
      `Overdue maintenance increases failure risk by 31% and voids extended warranty coverage.`,
    affectedMetric: 'uptimeSeconds',
    estimatedTimeToFailure: null,
    recommendedAction: 'Add to next maintenance batch. Checklist: physical inspection, contact cleaning, battery capacity test, firmware verification, calibration check. Est. 45 min per device.',
    businessImpact: 'Warranty void risk on $1,200 average hardware cost per device. Deferred maintenance compounds — each additional 30 days increases failure probability by 8%.',
    riskScore: (d) => Math.min(100, 20 + Math.floor(d.uptimeSeconds / 86400) * 0.3),
    condition: (d) => d.uptimeSeconds > 90 * 86400 && d.anomalyScore > 15,
  },
  {
    category: 'maintenance_scheduling',
    type: 'maintenance',
    severity: 'low',
    maintenancePriority: 'low',
    title: 'Preventive Maintenance Window Approaching',
    description: (d) =>
      `${d.name} is approaching its scheduled 60-day maintenance interval (currently at day ${Math.floor(d.uptimeSeconds / 86400)}). ` +
      `Pre-scheduling maintenance now allows optimal technician routing and parts availability. ` +
      `No urgent issues detected — this is standard lifecycle management.`,
    affectedMetric: 'uptimeSeconds',
    estimatedTimeToFailure: null,
    recommendedAction: 'Pre-book technician for maintenance visit within 2 weeks. Order consumable replacement parts now to avoid logistics delays. Group with nearby devices to optimize route.',
    businessImpact: 'Proactive scheduling reduces technician travel cost by 34% vs reactive dispatch. Bunching maintenance reduces per-device service cost by $120.',
    riskScore: (d) => Math.min(100, 10 + Math.floor(d.uptimeSeconds / 86400) * 0.15),
    condition: (d) => d.uptimeSeconds > 55 * 86400 && d.uptimeSeconds <= 90 * 86400,
  },

  // ── 10. Fleet Efficiency ──────────────────────────────────────────────────
  {
    category: 'fleet_efficiency',
    type: 'recommendation',
    severity: 'low',
    maintenancePriority: 'low',
    title: 'Device Load Imbalance Detected Across Fleet',
    description: (d) =>
      `${d.name} is carrying disproportionate workload: CPU ${d.cpuUsage.toFixed(1)}%, ` +
      `memory ${d.memoryUsage.toFixed(1)}%, while adjacent devices in the cluster operate below 30% utilization. ` +
      `Load rebalancing could improve fleet-wide efficiency by an estimated 19%.`,
    affectedMetric: 'cpuUsage',
    estimatedTimeToFailure: null,
    recommendedAction: 'Review gateway routing rules and load distribution policy. Enable auto-scaling for edge compute tasks. Consider redistributing sensor reporting responsibilities across cluster.',
    businessImpact: 'Uneven load reduces hardware lifespan on overloaded devices while underutilizing fleet capacity. Fleet efficiency score currently at 67% vs target of 85%.',
    riskScore: (d) => Math.min(100, 15 + d.cpuUsage * 0.3 + d.memoryUsage * 0.2),
    condition: (d) => d.cpuUsage > 70 && d.memoryUsage > 65 && d.anomalyScore < 50,
  },
];

// ─── Engine ───────────────────────────────────────────────────────────────────

export function generateAIInsights(devices: Device[]): AIInsight[] {
  const newInsights: AIInsight[] = [];
  const now = Date.now();

  for (const device of devices) {
    const lastTime = lastInsightTime.get(device.id) ?? 0;
    if (now - lastTime < INSIGHT_COOLDOWN_MS) continue;

    // Find first matching template
    const template = TEMPLATES.find((t) => t.condition(device));
    if (!template) continue;

    const rawRisk = template.riskScore(device);
    const confidence = Math.round(Math.min(99, 55 + rawRisk * 0.44));

    const insight: AIInsight = {
      id: uuidv4(),
      deviceId: device.id,
      deviceName: device.name,
      type: template.type,
      severity: template.severity,
      category: template.category,
      title: template.title,
      description: template.description(device),
      confidence,
      riskScore: Math.round(rawRisk),
      recommendedAction: template.recommendedAction,
      businessImpact: template.businessImpact,
      maintenancePriority: template.maintenancePriority,
      timestamp: new Date().toISOString(),
      estimatedTimeToFailure: template.estimatedTimeToFailure
        ? template.estimatedTimeToFailure(device)
        : null,
      affectedMetric: template.affectedMetric,
    };

    newInsights.push(insight);
    insightStore.unshift(insight);
    lastInsightTime.set(device.id, now);
  }

  if (insightStore.length > MAX_INSIGHTS) insightStore.splice(MAX_INSIGHTS);
  return newInsights;
}

export function getAllInsights(): AIInsight[] {
  return insightStore.slice();
}

export function getDeviceInsights(deviceId: string): AIInsight[] {
  return insightStore.filter((i) => i.deviceId === deviceId).slice(0, 10);
}
