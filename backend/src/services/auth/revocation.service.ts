import redis from '../../config/redis';
import logger from '../../utils/logger';

export class RevocationService {
    private readonly PREFIX = 'token:revoked:';

    /**
     * Blackliste un token via son JTI
     * @param jti Identifiant unique du JWT
     * @param ttlSeconds Durée de vie restante du token en secondes
     */
    async revoke(jti: string, ttlSeconds: number): Promise<void> {
        try {
            if (redis.status === 'end' || redis.status === 'close') {
                logger.warn('Redis unavailable, revocation might fail');
                return;
            }

            const key = `${this.PREFIX}${jti}`;
            await redis.setex(key, ttlSeconds, 'true');
            logger.info(`Token revoked centrally: ${jti}`);
        } catch (error: any) {
            logger.error('Error revoking token', { jti, error: error.message });
        }
    }

    /**
     * Vérifie si un token est révoqué
     * @param jti Identifiant unique du JWT
     */
    async isRevoked(jti: string): Promise<boolean> {
        try {
            if (redis.status === 'end' || redis.status === 'close') {
                return false; // Par défaut, on laisse passer si Redis est HS
            }

            const key = `${this.PREFIX}${jti}`;
            const result = await redis.exists(key);
            return result === 1;
        } catch (error: any) {
            logger.error('Error checking token revocation', { jti, error: error.message });
            return false;
        }
    }
}

export default new RevocationService();
