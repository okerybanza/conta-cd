/**
 * Service d'indicateurs de contrôle du stock (DOC-03)
 * 
 * Détecte les incohérences et problèmes :
 * - produit sans mouvement mais facturé
 * - stock théorique ≠ stock inventaire
 * - mouvement sans référence métier
 */

import prisma from '../config/database';
import logger from '../utils/logger';
import stockMovementService from './stock-movement.service';

export interface StockControlAlert {
  type: 'PRODUCT_INVOICED_WITHOUT_MOVEMENT' | 'STOCK_MISMATCH' | 'MOVEMENT_WITHOUT_REFERENCE';
  severity: 'ERROR' | 'WARNING';
  message: string;
  details: any;
}

export class StockControlService {
  /**
   * Détecter les produits facturés sans mouvement de stock
   * DOC-03 : Indicateur obligatoire
   */
  async detectProductsInvoicedWithoutMovement(companyId: string): Promise<StockControlAlert[]> {
    const alerts: StockControlAlert[] = [];

    // Récupérer les factures validées avec des lignes produits
    const invoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        status: { in: ['sent', 'paid', 'partially_paid'] },
        deleted_at: null,
      },
      include: {
        invoice_lines: {
          where: {
            product_id: { not: null },
          },
          include: {
            products: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    for (const invoice of invoices) {
      for (const line of invoice.invoice_lines) {
        if (!line.product_id || line.products.type === 'service') {
          continue;
        }

        // Vérifier s'il existe un mouvement de stock pour cette facture
        const movement = await prisma.stock_movements.findFirst({
          where: {
            company_id: companyId,
            reference: 'invoice_sent',
            reference_id: invoice.id,
            status: 'VALIDATED',
            items: {
              some: {
                product_id: line.product_id,
              },
            },
          },
        });

        if (!movement) {
          alerts.push({
            type: 'PRODUCT_INVOICED_WITHOUT_MOVEMENT',
            severity: 'ERROR',
            message: `Product ${line.products.name} was invoiced but has no stock movement`,
            details: {
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoice_number,
              productId: line.product_id,
              productName: line.products.name,
              quantity: Number(line.quantity),
            },
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Détecter les mouvements sans référence métier
   * DOC-03 : Indicateur obligatoire
   */
  async detectMovementsWithoutReference(companyId: string): Promise<StockControlAlert[]> {
    const alerts: StockControlAlert[] = [];

    const movements = await prisma.stock_movements.findMany({
      where: {
        company_id: companyId,
        status: 'VALIDATED',
        OR: [
          { reference: null },
          { reference_id: null },
        ],
      },
      include: {
        items: {
          include: {
            products: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    for (const movement of movements) {
      alerts.push({
        type: 'MOVEMENT_WITHOUT_REFERENCE',
        severity: 'WARNING',
        message: `Stock movement ${movement.id} has no reference`,
        details: {
          movementId: movement.id,
          movementType: movement.movement_type,
          items: movement.items.map(item => ({
            productName: item.products.name,
            quantity: Number(item.quantity),
          })),
        },
      });
    }

    return alerts;
  }

  /**
   * Comparer le stock calculé avec le stock stocké (cache)
   * DOC-03 : Indicateur obligatoire
   */
  async detectStockMismatches(companyId: string): Promise<StockControlAlert[]> {
    const alerts: StockControlAlert[] = [];

    // Récupérer tous les produits avec suivi de stock
    const products = await prisma.products.findMany({
      where: {
        company_id: companyId,
        type: 'product',
        stock: { not: null },
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        stock: true,
      },
    });

    for (const product of products) {
      const calculatedStock = await stockMovementService.calculateStock(
        companyId,
        product.id
      );

      const storedStock = Number(product.stock || 0);

      // Tolérance de 0.01 pour les arrondis
      if (Math.abs(calculatedStock - storedStock) > 0.01) {
        alerts.push({
          type: 'STOCK_MISMATCH',
          severity: 'ERROR',
          message: `Stock mismatch for product ${product.name}: calculated=${calculatedStock}, stored=${storedStock}`,
          details: {
            productId: product.id,
            productName: product.name,
            calculatedStock,
            storedStock,
            difference: calculatedStock - storedStock,
          },
        });
      }
    }

    return alerts;
  }

  /**
   * Obtenir tous les indicateurs de contrôle
   */
  async getAllAlerts(companyId: string): Promise<StockControlAlert[]> {
    const [
      invoicedWithoutMovement,
      movementsWithoutReference,
      stockMismatches,
    ] = await Promise.all([
      this.detectProductsInvoicedWithoutMovement(companyId),
      this.detectMovementsWithoutReference(companyId),
      this.detectStockMismatches(companyId),
    ]);

    const allAlerts = [
      ...invoicedWithoutMovement,
      ...movementsWithoutReference,
      ...stockMismatches,
    ];

    logger.info(`Stock control alerts generated`, {
      companyId,
      totalAlerts: allAlerts.length,
      errors: allAlerts.filter(a => a.severity === 'ERROR').length,
      warnings: allAlerts.filter(a => a.severity === 'WARNING').length,
    });

    return allAlerts;
  }
}

export default new StockControlService();

