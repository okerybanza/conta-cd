"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevocationService = void 0;
const redis_1 = __importDefault(require("../../config/redis"));
const logger_1 = __importDefault(require("../../utils/logger"));
class RevocationService {
    PREFIX = 'token:revoked:';
    /**
     * Blackliste un token via son JTI
     * @param jti Identifiant unique du JWT
     * @param ttlSeconds Durée de vie restante du token en secondes
     */
    async revoke(jti, ttlSeconds) {
        try {
            if (redis_1.default.status === 'end' || redis_1.default.status === 'close') {
                logger_1.default.warn('Redis unavailable, revocation might fail');
                return;
            }
            const key = `${this.PREFIX}${jti}`;
            await redis_1.default.setex(key, ttlSeconds, 'true');
            logger_1.default.info(`Token revoked centrally: ${jti}`);
        }
        catch (error) {
            logger_1.default.error('Error revoking token', { jti, error: error.message });
        }
    }
    /**
     * Vérifie si un token est révoqué
     * @param jti Identifiant unique du JWT
     */
    async isRevoked(jti) {
        try {
            if (redis_1.default.status === 'end' || redis_1.default.status === 'close') {
                return false; // Par défaut, on laisse passer si Redis est HS
            }
            const key = `${this.PREFIX}${jti}`;
            const result = await redis_1.default.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.default.error('Error checking token revocation', { jti, error: error.message });
            return false;
        }
    }
}
exports.RevocationService = RevocationService;
exports.default = new RevocationService();
//# sourceMappingURL=revocation.service.js.map