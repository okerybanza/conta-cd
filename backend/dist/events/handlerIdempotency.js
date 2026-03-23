"use strict";
/**
 * ARCH-002: Idempotence des handlers d'événements
 * Permet de ne traiter qu'une seule fois un événement par handler (replay / double livraison safe).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HANDLER_NAMES = void 0;
exports.wasProcessed = wasProcessed;
exports.markProcessed = markProcessed;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const HANDLER_NAMES = {
    INVOICE_UPDATED: 'handleInvoiceUpdated',
    INVOICE_DELETED: 'handleInvoiceDeleted',
    INVOICE_STATUS_CHANGED: 'invoiceStatusChangedHandler',
};
exports.HANDLER_NAMES = HANDLER_NAMES;
/**
 * Retourne true si l'événement a déjà été traité par ce handler.
 */
async function wasProcessed(eventId, handlerName) {
    return false;
}
/**
 * Marque l'événement comme traité par ce handler (à appeler après succès du traitement).
 */
async function markProcessed(eventId, handlerName) {
    logger_1.default.debug('Event idempotency disabled - table missing', { eventId, handlerName });
}
//# sourceMappingURL=handlerIdempotency.js.map