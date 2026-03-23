import prisma from '../config/database';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import logger from '../utils/logger';
import env from '../config/env';
import emailService from './email.service';
import { randomBytes, randomUUID } from 'crypto';

export interface InviteUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: Record<string, any>;
}

export interface CreateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  permissions?: Record<string, any>;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  permissions?: Record<string, any>;
  lockedUntil?: Date | null;
}

export interface UserFilters {
  role?: string;
  search?: string;
}

// Schémas de validation
const inviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'accountant', 'manager', 'employee']),
  permissions: z.record(z.any()).optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'accountant', 'manager', 'employee']),
  permissions: z.record(z.any()).optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'accountant', 'manager', 'employee']).optional(),
  permissions: z.record(z.any()).optional(),
  lockedUntil: z.date().nullable().optional(),
});

export class UserService {
  /**
   * Inviter un utilisateur par email
   */
  async inviteUser(companyId: string, inviterId: string, data: InviteUserData) {
    // Vérifier le quota d'utilisateurs AVANT toute autre vérification
    const quotaService = (await import('./quota.service')).default;
    try {
      await quotaService.checkLimit(companyId, 'users');
    } catch (error: any) {
      // Si le quota est dépassé, renvoyer l'erreur telle quelle (QUOTA_EXCEEDED 403)
      throw error;
    }
    const validated = inviteUserSchema.parse(data);

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.users.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Vérifier que l'inviteur est admin
    const inviter = await prisma.users.findUnique({
      where: { id: inviterId },
    });

    if (!inviter || inviter.role !== 'admin') {
      throw new Error('Seuls les administrateurs peuvent inviter des utilisateurs');
    }

    // Générer un token d'invitation
    const invitationToken = randomBytes(32).toString('hex');
    const invitationExpires = new Date();
    invitationExpires.setDate(invitationExpires.getDate() + 7); // Valide 7 jours

    // Créer l'utilisateur avec un mot de passe temporaire
    const tempPassword = randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, parseInt(env.BCRYPT_ROUNDS));

    const user = await prisma.users.create({
      data: {
        email: validated.email,
        password_hash: passwordHash,
        first_name: validated.firstName,
        last_name: validated.lastName,
        company_id: companyId,
        role: validated.role,
        permissions: validated.permissions || {},
        id: randomUUID(),
        email_verified: false,
        email_verification_token: invitationToken,
        email_verification_expires_at: invitationExpires,
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        created_at: true,
      },
    });

    // Envoyer l'email d'invitation
    try {
      const invitationUrl = `${env.FRONTEND_URL}/auth/accept-invitation?token=${invitationToken}`;
      await emailService.sendEmail({
        from: env.SMTP_FROM || env.SMTP_USER,
        to: validated.email,
        subject: 'Invitation à rejoindre Conta',
        template: 'user-invitation',
        data: {
          firstName: validated.firstName || 'Utilisateur',
          inviterName: `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() || inviter.email,
          invitationUrl,
          companyName: (await prisma.companies.findUnique({ where: { id: companyId } }))?.name || 'l\'entreprise',
        },
      });
      logger.info('Invitation email sent successfully', { email: validated.email });
    } catch (error: any) {
      logger.error('Failed to send invitation email', {
        email: validated.email,
        error: error.message,
      });
      // Ne pas échouer la création de l'utilisateur si l'email ne peut pas être envoyé
      // L'utilisateur pourra toujours utiliser la réinitialisation de mot de passe
    }

    // Incrémenter le compteur d'usage APRÈS création réussie
    const usageService = (await import('./usage.service')).default;
    await usageService.increment(companyId, 'users');

    logger.info('User invited', { userId: user.id, email: validated.email, companyId });

    return user;
  }

  /**
   * Créer un utilisateur directement (avec mot de passe)
   */
  async createUser(companyId: string, creatorId: string, data: CreateUserData) {
    const validated = createUserSchema.parse(data);

    // Vérifier le quota d'utilisateurs AVANT toute autre vérification
    const quotaService = (await import('./quota.service')).default;
    try {
      await quotaService.checkLimit(companyId, 'users');
    } catch (error: any) {
      // Si le quota est dépassé, renvoyer l'erreur telle quelle (QUOTA_EXCEEDED 403)
      throw error;
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.users.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Vérifier que le créateur est admin
    const creator = await prisma.users.findUnique({
      where: { id: creatorId },
    });

    if (!creator || creator.role !== 'admin') {
      throw new Error('Seuls les administrateurs peuvent créer des utilisateurs');
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(validated.password, parseInt(env.BCRYPT_ROUNDS));

    const user = await prisma.users.create({
      data: {
        id: randomUUID(),
        email: validated.email,
        password_hash: passwordHash,
        first_name: validated.firstName,
        last_name: validated.lastName,
        phone: validated.phone,
        company_id: companyId,
        role: validated.role,
        permissions: validated.permissions || {},
        email_verified: true, // Créé directement, donc vérifié
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        permissions: true,
        created_at: true,
        last_login_at: true,
      },
    });

    // Incrémenter le compteur d'usage APRÈS création réussie
    const usageService = (await import('./usage.service')).default;
    await usageService.increment(companyId, 'users');

    logger.info('User created', { userId: user.id, email: validated.email, companyId });

    return user;
  }

  /**
   * Lister les utilisateurs d'une entreprise
   */
  async listUsers(companyId: string, filters?: UserFilters) {
    const where: any = {
      company_id: companyId,
      deleted_at: null,
    };

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        permissions: true,
        email_verified: true,
        two_factor_enabled: true,
        last_login_at: true,
        created_at: true,
        locked_until: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return users;
  }

  /**
   * Obtenir un utilisateur par ID
   */
  async getUserById(companyId: string, userId: string) {
    const user = await prisma.users.findFirst({
      where: {
        id: userId,
        company_id: companyId,
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        permissions: true,
        preferences: true,
        language: true,
        timezone: true,
        email_verified: true,
        two_factor_enabled: true,
        last_login_at: true,
        last_login_ip: true,
        created_at: true,
        updated_at: true,
        locked_until: true,
      },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return user;
  }

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(companyId: string, userId: string, updaterId: string, data: UpdateUserData) {
    // Vérifier que l'utilisateur existe et appartient à l'entreprise
    const user = await prisma.users.findFirst({
      where: {
        id: userId,
        company_id: companyId,
        deleted_at: null,
      },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier que le modificateur est admin
    const updater = await prisma.users.findUnique({
      where: { id: updaterId },
    });

    if (!updater || updater.role !== 'admin') {
      throw new Error('Seuls les administrateurs peuvent modifier les utilisateurs');
    }

    // Empêcher de modifier son propre rôle
    if (userId === updaterId && data.role && data.role !== user.role) {
      throw new Error('Vous ne pouvez pas modifier votre propre rôle');
    }

    const validated = updateUserSchema.parse(data);

    const updated = await prisma.users.update({
      where: { id: userId },
      data: {
        ...(validated.firstName !== undefined && { first_name: validated.firstName }),
        ...(validated.lastName !== undefined && { last_name: validated.lastName }),
        ...(validated.phone !== undefined && { phone: validated.phone }),
        ...(validated.role !== undefined && { role: validated.role }),
        ...(validated.permissions !== undefined && { permissions: validated.permissions }),
        ...(validated.lockedUntil !== undefined && { locked_until: validated.lockedUntil }),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        permissions: true,
        updated_at: true,
        locked_until: true,
      },
    });

    logger.info('User updated', { userId, updaterId, companyId });

    return updated;
  }

  /**
   * Supprimer un utilisateur (soft delete)
   * DÉPRÉCIÉ : Utiliser accountDeletionService.deleteAccount() à la place
   * Conservé pour compatibilité ascendante
   */
  async deleteUser(companyId: string, userId: string, deleterId: string) {
    // Déléguer au service de suppression de compte pour une gestion complète
    const accountDeletionService = (await import('./account-deletion.service')).default;
    
    // Vérifier que l'utilisateur appartient à l'entreprise
    const user = await prisma.users.findFirst({
      where: {
        id: userId,
        company_id: companyId,
        deleted_at: null,
      },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Utiliser le service de suppression amélioré
    return await accountDeletionService.deleteAccount(userId, deleterId, {
      reason: `Suppression par admin de l'entreprise ${companyId}`,
    });
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur (admin seulement)
   */
  async resetUserPassword(companyId: string, userId: string, adminId: string, newPassword: string) {
    // Vérifier que l'utilisateur existe
    const user = await prisma.users.findFirst({
      where: {
        id: userId,
        company_id: companyId,
        deleted_at: null,
      },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier que c'est un admin
    const admin = await prisma.users.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'admin') {
      throw new Error('Seuls les administrateurs peuvent réinitialiser les mots de passe');
    }

    // Valider le mot de passe
    if (newPassword.length < 8 || !/^(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre');
    }

    const passwordHash = await bcrypt.hash(newPassword, parseInt(env.BCRYPT_ROUNDS));

    await prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires_at: null,
        locked_until: null, // Déverrouiller le compte
        failed_login_attempts: 0,
      },
    });

    logger.info('User password reset', { userId, adminId, companyId });

    return { success: true };
  }
}

export default new UserService();

