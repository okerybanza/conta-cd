export interface CreateSupplierData {
    name: string;
    businessName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    nif?: string;
    rccm?: string;
    notes?: string;
    accountId?: string;
}
export interface UpdateSupplierData extends Partial<CreateSupplierData> {
}
export interface SupplierFilters {
    search?: string;
    city?: string;
    country?: string;
    page?: number;
    limit?: number;
}
export declare class SupplierService {
    /**
     * S'assurer que le schéma DB supporte bien le lien compte-fournisseur.
     * À appeler uniquement avant écriture (create/update), pas avant lecture (list/getById).
     */
    private ensureAccountSchema;
    /**
     * Créer un fournisseur
     */
    create(companyId: string, data: CreateSupplierData): Promise<any>;
    /**
     * Obtenir un fournisseur par ID
     */
    getById(companyId: string, supplierId: string): Promise<any>;
    /**
     * Lister les fournisseurs (lecture seule : pas d'appel au DDL ensureAccountSchema)
     */
    list(companyId: string, filters?: SupplierFilters): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * Mettre à jour un fournisseur
     */
    update(companyId: string, supplierId: string, data: UpdateSupplierData): Promise<any>;
    /**
     * Supprimer un fournisseur
     */
    delete(companyId: string, supplierId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Mettre à jour les statistiques d'un fournisseur
     */
    updateStats(supplierId: string): Promise<void>;
}
declare const _default: SupplierService;
export default _default;
//# sourceMappingURL=supplier.service.d.ts.map