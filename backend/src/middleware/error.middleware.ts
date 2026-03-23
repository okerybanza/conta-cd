import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ZodError } from 'zod';
import { createErrorWithSolution, ErrorMessages } from '../utils/error-messages';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log erreur avec plus de détails
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    body: req.body,
    params: req.params,
    query: req.query,
    name: err.name,
    ...(err instanceof CustomError && { code: err.code, details: err.details }),
  });

  // Intercepter les erreurs de triggers Prisma (Fiscal Periods)
  if (err.name === 'PrismaClientUnknownRequestError' || err.name === 'PrismaClientKnownRequestError') {
    const msg = err.message;
    if (msg.includes('P0002') || msg.includes('est clos') || msg.includes('est verrouillé')) {
      const periodNameMatch = msg.match(/"([^"]+)"/);
      const periodName = periodNameMatch ? periodNameMatch[1] : undefined;
      const isClosed = msg.includes('clos') || msg.includes('closed');

      const customErr = new CustomError(
        msg.split('\n').pop() || err.message, // Essayer de prendre la dernière ligne propre
        400,
        isClosed ? 'PERIOD_CLOSED' : 'PERIOD_LOCKED',
        { periodName }
      );
      return errorHandler(customErr, req, res, next);
    }

    if (msg.includes('P0001') || msg.includes('No fiscal period defined')) {
      const customErr = new CustomError(
        'Aucun exercice comptable défini pour cette date.',
        400,
        'PERIOD_NOT_FOUND'
      );
      return errorHandler(customErr, req, res, next);
    }
  }

  // Erreur Zod (validation)
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.reduce((acc, error) => {
          const path = error.path.join('.');
          acc[path] = error.message;
          return acc;
        }, {} as Record<string, string>),
      },
    });
  }

  // Erreur personnalisée
  if (err instanceof CustomError) {
    // DOC-10 : Essayer de trouver un message explicite avec solution
    let errorResponse: any = {
      code: err.code,
      message: err.message,
      details: err.details,
    };

    // Si le code d'erreur correspond à un message explicite, l'utiliser
    try {
      // Vérifier si le code existe dans ErrorMessages (pas un message générique)
      const hasCustomMessage = ErrorMessages && (ErrorMessages as any)[err.code];

      if (hasCustomMessage) {
        const errorWithSolution = createErrorWithSolution(err.code, err.details);
        if (errorWithSolution && errorWithSolution.solution) {
          errorResponse = {
            code: errorWithSolution.code,
            message: errorWithSolution.message,
            solution: errorWithSolution.solution, // DOC-10 : Ajouter la solution
            details: err.details,
          };
        }
      }
    } catch (e) {
      // Si le code n'existe pas dans ErrorMessages, utiliser l'erreur originale
    }

    return res.status(err.statusCode).json({
      success: false,
      error: errorResponse,
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token expired',
      },
    });
  }

  // Erreur par défaut
  const statusCode = (err as AppError).statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      ...(!isProduction && {
        stack: err.stack,
        name: err.name,
        originalMessage: err.message,
      }),
    },
  });
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

