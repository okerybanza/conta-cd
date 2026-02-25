"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
const branding_1 = require("../utils/branding");
class EmailService {
    transporter = null;
    templatesPath;
    constructor() {
        // En développement, __dirname pointe vers src/services
        // En production, __dirname pointe vers dist/services
        // On cherche toujours dans src/templates/emails
        const isProduction = __dirname.includes('dist');
        if (isProduction) {
            // En production, aller chercher dans src depuis dist
            this.templatesPath = path_1.default.join(__dirname, '../../src/templates/emails');
        }
        else {
            // En développement, chercher dans src/templates/emails
            this.templatesPath = path_1.default.join(__dirname, '../templates/emails');
        }
        this.initializeTransporter();
    }
    // Initialiser le transporteur SMTP
    initializeTransporter() {
        // Pour localhost/Postfix, l'authentification n'est pas toujours nécessaire
        const needsAuth = process.env.SMTP_USER && process.env.SMTP_PASS;
        if (!process.env.SMTP_HOST) {
            logger_1.default.warn('SMTP_HOST not configured, email service will be disabled');
            return;
        }
        try {
            const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
            const isSecure = smtpPort === 465 || process.env.SMTP_SECURE === 'true';
            const isLocalhost = process.env.SMTP_HOST === 'localhost' || process.env.SMTP_HOST === '127.0.0.1';
            const transportConfig = {
                host: process.env.SMTP_HOST,
                port: smtpPort,
                secure: isSecure,
                tls: {
                    // Pour localhost, ne pas rejeter les certificats auto-signés
                    rejectUnauthorized: !isLocalhost && process.env.NODE_ENV === 'production',
                },
            };
            // Ajouter l'authentification seulement si nécessaire
            if (needsAuth) {
                transportConfig.auth = {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                };
            }
            // Require TLS pour le port 587 (sauf localhost)
            if (!isSecure && smtpPort === 587 && !isLocalhost) {
                transportConfig.requireTLS = true;
            }
            this.transporter = nodemailer_1.default.createTransport(transportConfig);
            logger_1.default.info('Email transporter initialized', {
                host: process.env.SMTP_HOST,
                port: smtpPort,
                secure: isSecure,
                auth: needsAuth ? 'enabled' : 'disabled (local relay)',
            });
        }
        catch (error) {
            logger_1.default.error('Error initializing email transporter', { error });
        }
    }
    // Charger un template email
    loadTemplate(templateName) {
        const templateFile = path_1.default.join(this.templatesPath, `${templateName}.html`);
        if (!fs_1.default.existsSync(templateFile)) {
            logger_1.default.warn(`Email template not found: ${templateName}, using default`);
            // Template par défaut simple
            return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0D3B66; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{{subject}}</h1>
            </div>
            <div class="content">
              {{content}}
            </div>
            <div class="footer">
              <p>Conta - Application de Facturation</p>
            </div>
          </div>
        </body>
        </html>
      `;
        }
        return fs_1.default.readFileSync(templateFile, 'utf8');
    }
    // Compiler un template avec Handlebars
    compileTemplate(templateName, data) {
        const templateSource = this.loadTemplate(templateName);
        const template = handlebars_1.default.compile(templateSource);
        return template(data);
    }
    // Envoyer un email
    async sendEmail(emailData) {
        if (!this.transporter) {
            logger_1.default.warn('Email transporter not initialized, cannot send email');
            return false;
        }
        try {
            // Déterminer quel logo utiliser (ne pas faire échouer l'envoi si le branding échoue)
            let emailLogoUrl = null;
            try {
                emailLogoUrl = await (0, branding_1.getEmailLogoUrl)();
            }
            catch (logoErr) {
                logger_1.default.warn('getEmailLogoUrl failed, continuing without logo', { error: logoErr?.message });
            }
            const companyLogo = emailData.data.companyLogo;
            const templateData = {
                ...emailData.data,
                // Logo de l'entreprise pour les emails de factures/paiements (avec fallback vers logo Conta)
                companyLogo: companyLogo || emailLogoUrl || emailData.data.companyLogo,
                // Logo de la plateforme Conta pour les emails système
                platformLogo: emailLogoUrl || emailData.data.platformLogo,
            };
            // Compiler le template
            const html = this.compileTemplate(emailData.template, templateData);
            // Logger pour debug (premiers 500 caractères seulement)
            logger_1.default.debug('Email template compiled', {
                template: emailData.template,
                dataKeys: Object.keys(templateData),
                htmlLength: html.length,
                hasResetUrl: emailData.data.resetUrl ? 'yes' : 'no',
                preview: html.substring(0, 200).replace(/\s+/g, ' '),
            });
            // Préparer les options d'envoi
            const fromAddress = emailData.from || process.env.SMTP_FROM || process.env.SMTP_USER;
            const mailOptions = {
                from: fromAddress,
                to: emailData.to,
                subject: emailData.subject,
                html,
                attachments: emailData.attachments,
            };
            // Envoyer l'email
            const info = await this.transporter.sendMail(mailOptions);
            logger_1.default.info('Email sent successfully', {
                to: emailData.to,
                subject: emailData.subject,
                messageId: info.messageId,
            });
            return true;
        }
        catch (error) {
            logger_1.default.error('Error sending email', {
                to: emailData.to,
                subject: emailData.subject,
                error: error.message,
            });
            throw error;
        }
    }
    // Tester la connexion SMTP
    async testConnection() {
        if (!this.transporter) {
            return false;
        }
        try {
            await this.transporter.verify();
            logger_1.default.info('SMTP connection verified');
            return true;
        }
        catch (error) {
            logger_1.default.error('SMTP connection failed', { error: error.message });
            return false;
        }
    }
}
exports.EmailService = EmailService;
exports.default = new EmailService();
//# sourceMappingURL=email.service.js.map