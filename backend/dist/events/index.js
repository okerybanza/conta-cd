"use strict";
/**
 * Point d'entrée pour le système d'événements
 *
 * Enregistre tous les handlers au démarrage de l'application
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = void 0;
exports.initializeEventHandlers = initializeEventHandlers;
const event_bus_1 = require("./event-bus");
const stock_handlers_1 = require("./handlers/stock.handlers");
const invoice_handlers_1 = require("./handlers/invoice.handlers");
const invoice_status_changed_handler_1 = require("./invoice-status-changed.handler");
const accounting_handlers_1 = require("./handlers/accounting.handlers");
const invoice_data_handlers_1 = require("./handlers/invoice-data.handlers");
const hr_handlers_1 = require("./handlers/hr.handlers");
const logger_1 = __importDefault(require("../utils/logger"));
// SPRINT 3 - TASK 3.2 (UX-015): Event-based cache invalidation
require("./cache-invalidation.handler");
/**
 * Initialiser le système d'événements
 * Doit être appelé au démarrage de l'application
 */
function initializeEventHandlers() {
    // Handlers Stock (DOC-03)
    event_bus_1.eventBus.subscribe('StockMovementValidated', stock_handlers_1.handleStockMovementValidated);
    event_bus_1.eventBus.subscribe('StockMovementReversed', stock_handlers_1.handleStockMovementReversed);
    // Handlers Facturation
    event_bus_1.eventBus.subscribe('InvoiceValidated', invoice_handlers_1.handleInvoiceValidated);
    event_bus_1.eventBus.subscribe('InvoiceCancelled', invoice_handlers_1.handleInvoiceCancelled);
    // SPRINT 1 - ARCH-007: Invoice status change event
    event_bus_1.eventBus.subscribe('InvoiceStatusChanged', invoice_status_changed_handler_1.invoiceStatusChangedHandler);
    // SPRINT 1 - TASK 1.1: Direct UPDATE replacements
    event_bus_1.eventBus.subscribe('InvoiceUpdated', invoice_data_handlers_1.handleInvoiceUpdated);
    event_bus_1.eventBus.subscribe('InvoiceDeleted', invoice_data_handlers_1.handleInvoiceDeleted);
    // Handlers Comptabilité
    event_bus_1.eventBus.subscribe('InvoiceValidated', accounting_handlers_1.handleInvoiceValidatedAccounting);
    event_bus_1.eventBus.subscribe('JournalEntryPosted', accounting_handlers_1.handleJournalEntryPosted);
    // Handlers RH (DOC-04)
    event_bus_1.eventBus.subscribe('PayrollValidated', hr_handlers_1.handlePayrollValidated);
    event_bus_1.eventBus.subscribe('EmployeeContractCreated', hr_handlers_1.handleEmployeeContractCreated);
    event_bus_1.eventBus.subscribe('EmployeeContractTerminated', hr_handlers_1.handleEmployeeContractTerminated);
    logger_1.default.info('Event handlers initialized', {
        handlerCount: event_bus_1.eventBus.getHandlerCount('StockMovementCreated') +
            event_bus_1.eventBus.getHandlerCount('InvoiceValidated') +
            event_bus_1.eventBus.getHandlerCount('JournalEntryPosted') +
            event_bus_1.eventBus.getHandlerCount('PayrollValidated'),
    });
}
// Réexporter les types et l'event bus
__exportStar(require("./domain-event"), exports);
var event_bus_2 = require("./event-bus");
Object.defineProperty(exports, "eventBus", { enumerable: true, get: function () { return event_bus_2.eventBus; } });
//# sourceMappingURL=index.js.map