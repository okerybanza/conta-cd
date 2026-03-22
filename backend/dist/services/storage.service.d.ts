export declare class StorageService {
    /**
     * Calculer l'espace de stockage utilisé par une entreprise (en bytes)
     */
    calculateStorageUsage(companyId: string): Promise<number>;
    /**
     * Calculer la taille d'un répertoire récursivement
     */
    private calculateDirectorySize;
    /**
     * Vérifier si l'ajout d'un fichier dépasserait la limite de stockage
     */
    checkStorageLimit(companyId: string, fileSize: number, storageLimitMB: number | null): Promise<void>;
    /**
     * Obtenir l'usage de stockage formaté
     */
    formatStorage(bytes: number): {
        value: number;
        unit: string;
        display: string;
    };
}
declare const _default: StorageService;
export default _default;
//# sourceMappingURL=storage.service.d.ts.map