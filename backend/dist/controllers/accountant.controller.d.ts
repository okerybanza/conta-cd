import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class AccountantController {
    /**
     * GET /api/v1/accountants/firms
     * Suggérer / lister les cabinets d'experts (type LinkedIn)
     */
    searchFirms(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/accountants/search
     * Rechercher des experts comptables
     */
    search(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/accountants/:id
     * Obtenir le profil d'un expert
     */
    getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/accountants/:id/invite  (ID dans l'URL)
     * POST /api/v1/accountants/invite       (accountantId dans le body)
     * Inviter un expert comptable (par une entreprise)
     */
    invite(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/accountants/invitations/:id/accept
     * Accepter une invitation (par l'expert)
     */
    acceptInvitation(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/accountants/invitations/:id/reject
     * Rejeter une invitation (par l'expert)
     */
    rejectInvitation(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/accountants/invitations
     * Obtenir les invitations reçues (pour un expert)
     */
    getInvitations(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/v1/accountants/companies
     * Obtenir les entreprises gérées (pour un expert)
     */
    getManagedCompanies(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/v1/accountants/company/:companyId
     * Obtenir les experts d'une entreprise
     */
    getCompanyAccountants(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/accountants/relations/:id
     * Révocation d'un expert (par l'entreprise)
     */
    revoke(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/accountants/profile
     * Obtenir le profil de l'expert connecté (optionnel ?userId= pour compatibilité)
     */
    getOwnProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/accountants/profile
     * Créer ou mettre à jour le profil expert
     */
    createOrUpdateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/accountants/profile
     * Mettre à jour le profil expert
     */
    updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/accountants/profile/photo
     * Upload photo de profil expert
     */
    uploadProfilePhoto(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/v1/accountants/cabinet
     * Obtenir le cabinet de l'expert (entreprise de type EXPERT_COMPTABLE)
     */
    getCabinet(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/accountants/cabinet
     * Créer le propre cabinet d'un expert comptable
     */
    createCabinet(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/accountants/dashboard-stats
     * Obtenir les statistiques consolidées pour le dashboard expert comptable
     */
    getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/accountants/:id/reviews
     * Soumettre un avis sur un expert comptable
     */
    submitReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/accountants/:id/reviews
     * Obtenir les avis d'un expert comptable
     */
    getReviews(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/accountants/reviews/:id
     * Supprimer un avis
     */
    deleteReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: AccountantController;
export default _default;
//# sourceMappingURL=accountant.controller.d.ts.map