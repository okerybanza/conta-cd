import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { eventBus } from '../events/event-bus';
import { StockAdjusted } from '../events/domain-event';
import stockMovementService from './stock-movement.service';

export interface StockCheckResult {
  available: boolean;
  requested: number;
  availableQuantity: number;
  productId: string;
  productName: string;
}

export interface LowStockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  status: 'low' | 'critical' | 'out_of_stock';
}

export class StockService {
  /**
   * Vérifier si le stock est disponible pour un produit
   */
  async checkStock(
    companyId: string,
    productId: string,
    requestedQuantity: number
  ): Promise<StockCheckResult> {
    const product = await prisma.products.findFirst({
      where: {
        id: productId,
        company_id: companyId,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        type: true,
        stock: true,
        min_stock: true,
        track_stock: true,
      },
    });

    if (!product) {
      throw new CustomError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Si c'est un service ou si le suivi de stock est désactivé
    if (product.type === 'service' || product.track_stock === false) {
      return {
        available: true,
        requested: requestedQuantity,
        availableQuantity: Infinity,
        productId: product.id,
        productName: product.name,
      };
    }

    // Calculer le stock réel via le service de mouvement
    const currentStock = await stockMovementService.calculateStock(companyId, productId);
    const available = currentStock >= requestedQuantity;

    return {
      available,
      requested: requestedQuantity,
      availableQuantity: currentStock,
      productId: product.id,
      productName: product.name,
    };
  }

  /**
   * Vérifier le stock pour plusieurs produits
   */
  async checkMultipleStocks(
    companyId: string,
    items: Array<{ productId: string; quantity: number }>
  ): Promise<StockCheckResult[]> {
    const results: StockCheckResult[] = [];

    for (const item of items) {
      if (!item.productId) continue;

      try {
        const result = await this.checkStock(companyId, item.productId, item.quantity);
        results.push(result);
      } catch (error: any) {
        logger.error('Error checking stock for product', {
          companyId,
          productId: item.productId,
          error: error.message,
        });
        results.push({
          available: false,
          requested: item.quantity,
          availableQuantity: 0,
          productId: item.productId,
          productName: 'Unknown',
        });
      }
    }

    return results;
  }

  /**
   * Décrémenter le stock d'un produit (via StockMovementService)
   */
  async decrementStock(
    companyId: string,
    productId: string,
    quantity: number,
    reference?: string,
    referenceId?: string,
    userId?: string
  ): Promise<void> {
    const movementId = await stockMovementService.create(companyId, userId || 'system', {
      movementType: 'OUT',
      items: [{ productId, quantity }],
      reference,
      referenceId,
    });

    await stockMovementService.validate(companyId, movementId, userId || 'system');
  }

  /**
   * Incrémenter le stock d'un produit (via StockMovementService)
   */
  async incrementStock(
    companyId: string,
    productId: string,
    quantity: number,
    reference?: string,
    referenceId?: string,
    userId?: string
  ): Promise<void> {
    const movementId = await stockMovementService.create(companyId, userId || 'system', {
      movementType: 'IN',
      items: [{ productId, quantity }],
      reference,
      referenceId,
    });

    await stockMovementService.validate(companyId, movementId, userId || 'system');
  }

  /**
   * Obtenir les alertes de stock faible
   */
  async getLowStockAlerts(companyId: string): Promise<LowStockAlert[]> {
    const products = await prisma.products.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        is_active: true,
        type: 'product',
        track_stock: true,
      },
      select: {
        id: true,
        name: true,
        min_stock: true,
      },
    });

    const alerts: LowStockAlert[] = [];

    for (const product of products) {
      const currentStock = await stockMovementService.calculateStock(companyId, product.id);
      const minStock = Number(product.min_stock || 0);

      if (currentStock <= minStock) {
        let status: LowStockAlert['status'] = 'low';
        if (currentStock <= 0) status = 'out_of_stock';
        else if (currentStock <= minStock / 2) status = 'critical';

        alerts.push({
          productId: product.id,
          productName: product.name,
          currentStock,
          minStock,
          status,
        });
      }
    }

    return alerts;
  }

  /**
   * Ajuster le stock à une valeur spécifique
   */
  async adjustStock(
    companyId: string,
    productId: string,
    newQuantity: number,
    reason: string,
    userId?: string
  ): Promise<void> {
    const currentStock = await stockMovementService.calculateStock(companyId, productId);
    const adjustment = newQuantity - currentStock;

    if (adjustment === 0) return;

    const movementType = adjustment > 0 ? 'IN' : 'OUT';
    const movementId = await stockMovementService.create(companyId, userId || 'system', {
      movementType: adjustment > 0 ? 'IN' : 'OUT',
      items: [{ productId, quantity: Math.abs(adjustment) }],
      reason: `Adjustment: ${reason}`,
    });

    await stockMovementService.validate(companyId, movementId, userId || 'system');

    // Trigger explicit event for backward compatibility / other listeners if needed
    const event = new StockAdjusted(
      {
        companyId,
        userId,
        timestamp: new Date(),
      },
      productId,
      currentStock,
      newQuantity,
      reason,
      undefined
    );
    await eventBus.publish(event);
  }

  /**
   * Obtenir le stock actuel d'un produit (méthode de compatibilité)
   */
  async getProductStock(companyId: string, productId: string): Promise<number> {
    return stockMovementService.calculateStock(companyId, productId);
  }
}

export default new StockService();
