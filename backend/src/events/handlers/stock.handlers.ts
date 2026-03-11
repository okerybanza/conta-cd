/**
 * Handlers pour les événements Stock (DOC-03)
 * 
 * Ces handlers mettent à jour les agrégats calculés à partir des événements
 * Le stock est calculé, jamais stocké directement
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { StockMovementValidated, StockMovementReversed } from '../domain-event';
import logger from '../../utils/logger';
import stockMovementService from '../../services/stock-movement.service';

const prisma = new PrismaClient();

/**
 * Handler pour StockMovementValidated
 * Met à jour le cache de stock calculé pour chaque produit/entrepôt
 * DOC-03 : Le stock est calculé, jamais stocké
 */
export async function handleStockMovementValidated(event: StockMovementValidated): Promise<void> {
  const { movementId, movementType, items, metadata } = event;

  await prisma.$transaction(async (tx) => {
    // Pour chaque item, recalculer le stock et mettre à jour le cache
    for (const item of items) {
      // Calculer le stock actuel depuis tous les mouvements validés
      const stock = await stockMovementService.calculateStock(
        metadata.companyId,
        item.productId,
        item.warehouseId
      );

      // CHECKLIST ÉTAPE 1 : Mise à jour du CACHE du stock
      // La source de vérité est stock_movements, products.stock est un cache dérivé
      // Ne jamais utiliser products.stock pour des décisions métier. Toujours recalculer depuis les mouvements.
      await tx.products.update({
        where: { id: item.productId },
        data: {
          stock: new Decimal(stock),
        },
      });

      logger.debug(`Stock cache updated after movement validation`, {
        movementId,
        productId: item.productId,
        warehouseId: item.warehouseId,
        calculatedStock: stock,
        companyId: metadata.companyId,
      });
    }

    // Si valorisation activée, calculer le coût unitaire selon la méthode choisie
    const company = await tx.companies.findUnique({
      where: { id: metadata.companyId },
      select: {
        stock_valuation_method: true,
        rh_accounting_integration: true,
      },
    });

    if (company?.stock_valuation_method && company.rh_accounting_integration) {
      const method = company.stock_valuation_method.toLowerCase();

      for (const item of items) {
        // La valorisation ne s'applique qu'aux entrées de stock (IN, ADJUSTMENT, TRANSFER entrant)
        const isInbound =
          movementType === 'IN' ||
          movementType === 'ADJUSTMENT' ||
          (movementType === 'TRANSFER' && item.warehouseToId);

        if (!isInbound) {
          continue;
        }

        // Recalculer le stock après mouvement (stock courant)
        const stockAfter = await stockMovementService.calculateStock(
          metadata.companyId,
          item.productId,
          item.warehouseId
        );

        const product = await tx.products.findUnique({
          where: { id: item.productId },
          select: {
            cost: true,
            price: true,
          },
        });

        if (!product) {
          logger.warn('Product not found while computing stock valuation', {
            movementId,
            productId: item.productId,
          });
          continue;
        }

        const currentCost = product.cost ? Number(product.cost) : 0;
        const incomingUnitCost =
          currentCost > 0
            ? currentCost
            : product.price
            ? Number(product.price)
            : 0;

        const quantityIn = item.quantity;
        const stockBefore = stockAfter - quantityIn;

        let newCost = currentCost;

        if (method === 'weighted_average') {
          const totalQtyBefore = stockBefore > 0 ? stockBefore : 0;
          const totalValueBefore = totalQtyBefore * currentCost;
          const totalQtyAfter = totalQtyBefore + quantityIn;
          const totalValueAfter =
            totalValueBefore + quantityIn * incomingUnitCost;

          if (totalQtyAfter > 0) {
            newCost = totalValueAfter / totalQtyAfter;
          } else {
            newCost = incomingUnitCost;
          }
        } else if (method === 'fifo') {
          // Approximation : en absence de couches de lots valorisées,
          // on aligne le coût unitaire sur le coût du dernier lot entrant.
          newCost = incomingUnitCost;
        }

        // Mettre à jour le coût unitaire du produit (cache cost)
        await tx.products.update({
          where: { id: item.productId },
          data: {
            cost: new Decimal(newCost),
          },
        });

        logger.debug('Product unit cost updated after stock movement', {
          movementId,
          productId: item.productId,
          method: company.stock_valuation_method,
          previousCost: currentCost,
          newCost,
          companyId: metadata.companyId,
        });
      }
    }
  });

  logger.info(`Stock movement validated and stock cache updated`, {
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
export async function handleStockMovementReversed(event: StockMovementReversed): Promise<void> {
  const { originalMovementId, reversalMovementId, metadata } = event;

  // Récupérer les items du mouvement original pour recalculer
  const originalMovement = await prisma.stock_movements.findUnique({
    where: { id: originalMovementId },
    include: {
      items: true,
    },
  });

  if (!originalMovement) {
    logger.warn(`Original movement not found for reversal`, {
      originalMovementId,
      reversalMovementId,
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Recalculer le stock pour chaque produit affecté
    for (const item of originalMovement.items) {
      const stock = await stockMovementService.calculateStock(
        metadata.companyId,
        item.product_id,
        item.warehouse_id || undefined
      );

      // CHECKLIST ÉTAPE 1 : Mise à jour du CACHE du stock (cache dérivé uniquement)
      await tx.products.update({
        where: { id: item.product_id },
        data: {
          stock: new Decimal(stock),
        },
      });
    }
  });

  logger.info(`Stock recalculated after movement reversal`, {
    originalMovementId,
    reversalMovementId,
    companyId: metadata.companyId,
  });
}

// Note: StockAdjusted n'est plus utilisé dans DOC-03
// Les ajustements passent par StockMovementService avec type ADJUSTMENT

