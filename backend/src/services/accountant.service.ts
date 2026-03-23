import { randomUUID } from 'crypto';
import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import emailService from './email.service';
import env from '../config/env';
import logger from '../utils/logger';

export class AccountantService {
    /**
     * Rechercher des experts-comptables
     */
    async searchAccountants(filters: any) {
        const { query, city, country, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;

        const where: any = {
            account_type: 'EXPERT_COMPTABLE',
            deleted_at: null,
        };

        if (query) {
            where.OR = [
                { first_name: { contains: query, mode: 'insensitive' } },
                { last_name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
            ];
        }

        if (city) where.city = city;
        if (country) where.country = country;

        const [accountants, total] = await Promise.all([
            prisma.users.findMany({
                where,
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    city: true,
                    country: true,
                    accountant_profile: true,
                },
                skip,
                take: limit,
            }),
            prisma.users.count({ where }),
        ]);

        return {
            data: accountants,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Rechercher des cabinets (entreprises de type EXPERT_COMPTABLE)
     */
    async searchFirms(filters: any) {
        const { query, city, country, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;

        const where: any = {
            account_type: 'EXPERT_COMPTABLE',
            deleted_at: null,
        };

        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { business_name: { contains: query, mode: 'insensitive' } },
            ];
        }

        if (city) where.city = city;
        if (country) where.country = country;

        const [firms, total] = await Promise.all([
            prisma.companies.findMany({
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
            prisma.companies.count({ where }),
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
     * Obtenir le profil d'un expert-comptable
     */
    async getAccountantProfile(userId: string) {
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                accountant_profile: true,
            },
        });

        if (!user || !user.accountant_profile) {
            throw new CustomError('Profil expert-comptable non trouvé', 404, 'ACCOUNTANT_PROFILE_NOT_FOUND');
        }

        return user;
    }

    /**
     * Créer ou mettre à jour le profil d'un expert-comptable
     */
    async createOrUpdateProfile(userId: string, data: any) {
        const existing = await prisma.user_accountant_profiles.findUnique({
            where: { user_id: userId },
        });

        const profileData = {
            bio: data.bio,
            specialties: data.specialties,
            experience_years: data.experienceYears,
            languages: data.languages,
            website_url: data.websiteUrl,
            linkedin_url: data.linkedinUrl,
            is_public: data.isPublic,
            updated_at: new Date(),
        };

        if (existing) {
            return await prisma.user_accountant_profiles.update({
                where: { user_id: userId },
                data: profileData,
            });
        } else {
            return await prisma.user_accountant_profiles.create({
                data: {
                    id: randomUUID(),
                    user_id: userId,
                    ...profileData,
                },
            });
        }
    }

    /**
     * Inviter un expert-comptable à rejoindre une entreprise
     */
    async inviteAccountant(companyId: string, accountantId: string, invitedBy: string) {
        // Vérifier si une relation existe déjà
        const existing = await prisma.company_accountants.findUnique({
            where: {
                company_id_accountant_id: {
                    company_id: companyId,
                    accountant_id: accountantId,
                },
            },
        });

        if (existing) {
            throw new CustomError('Une invitation existe déjà ou cet expert gère déjà cette entreprise', 400, 'INVITATION_EXISTS');
        }

        const invitation = await prisma.company_accountants.create({
            data: {
                id: randomUUID(),
                company_id: companyId,
                accountant_id: accountantId,
                status: 'pending',
                invited_by: invitedBy,
                updated_at: new Date(),
            },
        });

        // Envoyer un email (optionnel, selon config)
        try {
            const company = await prisma.companies.findUnique({ where: { id: companyId } });
            const accountant = await prisma.users.findUnique({ where: { id: accountantId } });

            if (company && accountant) {
                await emailService.sendEmail({
                    to: accountant.email,
                    subject: `Invitation à rejoindre ${company.name} sur Conta`,
                    template: 'generic',
                    data: { message: `Vous avez été invité à rejoindre ${company.name}.`, link: `${env.FRONTEND_URL}/accountant/invitations` },
                });
            }
        } catch (error) {
            logger.error('Erreur lors de l’envoi de l’email d’invitation accountant', error);
        }

        return invitation;
    }

    /**
     * Accepter une invitation
     */
    async acceptInvitation(invitationId: string, accountantId: string) {
        const invitation = await prisma.company_accountants.findUnique({
            where: { id: invitationId },
        });

        if (!invitation || invitation.accountant_id !== accountantId) {
            throw new CustomError('Invitation non trouvée', 404, 'INVITATION_NOT_FOUND');
        }

        if (invitation.status !== 'pending') {
            throw new CustomError('Cette invitation n’est plus en attente', 400, 'INVITATION_NOT_PENDING');
        }

        const result = await prisma.company_accountants.update({
            where: { id: invitationId },
            data: {
                status: 'active',
                accepted_at: new Date(),
                updated_at: new Date(),
            },
        });

        // Incrémenter les compteurs de l'expert
        await prisma.user_accountant_profiles.update({
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
    async rejectInvitation(invitationId: string, accountantId: string) {
        const invitation = await prisma.company_accountants.findUnique({
            where: { id: invitationId },
        });

        if (!invitation || invitation.accountant_id !== accountantId) {
            throw new CustomError('Invitation non trouvée', 404, 'INVITATION_NOT_FOUND');
        }

        return await prisma.company_accountants.update({
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
    async getInvitations(accountantId: string) {
        return await prisma.company_accountants.findMany({
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
    async getManagedCompanies(accountantId: string) {
        return await prisma.company_accountants.findMany({
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
    async getCompanyAccountants(companyId: string) {
        return await prisma.company_accountants.findMany({
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
    async revokeAccountant(companyId: string, accountantId: string) {
        const relation = await prisma.company_accountants.findUnique({
            where: {
                company_id_accountant_id: {
                    company_id: companyId,
                    accountant_id: accountantId,
                },
            },
        });

        if (!relation) {
            throw new CustomError('Relation non trouvée', 404, 'RELATION_NOT_FOUND');
        }

        const result = await prisma.company_accountants.delete({
            where: {
                company_id_accountant_id: {
                    company_id: companyId,
                    accountant_id: accountantId,
                },
            },
        });

        // Décrémenter le compteur de l'expert
        await prisma.user_accountant_profiles.update({
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
    async getDashboardStats(accountantId: string) {
        // 1. Nombre d'entreprises gérées (actives)
        const activeCompanies = await prisma.company_accountants.findMany({
            where: {
                accountant_id: accountantId,
                status: 'active',
            },
            select: {
                company_id: true,
            },
        });

        const companyIds = activeCompanies.map((rel: any) => rel.company_id);
        const activeCompaniesCount = companyIds.length;

        // 2. Invitations en attente
        const pendingInvitationsCount = await prisma.company_accountants.count({
            where: {
                accountant_id: accountantId,
                status: 'pending',
            },
        });

        if (companyIds.length === 0) {
            return {
                activeCompaniesCount,
                pendingInvitationsCount,
                totalRevenue: 0,
                totalInvoices: 0,
                unpaidInvoices: 0,
                companiesStats: [],
            };
        }

        // 3. Calculer les statistiques globales sur toutes les entreprises gérées
        const [invoiceStats, unpaidInvoicesCount] = await Promise.all([
            prisma.invoices.aggregate({
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
            prisma.invoices.count({
                where: {
                    company_id: { in: companyIds },
                    deleted_at: null,
                    status: { in: ['sent', 'partially_paid'] },
                },
            }),
        ]);

        // 4. Statistiques par entreprise (top 5 par chiffre d'affaires)
        const revenueByCompany = await prisma.invoices.groupBy({
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

        const topCompanyIds = revenueByCompany.map((row: any) => row.company_id);
        const companies = await prisma.companies.findMany({
            where: { id: { in: topCompanyIds } },
            select: {
                id: true,
                name: true,
                business_name: true,
                logo_url: true,
            },
        });

        const companiesStats = revenueByCompany.map((row: any) => {
            const company = companies.find((c: any) => c.id === row.company_id);
            return {
                id: row.company_id,
                name: company?.name || 'Inconnue',
                businessName: company?.business_name,
                logoUrl: company?.logo_url,
                revenue: Number(row._sum.total_amount || 0),
            };
        });

        return {
            activeCompaniesCount,
            pendingInvitationsCount,
            totalRevenue: Number(invoiceStats._sum.total_amount || 0),
            totalInvoices: invoiceStats._count.id || 0,
            unpaidInvoices: unpaidInvoicesCount,
            companiesStats,
        };
    }

    /**
     * Créer son propre cabinet (entreprise de type EXPERT_COMPTABLE)
     */
    async createOwnCabinet(userId: string, data: any) {
        const companyId = randomUUID();

        return await prisma.companies.create({
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
}

export default new AccountantService();
