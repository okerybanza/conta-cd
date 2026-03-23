import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../config/database';
import crypto from 'crypto';

const IDEMPOTENCY_TTL_HOURS = 24;

/**
 * SPRINT 1 - TASK 1.6 (CODE-006): Idempotency middleware (minimal version)
 * 
 * Checks for Idempotency-Key header and prevents duplicate operations
 */
export async function idempotencyMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    // Only POST requests
    if (req.method !== 'POST') {
        return next();
    }

    const idempotencyKey = req.headers['idempotency-key'] as string;

    // Optional - skip if no key provided
    if (!idempotencyKey) {
        return next();
    }

    const companyId = (req.user as any)?.companyId || (req as any).companyId;
    if (!companyId) {
        return next();
    }

    const endpoint = `${req.method} ${req.path}`;
    const requestHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(req.body))
        .digest('hex');

    try {
        // Check existing key
        const existing = await prisma.idempotency_keys.findFirst({
            where: {
                company_id: companyId,
                key: idempotencyKey,
            },
        });

        if (existing) {
            // Check expiry
            if (existing.expires_at < new Date()) {
                await prisma.idempotency_keys.delete({ where: { id: existing.id } });
                return next();
            }

            // Check request match
            if (existing.request_hash !== requestHash) {
                return res.status(422).json({
                    success: false,
                    error: 'IDEMPOTENCY_KEY_MISMATCH',
                    message: 'Idempotency key already used with different request',
                });
            }

            // Return cached response
            return res.status(existing.response_code).json(existing.response_body);
        }

        // Store response
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_TTL_HOURS);

        const originalJson = res.json.bind(res);
        res.json = function (body: any) {
            prisma.idempotency_keys.create({
                data: {
                    company_id: companyId,
                    key: idempotencyKey,
                    endpoint,
                    request_hash: requestHash,
                    response_code: res.statusCode,
                    response_body: body,
                    expires_at: expiresAt,
                },
            }).catch(err => console.error('Idem key store failed:', err));

            return originalJson(body);
        };

        next();
    } catch (error) {
        console.error('Idempotency error:', error);
        next(); // Fail open
    }
}
