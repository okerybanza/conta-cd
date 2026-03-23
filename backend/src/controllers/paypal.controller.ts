import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import paypalService, { PayPalOrderData, PayPalCaptureData } from '../services/paypal.service';
import { z } from 'zod';
import logger from '../utils/logger';

// Schémas de validation
const createOrderSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  type: z.enum(['invoice', 'subscription']),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const captureOrderSchema = z.object({
  orderId: z.string().min(1),
  invoiceId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  type: z.enum(['invoice', 'subscription']),
});

export class PayPalController {
  /**
   * Créer une Order PayPal pour une facture ou un abonnement
   * POST /api/v1/payments/paypal/init
   */
  async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      }

      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company ID is required' },
        });
      }

      // Valider les données
      const validation = createOrderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        });
      }

      const data = validation.data;

      // Vérifier que les données sont cohérentes
      if (data.type === 'invoice' && !data.invoiceId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'invoiceId is required for invoice payment',
          },
        });
      }

      if (data.type === 'subscription' && !data.packageId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'packageId is required for subscription payment',
          },
        });
      }

      // Créer l'order PayPal
      const orderData: PayPalOrderData = {
        invoiceId: data.invoiceId,
        subscriptionId: data.subscriptionId,
        packageId: data.packageId,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        returnUrl: data.returnUrl,
        cancelUrl: data.cancelUrl,
        type: data.type,
      };

      const result = await paypalService.createOrder(companyId, orderData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error creating PayPal order', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });

      next(error);
    }
  }

  /**
   * Capturer une Order PayPal après approbation
   * POST /api/v1/payments/paypal/capture
   */
  async captureOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      }

      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company ID is required' },
        });
      }

      // Valider les données
      const validation = captureOrderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        });
      }

      const data = validation.data;

      // Vérifier que les données sont cohérentes
      if (data.type === 'invoice' && !data.invoiceId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'invoiceId is required for invoice payment',
          },
        });
      }

      if (data.type === 'subscription' && !data.packageId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'packageId is required for subscription payment',
          },
        });
      }

      // Capturer l'order PayPal
      const captureData: PayPalCaptureData = {
        orderId: data.orderId,
        invoiceId: data.invoiceId,
        subscriptionId: data.subscriptionId,
        packageId: data.packageId,
        type: data.type,
      };

      const result = await paypalService.captureOrder(companyId, captureData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error capturing PayPal order', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });

      next(error);
    }
  }

  /**
   * Récupérer les détails d'une Order PayPal
   * GET /api/v1/payments/paypal/order/:orderId
   */
  async getOrderDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      }

      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company ID is required' },
        });
      }

      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Order ID is required' },
        });
      }

      const order = await paypalService.getOrderDetails(companyId, orderId);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Error getting PayPal order details', {
        error: error.message,
        orderId: req.params.orderId,
      });

      next(error);
    }
  }
}

export default new PayPalController();

