export interface ValidateStockMovementResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export type GetStockFn = (productId: string, warehouseId?: string) => Promise<number>;
export declare class StockMovementValidationService {
    /**
     * Vérifier que le module Stock est activé pour la company.
     */
    ensureStockModuleEnabled(companyId: string): Promise<void>;
    /**
     * Valider un mouvement selon DOC-03 (datarissage, module, produits actifs, entrepôts, stock suffisant pour OUT).
     */
    validateMovement(companyId: string, movement: any, getStock: GetStockFn): Promise<ValidateStockMovementResult>;
    /**
     * Type de mouvement inverse (IN↔OUT, ADJUSTMENT/TRANSFER invariants pour le libellé).
     */
    getReversedType(type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER'): 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
}
declare const _default: StockMovementValidationService;
export default _default;
//# sourceMappingURL=stockMovementValidation.service.d.ts.map