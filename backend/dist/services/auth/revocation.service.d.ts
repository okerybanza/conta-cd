export declare class RevocationService {
    private readonly PREFIX;
    /**
     * Blackliste un token via son JTI
     * @param jti Identifiant unique du JWT
     * @param ttlSeconds Durée de vie restante du token en secondes
     */
    revoke(jti: string, ttlSeconds: number): Promise<void>;
    /**
     * Vérifie si un token est révoqué
     * @param jti Identifiant unique du JWT
     */
    isRevoked(jti: string): Promise<boolean>;
}
declare const _default: RevocationService;
export default _default;
//# sourceMappingURL=revocation.service.d.ts.map