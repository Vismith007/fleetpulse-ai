import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { OriginFunction } from '@fastify/cors';
import websocketPlugin from '@fastify/websocket';
import type { WebSocket } from '@fastify/websocket';
import type { WSMessage, SystemHealth } from '@fleetpulse/types';

import { initSimulator, tickSimulator, getAllDevices } from './services/simulator.js';
import { checkAndGenerateAlerts, getAllAlerts } from './services/alerts.js';
import { generateAIInsights, getAllInsights } from './services/ai.js';
import { generateLogs, getAllLogs } from './services/logs.js';
import { deviceRoutes } from './routes/devices.js';
import { alertRoutes } from './routes/alerts.js';
import { analyticsRoutes } from './routes/analytics.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';

const wsClients = new Set<WebSocket>();

function broadcast(message: WSMessage): void {
  const data = JSON.stringify(message);
  for (const client of wsClients) {
    if (client.readyState === 1) client.send(data);
  }
}

function buildSystemHealth(): SystemHealth {
  const devices = getAllDevices();
  const alerts = getAllAlerts();
  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const criticalCount = devices.filter((d) => d.aiRiskLevel === 'critical').length;
  const score = Math.round(
    (onlineCount / devices.length) * 50 +
    (1 - criticalCount / Math.max(devices.length, 1)) * 30 +
    (alerts.filter((a) => a.severity === 'critical').length === 0 ? 20 : 5),
  );
  return {
    overallScore: Math.min(100, Math.max(0, score)),
    fleetEfficiency: Math.min(100, Math.max(0, Math.round(score * 0.92))),
    activeIncidents: alerts.filter((a) => a.severity === 'critical').length,
    resolvedToday: Math.floor(Math.random() * 3),
    avgUptimePercent: parseFloat(
      (devices.reduce((s, d) => s + (d.status !== 'offline' ? 98 : 55), 0) / devices.length).toFixed(1),
    ),
    predictedFailures: devices.filter((d) => d.aiRiskLevel === 'critical' || d.aiRiskLevel === 'high').length,
    dataPointsPerSecond: Math.round(devices.length * 0.6 + Math.random() * 8),
  };
}

async function main(): Promise<void> {
  const fastify = Fastify({ logger: { level: 'info' } });

  // CORS_ORIGIN can be a comma-separated list: "https://fleetpulse.vercel.app,http://localhost:5173"
  const allowedOrigins = (process.env['CORS_ORIGIN'] ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());

  const originFn: OriginFunction = (origin, cb) => {
    if (!origin || allowedOrigins.some((o) => origin === o || o === '*')) {
      cb(null, true);
    } else {
      cb(new Error(`Origin ${origin} not allowed`), false);
    }
  };

  await fastify.register(cors, {
    origin: originFn,
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  await fastify.register(websocketPlugin);

  // ─── WebSocket ──────────────────────────────────────────────────────────────
  fastify.get('/ws', { websocket: true }, (socket) => {
    wsClients.add(socket);
    fastify.log.info(`WS client connected (total: ${wsClients.size})`);

    // Initial burst: fleet + existing alerts + insights + recent logs + health
    socket.send(JSON.stringify({ type: 'fleet', payload: getAllDevices() } satisfies WSMessage));
    for (const alert of getAllAlerts().slice(0, 20)) {
      socket.send(JSON.stringify({ type: 'alert', payload: alert } satisfies WSMessage));
    }
    for (const insight of getAllInsights().slice(0, 10)) {
      socket.send(JSON.stringify({ type: 'ai_insight', payload: insight } satisfies WSMessage));
    }
    for (const log of getAllLogs().slice(0, 30)) {
      socket.send(JSON.stringify({ type: 'log', payload: log } satisfies WSMessage));
    }
    socket.send(JSON.stringify({ type: 'system_health', payload: buildSystemHealth() } satisfies WSMessage));

    socket.on('close', () => {
      wsClients.delete(socket);
      fastify.log.info(`WS client disconnected (total: ${wsClients.size})`);
    });
  });

  // ─── Health check (used by Railway / load balancers) ───────────────────────
  fastify.get('/api/health', async (_req, reply) => {
    return reply.send({ status: 'ok', uptime: process.uptime(), devices: getAllDevices().length });
  });

  // ─── REST routes ────────────────────────────────────────────────────────────
  await fastify.register(deviceRoutes);
  await fastify.register(alertRoutes);
  await fastify.register(analyticsRoutes);

  // ─── Simulation loop (2 s tick) ─────────────────────────────────────────────
  initSimulator();

  setInterval(() => {
    tickSimulator();
    const devices = getAllDevices();

    // Fleet state
    broadcast({ type: 'fleet', payload: devices });

    // Alerts
    for (const alert of checkAndGenerateAlerts(devices)) {
      broadcast({ type: 'alert', payload: alert });
    }

    // AI insights
    for (const insight of generateAIInsights(devices)) {
      broadcast({ type: 'ai_insight', payload: insight });
    }

    // Logs (every other tick ~ 4 s cadence per device)
    for (const log of generateLogs(devices)) {
      broadcast({ type: 'log', payload: log });
    }

    // System health every 5 ticks (10 s)
    if (Math.random() < 0.2) {
      broadcast({ type: 'system_health', payload: buildSystemHealth() });
    }
  }, 2000);

  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`FleetPulse server running on http://${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
