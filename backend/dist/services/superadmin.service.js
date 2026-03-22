"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_1 = __importDefault(require("../config/env"));
const zod_1 = require("zod");
const crypto_1 = require("crypto");
const createContaUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/),
    first_name: zod_1.z.string().optional(),
    last_name: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    conta_role: zod_1.z.enum(['superadmin', 'admin', 'support', 'developer', 'sales', 'finance', 'marketing']),
    conta_permissions: zod_1.z.record(zod_1.z.any()).optional(),
});
class SuperAdminService {
    /**
     * Obtenir toutes les entreprises
     */
    async getAllCompanies(filters) {
        const where = {
            deletedAt: null,
            is_system_company: false, // Exclure l'entreprise système
        };
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { nif: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        if (filters?.country) {
            where.country = filters.country;
        }
        if (filters?.plan) {
            where.subscriptions = {
                packages: {
                    code: filters.plan,
                },
                status: 'active', // Seulement les abonnements actifs
            };
        }
        if (filters?.isActive !== undefined) {
            if (filters.isActive) {
                where.deletedAt = null;
            }
            else {
                where.deletedAt = { not: null };
            }
        }
        if (filters?.dateFrom || filters?.dateTo) {
            where.created_at = {};
            if (filters.dateFrom) {
                where.created_at.gte = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                const dateTo = new Date(filters.dateTo);
                dateTo.setHours(23, 59, 59, 999); // Fin de journée
                where.created_at.lte = dateTo;
            }
        }
        const [companies, total] = await Promise.all([
            database_1.default.companies.findMany({
                where,
                include: {
                    subscriptions: {
                        include: {
                            packages: true,
                        },
                    },
                    _count: {
                        select: {
                            users: true,
                            customers: true,
                            invoices: true,
                        },
                    },
                },
                take: filters?.limit || 50,
                skip: filters?.offset || 0,
                orderBy: {
                    created_at: 'desc',
                },
            }),
            database_1.default.companies.count({ where }),
        ]);
        return {
            companies,
            total,
            limit: filters?.limit || 50,
            offset: filters?.offset || 0,
        };
    }
    /**
     * Obtenir une entreprise par ID
     */
    async getCompanyById(companyId) {
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            include: {
                subscriptions: {
                    include: {
                        packages: true,
                    },
                },
                users: {
                    where: {
                        deleted_at: null,
                    },
                    select: {
                        id: true,
                        email: true,
                        first_name: true,
                        last_name: true,
                        role: true,
                        created_at: true,
                        last_login_at: true,
                    },
                },
                _count: {
                    select: {
                        customers: true,
                        invoices: true,
                        products: true,
                    },
                },
            },
        });
        if (!company) {
            throw new Error('Company not found');
        }
        return company;
    }
    /**
     * Obtenir l'historique des modifications d'un plan
     */
    async getPackageHistory(packageId) {
        const prisma = (await Promise.resolve().then(() => __importStar(require('../config/database')))).default;
        // Récupérer tous les logs d'audit pour ce package
        const logs = await prisma.audit_logs.findMany({
            where: {
                entity: 'Package',
                entity_id: packageId,
                action: 'PACKAGE_UPDATE',
            },
            orderBy: {
                created_at: 'desc',
            },
            take: 50, // Limiter à 50 dernières modifications
        });
        // Formater les logs pour l'affichage
        return logs.map((log) => {
            const changes = log.changes || {};
            return {
                id: log.id,
                userId: log.user_id,
                userEmail: changes.userEmail || null,
                changes: changes.changes || {},
                packageName: changes.packageName || null,
                totalChanges: changes.totalChanges || 0,
                ipAddress: log.ip_address,
                userAgent: log.user_agent,
                createdAt: log.created_at,
            };
        });
    }
    /**
     * Obtenir l'impact d'une modification de plan
     */
    async getPackageModificationImpact(packageId, newLimits, newFeatures) {
        // Obtenir toutes les entreprises utilisant ce package
        const companies = await database_1.default.companies.findMany({
            where: {
                deleted_at: null,
                is_system_company: false,
                subscriptions: {
                    package_id: packageId,
                    status: 'active',
                },
            },
            include: {
                subscriptions: {
                    include: {
                        packages: true,
                    },
                },
            },
        });
        const usageService = (await Promise.resolve().then(() => __importStar(require('./usage.service')))).default;
        const impact = {
            totalCompanies: companies.length,
            companiesWithIssues: [],
            featuresAdded: [],
            featuresRemoved: [],
            limitsIncreased: [],
            limitsDecreased: [],
        };
        // Obtenir les limites et features actuelles du package
        const currentPackage = await database_1.default.packages.findUnique({
            where: { id: packageId },
        });
        if (!currentPackage) {
            throw new Error('Package not found');
        }
        const currentLimits = currentPackage.limits || {};
        const currentFeatures = currentPackage.features || {};
        // Comparer les features
        for (const [key, value] of Object.entries(newFeatures)) {
            if (value === true && currentFeatures[key] !== true) {
                impact.featuresAdded.push(key);
            }
            else if (value === false && currentFeatures[key] === true) {
                impact.featuresRemoved.push(key);
            }
        }
        // Comparer les limites et vérifier l'usage
        for (const company of companies) {
            const companyIssues = [];
            // Obtenir l'usage réel de l'entreprise
            const usage = await this.getCompanyUsage(company.id);
            // Mapper les métriques Usage vers les limites Package
            const metricMapping = {
                customers: 'customers',
                invoices: 'invoices',
                products: 'products',
                users: 'users',
                expenses: 'expenses',
                suppliers: 'suppliers',
            };
            // Vérifier chaque limite
            for (const [metric, newLimit] of Object.entries(newLimits)) {
                const oldLimit = currentLimits[metric] ?? null;
                const usageMetric = metricMapping[metric] || metric;
                const currentUsage = usage[usageMetric] || 0;
                // Si la limite est réduite et que l'usage actuel dépasse la nouvelle limite
                if (oldLimit !== null && newLimit !== null && newLimit < oldLimit) {
                    impact.limitsDecreased.push(metric);
                    if (currentUsage > newLimit) {
                        companyIssues.push({
                            metric,
                            currentUsage,
                            oldLimit,
                            newLimit,
                        });
                    }
                }
                else if (oldLimit !== null && newLimit !== null && newLimit > oldLimit) {
                    impact.limitsIncreased.push(metric);
                }
            }
            if (companyIssues.length > 0) {
                impact.companiesWithIssues.push({
                    companyId: company.id,
                    companyName: company.name,
                    issues: companyIssues,
                });
            }
        }
        // Dédupliquer les listes
        impact.limitsIncreased = [...new Set(impact.limitsIncreased)];
        impact.limitsDecreased = [...new Set(impact.limitsDecreased)];
        return impact;
    }
    /**
     * Obtenir l'usage réel d'une entreprise
     */
    async getCompanyUsage(companyId) {
        const usageService = (await Promise.resolve().then(() => __importStar(require('./usage.service')))).default;
        // Obtenir tous les usages pour la période actuelle
        const usage = await usageService.getAll(companyId);
        // Compter les ressources réelles (pas seulement l'usage mensuel)
        const [customersCount, invoicesCount, productsCount, usersCount, expensesCount, suppliersCount] = await Promise.all([
            database_1.default.customers.count({
                where: {
                    company_id: companyId,
                    deleted_at: null,
                },
            }),
            database_1.default.invoices.count({
                where: {
                    company_id: companyId,
                    deleted_at: null,
                },
            }),
            database_1.default.products.count({
                where: {
                    company_id: companyId,
                    deleted_at: null,
                },
            }),
            database_1.default.users.count({
                where: {
                    company_id: companyId,
                    deleted_at: null,
                },
            }),
            database_1.default.expenses.count({
                where: {
                    company_id: companyId,
                    deleted_at: null,
                },
            }),
            database_1.default.suppliers.count({
                where: {
                    company_id: companyId,
                    deleted_at: null,
                },
            }),
        ]);
        return {
            customers: customersCount,
            invoices: invoicesCount,
            products: productsCount,
            users: usersCount,
            expenses: expensesCount,
            suppliers: suppliersCount,
        };
    }
    /**
     * Modifier le plan d'une entreprise
     */
    async updateCompanySubscription(companyId, packageId, userId) {
        const subscriptionService = (await Promise.resolve().then(() => __importStar(require('./subscription.service')))).default;
        // Utiliser la méthode upgrade existante
        const updated = await subscriptionService.upgrade(companyId, packageId, userId);
        logger_1.default.info('Company subscription updated by super admin', {
            companyId,
            packageId,
            userId,
        });
        return updated;
    }
    /**
     * Suspendre ou activer une entreprise
     */
    async updateCompanyStatus(companyId, status, reason, userId) {
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new Error('Company not found');
        }
        const updateData = {};
        if (status === 'suspended') {
            // Suspendre : marquer comme supprimé (soft delete)
            updateData.deletedAt = new Date();
        }
        else {
            // Activer : retirer la suspension
            updateData.deletedAt = null;
        }
        const updated = await database_1.default.companies.update({
            where: { id: companyId },
            data: updateData,
        });
        logger_1.default.info('Company status updated', {
            companyId,
            status,
            reason,
            userId,
        });
        return updated;
    }
    /**
     * Créer un utilisateur Conta (interne)
     */
    async createContaUser(data) {
        const validated = createContaUserSchema.parse(data);
        // Vérifier que l'email n'existe pas déjà
        const existingUser = await database_1.default.users.findUnique({
            where: { email: validated.email },
        });
        if (existingUser) {
            throw new Error('Un utilisateur avec cet email existe déjà');
        }
        // Trouver ou créer l'entreprise système Conta
        let systemCompany = await database_1.default.companies.findFirst({
            where: {
                is_system_company: true,
                system_type: 'system',
            },
        });
        if (!systemCompany) {
            systemCompany = await database_1.default.companies.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    name: 'Conta Platform',
                    email: 'system@conta.cd',
                    is_system_company: true,
                    system_type: 'system',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }
        // Hasher le mot de passe
        const passwordHash = await bcrypt_1.default.hash(validated.password, parseInt(env_1.default.BCRYPT_ROUNDS));
        // Déterminer si c'est un Super Admin
        const isSuperAdmin = validated.conta_role === 'superadmin';
        // Créer l'utilisateur
        const user = await database_1.default.users.create({
            data: {
                email: validated.email,
                password_hash: passwordHash,
                first_name: validated.first_name,
                last_name: validated.last_name,
                phone: validated.phone,
                company_id: systemCompany.id,
                is_conta_user: true,
                is_super_admin: isSuperAdmin,
                conta_role: validated.conta_role,
                conta_permissions: validated.conta_permissions || {},
                role: 'admin', // Rôle par défaut pour les utilisateurs Conta
                emailVerified: true, // Les utilisateurs Conta sont vérifiés par défaut
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                conta_role: true,
                is_super_admin: true,
                is_conta_user: true,
                created_at: true,
            },
        });
        logger_1.default.info('Conta user created', {
            userId: user.id,
            email: validated.email,
            conta_role: validated.conta_role,
        });
        return user;
    }
    /**
     * Mettre à jour un utilisateur Conta
     */
    async updateContaUser(userId, data) {
        const user = await database_1.default.users.findUnique({
            where: { id: userId },
        });
        if (!user || !user.is_conta_user) {
            throw new Error('Utilisateur Conta non trouvé');
        }
        // Ne pas permettre de modifier le Super Admin principal
        if (user.is_super_admin && data.conta_role && data.conta_role !== 'superadmin') {
            throw new Error('Impossible de modifier le rôle d\'un Super Admin');
        }
        const updateData = {};
        if (data.first_name !== undefined)
            updateData.first_name = data.first_name;
        if (data.last_name !== undefined)
            updateData.last_name = data.last_name;
        if (data.phone !== undefined)
            updateData.phone = data.phone;
        if (data.conta_role !== undefined) {
            updateData.conta_role = data.conta_role;
            updateData.is_super_admin = data.conta_role === 'superadmin';
        }
        if (data.conta_permissions !== undefined)
            updateData.conta_permissions = data.conta_permissions;
        // Si un nouveau mot de passe est fourni, le hasher
        if (data.password) {
            updateData.password_hash = await bcrypt_1.default.hash(data.password, parseInt(env_1.default.BCRYPT_ROUNDS));
        }
        const updated = await database_1.default.users.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                conta_role: true,
                is_super_admin: true,
                conta_permissions: true,
                last_login_at: true,
                created_at: true,
            },
        });
        logger_1.default.info('Conta user updated', { userId, updates: Object.keys(updateData) });
        return updated;
    }
    /**
     * Supprimer un utilisateur Conta
     */
    async deleteContaUser(userId) {
        const user = await database_1.default.users.findUnique({
            where: { id: userId },
        });
        if (!user || !user.is_conta_user) {
            throw new Error('Utilisateur Conta non trouvé');
        }
        // Ne pas permettre de supprimer le Super Admin principal
        if (user.is_super_admin) {
            throw new Error('Impossible de supprimer un Super Admin');
        }
        // Soft delete
        const deleted = await database_1.default.users.update({
            where: { id: userId },
            data: {
                deleted_at: new Date(),
                email: `deleted_${Date.now()}_${user.email}`, // Modifier l'email pour éviter les conflits
            },
            select: {
                id: true,
                email: true,
            },
        });
        logger_1.default.info('Conta user deleted', { userId, email: user.email });
        return deleted;
    }
    /**
     * Obtenir tous les utilisateurs Conta
     */
    async getContaUsers() {
        const systemCompany = await database_1.default.companies.findFirst({
            where: {
                is_system_company: true,
                system_type: 'system',
            },
        });
        if (!systemCompany) {
            return [];
        }
        const users = await database_1.default.users.findMany({
            where: {
                company_id: systemCompany.id,
                is_conta_user: true,
                deleted_at: null,
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                conta_role: true,
                is_super_admin: true,
                last_login_at: true,
                created_at: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
        return users;
    }
    /**
     * Approuver un expert comptable
     */
    async approveAccountant(accountantId, adminUserId) {
        const accountant = await database_1.default.users.findUnique({
            where: {
                id: accountantId,
                is_accountant: true,
            },
            include: {
                user_accountant_profiles: true,
            },
        });
        if (!accountant) {
            throw new Error('Expert comptable non trouvé');
        }
        // Créer ou mettre à jour le profil
        const profile = await database_1.default.user_accountant_profiles.upsert({
            where: { user_id: accountantId },
            update: {
                is_available: true, // Activer la disponibilité
            },
            create: {
                id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: accountantId,
                is_available: true,
                updated_at: new Date(),
            },
        });
        logger_1.default.info('Accountant approved', {
            accountantId,
            adminUserId,
        });
        return {
            id: accountant.id,
            email: accountant.email,
            first_name: accountant.first_name,
            last_name: accountant.last_name,
            profile,
        };
    }
    /**
     * Rejeter un expert comptable
     */
    async rejectAccountant(accountantId, reason, adminUserId) {
        const accountant = await database_1.default.users.findUnique({
            where: {
                id: accountantId,
                is_accountant: true,
            },
            include: {
                user_accountant_profiles: true,
            },
        });
        if (!accountant) {
            throw new Error('Expert comptable non trouvé');
        }
        // Désactiver la disponibilité
        if (accountant.user_accountant_profiles) {
            await database_1.default.user_accountant_profiles.update({
                where: { user_id: accountantId },
                data: {
                    is_available: false,
                },
            });
        }
        logger_1.default.info('Accountant rejected', {
            accountantId,
            reason,
            adminUserId,
        });
        return {
            id: accountant.id,
            email: accountant.email,
            first_name: accountant.first_name,
            last_name: accountant.last_name,
            rejected: true,
            reason,
        };
    }
    /**
     * Obtenir les statistiques globales
     */
    async getGlobalStats() {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [totalCompanies, activeCompanies, newCompaniesLast7Days, newCompaniesLast30Days, totalUsers, activeUsersLast30Days, accountantsCount, activeSubscriptions, subscriptionsByPlan, freeSubscriptions, paidSubscriptions,] = await Promise.all([
            database_1.default.companies.count({
                where: {
                    deleted_at: null,
                    is_system_company: false,
                },
            }),
            database_1.default.companies.count({
                where: {
                    deleted_at: null,
                    is_system_company: false,
                    subscriptions: {
                        status: 'active',
                    },
                },
            }),
            database_1.default.companies.count({
                where: {
                    deleted_at: null,
                    is_system_company: false,
                    created_at: {
                        gte: sevenDaysAgo,
                    },
                },
            }),
            database_1.default.companies.count({
                where: {
                    deleted_at: null,
                    is_system_company: false,
                    created_at: {
                        gte: thirtyDaysAgo,
                    },
                },
            }),
            database_1.default.users.count({
                where: {
                    deleted_at: null,
                    is_conta_user: false,
                },
            }),
            database_1.default.users.count({
                where: {
                    deleted_at: null,
                    is_conta_user: false,
                    last_login_at: {
                        gte: thirtyDaysAgo,
                    },
                },
            }),
            database_1.default.users.count({
                where: {
                    deleted_at: null,
                    is_accountant: true,
                },
            }),
            database_1.default.subscriptions.count({
                where: {
                    status: 'active',
                },
            }),
            database_1.default.subscriptions.groupBy({
                by: ['package_id'],
                where: {
                    status: 'active',
                },
                _count: {
                    id: true,
                },
            }),
            database_1.default.subscriptions.count({
                where: {
                    status: 'active',
                    packages: {
                        code: 'FREE',
                    },
                },
            }),
            database_1.default.subscriptions.count({
                where: {
                    status: 'active',
                    packages: {
                        code: {
                            not: 'FREE',
                        },
                    },
                },
            }),
        ]);
        // Obtenir les noms des packages pour la répartition
        const packageIds = subscriptionsByPlan.map((s) => s.package_id);
        const packages = await database_1.default.packages.findMany({
            where: {
                id: {
                    in: packageIds,
                },
            },
            select: {
                id: true,
                code: true,
                name: true,
            },
        });
        const byPlan = {};
        subscriptionsByPlan.forEach((sub) => {
            const pkg = packages.find((p) => p.id === sub.package_id);
            if (pkg) {
                byPlan[pkg.name] = (byPlan[pkg.name] || 0) + (sub._count?.id || 0);
            }
        });
        // Calculer le taux de conversion (GRATUIT → Payant)
        const conversionRate = freeSubscriptions > 0
            ? (paidSubscriptions / (freeSubscriptions + paidSubscriptions)) * 100
            : 0;
        // Calculer les revenus basés sur les abonnements actifs
        const activeSubsWithPackage = await database_1.default.subscriptions.findMany({
            where: {
                status: 'active',
            },
            include: {
                packages: true,
            },
        });
        // Revenus du mois en cours (basés sur les abonnements actifs)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        // Calculer les revenus mensuels récurrents (MRR)
        // Gérer le cas où le package pourrait être null (supprimé)
        const logger = (await Promise.resolve().then(() => __importStar(require('../utils/logger')))).default;
        const monthlyRecurringRevenue = activeSubsWithPackage.reduce((sum, sub) => {
            if (!sub.packages) {
                // Si le package n'existe plus, on ne peut pas calculer le revenu
                logger.warn(`Subscription ${sub.id} has no package, skipping revenue calculation`);
                return sum;
            }
            const price = Number(sub.packages.price);
            // Si cycle mensuel, ajouter le prix complet. Si annuel, diviser par 12
            return sum + (sub.billing_cycle === 'monthly' ? price : price / 12);
        }, 0);
        // Revenus de l'année (basés sur les abonnements actifs)
        const yearlyRevenue = activeSubsWithPackage.reduce((sum, sub) => {
            if (!sub.packages) {
                logger.warn(`Subscription ${sub.id} has no package, skipping revenue calculation`);
                return sum;
            }
            const price = Number(sub.packages.price);
            // Si cycle annuel, ajouter le prix complet. Si mensuel, multiplier par 12
            return sum + (sub.billing_cycle === 'yearly' ? price : price * 12);
        }, 0);
        // Revenus du mois en cours (approximation basée sur MRR)
        const currentMonthRevenue = monthlyRecurringRevenue;
        // Projection annuelle basée sur le MRR
        const projection = monthlyRecurringRevenue * 12;
        return {
            companies: {
                total: totalCompanies,
                active: activeCompanies,
                inactive: totalCompanies - activeCompanies,
                newLast7Days: newCompaniesLast7Days,
                newLast30Days: newCompaniesLast30Days,
            },
            users: {
                total: totalUsers,
                activeLast30Days: activeUsersLast30Days,
                accountants: accountantsCount,
            },
            subscriptions: {
                total: activeSubscriptions,
                byPlan,
                conversionRate: Math.round(conversionRate * 10) / 10,
            },
            revenue: {
                currentMonth: Math.round(currentMonthRevenue * 100) / 100,
                currentYear: Math.round(yearlyRevenue * 100) / 100,
                projection: Math.round(projection * 100) / 100,
            },
        };
    }
    /**
     * Obtenir les données de revenus mensuels (12 derniers mois)
     */
    async getMonthlyRevenueData() {
        const now = new Date();
        const monthlyRevenue = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
            // Obtenir les subscriptions actives qui ont effectué un paiement dans ce mois
            // ou qui étaient actives pendant ce mois
            const subscriptions = await database_1.default.subscriptions.findMany({
                where: {
                    status: 'active',
                    OR: [
                        // Paiement effectué dans ce mois
                        {
                            last_payment_date: {
                                gte: date,
                                lte: endOfMonth,
                            },
                        },
                        // Subscription active pendant ce mois (début avant la fin du mois et fin après le début du mois)
                        {
                            AND: [
                                { start_date: { lte: endOfMonth } },
                                {
                                    OR: [
                                        { end_date: null },
                                        { end_date: { gte: date } },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                include: {
                    packages: true,
                },
            });
            // Calculer le revenu pour ce mois
            // Pour les subscriptions avec last_payment_date dans ce mois, utiliser le prix du package
            // Pour les autres, utiliser le MRR (prix mensuel)
            let revenue = 0;
            for (const sub of subscriptions) {
                if (!sub.packages)
                    continue;
                const packagePrice = Number(sub.packages.price);
                if (sub.last_payment_date &&
                    sub.last_payment_date >= date &&
                    sub.last_payment_date <= endOfMonth) {
                    // Paiement effectué dans ce mois
                    revenue += packagePrice;
                }
                else {
                    // Subscription active mais pas de paiement dans ce mois
                    // Utiliser le MRR (prix mensuel)
                    if (sub.billing_cycle === 'monthly') {
                        revenue += packagePrice;
                    }
                    else if (sub.billing_cycle === 'yearly') {
                        revenue += packagePrice / 12;
                    }
                }
            }
            monthlyRevenue.push({
                month: monthName,
                revenus: Math.round(revenue * 100) / 100,
            });
        }
        return monthlyRevenue;
    }
    /**
     * Obtenir tous les packages (y compris ceux désactivés mais utilisés)
     * Pour le superadmin, on doit voir tous les packages, même désactivés,
     * s'ils sont utilisés par des subscriptions actives
     */
    async getAllPackagesForAdmin() {
        const prisma = (await Promise.resolve().then(() => __importStar(require('../config/database')))).default;
        // Obtenir tous les packages (actifs et inactifs)
        const allPackages = await prisma.packages.findMany({
            orderBy: {
                display_order: 'asc',
            },
        });
        // Obtenir les IDs des packages utilisés par des subscriptions actives
        const activeSubscriptions = await prisma.subscriptions.findMany({
            where: {
                status: 'active',
            },
            select: {
                package_id: true,
            },
            distinct: ['package_id'],
        });
        const usedPackageIds = new Set(activeSubscriptions.map((s) => s.package_id));
        // Marquer les packages utilisés
        const packagesWithUsage = allPackages.map((pkg) => ({
            ...pkg,
            isUsed: usedPackageIds.has(pkg.id),
        }));
        return packagesWithUsage;
    }
    /**
     * Obtenir les données de croissance des entreprises (12 derniers mois)
     */
    async getCompanyGrowthData() {
        const now = new Date();
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
            // Compter les entreprises créées jusqu'à la fin de ce mois
            const count = await database_1.default.companies.count({
                where: {
                    deleted_at: null,
                    is_system_company: false,
                    created_at: {
                        lte: monthEnd,
                    },
                },
            });
            const monthName = monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
            months.push({
                month: monthName,
                entreprises: count,
            });
        }
        return months;
    }
}
exports.SuperAdminService = SuperAdminService;
exports.default = new SuperAdminService();
//# sourceMappingURL=superadmin.service.js.map