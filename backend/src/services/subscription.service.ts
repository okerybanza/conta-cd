import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import packageService from './package.service';
// import env from '../config/env'; // Utiliser process.env directement
import { randomUUID } from 'crypto';

export interface CreateSubscriptionData {
  packageId?: string;
  billingCycle?: 'monthly' | 'yearly';
  startDate?: Date;
  trialDays?: number; // Période d'essai en jours (défaut: 14)
}

export class SubscriptionService {
  /**
   * Créer un abonnement pour une entreprise
   */
  async create(companyId: string, data: CreateSubscriptionData) {
    // Vérifier que le package existe
    const pkg = await packageService.getById(data.packageId);

    // Vérifier le type de compte (accountType) pour restreindre certains plans
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { id: true, account_type: true, name: true },
    });

    if (!company) {
      throw new CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    // Règle métier actuelle :
    // - Le plan FREE est réservé aux comptes ENTREPRENEUR
    // - Les autres types (STARTUP, ONG_FIRM, EXPERT_COMPTABLE) doivent utiliser un plan payant
    if (pkg.code === 'FREE' && company.account_type !== 'ENTREPRENEUR') {
      throw new CustomError(
        'Le plan Gratuit est réservé aux comptes Entrepreneur. Veuillez choisir un autre plan.',
        400,
        'PACKAGE_NOT_ALLOWED_FOR_ACCOUNT_TYPE',
        {
          companyId,
          companyAccountType: company.account_type,
          packageCode: pkg.code,
        }
      );
    }

    // Vérifier qu'il n'y a pas déjà un abonnement actif
    const existing = await prisma.subscriptions.findUnique({
      where: { company_id: companyId },
    });

    if (existing && existing.status === 'active') {
      throw new CustomError(
        'Company already has an active subscription',
        409,
        'SUBSCRIPTION_EXISTS'
      );
    }

    const startDate = data.startDate || new Date();
    
    // Déterminer si c'est un plan gratuit (STARTER) ou payant (PRO/PREMIUM)
    const isFreePlan = pkg.code === 'STARTER' || Number(pkg.priceMonthly) === 0;
    
    // Pour les plans payants (PRO, PREMIUM), activer un essai de 14 jours
    // Pour STARTER (gratuit), pas d'essai, activation immédiate
    let status: string;
    let trialEndsAt: Date | null = null;
    
    if (isFreePlan) {
      // Plan gratuit : activation immédiate, pas d'essai
      status = 'active';
    } else {
      // Plan payant : essai gratuit de 14 jours
      status = 'trial';
      const trialDays = data.trialDays || 14;
      trialEndsAt = new Date(startDate);
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
    }

    // Calculer la date de fin selon le cycle de facturation
    const endDate = new Date(startDate);
    if (data.billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const subscription = await prisma.subscriptions.create({
      data: {
        id: randomUUID(),
        company_id: companyId,
        package_id: data.packageId,
        status: status as any,
        billing_cycle: data.billingCycle,
        start_date: startDate,
        end_date: endDate,
        trial_ends_at: trialEndsAt,
        next_payment_date: endDate,
        updated_at: new Date(),
      },
      include: {
        packages: true,
      },
    });

    logger.info(`Subscription created: ${subscription.id}`, {
      companyId,
      packageId: data.packageId,
      status: subscription.status,
    });

    return subscription;
  }

  /**
   * Obtenir l'abonnement actif d'une entreprise
   */
  async getActive(companyId: string) {
    const subscription = await prisma.subscriptions.findFirst({
      where: { 
        company_id: companyId,
        status: { in: ['active', 'trial'] },
      },
      include: {
        packages: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!subscription) {
      throw new CustomError(
        'No active subscription found',
        404,
        'SUBSCRIPTION_NOT_FOUND'
      );
    }

    // Vérifier si l'abonnement est expiré
    if (subscription.end_date && subscription.end_date < new Date()) {
      // Mettre à jour le statut
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: { status: 'expired', updated_at: new Date() },
      });

      throw new CustomError(
        'Subscription has expired. Please renew.',
        403,
        'SUBSCRIPTION_EXPIRED'
      );
    }

    // Vérifier si le package est inclus (peut être null même avec include)
    // Utiliser un accès robuste pour vérifier la présence du package
    const packagesRelation = (subscription as any).packages;
    
    if (!packagesRelation && subscription.package_id) {
      logger.warn('Package not included in subscription query result, loading manually', {
        subscriptionId: subscription.id,
        packageId: subscription.package_id,
        companyId,
        hasPackages: !!packagesRelation,
        packagesType: typeof packagesRelation,
      });
      const pkg = await prisma.packages.findUnique({
        where: { id: subscription.package_id },
      });
      if (pkg) {
        // Ajouter le package à l'objet subscription de manière explicite
        (subscription as any).packages = pkg;
        logger.info('Package loaded manually and attached to subscription', {
          subscriptionId: subscription.id,
          packageId: pkg.id,
          packageName: pkg.name,
        });
      } else {
        logger.error('Package not found for subscription', {
          subscriptionId: subscription.id,
          packageId: subscription.package_id,
        });
        // Ne pas throw ici, laisser le controller gérer l'erreur
      }
    } else if (packagesRelation) {
      logger.debug('Package included in subscription query', {
        subscriptionId: subscription.id,
        packageId: subscription.package_id,
        packageName: packagesRelation.name,
        packageCode: packagesRelation.code,
      });
    }

    // S'assurer que le package est toujours attaché avant de retourner
    if (!(subscription as any).packages && subscription.package_id) {
      logger.warn('Package still missing after all attempts in service, will be handled in controller', {
        subscriptionId: subscription.id,
        packageId: subscription.package_id,
      });
    }

    return subscription;
  }

  /**
   * Vérifier si une entreprise est en période d'essai
   */
  async isTrial(companyId: string): Promise<boolean> {
    try {
      const subscription = await this.getActive(companyId);
      
      if (subscription.status !== 'trial') {
        return false;
      }

      if (!subscription.trial_ends_at) {
        return false;
      }

      return subscription.trial_ends_at > new Date();
    } catch (error) {
      return false;
    }
  }

  /**
   * Changer de package (upgrade/downgrade)
   */
  async upgrade(companyId: string, newPackageId: string, userId?: string) {
    // Pour le Super Admin, on peut changer même si l'abonnement est expired
    // On récupère l'abonnement actuel (même expired) ou on en crée un
    let subscription;
    try {
      subscription = await this.getActive(companyId);
    } catch (error: any) {
      // Si pas d'abonnement actif, chercher le dernier abonnement (même expired)
      const lastSubscription = await prisma.subscriptions.findFirst({
        where: { company_id: companyId },
        include: { packages: true },
        orderBy: { created_at: 'desc' },
      });
      
      if (!lastSubscription) {
        throw new CustomError('No subscription found for this company', 404, 'SUBSCRIPTION_NOT_FOUND');
      }
      
      subscription = lastSubscription;
    }
    
    const oldPackage = subscription.packages;

    // Vérifier que le nouveau package existe
    const newPackage = await packageService.getById(newPackageId);

    // Récupérer l'entreprise et les utilisateurs à notifier
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, account_type: true },
    });

    if (!company) {
      throw new CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    // Règle métier : empêcher de passer vers FREE pour les comptes non-Entrepreneur
    if (newPackage.code === 'FREE' && company.account_type !== 'ENTREPRENEUR') {
      throw new CustomError(
        'Le plan Gratuit est réservé aux comptes Entrepreneur. Veuillez choisir un autre plan.',
        400,
        'PACKAGE_NOT_ALLOWED_FOR_ACCOUNT_TYPE',
        {
          companyId,
          companyAccountType: company.account_type,
          newPackageCode: newPackage.code,
        }
      );
    }

    // Trouver les utilisateurs à notifier : créateur, admins, comptables
    const usersToNotify = await prisma.users.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        OR: [
          { role: 'admin' },
          { role: 'accountant' },
          // Le créateur est généralement le premier admin
        ],
      },
      orderBy: {
        created_at: 'asc', // Le premier est probablement le créateur
      },
      take: 10, // Limiter à 10 pour éviter trop d'emails
    });

    // Mettre à jour l'abonnement
    const updated = await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        package_id: newPackageId,
        // Le changement de package prend effet immédiatement
        // La facturation sera ajustée au prochain cycle
      },
      include: {
        packages: true,
      },
    });

    logger.info(`Subscription upgraded: ${subscription.id}`, {
      companyId,
      oldPackageId: subscription.package_id,
      newPackageId,
      userId,
    });

    // Envoyer des emails de notification
    try {
      const emailService = (await import('./email.service')).default;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      // Déterminer les nouvelles fonctionnalités
      const oldFeatures = (oldPackage.features as any) || {};
      const newFeaturesObj = (newPackage.features as any) || {};
      const newFeatures: string[] = [];
      
      const featureLabels: Record<string, string> = {
        expenses: 'Module Dépenses',
        accounting: 'Comptabilité Avancée',
        recurring_invoices: 'Factures Récurrentes',
        api: 'API Access',
        custom_templates: 'Templates Personnalisés',
        multi_currency: 'Multi-devises',
        advanced_reports: 'Rapports Avancés',
        workflows: 'Workflows Automatisés',
        custom_branding: 'Branding Personnalisé',
      };

      for (const [key, value] of Object.entries(newFeaturesObj)) {
        if (value === true && oldFeatures[key] !== true) {
          newFeatures.push(featureLabels[key] || key);
        }
      }

      // Calculer le montant (pour l'instant, on utilise le prix du package)
      const amount = Number(newPackage.price);
      const currency = newPackage.currency || 'CDF';
      const billingCycle = subscription.billing_cycle;
      const nextPaymentDate = subscription.next_payment_date 
        ? new Date(subscription.next_payment_date).toLocaleDateString('fr-FR')
        : 'N/A';

      // Envoyer un email à chaque utilisateur concerné
      for (const user of usersToNotify) {
        try {
          await emailService.sendEmail({
            from: process.env.SMTP_NOTIF_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || '',
            to: user.email,
            subject: `Abonnement Mis à Jour - ${company.name}`,
            template: 'subscription-upgraded',
            data: {
              firstName: user.first_name || 'Utilisateur',
              companyName: company.name,
              oldPackageName: oldPackage.name,
              newPackageName: newPackage.name,
              billingCycle: billingCycle === 'monthly' ? 'Mensuel' : 'Annuel',
              nextPaymentDate,
              amount: amount.toLocaleString('fr-FR'),
              currency,
              newFeatures,
              dashboardUrl: `${frontendUrl}/dashboard`,
            },
          });
          logger.info('Subscription upgrade email sent', { userId: user.id, email: user.email });
        } catch (error: any) {
          logger.error('Error sending subscription upgrade email', {
            userId: user.id,
            email: user.email,
            error: error.message,
          });
        }
      }
    } catch (error: any) {
      logger.error('Error sending subscription upgrade emails', {
        error: error.message,
        companyId,
      });
      // Ne pas faire échouer l'upgrade si l'email échoue
    }

    return updated;
  }

  /**
   * Annuler un abonnement
   */
  async cancel(companyId: string, userId?: string) {
    const subscription = await this.getActive(companyId);

    const cancelled = await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
        cancelled_at: new Date(),
        cancelled_by: userId,
        // L'abonnement reste actif jusqu'à la fin de la période payée
      },
    });

    logger.info(`Subscription cancelled: ${subscription.id}`, {
      companyId,
      userId,
    });

    return cancelled;
  }

  /**
   * Renouveler un abonnement (manuellement ou automatiquement)
   */
  async renew(companyId: string, automatic: boolean = false) {
    const subscription = await this.getActive(companyId);

    // Pour le renouvellement automatique, on accepte aussi les abonnements actifs qui arrivent à expiration
    if (!automatic && subscription.status !== 'expired' && subscription.status !== 'cancelled') {
      throw new CustomError(
        'Subscription is not expired or cancelled',
        400,
        'INVALID_STATUS'
      );
    }

    const now = new Date();
    const endDate = new Date(now);
    
    // Toujours mensuel selon les spécifications
    endDate.setMonth(endDate.getMonth() + 1);

    const renewed = await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        start_date: now,
        end_date: endDate,
        next_payment_date: endDate,
        last_payment_date: now,
        cancelled_at: null,
        cancelled_by: null,
      },
      include: {
        packages: true,
      },
    });

    logger.info(`Subscription renewed: ${subscription.id}`, {
      companyId,
      automatic,
    });

    // Envoyer des emails de notification pour le renouvellement
    try {
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
      });

      if (company) {
        const usersToNotify = await prisma.users.findMany({
          where: {
            company_id: companyId,
            deleted_at: null,
            OR: [
              { role: 'admin' },
              { role: 'accountant' },
            ],
          },
          orderBy: {
            created_at: 'asc',
          },
          take: 10,
        });

        const emailService = (await import('./email.service')).default;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        
        const amount = Number(renewed.packages.price);
        const currency = renewed.packages.currency || 'CDF';
        const nextRenewalDate = new Date(endDate);
        nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);

        for (const user of usersToNotify) {
          try {
            await emailService.sendEmail({
              from: process.env.SMTP_NOTIF_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || '',
              to: user.email,
              subject: automatic 
                ? `Abonnement Renouvelé Automatiquement - ${company.name}`
                : `Abonnement Renouvelé - ${company.name}`,
              template: 'subscription-renewed',
              data: {
                firstName: user.first_name || 'Utilisateur',
                companyName: company.name,
                packageName: renewed.packages.name,
                periodStart: now.toLocaleDateString('fr-FR'),
                periodEnd: endDate.toLocaleDateString('fr-FR'),
                amount: amount.toLocaleString('fr-FR'),
                currency,
                nextRenewalDate: nextRenewalDate.toLocaleDateString('fr-FR'),
                dashboardUrl: `${frontendUrl}/dashboard`,
                automatic,
              },
            });
            logger.info('Subscription renewal email sent', { userId: user.id, email: user.email });
          } catch (error: any) {
            logger.error('Error sending subscription renewal email', {
              userId: user.id,
              email: user.email,
              error: error.message,
            });
          }
        }
      }
    } catch (error: any) {
      logger.error('Error sending subscription renewal emails', {
        error: error.message,
        companyId,
      });
    }

    return renewed;
  }

  /**
   * Renouveler automatiquement les abonnements mensuels expirés
   * À appeler par un cron job quotidien
   */
  async renewExpiredSubscriptions() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Trouver les abonnements qui expirent aujourd'hui ou demain et qui sont actifs
    const expiredSubscriptions = await prisma.subscriptions.findMany({
      where: {
        status: 'active',
        end_date: {
          lte: tomorrow,
          gte: now,
        },
        billing_cycle: 'monthly', // Seulement les mensuels
      },
      include: {
        companies: true,
        packages: true,
      },
    });

    logger.info(`Found ${expiredSubscriptions.length} subscriptions to renew automatically`);

    const results = {
      renewed: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const subscription of expiredSubscriptions) {
      try {
        // Renouveler automatiquement
        await this.renew(subscription.company_id, true);
        results.renewed++;
        logger.info(`Auto-renewed subscription ${subscription.id} for company ${subscription.company_id}`);
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          subscriptionId: subscription.id,
          companyId: subscription.company_id,
          error: error.message,
        });
        logger.error(`Error auto-renewing subscription ${subscription.id}`, {
          error: error.message,
          companyId: subscription.company_id,
        });
      }
    }

    return results;
  }

  /**
   * Obtenir le package actif d'une entreprise
   */
  async getActivePackage(companyId: string) {
    const subscription = await this.getActive(companyId);
    return subscription.packages;
  }
}

export default new SubscriptionService();

