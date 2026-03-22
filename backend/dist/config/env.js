"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Charger les variables d'environnement
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
exports.default = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3001,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || 'secret',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    // Durée de vie du access token (courte pour limiter l'impact en cas de vol)
    // Recommandation: 15 minutes
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    // Durée de vie du refresh token (session globale)
    // Recommandation: 7 jours
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS || '10',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    // DEV : autoriser localhost + frontend sur le serveur (IP et hostname, ports 5173 et 5174)
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://185.250.37.250:5173,http://185.250.37.250:5174,http://vmi2977479.contaboserver.net:5173,http://vmi2977479.contaboserver.net:5174',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    // SPRINT 5: Production Infrastructure
    DATABASE_READ_URL: process.env.DATABASE_READ_URL,
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    // External APIs
    BCC_API_URL: process.env.BCC_API_URL || 'https://www.bcc.cd/api/v1/rates',
    WHATSAPP_API_URL: process.env.WHATSAPP_API_URL,
    WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
    // Notification Settings
    SMTP_HOST: process.env.SMTP_HOST || 'localhost',
    SMTP_PORT: process.env.SMTP_PORT || '587',
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM || 'noreply@conta.cd',
    SMTP_NOTIF_FROM: process.env.SMTP_NOTIF_FROM || process.env.SMTP_FROM || 'noreply@conta.cd',
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@conta.cd',
    // Upload settings
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILE_SIZE: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB par défaut
    // OAuth (connexion Gmail, Apple, Microsoft)
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
    APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
    APPLE_KEY_ID: process.env.APPLE_KEY_ID,
    APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY,
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
    MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID || 'common',
};
//# sourceMappingURL=env.js.map