"use strict";
/**
 * Middleware pour empêcher les écritures directes sur les agrégats
 *
 * Conformité DOC-02 : Aucune donnée critique ne doit être modifiée directement
 *
 * Ce middleware intercepte les requêtes qui tentent de modifier directement :
 * - products.stock (doit passer par stock_movements)
 * - accounts.balance (doit passer par journal_entries)
 * - etc.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preventDirectStockUpdate = preventDirectStockUpdate;
exports.preventDirectBalanceUpdate = preventDirectBalanceUpdate;
exports.preventDirectAggregateUpdates = preventDirectAggregateUpdates;
const logger_1 = __importDefault(require("../utils/logger"));
const error_middleware_1 = require("./error.middleware");
/**
 * Liste des champs interdits pour modification directe
 */
const PROTECTED_FIELDS = {
    products: ['stock'], // Le stock doit être modifié via stock_movements
    accounts: ['balance', 'debit_balance', 'credit_balance'], // Les soldes doivent être calculés depuis journal_entries
    // Ajouter d'autres champs critiques ici
};
/**
 * Middleware pour vérifier les mises à jour de produits
 */
function preventDirectStockUpdate(req, res, next) {
    if (req.method !== 'PUT' && req.method !== 'PATCH') {
        return next();
    }
    // Vérifier si on tente de modifier le stock directement
    if (req.body.stock !== undefined || req.body.stockQuantity !== undefined) {
        logger_1.default.warn('Attempt to update stock directly detected', {
            path: req.path,
            method: req.method,
            body: req.body,
            userId: req.user?.id,
        });
        throw new error_middleware_1.CustomError('Direct stock updates are not allowed. Use stock movements instead (createStockMovement API).', 400, 'DIRECT_AGGREGATE_UPDATE_FORBIDDEN', {
            field: 'stock',
            message: 'Stock must be modified via stock movements, not directly',
        });
    }
    next();
}
/**
 * Middleware pour vérifier les mises à jour de comptes comptables
 */
function preventDirectBalanceUpdate(req, res, next) {
    if (req.method !== 'PUT' && req.method !== 'PATCH') {
        return next();
    }
    // Vérifier si on tente de modifier les soldes directement
    const balanceFields = ['balance', 'debit_balance', 'credit_balance'];
    const hasBalanceUpdate = balanceFields.some(field => req.body[field] !== undefined);
    if (hasBalanceUpdate) {
        logger_1.default.warn('Attempt to update account balance directly detected', {
            path: req.path,
            method: req.method,
            body: req.body,
            userId: req.user?.id,
        });
        throw new error_middleware_1.CustomError('Direct account balance updates are not allowed. Use journal entries instead.', 400, 'DIRECT_AGGREGATE_UPDATE_FORBIDDEN', {
            fields: balanceFields.filter(field => req.body[field] !== undefined),
            message: 'Account balances must be calculated from journal entries, not updated directly',
        });
    }
    next();
}
/**
 * Middleware générique pour empêcher les mises à jour directes
 * À utiliser sur les routes critiques
 */
function preventDirectAggregateUpdates(protectedFields) {
    return (req, res, next) => {
        if (req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'POST') {
            return next();
        }
        // Vérifier chaque modèle protégé
        for (const [model, fields] of Object.entries(protectedFields)) {
            const hasProtectedField = fields.some(field => req.body[field] !== undefined);
            if (hasProtectedField) {
                const violatedFields = fields.filter(field => req.body[field] !== undefined);
                logger_1.default.warn(`Attempt to update protected fields directly detected: ${model}`, {
                    path: req.path,
                    method: req.method,
                    model,
                    violatedFields,
                    userId: req.user?.id,
                });
                throw new error_middleware_1.CustomError(`Direct updates to ${model} protected fields are not allowed. Use the appropriate service methods instead.`, 400, 'DIRECT_AGGREGATE_UPDATE_FORBIDDEN', {
                    model,
                    violatedFields,
                    message: `Protected fields in ${model} must be modified via events, not directly`,
                });
            }
        }
        next();
    };
}
//# sourceMappingURL=prevent-direct-aggregate-updates.middleware.js.map