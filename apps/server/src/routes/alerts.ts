import type { FastifyInstance } from 'fastify';
import { getAllAlerts } from '../services/alerts.js';

export async function alertRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/alerts — recent alerts
  fastify.get('/api/alerts', async (_req, reply) => {
    return reply.send(getAllAlerts());
  });
}
