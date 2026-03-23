import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import userService from '../services/user.service';
import { z } from 'zod';

const inviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'accountant', 'manager', 'employee', 'rh']),
  permissions: z.record(z.any()).optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'accountant', 'manager', 'employee', 'rh']),
  permissions: z.record(z.any()).optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'accountant', 'manager', 'employee', 'rh']).optional(),
  permissions: z.record(z.any()).optional(),
  lockedUntil: z.date().nullable().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/),
});

export class UserController {
  /**
   * Inviter un utilisateur par email
   */
  async invite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');

      const data = inviteUserSchema.parse(req.body);
      const user = await userService.inviteUser(getCompanyId(req), req.user.id, data);

      res.status(201).json({
        success: true,
        data: user,
        message: 'Invitation envoyée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer un utilisateur directement
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');

      const data = createUserSchema.parse(req.body);
      const user = await userService.createUser(getCompanyId(req), req.user.id, data);

      res.status(201).json({
        success: true,
        data: user,
        message: 'Utilisateur créé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister les utilisateurs de l'entreprise
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');

      const filters = {
        role: req.query.role as string | undefined,
        search: req.query.search as string | undefined,
      };

      const users = await userService.listUsers(getCompanyId(req), filters);

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un utilisateur par ID
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');

      const { id } = req.params;
      const user = await userService.getUserById(getCompanyId(req), id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');

      const { id } = req.params;
      const data = updateUserSchema.parse(req.body);
      const user = await userService.updateUser(getCompanyId(req), id, req.user.id, data);

      res.json({
        success: true,
        data: user,
        message: 'Utilisateur mis à jour avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un utilisateur
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');

      const { id } = req.params;
      await userService.deleteUser(getCompanyId(req), id, req.user.id);

      res.json({
        success: true,
        message: 'Utilisateur supprimé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');

      const { id } = req.params;
      const { newPassword } = resetPasswordSchema.parse(req.body);
      await userService.resetUserPassword(getCompanyId(req), id, req.user.id, newPassword);

      res.json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();

