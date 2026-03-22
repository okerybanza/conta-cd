"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountantController = void 0;
const accountant_service_1 = __importDefault(require("../services/accountant.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const env_1 = __importDefault(require("../config/env"));
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
// Schémas de validation
const searchAccountantsSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    province: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    isAvailable: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false']).transform((s) => s === 'true')]).optional(),
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional().default(20),
});
const inviteAccountantSchema = zod_1.z.object({
    accountantId: zod_1.z.string().uuid(),
    message: zod_1.z.string().optional(),
});
const acceptInvitationSchema = zod_1.z.object({
    contractId: zod_1.z.string().uuid().optional(),
    acceptanceMessage: zod_1.z.string().optional(),
});
const rejectInvitationSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1, 'Rejection reason is required'),
});
const createProfileSchema = zod_1.z.object({
    companyName: zod_1.z.string().optional(),
    registrationNumber: zod_1.z.string().optional(),
    specialization: zod_1.z.array(zod_1.z.string()).optional(),
    experienceYears: zod_1.z.number().int().positive().optional(),
    country: zod_1.z.string().optional(),
    province: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    professionalEmail: zod_1.z.union([zod_1.z.string().email(), zod_1.z.literal('')]).optional().transform((v) => (v === '' ? undefined : v)),
    professionalPhone: zod_1.z.string().optional(),
    website: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().transform((v) => (v === '' ? undefined : v)),
    profilePhotoUrl: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().transform((v) => (v === '' ? undefined : v)),
    isAvailable: zod_1.z.boolean().optional(),
    maxCompanies: zod_1.z.number().int().positive().optional(),
    bio: zod_1.z.string().max(1000).optional(),
    certifications: zod_1.z.array(zod_1.z.string()).optional(),
    languages: zod_1.z.array(zod_1.z.string()).optional(),
    linkedinUrl: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().transform((v) => (v === '' ? undefined : v)),
    businessHours: zod_1.z.string().max(255).optional(),
});
const updateProfileSchema = createProfileSchema.partial();
class AccountantController {
    /**
     * GET /api/v1/accountants/firms
     * Suggérer / lister les cabinets d'experts (type LinkedIn)
     */
    async searchFirms(req, res, next) {
        try {
            const schema = zod_1.z.object({
                search: zod_1.z.string().optional(),
                country: zod_1.z.string().optional(),
                city: zod_1.z.string().optional(),
            });
            const { search, country, city } = schema.parse(req.query);
            const firms = await accountant_service_1.default.searchFirms({ query: search, country, city });
            res.json({
                success: true,
                data: firms,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/accountants/search
     * Rechercher des experts comptables
     */
    async search(req, res, next) {
        try {
            const filters = searchAccountantsSchema.parse(req.query);
            const result = await accountant_service_1.default.searchAccountants(filters);
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/accountants/:id
     * Obtenir le profil d'un expert
     */
    async getProfile(req, res, next) {
        try {
            const { id } = req.params;
            const profile = await accountant_service_1.default.getAccountantProfile(id);
            res.json({
                success: true,
                data: profile,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/accountants/:id/invite  (ID dans l'URL)
     * POST /api/v1/accountants/invite       (accountantId dans le body)
     * Inviter un expert comptable (par une entreprise)
     */
    async invite(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            // Accepter l'ID depuis l'URL (/:id/invite) ou depuis le body ({accountantId})
            const accountantId = req.params.id || req.body?.accountantId;
            if (!accountantId) {
                throw new Error('accountantId is required (via URL param or body)');
            }
            if (!req.user?.id) {
                throw new Error('User not authenticated');
            }
            const relation = await accountant_service_1.default.inviteAccountant(companyId, accountantId, req.user.id);
            res.status(201).json({
                success: true,
                data: relation,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/accountants/invitations/:id/accept
     * Accepter une invitation (par l'expert)
     */
    async acceptInvitation(req, res, next) {
        try {
            const { id } = req.params;
            const data = acceptInvitationSchema.parse(req.body);
            // Vérifier que l'utilisateur est un expert
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated');
            }
            const relation = await accountant_service_1.default.acceptInvitation(id, req.user.id);
            res.json({
                success: true,
                data: relation,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/accountants/invitations/:id/reject
     * Rejeter une invitation (par l'expert)
     */
    async rejectInvitation(req, res, next) {
        try {
            const { id } = req.params;
            const data = rejectInvitationSchema.parse(req.body);
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated');
            }
            const relation = await accountant_service_1.default.rejectInvitation(id, req.user.id);
            res.json({
                success: true,
                data: relation,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/accountants/invitations
     * Obtenir les invitations reçues (pour un expert)
     */
    async getInvitations(req, res, next) {
        try {
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated');
            }
            const invitations = await accountant_service_1.default.getInvitations(req.user.id);
            res.json({
                success: true,
                data: invitations,
            });
        }
        catch (error) {
            // Si l'expert n'est pas trouvé, retourner une liste vide plutôt qu'une 404
            if (error.code === 'ACCOUNTANT_NOT_FOUND') {
                return res.json({
                    success: true,
                    data: [],
                });
            }
            next(error);
        }
    }
    /**
     * GET /api/v1/accountants/companies
     * Obtenir les entreprises gérées (pour un expert)
     */
    async getManagedCompanies(req, res, next) {
        try {
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated');
            }
            const companies = await accountant_service_1.default.getManagedCompanies(req.user.id);
            res.json({
                success: true,
                data: companies,
            });
        }
        catch (error) {
            // Si l'expert n'est pas trouvé, retourner une liste vide plutôt qu'une 404
            if (error.code === 'ACCOUNTANT_NOT_FOUND') {
                return res.json({
                    success: true,
                    data: [],
                });
            }
            next(error);
        }
    }
    /**
     * GET /api/v1/accountants/company/:companyId
     * Obtenir les experts d'une entreprise
     */
    async getCompanyAccountants(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const { companyId: paramCompanyId } = req.params;
            // Vérifier que l'utilisateur a accès à cette entreprise
            if (paramCompanyId && paramCompanyId !== companyId) {
                throw new Error('Unauthorized');
            }
            const accountants = await accountant_service_1.default.getCompanyAccountants(companyId);
            res.json({
                success: true,
                data: accountants,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/accountants/relations/:id
     * Révocation d'un expert (par l'entreprise)
     */
    async revoke(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const { id } = req.params;
            if (!req.user?.id) {
                throw new Error('User not authenticated');
            }
            const relation = await accountant_service_1.default.revokeAccountant(companyId, id);
            res.json({
                success: true,
                data: relation,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/accountants/profile
     * Obtenir le profil de l'expert connecté (optionnel ?userId= pour compatibilité)
     */
    async getOwnProfile(req, res, next) {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
                });
            }
            const userId = req.query.userId || req.user.id;
            if (userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'Vous ne pouvez consulter que votre propre profil' },
                });
            }
            const profile = await accountant_service_1.default.getAccountantProfile(userId);
            res.json({
                success: true,
                data: { profile },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/accountants/profile
     * Créer ou mettre à jour le profil expert
     */
    async createOrUpdateProfile(req, res, next) {
        try {
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated');
            }
            const data = createProfileSchema.parse(req.body);
            const profile = await accountant_service_1.default.createOrUpdateProfile(req.user.id, data);
            res.json({
                success: true,
                data: profile,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/accountants/profile
     * Mettre à jour le profil expert
     */
    async updateProfile(req, res, next) {
        try {
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated');
            }
            const data = updateProfileSchema.parse(req.body);
            const profile = await accountant_service_1.default.createOrUpdateProfile(req.user.id, data);
            res.json({
                success: true,
                data: profile,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/accountants/profile/photo
     * Upload photo de profil expert
     */
    async uploadProfilePhoto(req, res, next) {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
                });
            }
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'NO_FILE', message: 'Aucun fichier envoyé' },
                });
            }
            const baseUrl = process.env.BACKEND_URL || env_1.default.FRONTEND_URL || (req.protocol + '://' + req.get('host'));
            const profilePhotoUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
            const profile = await accountant_service_1.default.updateProfilePhotoUrl(req.user.id, profilePhotoUrl);
            res.json({
                success: true,
                data: { profilePhotoUrl, profile },
                message: 'Photo de profil mise à jour',
            });
        }
        catch (err) {
            logger_1.default.error('uploadProfilePhoto error', {
                error: err instanceof Error ? err.message : String(err),
                stack: err instanceof Error ? err.stack : undefined,
            });
            next(err);
        }
    }
    /**
     * GET /api/v1/accountants/cabinet
     * Obtenir le cabinet de l'expert (entreprise de type EXPERT_COMPTABLE)
     */
    async getCabinet(req, res, next) {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
                });
            }
            const company = await accountant_service_1.default.getOwnCabinet(req.user.id);
            res.json({
                success: true,
                data: company ?? null,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/accountants/cabinet
     * Créer le propre cabinet d'un expert comptable
     */
    async createCabinet(req, res, next) {
        try {
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated');
            }
            const schema = zod_1.z.object({
                name: zod_1.z.string().min(1, 'Le nom du cabinet est requis'),
                email: zod_1.z.string().email().optional(),
                phone: zod_1.z.string().optional(),
                address: zod_1.z.string().optional(),
                city: zod_1.z.string().optional(),
                country: zod_1.z.string().optional(),
            });
            const data = schema.parse(req.body);
            const company = await accountant_service_1.default.createOwnCabinet(req.user.id, data);
            res.status(201).json({
                success: true,
                data: company,
                message: 'Cabinet créé avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/accountants/dashboard-stats
     * Obtenir les statistiques consolidées pour le dashboard expert comptable
     */
    async getDashboardStats(req, res, next) {
        try {
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated');
            }
            const stats = await accountant_service_1.default.getDashboardStats(req.user.id);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            // Si l'expert n'est pas trouvé, retourner des stats vides
            if (error.code === 'ACCOUNTANT_NOT_FOUND') {
                return res.json({
                    success: true,
                    data: {
                        totalCompanies: 0,
                        activeCompanies: 0,
                        pendingInvitations: 0,
                        totalRevenue: 0,
                        totalInvoices: 0,
                        unpaidInvoices: 0,
                        companiesStats: [],
                    },
                });
            }
            next(error);
        }
    }
    // ============================================================
    // AVIS / REVIEWS
    // ============================================================
    /**
     * POST /api/v1/accountants/:id/reviews
     * Soumettre un avis sur un expert comptable
     */
    async submitReview(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const accountantId = req.params.id;
            const { rating, comment } = req.body;
            if (!req.user?.id) {
                throw new Error('User not authenticated');
            }
            const review = await accountant_service_1.default.submitReview({
                accountantId,
                companyId,
                reviewerId: req.user.id,
                rating: Number(rating),
                comment,
            });
            res.status(201).json({ success: true, data: review });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/accountants/:id/reviews
     * Obtenir les avis d'un expert comptable
     */
    async getReviews(req, res, next) {
        try {
            const accountantId = req.params.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await accountant_service_1.default.getReviews(accountantId, page, limit);
            res.json({ success: true, ...result });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/accountants/reviews/:id
     * Supprimer un avis
     */
    async deleteReview(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const reviewId = req.params.id;
            if (!req.user?.id) {
                throw new Error('User not authenticated');
            }
            const result = await accountant_service_1.default.deleteReview(reviewId, req.user.id, companyId);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AccountantController = AccountantController;
exports.default = new AccountantController();
//# sourceMappingURL=accountant.controller.js.map