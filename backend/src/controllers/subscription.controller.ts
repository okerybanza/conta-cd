import { Request, Response, NextFunction } from 'express';
import subscriptionService from '../services/subscription.service';
import { CustomError } from '../middleware/error.middleware';
import { authenticate, AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { z } from 'zod';
import prisma from '../config/database';

// Fonction utilitaire pour mapper les données Prisma vers le format frontend
function mapSubscriptionToFrontend(subscription: any) {
  // Accès robuste au package (peut être dans packages ou packages relation)
  // Essayer plusieurs chemins d'accès possibles
  let pkg = subscription.packages;
  if (!pkg) {
    pkg = (subscription as any).packages;
  }
  if (!pkg && subscription.package_id) {
    // Si le package n'est toujours pas trouvé, essayer de le récupérer depuis l'objet subscription
    // Cela peut arriver si Prisma a chargé le package mais qu'il n'est pas accessible directement
    const packagesRelation = (subscription as any).packages;
    if (packagesRelation) {
      pkg = packagesRelation;
    }
  }
  
  // Construire l'objet package de manière robuste
  let packageObj: any = undefined;
  if (pkg) {
    try {
      packageObj = {
        id: pkg.id,
        code: pkg.code,
        name: pkg.name,
        description: pkg.description || undefined,
        priceMonthly: Number(pkg.price || 0),
        priceYearly: pkg.billing_cycle === 'yearly' ? Number(pkg.price || 0) : Number(pkg.price || 0) * 10,
        currency: pkg.currency || 'CDF',
        limits: pkg.limits as any || {},
        features: pkg.features as any || {},
        isActive: pkg.is_active !== undefined ? pkg.is_active : true,
        displayOrder: pkg.display_order || 0,
      };
    } catch (error: any) {
      console.error('Error mapping package:', error);
      packageObj = undefined;
    }
  }
  
  return {
    id: subscription.id,
    companyId: subscription.company_id,
    packageId: subscription.package_id,
    status: subscription.status,
    billingCycle: subscription.billing_cycle,
    startDate: subscription.start_date ? subscription.start_date.toISOString() : new Date().toISOString(),
    endDate: subscription.end_date ? subscription.end_date.toISOString() : undefined,
    trialEndsAt: subscription.trial_ends_at ? subscription.trial_ends_at.toISOString() : undefined,
    cancelledAt: subscription.cancelled_at ? subscription.cancelled_at.toISOString() : undefined,
    cancelledBy: subscription.cancelled_by || undefined,
    paymentMethod: subscription.payment_method || undefined,
    lastPaymentDate: subscription.last_payment_date ? subscription.last_payment_date.toISOString() : undefined,
    nextPaymentDate: subscription.next_payment_date ? subscription.next_payment_date.toISOString() : undefined,
    package: packageObj,
  };
}

const createSubscriptionSchema = z.object({
  packageId: z.string().uuid(),
  billingCycle: z.enum(['monthly', 'yearly']),
  startDate: z.string().datetime().optional(),
  trialDays: z.number().int().positive().max(30).optional(),
});

export class SubscriptionController {
  /**
   * GET /api/v1/subscription
   * Obtenir l'abonnement actif de l'entreprise
   */
  async getActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionService.getActive(getCompanyId(req));
      
      // Le service devrait déjà avoir chargé le package, mais on vérifie quand même
      if (!subscription.packages && subscription.package_id) {
        logger.warn('Package not included in subscription from service, loading manually from Prisma in controller', {
          subscriptionId: subscription.id,
          packageId: subscription.package_id,
        });
        try {
          const pkg = await prisma.packages.findUnique({
            where: { id: subscription.package_id },
          });
          if (!pkg) {
            logger.error('Package not found in database', {
              subscriptionId: subscription.id,
              packageId: subscription.package_id,
            });
            throw new CustomError(
              `Package avec l'ID ${subscription.package_id} introuvable`,
              404,
              'PACKAGE_NOT_FOUND'
            );
          }
          // Mapper le package Prisma vers le format attendu
          subscription.packages = {
            id: pkg.id,
            code: pkg.code,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            currency: pkg.currency,
            limits: pkg.limits,
            features: pkg.features,
            is_active: pkg.is_active,
            display_order: pkg.display_order,
            billing_cycle: pkg.billing_cycle,
          } as any;
          logger.info('Package loaded and attached in controller', {
            subscriptionId: subscription.id,
            packageId: pkg.id,
            packageName: pkg.name,
          });
        } catch (pkgError: any) {
          logger.error('Failed to load package for subscription in controller', {
            subscriptionId: subscription.id,
            packageId: subscription.package_id,
            error: pkgError.message,
            stack: pkgError.stack,
          });
          throw new CustomError(
            'Package associé à l\'abonnement introuvable',
            500,
            'PACKAGE_NOT_FOUND'
          );
        }
      }
      
      // Vérifier que le package existe maintenant avant de mapper
      // Utiliser une vérification plus robuste avec accès direct à la propriété
      const packagesRelation = (subscription as any).packages;
      if (!packagesRelation && subscription.package_id) {
        logger.error('Subscription found but package is still missing after all attempts', {
          subscriptionId: subscription.id,
          packageId: subscription.package_id,
          companyId: subscription.company_id,
          hasPackages: !!packagesRelation,
          packagesType: typeof packagesRelation,
        });
        throw new CustomError(
          'Package associé à l\'abonnement introuvable',
          500,
          'PACKAGE_NOT_FOUND'
        );
      }
      
      // S'assurer que subscription.packages est défini pour le mapping
      if (!packagesRelation && subscription.package_id) {
        // Dernière tentative : charger directement depuis Prisma
        const pkg = await prisma.packages.findUnique({
          where: { id: subscription.package_id },
        });
        if (pkg) {
          (subscription as any).packages = pkg;
          logger.info('Package loaded as last resort in controller', {
            subscriptionId: subscription.id,
            packageId: pkg.id,
          });
        }
      }
      
      // Mapper les données Prisma (snake_case) vers camelCase pour le frontend
      const mappedSubscription = mapSubscriptionToFrontend(subscription);
      
      // Vérifier que le package est bien dans la réponse mappée
      if (!mappedSubscription.package) {
        logger.error('Package missing in mapped subscription response', {
          subscriptionId: mappedSubscription.id,
          packageId: mappedSubscription.packageId,
          hasPackagesInSubscription: !!(subscription as any).packages,
          packagesValue: (subscription as any).packages ? 'exists' : 'null/undefined',
        });
        // Ne pas throw d'erreur ici, mais logger pour debug
        // Le frontend gère déjà ce cas avec un message d'avertissement
      } else {
        logger.info('✅ Mapped subscription sent to frontend WITH package', {
          subscriptionId: mappedSubscription.id,
          hasPackage: !!mappedSubscription.package,
          packageName: mappedSubscription.package?.name,
          packageCode: mappedSubscription.package?.code,
          packageFeatures: Object.keys(mappedSubscription.package?.features || {}),
        });
      }
      
      // Log la réponse complète pour debug (en développement seulement)
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Full subscription response', {
          subscription: {
            id: mappedSubscription.id,
            hasPackage: !!mappedSubscription.package,
            packageName: mappedSubscription.package?.name,
          },
        });
      }
      
      res.json({
        success: true,
        data: mappedSubscription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/subscription
   * Créer un abonnement
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createSubscriptionSchema.parse(req.body);
      const subscription = await subscriptionService.create(getCompanyId(req), {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
      });
      
      // Mapper les données Prisma (snake_case) vers camelCase pour le frontend
      res.status(201).json({
        success: true,
        data: mapSubscriptionToFrontend(subscription),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/subscription/upgrade
   * Changer de package
   */
  async upgrade(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { packageId } = req.body;
      if (!packageId || typeof packageId !== 'string') {
        throw new CustomError('packageId is required', 400, 'VALIDATION_ERROR');
      }
      const subscription = await subscriptionService.upgrade(
        getCompanyId(req),
        packageId,
        req.user.id
      );
      
      // Mapper les données Prisma (snake_case) vers camelCase pour le frontend
      const mappedSubscription = {
        id: subscription.id,
        companyId: subscription.company_id,
        packageId: subscription.package_id,
        status: subscription.status,
        billingCycle: subscription.billing_cycle,
        startDate: subscription.start_date ? subscription.start_date.toISOString() : new Date().toISOString(),
        endDate: subscription.end_date ? subscription.end_date.toISOString() : undefined,
        trialEndsAt: subscription.trial_ends_at ? subscription.trial_ends_at.toISOString() : undefined,
        cancelledAt: subscription.cancelled_at ? subscription.cancelled_at.toISOString() : undefined,
        cancelledBy: subscription.cancelled_by || undefined,
        paymentMethod: subscription.payment_method || undefined,
        lastPaymentDate: subscription.last_payment_date ? subscription.last_payment_date.toISOString() : undefined,
        nextPaymentDate: subscription.next_payment_date ? subscription.next_payment_date.toISOString() : undefined,
        package: subscription.packages ? {
          id: subscription.packages.id,
          code: subscription.packages.code,
          name: subscription.packages.name,
          description: subscription.packages.description || undefined,
          priceMonthly: Number(subscription.packages.price || 0),
          priceYearly: subscription.packages.billing_cycle === 'yearly' ? Number(subscription.packages.price || 0) : Number(subscription.packages.price || 0) * 10,
          currency: subscription.packages.currency || 'CDF',
          limits: subscription.packages.limits as any || {},
          features: subscription.packages.features as any || {},
          isActive: subscription.packages.is_active || false,
          displayOrder: subscription.packages.display_order || 0,
        } : undefined,
      };
      
      res.json({
        success: true,
        data: mappedSubscription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/subscription/cancel
   * Annuler un abonnement
   */
  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionService.cancel(getCompanyId(req), req.user.id);
      
      // Récupérer l'abonnement avec le package pour le mapping
      const subscriptionWithPackage = await prisma.subscriptions.findUnique({
        where: { id: subscription.id },
        include: { packages: true },
      });
      
      if (!subscriptionWithPackage) {
        throw new CustomError('Subscription not found after cancellation', 404, 'SUBSCRIPTION_NOT_FOUND');
      }
      
      // Mapper les données Prisma (snake_case) vers camelCase pour le frontend
      res.json({
        success: true,
        data: mapSubscriptionToFrontend(subscriptionWithPackage),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/subscription/renew
   * Renouveler un abonnement
   */
  async renew(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const automatic = req.body.automatic === true;
      const subscription = await subscriptionService.renew(getCompanyId(req), automatic);
      
      // Mapper les données Prisma (snake_case) vers camelCase pour le frontend
      const mappedSubscription = {
        id: subscription.id,
        companyId: subscription.company_id,
        packageId: subscription.package_id,
        status: subscription.status,
        billingCycle: subscription.billing_cycle,
        startDate: subscription.start_date ? subscription.start_date.toISOString() : new Date().toISOString(),
        endDate: subscription.end_date ? subscription.end_date.toISOString() : undefined,
        trialEndsAt: subscription.trial_ends_at ? subscription.trial_ends_at.toISOString() : undefined,
        cancelledAt: subscription.cancelled_at ? subscription.cancelled_at.toISOString() : undefined,
        cancelledBy: subscription.cancelled_by || undefined,
        paymentMethod: subscription.payment_method || undefined,
        lastPaymentDate: subscription.last_payment_date ? subscription.last_payment_date.toISOString() : undefined,
        nextPaymentDate: subscription.next_payment_date ? subscription.next_payment_date.toISOString() : undefined,
        package: subscription.packages ? {
          id: subscription.packages.id,
          code: subscription.packages.code,
          name: subscription.packages.name,
          description: subscription.packages.description || undefined,
          priceMonthly: Number(subscription.packages.price || 0),
          priceYearly: subscription.packages.billing_cycle === 'yearly' ? Number(subscription.packages.price || 0) : Number(subscription.packages.price || 0) * 10,
          currency: subscription.packages.currency || 'CDF',
          limits: subscription.packages.limits as any || {},
          features: subscription.packages.features as any || {},
          isActive: subscription.packages.is_active || false,
          displayOrder: subscription.packages.display_order || 0,
        } : undefined,
      };
      
      res.json({
        success: true,
        data: mappedSubscription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/subscription/quota-summary
   * Obtenir le résumé des quotas et fonctionnalités
   */
  async getQuotaSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quotaService = (await import('../services/quota.service')).default;
      const summary = await quotaService.getQuotaSummary(getCompanyId(req));
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SubscriptionController();

