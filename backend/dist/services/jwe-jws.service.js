"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWEJWSService = void 0;
const jose_1 = require("jose");
const logger_1 = __importDefault(require("../utils/logger"));
class JWEJWSService {
    /**
     * Crée un JWE (JSON Web Encryption) avec clé symétrique (API Key + Shared Secret)
     *
     * Algorithme recommandé par Visa:
     * - alg: A256GCMKW (Key Wrapping)
     * - enc: A256GCM (Content Encryption)
     */
    async createJWESymmetric(payload, config) {
        if (!config.sharedSecret || !config.encryptionKeyId) {
            throw new Error('Shared secret and encryption key ID are required for symmetric encryption');
        }
        try {
            // Convertir le shared secret en clé JWK
            const secretKey = await (0, jose_1.importJWK)({
                kty: 'oct',
                k: Buffer.from(config.sharedSecret).toString('base64url'),
            }, 'A256GCMKW');
            // Créer le JWE avec les headers Visa
            const jwe = await new jose_1.EncryptJWT(payload)
                .setProtectedHeader({
                alg: 'A256GCMKW', // Key Wrapping Algorithm
                enc: 'A256GCM', // Content Encryption Algorithm
                kid: config.encryptionKeyId,
                typ: 'JWT',
            })
                .encrypt(secretKey);
            return jwe;
        }
        catch (error) {
            logger_1.default.error('Error creating JWE (symmetric)', {
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`JWE encryption failed: ${error.message}`);
        }
    }
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
    async createJWEAsymmetric(payload, config, encryptionMethod = 'A128GCM') {
        if (!config.visaEncryptionPublicKey || !config.visaEncryptionKeyId) {
            throw new Error('Visa encryption public key and key ID are required for asymmetric encryption');
        }
        try {
            // Importer la clé publique Visa (PEM format)
            const visaPublicKey = await (0, jose_1.importSPKI)(config.visaEncryptionPublicKey, 'RSA-OAEP-256');
            // Convertir le payload en objet si c'est une string
            const payloadObject = typeof payload === 'string'
                ? JSON.parse(payload)
                : payload;
            // Créer le JWE avec les headers Visa Direct MLE
            // Note: Visa utilise iat en millisecondes dans le header JWE (custom param)
            // La bibliothèque jose supporte les custom params dans le header
            const jwe = await new jose_1.EncryptJWT(payloadObject)
                .setProtectedHeader({
                alg: 'RSA-OAEP-256', // Key Encryption Algorithm (MLE)
                enc: encryptionMethod, // Content Encryption Algorithm (A128GCM ou A256GCM)
                kid: config.visaEncryptionKeyId, // Key-ID (doit aussi être dans le header HTTP)
                iat: Date.now(), // Issued at timestamp en millisecondes (selon spécifications Visa)
                typ: 'JWT',
            })
                .encrypt(visaPublicKey);
            return jwe;
        }
        catch (error) {
            logger_1.default.error('Error creating JWE (asymmetric)', {
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`JWE encryption failed: ${error.message}`);
        }
    }
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
    async createVisaDirectMLEPayload(payload, config, encryptionMethod = 'A128GCM') {
        const jwe = await this.createJWEAsymmetric(payload, config, encryptionMethod);
        return { encData: jwe };
    }
    /**
     * Déchiffre un JWE avec clé symétrique
     */
    async decryptJWESymmetric(jwe, config) {
        if (!config.sharedSecret) {
            throw new Error('Shared secret is required for symmetric decryption');
        }
        try {
            const secretKey = await (0, jose_1.importJWK)({
                kty: 'oct',
                k: Buffer.from(config.sharedSecret).toString('base64url'),
            }, 'A256GCMKW');
            const { payload } = await (0, jose_1.jwtDecrypt)(jwe, secretKey);
            return payload;
        }
        catch (error) {
            logger_1.default.error('Error decrypting JWE (symmetric)', {
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`JWE decryption failed: ${error.message}`);
        }
    }
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
    async decryptJWEAsymmetric(jweOrResponse, config) {
        if (!config.clientEncryptionPrivateKey) {
            throw new Error('Client encryption private key is required for asymmetric decryption');
        }
        try {
            // Extraire le JWE string si c'est un objet avec encData
            const jweString = typeof jweOrResponse === 'string'
                ? jweOrResponse
                : jweOrResponse.encData;
            // Importer la clé privée client (PEM format)
            const clientPrivateKey = await (0, jose_1.importPKCS8)(config.clientEncryptionPrivateKey, 'RSA-OAEP-256');
            const { payload } = await (0, jose_1.jwtDecrypt)(jweString, clientPrivateKey);
            // Essayer de parser comme JSON si c'est une string
            if (typeof payload === 'string') {
                try {
                    return JSON.parse(payload);
                }
                catch {
                    return payload;
                }
            }
            return payload;
        }
        catch (error) {
            logger_1.default.error('Error decrypting JWE (asymmetric)', {
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`JWE decryption failed: ${error.message}`);
        }
    }
    /**
     * Crée un JWS (JSON Web Signature) avec clé symétrique
     *
     * Algorithme recommandé par Visa: HS256
     */
    async createJWSSymmetric(payload, config) {
        if (!config.sharedSecret || !config.signingKeyId) {
            throw new Error('Shared secret and signing key ID are required for symmetric signing');
        }
        try {
            const secretKey = await (0, jose_1.importJWK)({
                kty: 'oct',
                k: Buffer.from(config.sharedSecret).toString('base64url'),
            }, 'HS256');
            const jws = await new jose_1.SignJWT(payload)
                .setProtectedHeader({
                alg: 'HS256',
                kid: config.signingKeyId,
                typ: 'JWT',
            })
                .sign(secretKey);
            return jws;
        }
        catch (error) {
            logger_1.default.error('Error creating JWS (symmetric)', {
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`JWS signing failed: ${error.message}`);
        }
    }
    /**
     * Crée un JWS (JSON Web Signature) avec RSA PKI
     *
     * Algorithme recommandé par Visa: PS256
     *
     * Pour les requêtes inbound (Client → Visa):
     * - Utiliser la clé privée client pour signer
     * - kid doit être le Client Signing Certificate ID
     */
    async createJWSAsymmetric(payload, config) {
        if (!config.clientSigningPrivateKey || !config.clientSigningKeyId) {
            throw new Error('Client signing private key and key ID are required for asymmetric signing');
        }
        try {
            // Importer la clé privée client (PEM format)
            const clientPrivateKey = await (0, jose_1.importPKCS8)(config.clientSigningPrivateKey, 'PS256');
            const jws = await new jose_1.SignJWT(payload)
                .setProtectedHeader({
                alg: 'PS256',
                kid: config.clientSigningKeyId,
                typ: 'JWT',
                cty: 'JWE', // Si on signe un JWE
            })
                .sign(clientPrivateKey);
            return jws;
        }
        catch (error) {
            logger_1.default.error('Error creating JWS (asymmetric)', {
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`JWS signing failed: ${error.message}`);
        }
    }
    /**
     * Vérifie un JWS avec clé symétrique
     */
    async verifyJWSSymmetric(jws, config) {
        if (!config.sharedSecret) {
            throw new Error('Shared secret is required for symmetric verification');
        }
        try {
            const secretKey = await (0, jose_1.importJWK)({
                kty: 'oct',
                k: Buffer.from(config.sharedSecret).toString('base64url'),
            }, 'HS256');
            const { payload } = await (0, jose_1.jwtVerify)(jws, secretKey);
            return payload;
        }
        catch (error) {
            logger_1.default.error('Error verifying JWS (symmetric)', {
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`JWS verification failed: ${error.message}`);
        }
    }
    /**
     * Vérifie un JWS avec RSA PKI (clé publique Visa)
     *
     * Pour les réponses outbound (Visa → Client):
     * - Utiliser la clé publique Visa pour vérifier
     * - kid doit être le Visa Signing Certificate ID (généralement "715EA257")
     */
    async verifyJWSAsymmetric(jws, config) {
        if (!config.visaSigningPublicKey) {
            throw new Error('Visa signing public key is required for asymmetric verification');
        }
        try {
            // Importer la clé publique Visa (PEM format)
            const visaPublicKey = await (0, jose_1.importSPKI)(config.visaSigningPublicKey, 'PS256');
            const { payload } = await (0, jose_1.jwtVerify)(jws, visaPublicKey);
            return payload;
        }
        catch (error) {
            logger_1.default.error('Error verifying JWS (asymmetric)', {
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`JWS verification failed: ${error.message}`);
        }
    }
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
    async createSignedJWE(payload, encryptionConfig, signingConfig, useAsymmetric = true) {
        try {
            // 1. Créer le JWE
            let jwe;
            if (useAsymmetric) {
                jwe = await this.createJWEAsymmetric(payload, encryptionConfig);
            }
            else {
                jwe = await this.createJWESymmetric(payload, encryptionConfig);
            }
            // 2. Signer le JWE avec JWS
            let signedJWE;
            if (useAsymmetric) {
                signedJWE = await this.createJWSAsymmetric({ jwe }, signingConfig);
            }
            else {
                signedJWE = await this.createJWSSymmetric({ jwe }, signingConfig);
            }
            return signedJWE;
        }
        catch (error) {
            logger_1.default.error('Error creating signed JWE', {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Vérifie et déchiffre un JWE signé
     *
     * Pour les réponses outbound (Visa → Client):
     * 1. Vérifier la signature JWS avec la clé publique Visa
     * 2. Déchiffrer le JWE avec la clé privée client
     */
    async verifyAndDecryptSignedJWE(signedJWE, encryptionConfig, signingConfig, useAsymmetric = true) {
        try {
            // 1. Vérifier la signature JWS
            let verifiedPayload;
            if (useAsymmetric) {
                verifiedPayload = await this.verifyJWSAsymmetric(signedJWE, signingConfig);
            }
            else {
                verifiedPayload = await this.verifyJWSSymmetric(signedJWE, signingConfig);
            }
            // 2. Extraire le JWE du payload
            const jwe = verifiedPayload.jwe || verifiedPayload;
            if (typeof jwe !== 'string') {
                throw new Error('Invalid signed JWE format: JWE not found in payload');
            }
            // 3. Déchiffrer le JWE
            let decryptedPayload;
            if (useAsymmetric) {
                decryptedPayload = await this.decryptJWEAsymmetric(jwe, encryptionConfig);
            }
            else {
                decryptedPayload = await this.decryptJWESymmetric(jwe, encryptionConfig);
            }
            return decryptedPayload;
        }
        catch (error) {
            logger_1.default.error('Error verifying and decrypting signed JWE', {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
}
exports.JWEJWSService = JWEJWSService;
exports.default = new JWEJWSService();
//# sourceMappingURL=jwe-jws.service.js.map