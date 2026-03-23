
import prisma from '../config/database';
import logger from '../utils/logger';

export class PlatformSettingsService {
    async getSettings() {
        // Obtenir le premier (et normalement unique) enregistrement des paramètres
        const settings = await prisma.platform_settings.findFirst({
            orderBy: { created_at: 'desc' },
        });

        if (!settings) {
            logger.warn('No platform settings found in database, using defaults');
            return null;
        }

        return settings;
    }

    async getPayPalConfig() {
        const settings = await this.getSettings();

        return {
            enabled: settings?.paypal_enabled ?? process.env.PAYPAL_ENABLED === 'true',
            clientId: settings?.paypal_client_id ?? process.env.PAYPAL_CLIENT_ID,
            secretKey: settings?.paypal_secret_key ?? process.env.PAYPAL_SECRET_KEY,
            mode: settings?.paypal_mode ?? (process.env.PAYPAL_MODE || 'sandbox'),
            webhookId: settings?.paypal_webhook_id ?? process.env.PAYPAL_WEBHOOK_ID,
        };
    }

    async getSmtpConfig() {
        const settings = await this.getSettings();

        return {
            host: settings?.smtp_host ?? process.env.SMTP_HOST,
            port: settings?.smtp_port ?? Number(process.env.SMTP_PORT || 587),
            user: settings?.smtp_user ?? process.env.SMTP_USER,
            pass: settings?.smtp_pass ?? process.env.SMTP_PASS,
            from: settings?.smtp_from ?? process.env.SMTP_FROM,
            secure: settings?.smtp_secure ?? process.env.SMTP_SECURE === 'true',
        };
    }
}

export default new PlatformSettingsService();
