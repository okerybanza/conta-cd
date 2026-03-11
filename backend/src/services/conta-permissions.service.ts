import prisma from '../config/database';
import logger from '../utils/logger';

export interface ContaPermissionContext {
  userId: string;
  contaRole?: string | null;
  isContaUser: boolean;
}

class ContaPermissionsService {
  /**
   * Vérifie qu'un rôle Conta est « valide » pour l'espace expert-comptable.
   * Pour l'instant, un rôle est considéré valide s'il est non vide après trim.
   */
  private isValidContaRole(role?: string | null): boolean {
    return !!role && role.trim().length > 0;
  }

  /**
   * Vérifie si un utilisateur a accès à un module/action dans l'espace Conta.
   * Règle actuelle : utilisateur Conta + conta_role non vide.
   */
  async hasPermission(
    context: ContaPermissionContext,
    module: string,
    action: string
  ): Promise<boolean> {
    try {
      if (!context.isContaUser) {
        return false;
      }

      if (!this.isValidContaRole(context.contaRole)) {
        return false;
      }

      // Point d'extension futur :
      // - Lecture de droits plus fins depuis la base (conta_permissions)
      // - Vérification par module / action
      logger.debug('Conta permission check', {
        userId: context.userId,
        contaRole: context.contaRole,
        module,
        action,
      });

      return true;
    } catch (error: any) {
      logger.error('Error while checking Conta permissions', {
        error: error.message,
        userId: context.userId,
        module,
        action,
      });
      return false;
    }
  }
}

export default new ContaPermissionsService();

