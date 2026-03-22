/**
 * Service JWE/JWS pour Visa Developer Platform
 *
 * Implémente JSON Web Encryption (JWE) et JSON Web Signature (JWS)
 * selon les spécifications Visa :
 * - JWE-JWS User Guide v1.0.1
 * - Message Level Encryption (MLE) Guide
 *
 * Supporte:
 * - Symmetric Encryption (API Key + Shared Secret): A256GCMKW + A256GCM
 * - Asymmetric Encryption (RSA PKI): RSA-OAEP-256 + A128GCM/A256GCM (MLE)
 * - Symmetric Signing: HS256
 * - Asymmetric Signing: PS256
 *
 * Note: Visa Direct utilise MLE (Message Level Encryption) avec:
 * - alg: RSA-OAEP-256
 * - enc: A128GCM ou A256GCM
 * - kid: Key-ID (dans le header HTTP)
 * - iat: Timestamp en millisecondes (valide 2 minutes)
 */
export interface JWEHeader {
    alg: string;
    enc: string;
    kid?: string;
    typ?: string;
    cty?: string;
}
export interface JWSHeader {
    alg: string;
    kid?: string;
    typ?: string;
    cty?: string;
}
export interface VisaEncryptionConfig {
    apiKey?: string;
    sharedSecret?: string;
    encryptionKeyId?: string;
    visaEncryptionPublicKey?: string;
    visaEncryptionKeyId?: string;
    clientEncryptionPrivateKey?: string;
    clientEncryptionKeyId?: string;
}
export interface VisaSigningConfig {
    sharedSecret?: string;
    signingKeyId?: string;
    clientSigningPrivateKey?: string;
    clientSigningKeyId?: string;
    visaSigningPublicKey?: string;
    visaSigningKeyId?: string;
}
export declare class JWEJWSService {
    /**
     * Crée un JWE (JSON Web Encryption) avec clé symétrique (API Key + Shared Secret)
     *
     * Algorithme recommandé par Visa:
     * - alg: A256GCMKW (Key Wrapping)
     * - enc: A256GCM (Content Encryption)
     */
    createJWESymmetric(payload: any, config: VisaEncryptionConfig): Promise<string>;
    /**
     * Crée un JWE (JSON Web Encryption) avec RSA PKI (Asymmetric)
     *
     * Algorithme utilisé par Visa Direct MLE:
     * - alg: RSA-OAEP-256 (Key Encryption)
     * - enc: A128GCM ou A256GCM (Content Encryption)
     * - kid: Key-ID (doit être dans le header HTTP aussi)
     * - iat: Timestamp en millisecondes (valide 2 minutes)
     *
     * Note: Le payload doit être un objet JSON qui sera sérialisé
     */
    createJWEAsymmetric(payload: any, config: VisaEncryptionConfig, encryptionMethod?: 'A128GCM' | 'A256GCM'): Promise<string>;
    /**
     * Crée un payload JWE pour Visa Direct MLE
     *
     * Format requis par Visa Direct:
     * {
     *   "encData": "<JWE string>"
     * }
     *
     * Le JWE doit avoir:
     * - alg: RSA-OAEP-256
     * - enc: A128GCM ou A256GCM
     * - kid: Key-ID
     * - iat: Timestamp en millisecondes
     */
    createVisaDirectMLEPayload(payload: any, config: VisaEncryptionConfig, encryptionMethod?: 'A128GCM' | 'A256GCM'): Promise<{
        encData: string;
    }>;
    /**
     * Déchiffre un JWE avec clé symétrique
     */
    decryptJWESymmetric(jwe: string, config: VisaEncryptionConfig): Promise<any>;
    /**
     * Déchiffre un JWE avec RSA PKI (clé privée client)
     *
     * Pour Visa Direct MLE, la réponse peut être au format:
     * {
     *   "encData": "<JWE string>"
     * }
     *
     * Ou directement le JWE string
     */
    decryptJWEAsymmetric(jweOrResponse: string | {
        encData: string;
    }, config: VisaEncryptionConfig): Promise<any>;
    /**
     * Crée un JWS (JSON Web Signature) avec clé symétrique
     *
     * Algorithme recommandé par Visa: HS256
     */
    createJWSSymmetric(payload: any, config: VisaSigningConfig): Promise<string>;
    /**
     * Crée un JWS (JSON Web Signature) avec RSA PKI
     *
     * Algorithme recommandé par Visa: PS256
     *
     * Pour les requêtes inbound (Client → Visa):
     * - Utiliser la clé privée client pour signer
     * - kid doit être le Client Signing Certificate ID
     */
    createJWSAsymmetric(payload: any, config: VisaSigningConfig): Promise<string>;
    /**
     * Vérifie un JWS avec clé symétrique
     */
    verifyJWSSymmetric(jws: string, config: VisaSigningConfig): Promise<any>;
    /**
     * Vérifie un JWS avec RSA PKI (clé publique Visa)
     *
     * Pour les réponses outbound (Visa → Client):
     * - Utiliser la clé publique Visa pour vérifier
     * - kid doit être le Visa Signing Certificate ID (généralement "715EA257")
     */
    verifyJWSAsymmetric(jws: string, config: VisaSigningConfig): Promise<any>;
    /**
     * Crée un JWE signé (JWS sur JWE) - Pattern recommandé par Visa
     *
     * 1. Créer le JWE avec les données sensibles
     * 2. Signer le JWE avec JWS
     *
     * Pour les requêtes inbound (Client → Visa):
     * - JWE: Chiffrer avec la clé publique Visa (RSA-OAEP-256 + A256GCM)
     * - JWS: Signer avec la clé privée client (PS256)
     */
    createSignedJWE(payload: any, encryptionConfig: VisaEncryptionConfig, signingConfig: VisaSigningConfig, useAsymmetric?: boolean): Promise<string>;
    /**
     * Vérifie et déchiffre un JWE signé
     *
     * Pour les réponses outbound (Visa → Client):
     * 1. Vérifier la signature JWS avec la clé publique Visa
     * 2. Déchiffrer le JWE avec la clé privée client
     */
    verifyAndDecryptSignedJWE(signedJWE: string, encryptionConfig: VisaEncryptionConfig, signingConfig: VisaSigningConfig, useAsymmetric?: boolean): Promise<any>;
}
declare const _default: JWEJWSService;
export default _default;
//# sourceMappingURL=jwe-jws.service.d.ts.map