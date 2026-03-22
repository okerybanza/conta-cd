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
exports.ProductService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const library_1 = require("@prisma/client/runtime/library");
const quota_service_1 = __importDefault(require("./quota.service"));
const usage_service_1 = __importDefault(require("./usage.service"));
const cache_service_1 = __importDefault(require("./cache.service"));
// Mapper entre le modèle Prisma (Product) et le DTO exposé à l'app front
// DOC-03 : Le stock n'est plus inclus car il est calculé dynamiquement
const mapProduct = async (product, stockMovementService) => {
    let stockQuantity = undefined;
    // Si le produit suit le stock et qu'on a le service, calculer le stock
    if (product.track_stock && product.type === 'product' && stockMovementService) {
        try {
            stockQuantity = await stockMovementService.calculateStock(product.company_id, product.id);
        }
        catch (error) {
            // En cas d'erreur, définir le stock à 0 (produit nouvellement créé n'a pas encore de mouvements)
            stockQuantity = 0;
            logger_1.default.warn('Error calculating stock for product, defaulting to 0', {
                productId: product.id,
                error: error.message,
            });
        }
    }
    else if (product.track_stock && product.type === 'product') {
        // Si le service n'est pas disponible, définir le stock à 0
        stockQuantity = 0;
    }
    return {
        id: product.id,
        companyId: product.company_id,
        name: product.name,
        description: product.description || undefined,
        sku: product.sku || undefined,
        type: product.type || 'product',
        unitPrice: Number(product.price || 0),
        currency: product.currency || 'CDF',
        taxRate: product.tax_rate !== null && product.tax_rate !== undefined
            ? Number(product.tax_rate)
            : 0,
        category: product.category || undefined,
        trackStock: product.track_stock === true,
        // DOC-03 : stockQuantity calculé dynamiquement depuis les mouvements
        stockQuantity,
        lowStockThreshold: product.min_stock !== null && product.min_stock !== undefined
            ? Number(product.min_stock)
            : 0,
        isActive: product.is_active !== false,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
    };
};
class ProductService {
    // Créer un article
    async create(companyId, data) {
        try {
            // Vérifier la limite d'articles AVANT création
            await quota_service_1.default.checkLimit(companyId, 'products');
        }
        catch (error) {
            logger_1.default.error('Error checking quota limit', { companyId, error: error.message, stack: error.stack });
            throw error;
        }
        try {
            // Validation
            if (!data.name || data.name.trim().length === 0) {
                throw new error_middleware_1.CustomError('Product name is required', 400, 'VALIDATION_ERROR');
            }
            if (data.unitPrice <= 0) {
                throw new error_middleware_1.CustomError('Unit price must be greater than zero', 400, 'VALIDATION_ERROR');
            }
            if (data.taxRate !== undefined && (data.taxRate < 0 || data.taxRate > 100)) {
                throw new error_middleware_1.CustomError('Tax rate must be between 0 and 100', 400, 'VALIDATION_ERROR');
            }
            // Vérifier SKU unique si fourni
            if (data.sku) {
                const existingProduct = await database_1.default.products.findFirst({
                    where: {
                        company_id: companyId,
                        sku: data.sku,
                        deleted_at: null,
                    },
                });
                if (existingProduct) {
                    throw new error_middleware_1.CustomError('SKU already exists', 409, 'SKU_EXISTS');
                }
            }
            // DOC-03 : Le stock n'est jamais stocké directement, uniquement calculé depuis les mouvements
            // Préparer les données compatibles avec le schéma Prisma
            // IMPORTANT: Prisma n'accepte pas undefined, utiliser null ou omettre le champ
            const createData = {
                id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                company_id: companyId,
                name: data.name,
                type: data.type || 'service',
                currency: data.currency || 'CDF',
                price: new library_1.Decimal(data.unitPrice),
                tax_rate: data.taxRate !== undefined ? new library_1.Decimal(data.taxRate) : new library_1.Decimal(0),
                is_active: data.isActive !== undefined ? data.isActive : true,
                track_stock: data.trackStock || false,
                created_at: new Date(),
                updated_at: new Date(),
            };
            // Ajouter les champs optionnels seulement s'ils sont définis (pas undefined)
            if (data.description !== undefined && data.description !== null) {
                createData.description = data.description;
            }
            if (data.sku !== undefined && data.sku !== null && data.sku.trim() !== '') {
                createData.sku = data.sku;
            }
            if (data.category !== undefined && data.category !== null) {
                createData.category = data.category;
            }
            if (data.trackStock && data.lowStockThreshold !== undefined) {
                createData.min_stock = new library_1.Decimal(data.lowStockThreshold);
            }
            // DOC-03 : stock = 0 par défaut (sera calculé depuis les mouvements)
            // Note: Le schéma a @default(0), mais on l'explicite pour être sûr
            createData.stock = new library_1.Decimal(0);
            logger_1.default.info('Attempting to create product', {
                companyId,
                productName: data.name,
                createDataKeys: Object.keys(createData),
                createData: JSON.stringify(createData, (key, value) => {
                    // Convertir Decimal en string pour le logging
                    if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
                        return value.toString();
                    }
                    return value;
                })
            });
            // Créer l'article
            let product;
            try {
                product = await database_1.default.products.create({
                    data: createData,
                });
                logger_1.default.info('Product created in database', { productId: product.id });
            }
            catch (error) {
                logger_1.default.error('Error creating product in database', {
                    companyId,
                    error: error?.message || 'Unknown error',
                    errorCode: error?.code,
                    errorMeta: error?.meta,
                    stack: error?.stack,
                    createData: JSON.stringify(createData, (key, value) => {
                        if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
                            return value.toString();
                        }
                        return value;
                    })
                });
                throw error;
            }
            // DOC-03 : Si trackStock activé et qu'on veut initialiser le stock, créer un mouvement IN
            if (data.trackStock) {
                // Note: L'initialisation du stock doit passer par un mouvement de stock
                // Ici on ne crée pas de mouvement automatiquement car cela nécessite un entrepôt
                // L'utilisateur devra créer un mouvement d'ajustement initial si nécessaire
                logger_1.default.info('Product created with stock tracking enabled - stock will be calculated from movements', {
                    productId: product.id,
                });
            }
            // Incrémenter le compteur d'usage APRÈS création réussie
            try {
                await usage_service_1.default.increment(companyId, 'products');
                logger_1.default.info('Usage incremented', { companyId });
            }
            catch (error) {
                logger_1.default.error('Error incrementing usage', { companyId, error: error.message });
                // Ne pas faire échouer la création si l'incrémentation échoue
            }
            // ARCH-001: journal domain_events centralisé + cache invalidation
            const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
            const { ProductCreated } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
            await eventBus.publish(new ProductCreated({ companyId, timestamp: new Date() }, product.id));
            logger_1.default.info(`Product created: ${product.id}`, {
                companyId,
                productId: product.id,
                name: product.name,
            });
            // Pour un nouveau produit, le stock est toujours 0, pas besoin de le calculer
            // On retourne directement les données mappées sans calculer le stock
            const result = {
                id: product.id,
                companyId: product.company_id,
                name: product.name,
                description: product.description || undefined,
                sku: product.sku || undefined,
                type: product.type || 'product',
                unitPrice: Number(product.price || 0),
                currency: product.currency || 'CDF',
                taxRate: product.tax_rate !== null && product.tax_rate !== undefined
                    ? Number(product.tax_rate)
                    : 0,
                category: product.category || undefined,
                trackStock: product.track_stock === true,
                stockQuantity: 0, // Nouveau produit = stock 0
                lowStockThreshold: product.min_stock !== null && product.min_stock !== undefined
                    ? Number(product.min_stock)
                    : 0,
                isActive: product.is_active !== false,
                createdAt: product.created_at,
                updatedAt: product.updated_at,
            };
            logger_1.default.info('Product mapping completed', { productId: result.id });
            return result;
        }
        catch (error) {
            logger_1.default.error('Error in product creation', {
                companyId,
                error: error.message,
                stack: error.stack,
                data,
            });
            throw error;
        }
    }
    // Obtenir un article par ID
    async getById(companyId, productId) {
        const product = await database_1.default.products.findFirst({
            where: {
                id: productId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!product) {
            throw new error_middleware_1.CustomError('Product not found', 404, 'PRODUCT_NOT_FOUND');
        }
        // Import dynamique pour éviter les dépendances circulaires
        const stockMovementService = (await Promise.resolve().then(() => __importStar(require('./stock-movement.service')))).default;
        return await mapProduct(product, stockMovementService);
    }
    // Lister les articles avec filtres
    async list(companyId, filters = {}) {
        // SPRINT 3 - TASK 3.2 (UX-015): Advanced Caching Phase 3
        const cacheKey = `products:list:${companyId}:${JSON.stringify(filters)}`;
        // Try cache first
        const cached = await cache_service_1.default.get(cacheKey);
        if (cached) {
            logger_1.default.debug(`Cache hit for product list: ${companyId}`);
            return cached;
        }
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        // Construire les conditions de recherche
        const where = {
            company_id: companyId,
            deleted_at: null,
        };
        // Filtre par type
        if (filters.type) {
            where.type = filters.type;
        }
        // Filtre par catégorie
        if (filters.category) {
            where.category = filters.category;
        }
        // Filtre par statut actif
        if (filters.isActive !== undefined) {
            where.is_active = filters.isActive;
        }
        // Recherche textuelle
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { sku: { contains: filters.search, mode: 'insensitive' } },
                { category: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        // Récupérer les articles et le total
        const [products, total] = await Promise.all([
            database_1.default.products.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            database_1.default.products.count({ where }),
        ]);
        // Import dynamique pour éviter les dépendances circulaires
        const stockMovementService = (await Promise.resolve().then(() => __importStar(require('./stock-movement.service')))).default;
        // SPRINT 5 - TASK 5.5: Batch fetch stock to prevent N+1
        const productIds = products.map(p => p.id);
        const stockMap = await stockMovementService.calculateStockMany(companyId, productIds);
        // Mapper les produits avec le stock pré-calculé
        const data = products.map(p => {
            let stockQuantity = undefined;
            if (p.track_stock && p.type === 'product') {
                stockQuantity = stockMap.get(p.id) || 0;
            }
            return {
                id: p.id,
                companyId: p.company_id,
                name: p.name,
                description: p.description || undefined,
                sku: p.sku || undefined,
                type: p.type || 'product',
                unitPrice: Number(p.price || 0),
                currency: p.currency || 'CDF',
                taxRate: p.tax_rate !== null ? Number(p.tax_rate) : 0,
                category: p.category || undefined,
                trackStock: p.track_stock === true,
                stockQuantity,
                lowStockThreshold: p.min_stock !== null ? Number(p.min_stock) : 0,
                isActive: p.is_active !== false,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
            };
        });
        const result = {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
        // Cache for 30 minutes (1800 seconds)
        await cache_service_1.default.set(cacheKey, result, 1800);
        logger_1.default.debug(`Cached product list for company: ${companyId}`);
        return result;
    }
    // Obtenir toutes les catégories
    async getCategories(companyId) {
        const products = await database_1.default.products.findMany({
            where: {
                company_id: companyId,
                deleted_at: null,
                category: { not: null },
            },
            select: {
                category: true,
            },
            distinct: ['category'],
        });
        return products.map((p) => p.category).filter((c) => c !== null);
    }
    // Mettre à jour un article
    async update(companyId, productId, data) {
        // Vérifier que l'article existe et récupérer les valeurs Prisma
        const existingProductDto = await this.getById(companyId, productId);
        const existingProductPrisma = await database_1.default.products.findFirst({
            where: {
                id: productId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!existingProductPrisma) {
            throw new error_middleware_1.CustomError('Product not found', 404, 'PRODUCT_NOT_FOUND');
        }
        // Vérifier SKU unique si modifié
        if (data.sku && data.sku !== existingProductDto.sku) {
            const skuExists = await database_1.default.products.findFirst({
                where: {
                    company_id: companyId,
                    sku: data.sku,
                    deleted_at: null,
                    id: { not: productId },
                },
            });
            if (skuExists) {
                throw new error_middleware_1.CustomError('SKU already exists', 409, 'SKU_EXISTS');
            }
        }
        // Validation prix
        if (data.unitPrice !== undefined && data.unitPrice <= 0) {
            throw new error_middleware_1.CustomError('Unit price must be greater than zero', 400, 'VALIDATION_ERROR');
        }
        // Validation TVA
        if (data.taxRate !== undefined && (data.taxRate < 0 || data.taxRate > 100)) {
            throw new error_middleware_1.CustomError('Tax rate must be between 0 and 100', 400, 'VALIDATION_ERROR');
        }
        // Préparer les données de mise à jour compatibles avec Prisma
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.sku !== undefined)
            updateData.sku = data.sku;
        if (data.type !== undefined)
            updateData.type = data.type;
        if (data.category !== undefined)
            updateData.category = data.category;
        if (data.currency !== undefined)
            updateData.currency = data.currency;
        if (data.unitPrice !== undefined)
            updateData.price = new library_1.Decimal(data.unitPrice);
        if (data.taxRate !== undefined)
            updateData.tax_rate = new library_1.Decimal(data.taxRate);
        if (data.isActive !== undefined)
            updateData.is_active = data.isActive;
        // DOC-03 : Le stock ne peut jamais être modifié directement
        // Seul min_stock peut être modifié (seuil d'alerte)
        if (data.trackStock !== undefined) {
            updateData.track_stock = data.trackStock;
            if (data.lowStockThreshold !== undefined) {
                updateData.min_stock = new library_1.Decimal(data.lowStockThreshold);
            }
        }
        else {
            if (data.lowStockThreshold !== undefined) {
                updateData.min_stock = new library_1.Decimal(data.lowStockThreshold);
            }
        }
        // DOC-03 : Rejeter toute tentative de modification directe du stock
        if (data.stockQuantity !== undefined) {
            throw new error_middleware_1.CustomError('Stock cannot be modified directly. Use stock movements instead.', 400, 'STOCK_CANNOT_BE_MODIFIED_DIRECTLY');
        }
        // Mettre à jour
        const product = await database_1.default.products.update({
            where: { id: productId },
            data: updateData,
        });
        // ARCH-001: journal domain_events centralisé + cache invalidation
        const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
        const { ProductUpdated } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
        await eventBus.publish(new ProductUpdated({ companyId, timestamp: new Date() }, productId));
        logger_1.default.info(`Product updated: ${productId}`, {
            companyId,
            productId,
        });
        const stockMovementSvc = (await Promise.resolve().then(() => __importStar(require('./stock-movement.service')))).default;
        return await mapProduct(product, stockMovementSvc);
    }
    // Supprimer un article (soft delete)
    async delete(companyId, productId) {
        // Vérifier que l'article existe
        await this.getById(companyId, productId);
        // Vérifier qu'il n'y a pas de factures liées
        const invoiceLineCount = await database_1.default.invoice_lines.count({
            where: {
                productId,
                invoice: {
                    companyId,
                    deletedAt: null,
                },
            },
        });
        if (invoiceLineCount > 0) {
            throw new error_middleware_1.CustomError('Cannot delete product with existing invoice lines', 400, 'PRODUCT_HAS_INVOICES');
        }
        // Soft delete
        await database_1.default.products.update({
            where: { id: productId },
            data: { deletedAt: new Date() },
        });
        // Décrémenter le compteur d'usage
        await usage_service_1.default.decrement(companyId, 'products');
        // ARCH-001: journal domain_events centralisé + cache invalidation
        const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
        const { ProductDeleted } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
        await eventBus.publish(new ProductDeleted({ companyId, timestamp: new Date() }, productId));
        logger_1.default.info(`Product deleted: ${productId}`, {
            companyId,
            productId,
        });
        return { success: true };
    }
    // Exporter les articles en CSV
    async exportToCSV(companyId, filters = {}) {
        const where = {
            companyId,
            deletedAt: null,
        };
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.category) {
            where.category = filters.category;
        }
        if (filters.isActive !== undefined) {
            where.isActive = filters.isActive;
        }
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { sku: { contains: filters.search, mode: 'insensitive' } },
                { category: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const products = await database_1.default.products.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        // Générer CSV
        const headers = [
            'ID',
            'Nom',
            'Description',
            'Type',
            'SKU',
            'Catégorie',
            'Prix Unitaire HT',
            'Taux TVA (%)',
            'Prix Unitaire TTC',
            'Unité',
            'Stock Actuel',
            'Seuil Alerte',
            'Actif',
            'Date Création',
        ];
        // SPRINT 5 - TASK 5.5: Batch fetch stock for export
        const stockMovementService = (await Promise.resolve().then(() => __importStar(require('./stock-movement.service')))).default;
        const productIds = products.map(p => p.id);
        const stockMap = await stockMovementService.calculateStockMany(companyId, productIds);
        const rows = products.map((product) => {
            const unitPrice = product.price ? Number(product.price) : 0;
            const taxRate = product.tax_rate ? Number(product.tax_rate) : 0;
            const totalPrice = unitPrice * (1 + taxRate / 100);
            let stockQuantity = '';
            if (product.track_stock && product.type === 'product') {
                stockQuantity = (stockMap.get(product.id) || 0).toString();
            }
            else if (product.stock) {
                stockQuantity = product.stock.toString();
            }
            return [
                product.id,
                product.name || '',
                product.description || '',
                product.type,
                product.sku || '',
                product.category || '',
                unitPrice.toFixed(2),
                taxRate.toFixed(2),
                totalPrice.toFixed(2),
                '', // Unité non disponible dans le modèle
                stockQuantity,
                product.min_stock?.toString() || '',
                product.is_active ? 'Oui' : 'Non',
                product.created_at.toISOString(),
            ];
        });
        const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
        return csvContent;
    }
}
exports.ProductService = ProductService;
exports.default = new ProductService();
//# sourceMappingURL=product.service.js.map