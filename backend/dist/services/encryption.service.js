"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../utils/logger"));
// Clé de chiffrement (devrait être dans les variables d'environnement)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto_1.default.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
class EncryptionService {
    // Générer une clé de chiffrement
    static generateKey() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    // Chiffrer une valeur
    encrypt(value, key) {
        try {
            const encryptionKey = key || ENCRYPTION_KEY;
            const keyBuffer = Buffer.from(encryptionKey, 'hex');
            // Générer IV
            const iv = crypto_1.default.randomBytes(IV_LENGTH);
            // Créer le cipher
            const cipher = crypto_1.default.createCipheriv(ALGORITHM, keyBuffer, iv);
            // Chiffrer
            let encrypted = cipher.update(value, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            // Obtenir l'authentification tag
            const tag = cipher.getAuthTag();
            // Combiner IV + tag + encrypted
            const result = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
            return result;
        }
        catch (error) {
            logger_1.default.error('Error encrypting value', { error: error.message });
            throw new Error('Encryption failed');
        }
    }
    // Déchiffrer une valeur
    decrypt(encryptedValue, key) {
        try {
            const encryptionKey = key || ENCRYPTION_KEY;
            const keyBuffer = Buffer.from(encryptionKey, 'hex');
            // Séparer IV, tag et encrypted
            const parts = encryptedValue.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted value format');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const tag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            // Créer le decipher
            const decipher = crypto_1.default.createDecipheriv(ALGORITHM, keyBuffer, iv);
            decipher.setAuthTag(tag);
            // Déchiffrer
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            logger_1.default.error('Error decrypting value', { error: error.message });
            throw new Error('Decryption failed');
        }
    }
    // Chiffrer un objet
    encryptObject(obj, fieldsToEncrypt, key) {
        const encrypted = { ...obj };
        for (const field of fieldsToEncrypt) {
            if (encrypted[field] && typeof encrypted[field] === 'string') {
                try {
                    encrypted[field] = this.encrypt(encrypted[field], key);
                }
                catch (error) {
                    logger_1.default.error(`Error encrypting field ${field}`, { error });
                    // Garder la valeur originale si le chiffrement échoue
                }
            }
        }
        return encrypted;
    }
    // Déchiffrer un objet
    decryptObject(obj, fieldsToDecrypt, key) {
        const decrypted = { ...obj };
        for (const field of fieldsToDecrypt) {
            if (decrypted[field] && typeof decrypted[field] === 'string') {
                try {
                    decrypted[field] = this.decrypt(decrypted[field], key);
                }
                catch (error) {
                    logger_1.default.error(`Error decrypting field ${field}`, { error });
                    // Garder la valeur chiffrée si le déchiffrement échoue
                }
            }
        }
        return decrypted;
    }
    // Vérifier si une valeur est chiffrée
    isEncrypted(value) {
        if (!value || typeof value !== 'string') {
            return false;
        }
        // Format: iv:tag:encrypted (3 parties séparées par :)
        const parts = value.split(':');
        return parts.length === 3 && parts.every((part) => /^[0-9a-f]+$/i.test(part));
    }
    // Hash une valeur (pour comparaison sans déchiffrer)
    hash(value) {
        return crypto_1.default.createHash('sha256').update(value).digest('hex');
    }
}
exports.EncryptionService = EncryptionService;
exports.default = new EncryptionService();
//# sourceMappingURL=encryption.service.js.map