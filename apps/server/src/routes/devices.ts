import type { FastifyInstance } from 'fastify';
import type { DeviceDetailResponse } from '@fleetpulse/types';
import {
  getAllDevices,
  getDevice,
  getDeviceHistory,
  toggleDevice,
} from '../services/simulator.js';
import { getDeviceLogs } from '../services/logs.js';
import { getDeviceInsights } from '../services/ai.js';

interface DeviceParams {
  id: string;
}

export async function deviceRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/devices', async (_req, reply) => {
    return reply.send(getAllDevices());
  });

  fastify.get<{ Params: DeviceParams }>('/api/devices/:id', async (req, reply) => {
    const device = getDevice(req.params.id);
    if (!device) return reply.status(404).send({ error: 'Device not found' });

    const response: DeviceDetailResponse = {
      device,
      history: getDeviceHistory(req.params.id),
      recentLogs: getDeviceLogs(req.params.id),
      aiInsights: getDeviceInsights(req.params.id),
    };
    return reply.send(response);
  });

  fastify.post<{ Params: DeviceParams }>('/api/devices/:id/toggle', async (req, reply) => {
    const updated = toggleDevice(req.params.id);
    if (!updated) return reply.status(404).send({ error: 'Device not found' });
    return reply.send(updated);
  });
}
