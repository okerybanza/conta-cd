/**
 * Point d'entrée pour le système d'événements
 * 
 * Enregistre tous les handlers au démarrage de l'application
 */

import { eventBus } from './event-bus';
import { handleStockMovementValidated, handleStockMovementReversed } from './handlers/stock.handlers';
import { handleInvoiceValidated, handleInvoiceCancelled } from './handlers/invoice.handlers';
import { invoiceStatusChangedHandler } from './invoice-status-changed.handler';
import { handleInvoiceValidatedAccounting, handleJournalEntryPosted } from './handlers/accounting.handlers';
import { handleInvoiceUpdated, handleInvoiceDeleted } from './handlers/invoice-data.handlers';
import {
  handlePayrollValidated,
  handleEmployeeContractCreated,
  handleEmployeeContractTerminated,
} from './handlers/hr.handlers';
import logger from '../utils/logger';

// SPRINT 3 - TASK 3.2 (UX-015): Event-based cache invalidation
import './cache-invalidation.handler';

/**
 * Initialiser le système d'événements
 * Doit être appelé au démarrage de l'application
 */
export function initializeEventHandlers(): void {
  // Handlers Stock (DOC-03)
  eventBus.subscribe('StockMovementValidated', handleStockMovementValidated);
  eventBus.subscribe('StockMovementReversed', handleStockMovementReversed);

  // Handlers Facturation
  eventBus.subscribe('InvoiceValidated', handleInvoiceValidated);
  eventBus.subscribe('InvoiceCancelled', handleInvoiceCancelled);
  // SPRINT 1 - ARCH-007: Invoice status change event
  eventBus.subscribe('InvoiceStatusChanged', invoiceStatusChangedHandler);
  // SPRINT 1 - TASK 1.1: Direct UPDATE replacements
  eventBus.subscribe('InvoiceUpdated', handleInvoiceUpdated);
  eventBus.subscribe('InvoiceDeleted', handleInvoiceDeleted);

  // Handlers Comptabilité
  eventBus.subscribe('InvoiceValidated', handleInvoiceValidatedAccounting);
  eventBus.subscribe('JournalEntryPosted', handleJournalEntryPosted);

  // Handlers RH (DOC-04)
  eventBus.subscribe('PayrollValidated', handlePayrollValidated);
  eventBus.subscribe('EmployeeContractCreated', handleEmployeeContractCreated);
  eventBus.subscribe('EmployeeContractTerminated', handleEmployeeContractTerminated);

  logger.info('Event handlers initialized', {
    handlerCount: eventBus.getHandlerCount('StockMovementCreated') +
      eventBus.getHandlerCount('InvoiceValidated') +
      eventBus.getHandlerCount('JournalEntryPosted') +
      eventBus.getHandlerCount('PayrollValidated'),
  });
}

// Réexporter les types et l'event bus
export * from './domain-event';
export { eventBus } from './event-bus';

