import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from './auth.middleware';
import { CustomError } from './error.middleware';
import subscriptionService from '../services/subscription.service';
import logger from '../utils/logger';

/**
 * Middleware pour bloquer les actions d'écriture si l'abonnement est expiré
 * Permet la lecture mais bloque création/édition/suppression
 * 
 * À appliquer uniquement sur les routes POST/PUT/PATCH/DELETE
 * Les routes GET doivent rester accessibles même si l'abonnement est expiré
 */
export async function requireActiveSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Si pas d'utilisateur authentifié, laisser passer (authenticate middleware gère ça)
    if (!req.user) {
      return next();
    }

    // Si Super Admin ou utilisateur Conta, laisser passer
    if (req.user.isSuperAdmin || req.user.isContaUser) {
      return next();
    }

    // Si pas de companyId (ex: expert comptable sans entreprise), laisser passer
    // (l'expert comptable gère ses propres entreprises clientes, pas son propre abonnement)
    if (!req.user.companyId) {
      return next();
    }

    const companyId = req.user.companyId;

    try {
      // Vérifier si l'abonnement est actif
      const subscription = await subscriptionService.getActive(companyId);
      
      // Si l'abonnement est actif, laisser passer
      if (subscription.status === 'active' || subscription.status === 'trial') {
        return next();
      }

      // Si l'abonnement est expired ou cancelled, bloquer
      throw new CustomError(
        'Votre abonnement est expiré. Vous pouvez consulter vos données mais vous devez renouveler votre abonnement pour continuer à créer ou modifier.',
        403,
        'SUBSCRIPTION_EXPIRED_READ_ONLY',
        {
          subscriptionStatus: subscription.status,
          endDate: subscription.endDate?.toISOString(),
        }
      );
    } catch (error: any) {
      // Si l'erreur est déjà une CustomError avec le code SUBSCRIPTION_EXPIRED, la propager
      if (error.code === 'SUBSCRIPTION_EXPIRED' || error.code === 'SUBSCRIPTION_EXPIRED_READ_ONLY') {
        return next(error);
      }

      // Si l'erreur est SUBSCRIPTION_NOT_FOUND, vérifier s'il y a un abonnement expired
      if (error.code === 'SUBSCRIPTION_NOT_FOUND') {
        // Chercher le dernier abonnement (même expired)
        const prisma = (await import('../config/database')).default;
        const lastSubscription = await prisma.subscriptions.findFirst({
          where: { company_id: companyId },
          orderBy: { created_at: 'desc' },
        });

        if (lastSubscription && lastSubscription.status === 'expired') {
          return next(
            new CustomError(
              'Votre abonnement est expiré. Vous pouvez consulter vos données mais vous devez renouveler votre abonnement pour continuer à créer ou modifier.',
              403,
              'SUBSCRIPTION_EXPIRED_READ_ONLY',
              {
                subscriptionStatus: lastSubscription.status,
                endDate: lastSubscription.end_date?.toISOString(),
              }
            )
          );
        }

        // Pas d'abonnement du tout, bloquer aussi
        return next(
          new CustomError(
            'Aucun abonnement actif trouvé. Vous devez souscrire à un plan pour utiliser cette fonctionnalité.',
            403,
            'SUBSCRIPTION_REQUIRED',
          )
        );
      }

      // Autre erreur, logger et laisser passer (ne pas bloquer si erreur inattendue)
      logger.warn('Error checking subscription in readonly middleware', {
        companyId,
        error: error.message,
        code: error.code,
      });
      return next();
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Helper pour vérifier si une entreprise est en mode lecture seule
 * (utile dans les services pour des vérifications conditionnelles)
 */
export async function isReadOnlyMode(companyId: string): Promise<boolean> {
  try {
    const subscription = await subscriptionService.getActive(companyId);
    return subscription.status === 'expired' || subscription.status === 'cancelled';
  } catch (error: any) {
    // Si pas d'abonnement actif, vérifier s'il y a un expired
    if (error.code === 'SUBSCRIPTION_NOT_FOUND' || error.code === 'SUBSCRIPTION_EXPIRED') {
      const prisma = (await import('../config/database')).default;
      const lastSubscription = await prisma.subscriptions.findFirst({
        where: { company_id: companyId },
        orderBy: { created_at: 'desc' },
      });
      return lastSubscription?.status === 'expired' || lastSubscription?.status === 'cancelled';
    }
    // Par défaut, considérer comme non-readonly si erreur inattendue
    return false;
  }
}

