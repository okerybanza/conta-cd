"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const quota_service_1 = __importDefault(require("./quota.service"));
const usage_service_1 = __importDefault(require("./usage.service"));
class SupplierService {
    /**
     * S'assurer que le schéma DB supporte bien le lien compte-fournisseur.
     * À appeler uniquement avant écriture (create/update), pas avant lecture (list/getById).
     */
    async ensureAccountSchema() {
        await database_1.default.$executeRawUnsafe(`
      ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "account_id" TEXT;
    `);
        await database_1.default.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relname = 'suppliers_account_id_idx'
            AND n.nspname = 'public'
        ) THEN
          CREATE INDEX "suppliers_account_id_idx" ON "suppliers"("account_id");
        END IF;
      END $$;
    `);
        await database_1.default.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'suppliers_account_id_fkey'
        ) THEN
          ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_account_id_fkey"
            FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    }
    /**
     * Créer un fournisseur
     */
    async create(companyId, data) {
        await this.ensureAccountSchema();
        // Vérifier la limite de fournisseurs AVANT création
        await quota_service_1.default.checkLimit(companyId, 'suppliers');
        if (!data.name || data.name.trim().length === 0) {
            throw new error_middleware_1.CustomError('Supplier name is required', 400, 'VALIDATION_ERROR');
        }
        // Vérifier email unique si fourni
        if (data.email) {
            const existing = await database_1.default.suppliers.findFirst({
                where: {
                    company_id: companyId,
                    email: data.email,
                    deleted_at: null,
                },
            });
            if (existing) {
                throw new error_middleware_1.CustomError('Email already exists', 409, 'EMAIL_EXISTS');
            }
        }
        // Vérifier compte fournisseur si fourni
        if (data.accountId) {
            const account = await database_1.default.accounts.findFirst({
                where: {
                    id: data.accountId,
                    company_id: companyId,
                    is_active: true,
                },
            });
            if (!account) {
                throw new error_middleware_1.CustomError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
            }
            // Compte fournisseur attendu : passif (liability), classe 4 idéalement (ex: 401)
            if (account.type !== 'liability') {
                throw new error_middleware_1.CustomError('Le compte fournisseur doit être de type passif (liability)', 400, 'INVALID_ACCOUNT_TYPE');
            }
        }
        const supplier = await database_1.default.suppliers.create({
            data: {
                id: `supplier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                company_id: companyId,
                name: data.name.trim(),
                email: data.email,
                phone: data.phone,
                address: data.address,
                city: data.city,
                country: data.country || 'RDC',
                postal_code: data.postalCode,
                nif: data.nif,
                rccm: data.rccm,
                notes: data.notes,
                account_id: data.accountId,
                updated_at: new Date(),
            },
        });
        // Incrémenter le compteur d'usage
        await usage_service_1.default.increment(companyId, 'suppliers');
        logger_1.default.info(`Supplier created: ${supplier.id}`, {
            companyId,
            supplierId: supplier.id,
            name: supplier.name,
        });
        return supplier;
    }
    /**
     * Obtenir un fournisseur par ID
     */
    async getById(companyId, supplierId) {
        const supplier = await database_1.default.suppliers.findFirst({
            where: {
                id: supplierId,
                company_id: companyId,
                deleted_at: null,
            },
            include: {
                accounts: true,
                expenses: {
                    where: { deleted_at: null },
                    orderBy: { expense_date: 'desc' },
                    take: 10, // Dernières 10 dépenses
                },
            },
        });
        if (!supplier) {
            throw new error_middleware_1.CustomError('Supplier not found', 404, 'SUPPLIER_NOT_FOUND');
        }
        return supplier;
    }
    /**
     * Lister les fournisseurs (lecture seule : pas d'appel au DDL ensureAccountSchema)
     */
    async list(companyId, filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            company_id: companyId,
            deleted_at: null,
        };
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        if (filters.city) {
            where.city = filters.city;
        }
        if (filters.country) {
            where.country = filters.country;
        }
        const [suppliers, total] = await Promise.all([
            database_1.default.suppliers.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                // Pas d'include accounts ici : la liste (ex. filtre Dépenses) n'en a pas besoin
                // et évite 500 si account_id ou la FK n'existent pas encore en base
            }),
            database_1.default.suppliers.count({ where }),
        ]);
        return {
            data: suppliers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Mettre à jour un fournisseur
     */
    async update(companyId, supplierId, data) {
        await this.ensureAccountSchema();
        await this.getById(companyId, supplierId);
        // Vérifier email unique si modifié
        if (data.email) {
            const existing = await database_1.default.suppliers.findFirst({
                where: {
                    company_id: companyId,
                    email: data.email,
                    id: { not: supplierId },
                    deleted_at: null,
                },
            });
            if (existing) {
                throw new error_middleware_1.CustomError('Email already exists', 409, 'EMAIL_EXISTS');
            }
        }
        // Vérifier compte fournisseur si modifié
        if (data.accountId !== undefined) {
            if (data.accountId) {
                const account = await database_1.default.accounts.findFirst({
                    where: {
                        id: data.accountId,
                        company_id: companyId,
                        is_active: true,
                    },
                });
                if (!account) {
                    throw new error_middleware_1.CustomError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
                }
                if (account.type !== 'liability') {
                    throw new error_middleware_1.CustomError('Le compte fournisseur doit être de type passif (liability)', 400, 'INVALID_ACCOUNT_TYPE');
                }
            }
        }
        const updated = await database_1.default.suppliers.update({
            where: { id: supplierId },
            data: {
                ...(data.name && { name: data.name.trim() }),
                ...(data.email !== undefined && { email: data.email }),
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.address !== undefined && { address: data.address }),
                ...(data.city !== undefined && { city: data.city }),
                ...(data.country !== undefined && { country: data.country }),
                ...(data.postalCode !== undefined && { postal_code: data.postalCode }),
                ...(data.nif !== undefined && { nif: data.nif }),
                ...(data.rccm !== undefined && { rccm: data.rccm }),
                ...(data.notes !== undefined && { notes: data.notes }),
                ...(data.accountId !== undefined && { account_id: data.accountId }),
            },
        });
        logger_1.default.info(`Supplier updated: ${supplierId}`, { companyId, supplierId });
        return updated;
    }
    /**
     * Supprimer un fournisseur
     */
    async delete(companyId, supplierId) {
        await this.getById(companyId, supplierId);
        // Soft delete
        await database_1.default.suppliers.update({
            where: { id: supplierId },
            data: { deleted_at: new Date() },
        });
        // Décrémenter le compteur d'usage
        await usage_service_1.default.decrement(companyId, 'suppliers');
        logger_1.default.info(`Supplier deleted: ${supplierId}`, { companyId, supplierId });
        return { success: true };
    }
    /**
     * Mettre à jour les statistiques d'un fournisseur
     */
    async updateStats(supplierId) {
        // Statistiques calculées côté reporting / dashboard (pas de colonnes dédiées sur Supplier pour l'instant)
        const stats = await database_1.default.expenses.aggregate({
            where: {
                supplier_id: supplierId,
                deleted_at: null,
            },
            _sum: {
                amount_ttc: true,
            },
            _count: {
                id: true,
            },
        });
        logger_1.default.info('Supplier stats updated (in-memory only)', {
            supplierId,
            totalExpenses: stats._sum.amount_ttc?.toString() || '0',
            expenseCount: stats._count.id || 0,
        });
    }
}
exports.SupplierService = SupplierService;
exports.default = new SupplierService();
//# sourceMappingURL=supplier.service.js.map