/**
 * Service de gestion des entrepôts (Warehouses)
 * DOC-03 : Support multi-entrepôts
 */
export interface CreateWarehouseData {
    name: string;
    code?: string;
    address?: string;
    city?: string;
    country?: string;
    isDefault?: boolean;
    notes?: string;
}
export interface UpdateWarehouseData extends Partial<CreateWarehouseData> {
    isActive?: boolean;
}
export declare class WarehouseService {
    /**
     * Créer un entrepôt
     * DOC-08 : Audit logging obligatoire
     */
    create(companyId: string, data: CreateWarehouseData, userId?: string): Promise<any>;
    /**
     * Lister les entrepôts d'une entreprise
     */
    list(companyId: string, includeInactive?: boolean): Promise<any[]>;
    /**
     * Obtenir un entrepôt par ID
     */
    getById(companyId: string, warehouseId: string): Promise<any>;
    /**
     * Mettre à jour un entrepôt
     * DOC-08 : Audit logging obligatoire
     */
    update(companyId: string, warehouseId: string, data: UpdateWarehouseData, userId?: string): Promise<any>;
    /**
     * Supprimer un entrepôt (soft delete)
     * DOC-08 : Audit logging obligatoire
     * DOC-03 : Vérification mouvements validés (règle non négociable)
     */
    delete(companyId: string, warehouseId: string, userId?: string): Promise<void>;
    /**
     * Obtenir l'entrepôt par défaut d'une entreprise
     */
    getDefault(companyId: string): Promise<any | null>;
}
declare const _default: WarehouseService;
export default _default;
//# sourceMappingURL=warehouse.service.d.ts.map