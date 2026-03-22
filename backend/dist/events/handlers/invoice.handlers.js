"use strict";
/**
 * Handlers pour les événements Facturation
 *
 * Ces handlers génèrent les mouvements de stock et écritures comptables
 */
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
exports.handleInvoiceValidated = handleInvoiceValidated;
exports.handleInvoiceCancelled = handleInvoiceCancelled;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma = new client_1.PrismaClient();
/**
 * Handler pour InvoiceValidated
 * Crée les mouvements de stock pour chaque ligne de facture
 */
/**
 * Handler pour InvoiceValidated
 * Crée les mouvements de stock pour chaque ligne de facture via StockMovementService
 */
// CHECKLIST ÉTAPE 2 & 4 : Ce handler est maintenant obsolète car le mouvement de stock est créé atomiquement lors de la validation
// Conservé pour compatibilité, mais ne devrait plus être appelé
// CHECKLIST ÉTAPE 4 : Erreurs bloquantes - si le mouvement n'existe pas, c'est une anomalie critique
async function handleInvoiceValidated(event) {
    const { invoiceId, lines, metadata } = event;
    // Vérifier si le mouvement de stock existe déjà (créé atomiquement lors de la validation)
    const existingMovement = await prisma.stock_movements.findFirst({
        where: {
            company_id: metadata.companyId,
            reference: 'Invoice',
            reference_id: invoiceId,
            status: 'VALIDATED',
            reversed_at: null,
        },
    });
    if (existingMovement) {
        // Le mouvement existe déjà, créé atomiquement - ne rien faire
        logger_1.default.debug(`Stock movement already exists for invoice (created atomically): ${invoiceId}`, {
            invoiceId,
            companyId: metadata.companyId,
            movementId: existingMovement.id,
        });
        return;
    }
    // CHECKLIST ÉTAPE 4 : Erreur bloquante - si le mouvement n'existe pas, c'est une anomalie critique
    // Cela indique un problème dans le flux de validation atomique
    const errorMessage = `Stock movement missing for invoice (should have been created atomically): ${invoiceId}`;
    logger_1.default.error(errorMessage, {
        invoiceId,
        companyId: metadata.companyId,
    });
    // Propager l'erreur pour qu'elle soit visible et traçable
    throw new Error(errorMessage);
}
/**
 * Handler pour InvoiceCancelled
 * Inverse les mouvements de stock via StockMovementService
 */
async function handleInvoiceCancelled(event) {
    const { invoiceId, metadata } = event;
    // Importer dynamiquement
    const stockMovementService = (await Promise.resolve().then(() => __importStar(require('../../services/stock-movement.service')))).default;
    // Trouver le mouvement validé lié à cette facture
    // Note: On cherche manuellement car le service n'a pas de méthode "getByReference" exposée
    const movements = await prisma.stock_movements.findMany({
        where: {
            reference: 'Invoice',
            reference_id: invoiceId,
            company_id: metadata.companyId,
            status: 'VALIDATED',
            reversed_at: null,
        },
    });
    // CHECKLIST ÉTAPE 4 : Erreurs bloquantes - propager les erreurs au lieu de les avaler
    for (const movement of movements) {
        try {
            await stockMovementService.reverse(metadata.companyId, movement.id, metadata.userId || 'system', `Annulation facture ${event.invoiceNumber}`);
            logger_1.default.info(`Invoice cancelled, stock movement reversed`, {
                invoiceId,
                movementId: movement.id,
                companyId: metadata.companyId,
            });
        }
        catch (error) {
            // CHECKLIST ÉTAPE 4 : Erreur bloquante - logger clairement et propager
            logger_1.default.error(`Failed to reverse stock movement ${movement.id} for invoice ${invoiceId}`, {
                error: error.message,
                stack: error.stack,
                invoiceId,
                movementId: movement.id,
                companyId: metadata.companyId,
            });
            // Propager l'erreur pour qu'elle soit visible et traçable
            throw error;
        }
    }
}
//# sourceMappingURL=invoice.handlers.js.map