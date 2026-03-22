import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class UserController {
    /**
     * Inviter un utilisateur par email
     */
    invite(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Créer un utilisateur directement
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Lister les utilisateurs de l'entreprise
     */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Obtenir un utilisateur par ID
     */
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Mettre à jour un utilisateur
     */
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Supprimer un utilisateur
     */
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Réinitialiser le mot de passe d'un utilisateur
     */
    resetPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Upload avatar de l'utilisateur connecté (POST /users/me/avatar)
     */
    uploadAvatar(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=user.controller.d.ts.map