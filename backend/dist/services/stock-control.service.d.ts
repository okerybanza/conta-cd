/**
 * Service d'indicateurs de contrôle du stock (DOC-03)
 *
 * Détecte les incohérences et problèmes :
 * - produit sans mouvement mais facturé
 * - stock théorique ≠ stock inventaire
 * - mouvement sans référence métier
 */
export interface StockControlAlert {
    type: 'PRODUCT_INVOICED_WITHOUT_MOVEMENT' | 'STOCK_MISMATCH' | 'MOVEMENT_WITHOUT_REFERENCE';
    severity: 'ERROR' | 'WARNING';
    message: string;
    details: any;
}
export declare class StockControlService {
    /**
     * Détecter les produits facturés sans mouvement de stock
     * DOC-03 : Indicateur obligatoire
     */
    detectProductsInvoicedWithoutMovement(companyId: string): Promise<StockControlAlert[]>;
    /**
     * Détecter les mouvements sans référence métier
     * DOC-03 : Indicateur obligatoire
     */
    detectMovementsWithoutReference(companyId: string): Promise<StockControlAlert[]>;
    /**
     * Comparer le stock calculé avec le stock stocké (cache)
     * DOC-03 : Indicateur obligatoire
     */
    detectStockMismatches(companyId: string): Promise<StockControlAlert[]>;
    /**
     * Obtenir tous les indicateurs de contrôle
     */
    getAllAlerts(companyId: string): Promise<StockControlAlert[]>;
}
declare const _default: StockControlService;
export default _default;
//# sourceMappingURL=stock-control.service.d.ts.map