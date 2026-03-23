/**
 * Handlers pour les événements Facturation
 * 
 * Ces handlers génèrent les mouvements de stock et écritures comptables
 */

import { PrismaClient } from '@prisma/client';
import { InvoiceValidated, InvoiceCancelled } from '../domain-event';
import { eventBus } from '../event-bus';
import { StockMovementCreated } from '../domain-event';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

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
export async function handleInvoiceValidated(event: InvoiceValidated): Promise<void> {
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
    logger.debug(`Stock movement already exists for invoice (created atomically): ${invoiceId}`, {
      invoiceId,
      companyId: metadata.companyId,
      movementId: existingMovement.id,
    });
    return;
  }

  // CHECKLIST ÉTAPE 4 : Erreur bloquante - si le mouvement n'existe pas, c'est une anomalie critique
  // Cela indique un problème dans le flux de validation atomique
  const errorMessage = `Stock movement missing for invoice (should have been created atomically): ${invoiceId}`;
  logger.error(errorMessage, {
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
export async function handleInvoiceCancelled(event: InvoiceCancelled): Promise<void> {
  const { invoiceId, metadata } = event;

  // Importer dynamiquement
  const stockMovementService = (await import('../../services/stock-movement.service')).default;

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
      await stockMovementService.reverse(
        metadata.companyId,
        movement.id,
        metadata.userId || 'system',
        `Annulation facture ${event.invoiceNumber}`
      );

      logger.info(`Invoice cancelled, stock movement reversed`, {
        invoiceId,
        movementId: movement.id,
        companyId: metadata.companyId,
      });
    } catch (error: any) {
      // CHECKLIST ÉTAPE 4 : Erreur bloquante - logger clairement et propager
      logger.error(`Failed to reverse stock movement ${movement.id} for invoice ${invoiceId}`, {
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

