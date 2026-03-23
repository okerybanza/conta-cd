import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const logData = {
      method,
      url: originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      ip: req.headers['x-forwarded-for'] || ip,
      userAgent: req.headers['user-agent'],
    };

    if (statusCode >= 500) {
      logger.error('HTTP 5xx', logData);
    } else if (statusCode >= 400) {
      logger.warn('HTTP 4xx', logData);
    } else if (duration > 3000) {
      logger.warn('Slow request', logData);
    } else {
      logger.info('HTTP', logData);
    }
  });

  next();
};
