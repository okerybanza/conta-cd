export type { ValidateStockMovementResult } from './stock/stockMovementValidation.service';
export interface StockMovementItem {
    productId: string;
    warehouseId?: string;
    warehouseToId?: string;
    quantity: number;
    batchId?: string;
    serialNumber?: string;
}
export interface CreateStockMovementData {
    movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
    items: StockMovementItem[];
    reference?: string;
    referenceId?: string;
    reason?: string;
}
export declare class StockMovementService {
    create(companyId: string, userId: string, data: CreateStockMovementData): Promise<string>;
    validate(companyId: string, movementId: string, userId: string): Promise<void>;
    reverse(companyId: string, movementId: string, userId: string, reason: string): Promise<string>;
    calculateStock(companyId: string, productId: string, warehouseId?: string): Promise<number>;
    calculateStockMany(companyId: string, productIds: string[], warehouseId?: string): Promise<Map<string, number>>;
    getById(companyId: string, movementId: string): Promise<Record<string, any>>;
    list(companyId: string, filters?: {
        movementType?: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
        status?: 'DRAFT' | 'VALIDATED';
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
}
declare const _default: StockMovementService;
export default _default;
//# sourceMappingURL=stock-movement.service.d.ts.map