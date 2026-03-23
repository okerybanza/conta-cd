import prisma from '../config/database';
import logger from '../utils/logger';
import { CustomError } from '../middleware/error.middleware';
import subscriptionService from './subscription.service';
import emailService from './email.service';
import env from '../config/env';

/**
 * Service de gestion de la suppression et restauration de comptes
 * 
 * Bonnes pratiques implémentées :
 * 1. Période de grâce (grace period) : 30 jours pour restaurer un compte
 * 2. Anonymisation progressive : données sensibles anonymisées après période de grâce
 * 3. Gestion des abonnements : annulation/expiration lors de la suppression
 * 4. Réutilisation d'email : vérification intelligente lors de l'inscription
 * 5. Audit trail : logs complets de toutes les opérations
 */

// Période de grâce en jours (30 jours par défaut)
const GRACE_PERIOD_DAYS = parseInt(process.env.ACCOUNT_DELETION_GRACE_PERIOD_DAYS || '30');

// Période avant anonymisation complète (90 jours après suppression)
const ANONYMIZATION_PERIOD_DAYS = parseInt(process.env.ACCOUNT_ANONYMIZATION_PERIOD_DAYS || '90');

export interface DeleteAccountOptions {
  reason?: string;
  anonymizeImmediately?: boolean; // Pour les cas de force majeure (RGPD, etc.)
}

export interface RestoreAccountResult {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  restoredAt: Date;
}

export class AccountDeletionService {
  /**
   * Supprimer un compte utilisateur (soft delete avec période de grâce)
   * 
   * @param userId ID de l'utilisateur à supprimer
   * @param deleterId ID de l'utilisateur qui effectue la suppression
   * @param options Options de suppression
   */
  async deleteAccount(
    userId: string,
    deleterId: string,
    options: DeleteAccountOptions = {}
  ) {
    // Récupérer l'utilisateur avec sa société
    const user = await prisma.users.findFirst({
      where: {
        id: userId,
        deleted_at: null,
      },
      include: {
        companies: true,
      },
    });

    if (!user) {
      throw new CustomError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
    }

    // Vérifier les permissions
    const deleter = await prisma.users.findUnique({
      where: { id: deleterId },
    });

    if (!deleter) {
      throw new CustomError('Utilisateur suppresseur non trouvé', 404, 'USER_NOT_FOUND');
    }

    // Seuls les admins peuvent supprimer des comptes (sauf auto-suppression)
    const isSelfDeletion = userId === deleterId;
    const isAdmin = deleter.role === 'admin' || deleter.is_super_admin || deleter.is_conta_user;

    if (!isSelfDeletion && !isAdmin) {
      throw new CustomError(
        'Seuls les administrateurs peuvent supprimer des comptes utilisateur',
        403,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    // Empêcher la suppression d'un super admin (sauf par un autre super admin)
    if (user.is_super_admin && (!deleter.is_super_admin || isSelfDeletion)) {
      throw new CustomError(
        'Impossible de supprimer un compte Super Admin',
        403,
        'CANNOT_DELETE_SUPER_ADMIN'
      );
    }

    const now = new Date();
    const gracePeriodEnd = new Date(now);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

    // Calculer la date d'anonymisation
    const anonymizationDate = new Date(now);
    anonymizationDate.setDate(anonymizationDate.getDate() + ANONYMIZATION_PERIOD_DAYS);

    // Sauvegarder l'email original pour la période de grâce
    const originalEmail = user.email;
    
    // Générer un email temporaire unique (préfixe avec timestamp pour éviter les collisions)
    const deletedEmailPrefix = options.anonymizeImmediately 
      ? `deleted_${Date.now()}_${user.id}_`
      : `deleted_grace_${user.id}_`;
    
    const temporaryEmail = `${deletedEmailPrefix}${originalEmail}`;

    // Transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // 1. Soft delete de l'utilisateur
      const deletedUser = await tx.users.update({
        where: { id: userId },
        data: {
          deleted_at: now,
          email: temporaryEmail, // Libérer l'email unique immédiatement
          // Stocker l'email original dans un champ JSON pour la restauration
          // (on utilise preferences comme champ flexible)
          preferences: {
            ...((user.preferences as any) || {}),
            deletedAccount: {
              originalEmail,
              deletedAt: now.toISOString(),
              deletedBy: deleterId,
              reason: options.reason || null,
              gracePeriodEnd: gracePeriodEnd.toISOString(),
              anonymizationDate: anonymizationDate.toISOString(),
              canRestore: !options.anonymizeImmediately,
            },
          },
          updated_at: now,
        },
        select: {
          id: true,
          email: true,
          company_id: true,
        },
      });

      // 2. Gérer l'abonnement de l'entreprise si l'utilisateur est le propriétaire
      if (user.company_id) {
        const company = await tx.companies.findUnique({
          where: { id: user.company_id },
          include: {
            users: {
              where: {
                deleted_at: null,
                id: { not: userId }, // Exclure l'utilisateur supprimé
              },
            },
          },
        });

        if (company) {
          // Si c'est le dernier utilisateur actif de l'entreprise, expirer l'abonnement
          if (company.users.length === 0) {
            try {
              const subscription = await subscriptionService.getActive(user.company_id);
              if (subscription && subscription.status !== 'expired') {
                // Marquer l'abonnement comme expiré
                await tx.subscriptions.update({
                  where: { id: subscription.id },
                  data: {
                    status: 'expired',
                    updated_at: now,
                  },
                });
                logger.info('Subscription expired due to account deletion', {
                  companyId: user.company_id,
                  subscriptionId: subscription.id,
                });
              }
            } catch (error: any) {
              // Pas d'abonnement actif, c'est OK
              if (error.code !== 'SUBSCRIPTION_NOT_FOUND') {
                logger.warn('Error handling subscription on account deletion', {
                  companyId: user.company_id,
                  error: error.message,
                });
              }
            }
          }
        }
      }

      return deletedUser;
    });

    // 3. Envoyer un email de confirmation de suppression (si email valide)
    if (originalEmail && !options.anonymizeImmediately) {
      try {
        await emailService.sendEmail({
          from: env.SMTP_NOTIF_FROM || env.SMTP_FROM || env.SMTP_USER || '',
          to: originalEmail,
          subject: 'Votre compte Conta a été supprimé',
          template: 'account-deleted',
          data: {
            firstName: user.first_name || 'Utilisateur',
            gracePeriodDays: GRACE_PERIOD_DAYS,
            restoreUrl: `${env.FRONTEND_URL || 'https://conta.cd'}/restore-account?email=${encodeURIComponent(originalEmail)}`,
            reason: options.reason || 'Non spécifiée',
            supportEmail: env.SUPPORT_EMAIL || 'support@conta.cd',
          },
        });
        logger.info('Account deletion email sent', { userId, email: originalEmail });
      } catch (error: any) {
        logger.error('Failed to send account deletion email', {
          userId,
          email: originalEmail,
          error: error.message,
        });
        // Ne pas faire échouer la suppression si l'email échoue
      }
    }

    logger.info('Account deleted successfully', {
      userId,
      deleterId,
      companyId: user.company_id,
      originalEmail,
      gracePeriodEnd: gracePeriodEnd.toISOString(),
      anonymizeImmediately: options.anonymizeImmediately || false,
    });

    return {
      success: true,
      userId: result.id,
      originalEmail,
      gracePeriodEnd,
      canRestore: !options.anonymizeImmediately,
      message: `Compte supprimé. Vous avez ${GRACE_PERIOD_DAYS} jours pour le restaurer.`,
    };
  }

  /**
   * Restaurer un compte supprimé (pendant la période de grâce)
   * 
   * @param email Email original du compte à restaurer
   * @param newPassword Nouveau mot de passe (optionnel, si non fourni, envoi d'un lien de réinitialisation)
   */
  async restoreAccount(email: string, newPassword?: string): Promise<RestoreAccountResult> {
    // Trouver l'utilisateur supprimé avec l'email original dans preferences
    const deletedUsers = await prisma.users.findMany({
      where: {
        deleted_at: { not: null },
        email: { startsWith: 'deleted_' },
      },
    });

    // Chercher l'utilisateur avec l'email original dans preferences
    let userToRestore = null;
    for (const user of deletedUsers) {
      const prefs = user.preferences as any;
      if (
        prefs?.deletedAccount?.originalEmail === email &&
        prefs?.deletedAccount?.canRestore === true
      ) {
        // Vérifier que la période de grâce n'est pas expirée
        const gracePeriodEnd = new Date(prefs.deletedAccount.gracePeriodEnd);
        if (gracePeriodEnd > new Date()) {
          userToRestore = user;
          break;
        }
      }
    }

    if (!userToRestore) {
      throw new CustomError(
        'Aucun compte supprimé trouvé avec cet email ou période de grâce expirée',
        404,
        'ACCOUNT_NOT_FOUND_OR_EXPIRED'
      );
    }

    const prefs = userToRestore.preferences as any;
    const originalEmail = prefs.deletedAccount.originalEmail;

    // Restaurer le compte
    const restored = await prisma.users.update({
      where: { id: userToRestore.id },
      data: {
        deleted_at: null,
        email: originalEmail,
        preferences: {
          ...prefs,
          deletedAccount: undefined, // Supprimer les infos de suppression
          restoredAt: new Date().toISOString(),
        },
        updated_at: new Date(),
        // Si un nouveau mot de passe est fourni, le hasher
        ...(newPassword && {
          password_hash: await (await import('bcrypt')).default.hash(
            newPassword,
            parseInt(env.BCRYPT_ROUNDS)
          ),
        }),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
      },
    });

    // Si pas de nouveau mot de passe, envoyer un lien de réinitialisation
    if (!newPassword) {
      try {
        const resetToken = (await import('crypto')).randomBytes(32).toString('hex');
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 24); // 24h pour réinitialiser

        await prisma.users.update({
          where: { id: restored.id },
          data: {
            password_reset_token: resetToken,
            password_reset_expires_at: resetExpires,
          },
        });

        await emailService.sendEmail({
          from: env.SMTP_NOTIF_FROM || env.SMTP_FROM || env.SMTP_USER || '',
          to: originalEmail,
          subject: 'Votre compte Conta a été restauré',
          template: 'account-restored',
          data: {
            firstName: restored.first_name || 'Utilisateur',
            resetPasswordUrl: `${env.FRONTEND_URL || 'https://conta.cd'}/reset-password?token=${resetToken}`,
            loginUrl: `${env.FRONTEND_URL || 'https://conta.cd'}/login`,
          },
        });
      } catch (error: any) {
        logger.error('Failed to send account restoration email', {
          userId: restored.id,
          email: originalEmail,
          error: error.message,
        });
      }
    }

    logger.info('Account restored successfully', {
      userId: restored.id,
      email: originalEmail,
    });

    return {
      success: true,
      user: restored,
      restoredAt: new Date(),
    };
  }

  /**
   * Vérifier si un email peut être réutilisé (pour l'inscription)
   * 
   * @param email Email à vérifier
   * @returns true si l'email peut être réutilisé, false sinon
   */
  async canReuseEmail(email: string): Promise<{
    canReuse: boolean;
    reason?: string;
    gracePeriodEnd?: Date;
  }> {
    // 1. Vérifier si un utilisateur actif existe avec cet email
    const activeUser = await prisma.users.findFirst({
      where: {
        email,
        deleted_at: null,
      },
    });

    if (activeUser) {
      return {
        canReuse: false,
        reason: 'Un compte actif existe déjà avec cet email',
      };
    }

    // 2. Chercher un compte supprimé avec cet email original
    const deletedUsers = await prisma.users.findMany({
      where: {
        deleted_at: { not: null },
        email: { startsWith: 'deleted_' },
      },
    });

    for (const user of deletedUsers) {
      const prefs = user.preferences as any;
      if (prefs?.deletedAccount?.originalEmail === email) {
        const gracePeriodEnd = new Date(prefs.deletedAccount.gracePeriodEnd);
        const now = new Date();

        if (gracePeriodEnd > now) {
          // Période de grâce encore active
          const daysRemaining = Math.ceil(
            (gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return {
            canReuse: false,
            reason: `Un compte avec cet email a été supprimé récemment. Vous pouvez le restaurer dans les ${daysRemaining} jours restants, ou attendre la fin de la période de grâce.`,
            gracePeriodEnd,
          };
        } else {
          // Période de grâce expirée, l'email peut être réutilisé
          return {
            canReuse: true,
            reason: 'Période de grâce expirée, l\'email peut être réutilisé',
          };
        }
      }
    }

    // 3. Aucun compte trouvé, l'email est libre
    return {
      canReuse: true,
    };
  }

  /**
   * Nettoyer les comptes supprimés après la période d'anonymisation
   * (À exécuter via un cron job quotidien)
   */
  async cleanupAnonymizedAccounts() {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - ANONYMIZATION_PERIOD_DAYS);

    // Trouver tous les comptes supprimés avant la date limite
    const accountsToAnonymize = await prisma.users.findMany({
      where: {
        deleted_at: {
          not: null,
          lte: cutoffDate,
        },
        email: { startsWith: 'deleted_' },
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        preferences: true,
      },
    });

    let anonymized = 0;
    let errors = 0;

    for (const user of accountsToAnonymize) {
      try {
        const prefs = user.preferences as any;
        // Vérifier si déjà anonymisé
        if (prefs?.deletedAccount?.anonymized === true) {
          continue;
        }

        // Anonymiser les données sensibles
        await prisma.users.update({
          where: { id: user.id },
          data: {
            first_name: null,
            last_name: null,
            phone: null,
            password_hash: 'ANONYMIZED', // Hash invalide
            email_verification_token: null,
            password_reset_token: null,
            two_factor_secret: null,
            two_factor_backup_codes: [],
            preferences: {
              ...prefs,
              deletedAccount: {
                ...prefs?.deletedAccount,
                anonymized: true,
                anonymizedAt: now.toISOString(),
              },
            },
            updated_at: now,
          },
        });

        anonymized++;
        logger.info('Account anonymized', { userId: user.id });
      } catch (error: any) {
        errors++;
        logger.error('Error anonymizing account', {
          userId: user.id,
          error: error.message,
        });
      }
    }

    logger.info('Account cleanup completed', {
      total: accountsToAnonymize.length,
      anonymized,
      errors,
    });

    return {
      total: accountsToAnonymize.length,
      anonymized,
      errors,
    };
  }

  /**
   * Obtenir les informations sur un compte supprimé (pour l'utilisateur)
   */
  async getDeletedAccountInfo(email: string) {
    const deletedUsers = await prisma.users.findMany({
      where: {
        deleted_at: { not: null },
        email: { startsWith: 'deleted_' },
      },
    });

    for (const user of deletedUsers) {
      const prefs = user.preferences as any;
      if (prefs?.deletedAccount?.originalEmail === email) {
        const gracePeriodEnd = new Date(prefs.deletedAccount.gracePeriodEnd);
        const canRestore = prefs.deletedAccount.canRestore && gracePeriodEnd > new Date();

        return {
          found: true,
          deletedAt: new Date(prefs.deletedAccount.deletedAt),
          gracePeriodEnd,
          canRestore,
          daysRemaining: canRestore
            ? Math.ceil((gracePeriodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : 0,
          anonymized: prefs.deletedAccount.anonymized || false,
        };
      }
    }

    return {
      found: false,
    };
  }
}

export default new AccountDeletionService();
