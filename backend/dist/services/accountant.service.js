"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountantService = void 0;
const crypto_1 = require("crypto");
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const email_service_1 = __importDefault(require("./email.service"));
const env_1 = __importDefault(require("../config/env"));
const logger_1 = __importDefault(require("../utils/logger"));
class AccountantService {
    /**
     * Rechercher des experts-comptables (users avec is_accountant=true et profil optionnel)
     */
    async searchAccountants(filters) {
        const empty = {
            data: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        };
        try {
            const { search, query, city, country, province, page = 1, limit = 20, isAvailable } = filters;
            const q = search || query;
            const skip = (page - 1) * limit;
            const where = {
                is_accountant: true,
                deleted_at: null,
            };
            if (q) {
                where.OR = [
                    { first_name: { contains: q, mode: 'insensitive' } },
                    { last_name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                ];
            }
            const profileWhere = {};
            if (city)
                profileWhere.city = { equals: city, mode: 'insensitive' };
            if (country)
                profileWhere.country = { equals: country, mode: 'insensitive' };
            if (province)
                profileWhere.province = { equals: province, mode: 'insensitive' };
            if (isAvailable !== undefined)
                profileWhere.is_available = isAvailable;
            if (Object.keys(profileWhere).length > 0) {
                where.user_accountant_profiles = profileWhere;
            }
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const [users, total] = await Promise.all([
                database_1.default.users.findMany({
                    where,
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        created_at: true,
                        updated_at: true,
                        user_accountant_profiles: true,
                    },
                    skip,
                    take: limit,
                    orderBy: { created_at: 'desc' },
                }),
                database_1.default.users.count({ where }),
            ]);
            const validUsers = users.filter((u) => uuidRegex.test(u.id));
            const data = validUsers.map((u) => {
                const p = u.user_accountant_profiles;
                return {
                    id: u.id,
                    userId: u.id,
                    firstName: u.first_name,
                    lastName: u.last_name,
                    email: u.email,
                    companyName: p?.company_name ?? null,
                    registrationNumber: p?.registration_number ?? null,
                    specialization: p?.specialization ?? [],
                    experienceYears: p?.experience_years ?? null,
                    country: p?.country ?? '',
                    province: p?.province ?? null,
                    city: p?.city ?? null,
                    address: p?.address ?? null,
                    phone: p?.professional_phone ?? null,
                    website: p?.website ?? null,
                    isAvailable: p?.is_available ?? true,
                    rating: p?.rating != null ? Number(p.rating) : null,
                    totalCompanies: p?.total_companies_managed ?? 0,
                    createdAt: u.created_at,
                    updatedAt: u.updated_at,
                };
            });
            return {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (err) {
            logger_1.default.warn('searchAccountants failed, returning empty list', { error: err.message });
            return empty;
        }
    }
    /**
     * Rechercher des cabinets (entreprises de type EXPERT_COMPTABLE)
     */
    async searchFirms(filters) {
        const { query, city, country, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const where = {
            account_type: 'EXPERT_COMPTABLE',
            deleted_at: null,
        };
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { business_name: { contains: query, mode: 'insensitive' } },
            ];
        }
        if (city)
            where.city = city;
        if (country)
            where.country = country;
        const [firms, total] = await Promise.all([
            database_1.default.companies.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    business_name: true,
                    city: true,
                    country: true,
                    logo_url: true,
                },
                skip,
                take: limit,
            }),
            database_1.default.companies.count({ where }),
        ]);
        return {
            data: firms,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Obtenir le profil public d'un expert-comptable (même format que la recherche).
     * Compatible avec ou sans les colonnes optionnelles (bio, certifications, etc.) en base.
     */
    async getAccountantProfile(userId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!userId || !uuidRegex.test(userId)) {
            throw new error_middleware_1.CustomError('Expert comptable non trouvé', 404, 'ACCOUNTANT_PROFILE_NOT_FOUND');
        }
        const profileSelectFull = {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            is_accountant: true,
            created_at: true,
            updated_at: true,
            user_accountant_profiles: true,
        };
        const profileSelectLegacy = {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            is_accountant: true,
            created_at: true,
            updated_at: true,
            user_accountant_profiles: {
                select: {
                    company_name: true,
                    registration_number: true,
                    specialization: true,
                    experience_years: true,
                    country: true,
                    province: true,
                    city: true,
                    address: true,
                    professional_email: true,
                    professional_phone: true,
                    website: true,
                    profile_photo_url: true,
                    is_available: true,
                    max_companies: true,
                    total_companies_managed: true,
                    active_companies_count: true,
                    rating: true,
                    total_reviews: true,
                    updated_at: true,
                },
            },
        };
        let user;
        try {
            user = await database_1.default.users.findUnique({
                where: { id: userId },
                select: profileSelectFull,
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (/column .* does not exist|Unknown column/i.test(msg) || err?.code === 'P2010') {
                logger_1.default.warn('getAccountantProfile: legacy schema fallback (new profile columns missing)', { userId });
                user = await database_1.default.users.findUnique({
                    where: { id: userId },
                    select: profileSelectLegacy,
                });
            }
            else {
                throw err;
            }
        }
        if (!user || !user.is_accountant) {
            throw new error_middleware_1.CustomError('Expert comptable non trouvé', 404, 'ACCOUNTANT_PROFILE_NOT_FOUND');
        }
        const p = user.user_accountant_profiles;
        const legacy = !p || typeof (p?.bio) === 'undefined';
        return {
            id: user.id,
            userId: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            companyName: p?.company_name ?? null,
            registrationNumber: p?.registration_number ?? null,
            specialization: p?.specialization ?? [],
            experienceYears: p?.experience_years ?? null,
            country: p?.country ?? '',
            province: p?.province ?? null,
            city: p?.city ?? null,
            address: p?.address ?? null,
            professionalEmail: p?.professional_email ?? null,
            phone: p?.professional_phone ?? null,
            website: p?.website ?? null,
            profilePhotoUrl: p?.profile_photo_url ?? null,
            isAvailable: p?.is_available ?? true,
            maxCompanies: p?.max_companies ?? null,
            rating: p?.rating != null ? Number(p.rating) : null,
            totalReviews: p?.total_reviews ?? 0,
            totalCompanies: p?.total_companies_managed ?? 0,
            activeCompaniesCount: p?.active_companies_count ?? 0,
            bio: legacy ? null : (p?.bio ?? null),
            certifications: legacy ? [] : (p?.certifications ?? []),
            languages: legacy ? [] : (p?.languages ?? []),
            linkedinUrl: legacy ? null : (p?.linkedin_url ?? null),
            businessHours: legacy ? null : (p?.business_hours ?? null),
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        };
    }
    /**
     * Créer ou mettre à jour le profil d'un expert-comptable
     */
    async createOrUpdateProfile(userId, data) {
        const existing = await database_1.default.user_accountant_profiles.findUnique({
            where: { user_id: userId },
        });
        const profileData = {
            company_name: data.companyName ?? undefined,
            registration_number: data.registrationNumber ?? undefined,
            specialization: Array.isArray(data.specialization) ? data.specialization : (existing?.specialization ?? []),
            experience_years: data.experienceYears ?? undefined,
            country: data.country ?? undefined,
            province: data.province ?? undefined,
            city: data.city ?? undefined,
            address: data.address ?? undefined,
            professional_email: data.professionalEmail ?? undefined,
            professional_phone: data.professionalPhone ?? undefined,
            website: data.website ?? undefined,
            profile_photo_url: data.profilePhotoUrl ?? undefined,
            is_available: data.isAvailable ?? undefined,
            max_companies: data.maxCompanies ?? undefined,
            bio: data.bio ?? undefined,
            certifications: Array.isArray(data.certifications) ? data.certifications : (existing ? existing.certifications : []),
            languages: Array.isArray(data.languages) ? data.languages : (existing ? existing.languages : []),
            linkedin_url: data.linkedinUrl ?? undefined,
            business_hours: data.businessHours ?? undefined,
            updated_at: new Date(),
        };
        // Ne garder que les champs définis (pour PATCH partiel)
        const cleaned = Object.fromEntries(Object.entries(profileData).filter(([, v]) => v !== undefined));
        if (existing) {
            return await database_1.default.user_accountant_profiles.update({
                where: { user_id: userId },
                data: cleaned,
            });
        }
        return await database_1.default.user_accountant_profiles.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                user_id: userId,
                company_name: data.companyName ?? null,
                registration_number: data.registrationNumber ?? null,
                specialization: Array.isArray(data.specialization) ? data.specialization : [],
                experience_years: data.experienceYears ?? null,
                country: data.country ?? null,
                province: data.province ?? null,
                city: data.city ?? null,
                address: data.address ?? null,
                professional_email: data.professionalEmail ?? null,
                professional_phone: data.professionalPhone ?? null,
                website: data.website ?? null,
                profile_photo_url: data.profilePhotoUrl ?? null,
                is_available: data.isAvailable !== false,
                max_companies: data.maxCompanies ?? null,
                bio: data.bio ?? null,
                certifications: Array.isArray(data.certifications) ? data.certifications : [],
                languages: Array.isArray(data.languages) ? data.languages : [],
                linkedin_url: data.linkedinUrl ?? null,
                business_hours: data.businessHours ?? null,
                updated_at: new Date(),
            },
        });
    }
    /**
     * Mettre à jour uniquement l'URL de la photo de profil de l'expert
     */
    async updateProfilePhotoUrl(userId, profilePhotoUrl) {
        const existing = await database_1.default.user_accountant_profiles.findUnique({
            where: { user_id: userId },
        });
        const now = new Date();
        if (!existing) {
            const created = await database_1.default.user_accountant_profiles.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    user_id: userId,
                    profile_photo_url: profilePhotoUrl,
                    is_available: true,
                    total_companies_managed: 0,
                    active_companies_count: 0,
                    total_reviews: 0,
                    updated_at: now,
                },
            });
            return created;
        }
        return await database_1.default.user_accountant_profiles.update({
            where: { user_id: userId },
            data: { profile_photo_url: profilePhotoUrl, updated_at: now },
        });
    }
    /**
     * Inviter un expert-comptable à rejoindre une entreprise
     */
    async inviteAccountant(companyId, accountantId, invitedBy) {
        // Vérifier si une relation existe déjà
        const existing = await database_1.default.company_accountants.findUnique({
            where: {
                company_id_accountant_id: {
                    company_id: companyId,
                    accountant_id: accountantId,
                },
            },
        });
        if (existing) {
            throw new error_middleware_1.CustomError('Une invitation existe déjà ou cet expert gère déjà cette entreprise', 400, 'INVITATION_EXISTS');
        }
        const invitation = await database_1.default.company_accountants.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                company_id: companyId,
                accountant_id: accountantId,
                status: 'pending',
                invited_by: invitedBy,
                updated_at: new Date(),
            },
        });
        // Envoyer un email (optionnel, selon config)
        try {
            const company = await database_1.default.companies.findUnique({ where: { id: companyId } });
            const accountant = await database_1.default.users.findUnique({ where: { id: accountantId } });
            if (company && accountant) {
                await email_service_1.default.sendEmail({
                    to: accountant.email,
                    subject: `Invitation de ${company.name}`,
                    template: 'invitation',
                    data: {
                        companyName: company.name,
                        inviterName: invitedBy,
                        link: `${env_1.default.FRONTEND_URL}/accountant/invitations`,
                    },
                });
            }
        }
        catch (error) {
            logger_1.default.error('Erreur lors de l’envoi de l’email d’invitation accountant', error);
        }
        return invitation;
    }
    /**
     * Accepter une invitation
     */
    async acceptInvitation(invitationId, accountantId) {
        const invitation = await database_1.default.company_accountants.findUnique({
            where: { id: invitationId },
        });
        if (!invitation || invitation.accountant_id !== accountantId) {
            throw new error_middleware_1.CustomError('Invitation non trouvée', 404, 'INVITATION_NOT_FOUND');
        }
        if (invitation.status !== 'pending') {
            throw new error_middleware_1.CustomError('Cette invitation n’est plus en attente', 400, 'INVITATION_NOT_PENDING');
        }
        const result = await database_1.default.company_accountants.update({
            where: { id: invitationId },
            data: {
                status: 'active',
                accepted_at: new Date(),
                updated_at: new Date(),
            },
        });
        // Incrémenter les compteurs de l'expert
        await database_1.default.user_accountant_profiles.update({
            where: { user_id: accountantId },
            data: {
                active_companies_count: { increment: 1 },
                total_companies_managed: { increment: 1 },
            },
        });
        return result;
    }
    /**
     * Rejeter une invitation
     */
    async rejectInvitation(invitationId, accountantId) {
        const invitation = await database_1.default.company_accountants.findUnique({
            where: { id: invitationId },
        });
        if (!invitation || invitation.accountant_id !== accountantId) {
            throw new error_middleware_1.CustomError('Invitation non trouvée', 404, 'INVITATION_NOT_FOUND');
        }
        return await database_1.default.company_accountants.update({
            where: { id: invitationId },
            data: {
                status: 'rejected',
                rejected_at: new Date(),
                updated_at: new Date(),
            },
        });
    }
    /**
     * Obtenir les invitations d'un expert-comptable
     */
    async getInvitations(accountantId) {
        return await database_1.default.company_accountants.findMany({
            where: {
                accountant_id: accountantId,
                status: 'pending',
            },
            include: {
                companies: {
                    select: {
                        id: true,
                        name: true,
                        business_name: true,
                        logo_url: true,
                    },
                },
            },
            orderBy: { invited_at: 'desc' },
        });
    }
    /**
     * Lister les entreprises gérées par un expert
     */
    async getManagedCompanies(accountantId) {
        return await database_1.default.company_accountants.findMany({
            where: {
                accountant_id: accountantId,
                status: 'active',
            },
            include: {
                companies: {
                    select: {
                        id: true,
                        name: true,
                        business_name: true,
                        logo_url: true,
                        currency: true,
                    },
                },
            },
        });
    }
    /**
     * Lister les experts associés à une entreprise
     */
    async getCompanyAccountants(companyId) {
        return await database_1.default.company_accountants.findMany({
            where: {
                company_id: companyId,
                status: 'active',
            },
            include: {
                users: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });
    }
    /**
     * Révoquer l'accès d'un expert-comptable
     */
    async revokeAccountant(companyId, accountantId) {
        const relation = await database_1.default.company_accountants.findUnique({
            where: {
                company_id_accountant_id: {
                    company_id: companyId,
                    accountant_id: accountantId,
                },
            },
        });
        if (!relation) {
            throw new error_middleware_1.CustomError('Relation non trouvée', 404, 'RELATION_NOT_FOUND');
        }
        const result = await database_1.default.company_accountants.delete({
            where: {
                company_id_accountant_id: {
                    company_id: companyId,
                    accountant_id: accountantId,
                },
            },
        });
        // Décrémenter le compteur de l'expert
        await database_1.default.user_accountant_profiles.update({
            where: { user_id: accountantId },
            data: {
                active_companies_count: { decrement: 1 },
            },
        });
        return result;
    }
    /**
     * Obtenir les statistiques du tableau de bord d'un expert-comptable
     */
    async getDashboardStats(accountantId) {
        // 1. Entreprises gérées (actives)
        const activeCompanies = await database_1.default.company_accountants.findMany({
            where: {
                accountant_id: accountantId,
                status: 'active',
            },
            select: {
                company_id: true,
            },
        });
        const companyIds = activeCompanies.map((rel) => rel.company_id);
        const activeCompaniesCount = companyIds.length;
        // 2. Invitations en attente
        const pendingInvitationsCount = await database_1.default.company_accountants.count({
            where: {
                accountant_id: accountantId,
                status: 'pending',
            },
        });
        // Si l'expert ne gère encore aucune entreprise, retourner des stats vides cohérentes
        if (companyIds.length === 0) {
            return {
                totalCompanies: 0,
                activeCompanies: 0,
                pendingInvitations: pendingInvitationsCount,
                totalRevenue: 0,
                totalInvoices: 0,
                unpaidInvoices: 0,
                companiesStats: [],
            };
        }
        // 3. Calculer les statistiques globales sur toutes les entreprises gérées
        const [invoiceStats, unpaidInvoicesCount] = await Promise.all([
            database_1.default.invoices.aggregate({
                where: {
                    company_id: { in: companyIds },
                    deleted_at: null,
                    status: { notIn: ['draft', 'cancelled'] },
                },
                _sum: {
                    total_amount: true,
                },
                _count: {
                    id: true,
                },
            }),
            database_1.default.invoices.count({
                where: {
                    company_id: { in: companyIds },
                    deleted_at: null,
                    status: { in: ['sent', 'partially_paid'] },
                },
            }),
        ]);
        // 4. Statistiques par entreprise (top 5 par chiffre d'affaires)
        const revenueByCompany = await database_1.default.invoices.groupBy({
            by: ['company_id'],
            where: {
                company_id: { in: companyIds },
                deleted_at: null,
                status: { notIn: ['draft', 'cancelled'] },
            },
            _sum: {
                total_amount: true,
            },
            orderBy: {
                _sum: {
                    total_amount: 'desc',
                },
            },
            take: 5,
        });
        const topCompanyIds = revenueByCompany.map((row) => row.company_id);
        const companies = await database_1.default.companies.findMany({
            where: { id: { in: topCompanyIds } },
            select: {
                id: true,
                name: true,
                business_name: true,
                logo_url: true,
            },
        });
        const companiesStats = revenueByCompany.map((row) => {
            const company = companies.find((c) => c.id === row.company_id);
            return {
                id: row.company_id,
                name: company?.name || 'Inconnue',
                businessName: company?.business_name,
                logoUrl: company?.logo_url,
                revenue: Number(row._sum.total_amount || 0),
            };
        });
        return {
            totalCompanies: activeCompaniesCount,
            activeCompanies: activeCompaniesCount, // Pour l’instant, toutes les relations "actives" sont considérées actives
            pendingInvitations: pendingInvitationsCount,
            totalRevenue: Number(invoiceStats._sum.total_amount || 0),
            totalInvoices: invoiceStats._count.id || 0,
            unpaidInvoices: unpaidInvoicesCount,
            companiesStats,
        };
    }
    /**
     * Obtenir le cabinet de l'expert (son entreprise de type EXPERT_COMPTABLE)
     */
    async getOwnCabinet(userId) {
        const user = await database_1.default.users.findUnique({
            where: { id: userId },
            select: { company_id: true },
        });
        if (!user?.company_id)
            return null;
        const company = await database_1.default.companies.findFirst({
            where: {
                id: user.company_id,
                account_type: 'EXPERT_COMPTABLE',
                deleted_at: null,
            },
        });
        return company;
    }
    /**
     * Créer son propre cabinet (entreprise de type EXPERT_COMPTABLE)
     */
    async createOwnCabinet(userId, data) {
        const companyId = (0, crypto_1.randomUUID)();
        return await database_1.default.companies.create({
            data: {
                id: companyId,
                name: data.name,
                business_name: data.businessName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                city: data.city,
                country: data.country || 'RDC',
                account_type: 'EXPERT_COMPTABLE',
                is_system_company: false,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }
    // ============================================================
    // AVIS / REVIEWS
    // ============================================================
    /**
     * Soumettre ou mettre à jour un avis sur un expert comptable.
     * Un seul avis par couple (company, accountant).
     */
    async submitReview(data) {
        if (data.rating < 1 || data.rating > 5) {
            throw new error_middleware_1.CustomError('La note doit être entre 1 et 5', 400, 'INVALID_RATING');
        }
        // Vérifier que la company a bien une relation active/passée avec cet expert
        const relation = await database_1.default.company_accountants.findFirst({
            where: {
                company_id: data.companyId,
                accountant_id: data.accountantId,
                status: { in: ['active', 'revoked'] },
            },
        });
        if (!relation) {
            throw new error_middleware_1.CustomError('Vous ne pouvez noter que les experts comptables avec lesquels vous avez travaillé', 403, 'NO_RELATION');
        }
        const now = new Date();
        // Upsert : une seule review par company+accountant
        const review = await database_1.default.accountant_reviews.upsert({
            where: {
                company_id_accountant_id: {
                    company_id: data.companyId,
                    accountant_id: data.accountantId,
                },
            },
            update: {
                rating: data.rating,
                comment: data.comment || null,
                reviewer_id: data.reviewerId,
                updated_at: now,
            },
            create: {
                id: (0, crypto_1.randomUUID)(),
                accountant_id: data.accountantId,
                company_id: data.companyId,
                reviewer_id: data.reviewerId,
                rating: data.rating,
                comment: data.comment || null,
                created_at: now,
                updated_at: now,
            },
        });
        // Recalculer la moyenne de l'expert
        await this.recalculateRating(data.accountantId);
        return review;
    }
    /**
     * Récupérer les avis d'un expert comptable
     */
    async getReviews(accountantId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            database_1.default.accountant_reviews.findMany({
                where: { accountant_id: accountantId },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
                include: {
                    company: {
                        select: { id: true, name: true, logo_url: true },
                    },
                    reviewer: {
                        select: { id: true, first_name: true, last_name: true },
                    },
                },
            }),
            database_1.default.accountant_reviews.count({
                where: { accountant_id: accountantId },
            }),
        ]);
        return {
            data: reviews,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    /**
     * Supprimer un avis (par l'auteur ou admin)
     */
    async deleteReview(reviewId, userId, companyId) {
        const review = await database_1.default.accountant_reviews.findUnique({ where: { id: reviewId } });
        if (!review) {
            throw new error_middleware_1.CustomError('Avis non trouvé', 404, 'REVIEW_NOT_FOUND');
        }
        if (review.company_id !== companyId && review.reviewer_id !== userId) {
            throw new error_middleware_1.CustomError('Non autorisé à supprimer cet avis', 403, 'FORBIDDEN');
        }
        await database_1.default.accountant_reviews.delete({ where: { id: reviewId } });
        // Recalculer la moyenne
        await this.recalculateRating(review.accountant_id);
        return { success: true };
    }
    /**
     * Recalculer la note moyenne d'un expert comptable
     */
    async recalculateRating(accountantId) {
        const aggregation = await database_1.default.accountant_reviews.aggregate({
            where: { accountant_id: accountantId },
            _avg: { rating: true },
            _count: { rating: true },
        });
        const avgRating = aggregation._avg.rating ?? 0;
        const totalReviews = aggregation._count.rating ?? 0;
        await database_1.default.user_accountant_profiles.updateMany({
            where: { user_id: accountantId },
            data: {
                rating: avgRating,
                total_reviews: totalReviews,
                updated_at: new Date(),
            },
        });
    }
}
exports.AccountantService = AccountantService;
exports.default = new AccountantService();
//# sourceMappingURL=accountant.service.js.map