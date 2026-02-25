"use strict";
/**
 * Handlers pour les événements Stock (DOC-03)
 *
 * Ces handlers mettent à jour les agrégats calculés à partir des événements
 * Le stock est calculé, jamais stocké directement
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStockMovementValidated = handleStockMovementValidated;
exports.handleStockMovementReversed = handleStockMovementReversed;
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const logger_1 = __importDefault(require("../../utils/logger"));
const stock_movement_service_1 = __importDefault(require("../../services/stock-movement.service"));
const prisma = new client_1.PrismaClient();
/**
 * Handler pour StockMovementValidated
 * Met à jour le cache de stock calculé pour chaque produit/entrepôt
 * DOC-03 : Le stock est calculé, jamais stocké
 */
async function handleStockMovementValidated(event) {
    const { movementId, movementType, items, metadata } = event;
    await prisma.$transaction(async (tx) => {
        // Pour chaque item, recalculer le stock et mettre à jour le cache
        for (const item of items) {
            // Calculer le stock actuel depuis tous les mouvements validés
            const stock = await stock_movement_service_1.default.calculateStock(metadata.companyId, item.productId, item.warehouseId);
            // CHECKLIST ÉTAPE 1 : Mise à jour du CACHE du stock
            // La source de vérité est stock_movements, products.stock est un cache dérivé
            // Ne jamais utiliser products.stock pour des décisions métier. Toujours recalculer depuis les mouvements.
            await tx.products.update({
                where: { id: item.productId },
                data: {
                    stock: new library_1.Decimal(stock),
                },
            });
            logger_1.default.debug(`Stock cache updated after movement validation`, {
                movementId,
                productId: item.productId,
                warehouseId: item.warehouseId,
                calculatedStock: stock,
                companyId: metadata.companyId,
            });
        }
        // Si valorisation activée, générer les écritures comptables
        // TODO: Implémenter selon stock_valuation_method (FIFO, weighted_average)
        const company = await tx.companies.findUnique({
            where: { id: metadata.companyId },
            select: {
                stock_valuation_method: true,
                rh_accounting_integration: true,
            },
        });
        if (company?.stock_valuation_method && company.rh_accounting_integration) {
            // Générer les écritures comptables
            // TODO: Implémenter selon la méthode de valorisation
            logger_1.default.info(`Accounting entries should be generated for stock movement`, {
                movementId,
                valuationMethod: company.stock_valuation_method,
            });
        }
    });
    logger_1.default.info(`Stock movement validated and stock cache updated`, {
        movementId,
        movementType,
        itemsCount: items.length,
        companyId: metadata.companyId,
    });
}
/**
 * Handler pour StockMovementReversed
 * Recalcule le stock après inversion d'un mouvement
 */
async function handleStockMovementReversed(event) {
    const { originalMovementId, reversalMovementId, metadata } = event;
    // Récupérer les items du mouvement original pour recalculer
    const originalMovement = await prisma.stock_movements.findUnique({
        where: { id: originalMovementId },
        include: {
            items: true,
        },
    });
    if (!originalMovement) {
        logger_1.default.warn(`Original movement not found for reversal`, {
            originalMovementId,
            reversalMovementId,
        });
        return;
    }
    await prisma.$transaction(async (tx) => {
        // Recalculer le stock pour chaque produit affecté
        for (const item of originalMovement.items) {
            const stock = await stock_movement_service_1.default.calculateStock(metadata.companyId, item.product_id, item.warehouse_id || undefined);
            // CHECKLIST ÉTAPE 1 : Mise à jour du CACHE du stock (cache dérivé uniquement)
            await tx.products.update({
                where: { id: item.product_id },
                data: {
                    stock: new library_1.Decimal(stock),
                },
            });
        }
    });
    logger_1.default.info(`Stock recalculated after movement reversal`, {
        originalMovementId,
        reversalMovementId,
        companyId: metadata.companyId,
    });
}
// Note: StockAdjusted n'est plus utilisé dans DOC-03
// Les ajustements passent par StockMovementService avec type ADJUSTMENT
//# sourceMappingURL=stock.handlers.js.map