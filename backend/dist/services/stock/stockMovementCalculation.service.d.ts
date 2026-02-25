export declare class StockMovementCalculationService {
    /**
     * Calculer le stock disponible pour un produit (et entrepôt si spécifié).
     */
    calculateStock(companyId: string, productId: string, warehouseId?: string): Promise<number>;
    /**
     * Calculer le stock pour plusieurs produits (batch, évite N+1).
     */
    calculateStockMany(companyId: string, productIds: string[], warehouseId?: string): Promise<Map<string, number>>;
}
declare const _default: StockMovementCalculationService;
export default _default;
//# sourceMappingURL=stockMovementCalculation.service.d.ts.map