import type { FastifyInstance } from 'fastify';
import type { AnalyticsSnapshot, AlertFrequencyPoint, UptimeStat } from '@fleetpulse/types';
import { getAllDevices } from '../services/simulator.js';
import { getAllAlerts } from '../services/alerts.js';

export async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/analytics', async (_req, reply) => {
    const devices = getAllDevices();
    const alerts = getAllAlerts();
    const now = Date.now();

    // Alert frequency — last 12 hours bucketed by hour
    const buckets = new Map<string, { critical: number; warning: number; info: number }>();
    for (let h = 11; h >= 0; h--) {
      const d = new Date(now - h * 3_600_000);
      const key = `${d.getHours().toString().padStart(2, '0')}:00`;
      buckets.set(key, { critical: 0, warning: 0, info: 0 });
    }
    for (const alert of alerts) {
      const d = new Date(alert.timestamp);
      const ageMs = now - d.getTime();
      if (ageMs > 12 * 3_600_000) continue;
      const key = `${d.getHours().toString().padStart(2, '0')}:00`;
      const bucket = buckets.get(key);
      if (bucket) bucket[alert.severity]++;
    }
    const alertFrequency: AlertFrequencyPoint[] = Array.from(buckets.entries()).map(
      ([hour, counts]) => ({ hour, ...counts }),
    );

    // Uptime stats
    const uptimeStats: UptimeStat[] = devices.map((d) => ({
      deviceId: d.id,
      deviceName: d.name,
      uptimePercent: d.status === 'offline'
        ? parseFloat((Math.random() * 40 + 55).toFixed(1))
        : parseFloat((Math.random() * 10 + 89).toFixed(1)),
    }));

    // System health
    const onlineCount = devices.filter((d) => d.status === 'online').length;
    const criticalCount = devices.filter((d) => d.aiRiskLevel === 'critical').length;
    const overallScore = Math.round(
      (onlineCount / devices.length) * 50 +
      (1 - criticalCount / devices.length) * 30 +
      (alerts.filter((a) => a.severity === 'critical').length === 0 ? 20 : 5),
    );

    const snapshot: AnalyticsSnapshot = {
      alertFrequency,
      uptimeStats,
      systemHealth: {
        overallScore: clamp(overallScore, 0, 100),
        fleetEfficiency: clamp(Math.round(overallScore * 0.9 + Math.random() * 5), 0, 100),
        activeIncidents: alerts.filter((a) => a.severity === 'critical').length,
        resolvedToday: Math.floor(Math.random() * 8 + 2),
        avgUptimePercent: parseFloat(
          (uptimeStats.reduce((s, u) => s + u.uptimePercent, 0) / uptimeStats.length).toFixed(1),
        ),
        predictedFailures: devices.filter((d) => d.aiRiskLevel === 'critical' || d.aiRiskLevel === 'high').length,
        dataPointsPerSecond: Math.round(devices.length * 0.5 + Math.random() * 10),
      },
    };

    return reply.send(snapshot);
  });
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
