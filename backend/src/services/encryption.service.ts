import crypto from 'crypto';
import logger from '../utils/logger';

// Clé de chiffrement (devrait être dans les variables d'environnement)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

export class EncryptionService {
  // Générer une clé de chiffrement
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Chiffrer une valeur
  encrypt(value: string, key?: string): string {
    try {
      const encryptionKey = key || ENCRYPTION_KEY;
      const keyBuffer = Buffer.from(encryptionKey, 'hex');

      // Générer IV
      const iv = crypto.randomBytes(IV_LENGTH);

      // Créer le cipher
      const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

      // Chiffrer
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Obtenir l'authentification tag
      const tag = cipher.getAuthTag();

      // Combiner IV + tag + encrypted
      const result = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;

      return result;
    } catch (error: any) {
      logger.error('Error encrypting value', { error: error.message });
      throw new Error('Encryption failed');
    }
  }

  // Déchiffrer une valeur
  decrypt(encryptedValue: string, key?: string): string {
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
      const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
      decipher.setAuthTag(tag);

      // Déchiffrer
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: any) {
      logger.error('Error decrypting value', { error: error.message });
      throw new Error('Decryption failed');
    }
  }

  // Chiffrer un objet
  encryptObject(obj: Record<string, any>, fieldsToEncrypt: string[], key?: string): Record<string, any> {
    const encrypted = { ...obj };

    for (const field of fieldsToEncrypt) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        try {
          encrypted[field] = this.encrypt(encrypted[field], key);
        } catch (error) {
          logger.error(`Error encrypting field ${field}`, { error });
          // Garder la valeur originale si le chiffrement échoue
        }
      }
    }

    return encrypted;
  }

  // Déchiffrer un objet
  decryptObject(obj: Record<string, any>, fieldsToDecrypt: string[], key?: string): Record<string, any> {
    const decrypted = { ...obj };

    for (const field of fieldsToDecrypt) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = this.decrypt(decrypted[field], key);
        } catch (error) {
          logger.error(`Error decrypting field ${field}`, { error });
          // Garder la valeur chiffrée si le déchiffrement échoue
        }
      }
    }

    return decrypted;
  }

  // Vérifier si une valeur est chiffrée
  isEncrypted(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // Format: iv:tag:encrypted (3 parties séparées par :)
    const parts = value.split(':');
    return parts.length === 3 && parts.every((part) => /^[0-9a-f]+$/i.test(part));
  }

  // Hash une valeur (pour comparaison sans déchiffrer)
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}

export default new EncryptionService();

