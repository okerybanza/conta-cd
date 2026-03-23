/**
 * Handlers pour les événements Comptabilité
 * 
 * Ces handlers génèrent les écritures comptables automatiques
 */

import { PrismaClient } from '@prisma/client';
import { JournalEntryPosted, InvoiceValidated } from '../domain-event';
import logger from '../../utils/logger';
import journalEntryService from '../../services/journalEntry.service';

const prisma = new PrismaClient();

/**
 * Handler pour InvoiceValidated
 * Génère automatiquement les écritures comptables pour une facture validée
 */
// CHECKLIST ÉTAPE 2 : Ce handler est maintenant obsolète car l'écriture comptable est créée atomiquement lors de la validation
// Conservé pour compatibilité, mais ne devrait plus être appelé
export async function handleInvoiceValidatedAccounting(event: InvoiceValidated): Promise<void> {
  const { invoiceId, invoiceNumber, metadata } = event;

  // Vérifier si l'écriture comptable existe déjà (créée atomiquement lors de la validation)
  const existingEntry = await prisma.journal_entries.findFirst({
    where: {
      company_id: metadata.companyId,
      source_type: 'invoice',
      source_id: invoiceId,
      status: {
        not: 'reversed',
      },
    },
  });

  if (existingEntry) {
    // L'écriture existe déjà, créée atomiquement - ne rien faire
    logger.debug(`Accounting entry already exists for invoice (created atomically): ${invoiceId}`, {
      invoiceId,
      invoiceNumber,
      companyId: metadata.companyId,
      entryId: existingEntry.id,
    });
    return;
  }

  // Si l'écriture n'existe pas, c'est une anomalie - logger et ne pas créer pour éviter les doublons
  logger.warn(`Accounting entry missing for invoice (should have been created atomically): ${invoiceId}`, {
    invoiceId,
    invoiceNumber,
    companyId: metadata.companyId,
  });
  // Ne pas créer l'écriture ici car elle devrait avoir été créée atomiquement
  // Cela indique un problème dans le flux de validation
}

/**
 * Handler pour JournalEntryPosted
 * Met à jour les soldes des comptes (calculés à partir des écritures)
 */
export async function handleJournalEntryPosted(event: JournalEntryPosted): Promise<void> {
  const { entryId, lines, metadata } = event;

  logger.info(`Journal entry posted, account balances updated`, {
    entryId,
    linesCount: lines.length,
    companyId: metadata.companyId,
  });
}
