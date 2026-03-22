export declare class CacheService {
    /**
     * Obtenir une valeur du cache
     * @param key Clé du cache
     * @returns Valeur désérialisée ou null si non trouvée
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Définir une valeur dans le cache
     * @param key Clé du cache
     * @param value Valeur à mettre en cache (sera sérialisée en JSON)
     * @param ttlSeconds Durée de vie en secondes (optionnel)
     */
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    /**
     * Supprimer une clé du cache
     * @param key Clé à supprimer
     */
    delete(key: string): Promise<void>;
    /**
     * Supprimer toutes les clés correspondant à un pattern (Utilise SCAN pour la performance)
     * @param pattern Pattern à rechercher (ex: "dashboard:stats:company-*")
     */
    deletePattern(pattern: string): Promise<void>;
    /**
     * Invalider le cache d'une entreprise
     * Supprime toutes les clés contenant l'ID de l'entreprise
     * @param companyId ID de l'entreprise
     */
    invalidateCompany(companyId: string): Promise<void>;
    /**
     * Vérifier si une clé existe dans le cache
     * @param key Clé à vérifier
     * @returns true si la clé existe
     */
    exists(key: string): Promise<boolean>;
    /**
     * Obtenir le TTL (Time To Live) d'une clé
     * @param key Clé à vérifier
     * @returns TTL en secondes, -1 si pas de TTL, -2 si la clé n'existe pas
     */
    getTTL(key: string): Promise<number>;
    /**
     * Vider complètement le cache (à utiliser avec précaution)
     */
    flushAll(): Promise<void>;
}
declare const _default: CacheService;
export default _default;
//# sourceMappingURL=cache.service.d.ts.map