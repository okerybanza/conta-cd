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
export declare class StockService {
    /**
     * Vérifier si le stock est disponible pour un produit
     */
    checkStock(companyId: string, productId: string, requestedQuantity: number): Promise<StockCheckResult>;
    /**
     * Vérifier le stock pour plusieurs produits
     */
    checkMultipleStocks(companyId: string, items: Array<{
        productId: string;
        quantity: number;
    }>): Promise<StockCheckResult[]>;
    /**
     * Décrémenter le stock d'un produit (via StockMovementService)
     */
    decrementStock(companyId: string, productId: string, quantity: number, reference?: string, referenceId?: string, userId?: string): Promise<void>;
    /**
     * Incrémenter le stock d'un produit (via StockMovementService)
     */
    incrementStock(companyId: string, productId: string, quantity: number, reference?: string, referenceId?: string, userId?: string): Promise<void>;
    /**
     * Obtenir les alertes de stock faible
     */
    getLowStockAlerts(companyId: string): Promise<LowStockAlert[]>;
    /**
     * Ajuster le stock à une valeur spécifique
     */
    adjustStock(companyId: string, productId: string, newQuantity: number, reason: string, userId?: string): Promise<void>;
    /**
     * Obtenir le stock actuel d'un produit (méthode de compatibilité)
     */
    getProductStock(companyId: string, productId: string): Promise<number>;
}
declare const _default: StockService;
export default _default;
//# sourceMappingURL=stock.service.d.ts.map