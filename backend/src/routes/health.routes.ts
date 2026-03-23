import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prismaHealth = new PrismaClient();
import logger from '../utils/logger';
import redis from '../config/redis';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const start = Date.now();
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {},
    memory: {},
  };

  // Check DB
  try {
    await prismaHealth.$queryRawUnsafe("SELECT 1");
    health.services.database = { status: 'ok', latency: `${Date.now() - start}ms` };
  } catch (error: any) {
    health.services.database = { status: 'error', message: error.message };
    health.status = 'degraded';
  }

  // Check Redis
  try {
    if (redis) {
      const ping = await redis.ping();
      health.services.redis = { status: ping === 'PONG' ? 'ok' : 'error' };
    } else {
      health.services.redis = { status: 'disabled' };
    }
  } catch (error: any) {
    health.services.redis = { status: 'error', message: error.message };
  }

  // Mémoire
  const mem = process.memoryUsage();
  health.memory = {
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'mb',
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'mb',
    rss: Math.round(mem.rss / 1024 / 1024) + 'mb',
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
