import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { z } from 'zod';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { setAuthCookies, clearAuthCookies } from '../middleware/cookie.middleware';

// Schémas de validation
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1),
  accountType: z.enum(['entrepreneur', 'startup', 'ong_firm', 'expert_comptable']).default('startup'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(32),
});

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('=== REGISTER REQUEST ===', JSON.stringify(req.body, null, 2));
      logger.info('Register request received', { body: req.body });
      const data = registerSchema.parse(req.body);
      console.log('=== SCHEMA VALIDATION PASSED ===', { email: data.email, accountType: data.accountType });
      logger.info('Schema validation passed', { email: data.email, accountType: data.accountType });
      const result = await authService.register(data);
      console.log('=== REGISTRATION SUCCESSFUL ===', { userId: result.user.id, email: data.email });
      logger.info('Registration successful', { userId: result.user.id, email: data.email });

      // Don't set cookies yet - wait for email verification
      // Return data without tokens
      res.status(201).json({
        success: true,
        data: {
          requiresEmailVerification: result.requiresEmailVerification,
          email: result.email,
          user: result.user,
          company: result.company,
        },
      });
    } catch (error) {
      console.error('=== REGISTRATION ERROR ===', (error as Error).message);
      console.error('=== STACK ===', (error as Error).stack);
      logger.error('Registration error', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name,
        body: req.body,
      });
      next(error);
    }
  }

  /**
   * Dev / QA: Inspecter l'état d'un email (existe, vérifié, supprimé, etc.).
   * Désactivé automatiquement en production.
   */
  async emailStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not available in production',
          },
        });
      }

      const email = (req.query.email as string)?.trim();
      if (!email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_REQUIRED',
            message: 'Query parameter "email" is required',
          },
        });
      }

      const status = await authService.getEmailStatus(email);
      return res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await authService.login(data, ipAddress);

      // Set HttpOnly cookies for security
      setAuthCookies(res, result.accessToken, result.refreshToken);

      // Return user and company data (no tokens in response body)
      res.json({
        success: true,
        data: {
          user: result.user,
          company: result.company,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const data = verifyEmailSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await authService.verifyEmail(data.email, data.code, ipAddress);

      // Set HttpOnly cookies after successful email verification
      setAuthCookies(res, result.accessToken, result.refreshToken);

      // Return user and company data (no tokens in response body)
      res.json({
        success: true,
        data: {
          user: result.user,
          company: result.company,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async resendEmailVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resendVerificationSchema.parse(req.body);
      const result = await authService.resendEmailVerification(data.email);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Try to get refresh token from cookie first, then fallback to body (for API clients)
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: { code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh token required' },
        });
      }

      const tokens = await authService.refreshToken(refreshToken);

      // Set new cookies
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      // Return success (no tokens in response body)
      res.json({
        success: true,
        data: { refreshed: true },
      });
    } catch (error) {
      next(error);
    }
  }

  async enable2FA(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
      }
      const result = await authService.enable2FA(req.user.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verify2FA(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
      }
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({
          success: false,
          error: { code: 'TOKEN_REQUIRED', message: '2FA token required' },
        });
      }
      const result = await authService.verifyAndEnable2FA(req.user.id, token);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async disable2FA(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
      }
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({
          success: false,
          error: { code: 'PASSWORD_REQUIRED', message: 'Password required' },
        });
      }
      const result = await authService.disable2FA(req.user.id, password);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
      }

      // Récupérer infos utilisateur complètes
      const prisma = (await import('../config/database')).default;
      const user = await prisma.users.findFirst({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          role: true,
          two_factor_enabled: true,
          companies: {
            select: {
              id: true,
              name: true,
              logo_url: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(email);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(data.token, data.password);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // SPRINT 5 - TASK 5.3: Centralized Revocation
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = (await import('jsonwebtoken')).verify(token, (await import('../config/env')).default.JWT_SECRET) as any;
          if (decoded.jti) {
            const { default: revocationService } = await import('../services/auth/revocation.service');
            // Révoquer pour la durée restante du token (ou par défaut 24h)
            await revocationService.revoke(decoded.jti, 86400);
          }
        } catch (e) {
          // Ignorer si le token est déjà invalide
        }
      }

      // Clear auth cookies
      clearAuthCookies(res);

      res.json({
        success: true,
        message: 'Logged out successfully (Session revoked centrally)',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
