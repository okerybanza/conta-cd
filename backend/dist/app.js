"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_middleware_1 = require("./middleware/error.middleware");
const readonly_middleware_1 = require("./middleware/readonly.middleware");
const env_1 = __importDefault(require("./config/env"));
const logger_1 = __importDefault(require("./utils/logger"));
const events_1 = require("./events");
// Import des routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const quotation_routes_1 = __importDefault(require("./routes/quotation.routes"));
const creditNote_routes_1 = __importDefault(require("./routes/creditNote.routes"));
const expense_routes_1 = __importDefault(require("./routes/expense.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const account_routes_1 = __importDefault(require("./routes/account.routes"));
const journalEntry_routes_1 = __importDefault(require("./routes/journalEntry.routes"));
const reporting_routes_1 = __importDefault(require("./routes/reporting.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const accountant_routes_1 = __importDefault(require("./routes/accountant.routes"));
const contract_routes_1 = __importDefault(require("./routes/contract.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const recurringInvoice_routes_1 = __importDefault(require("./routes/recurringInvoice.routes"));
const accountingReports_routes_1 = __importDefault(require("./routes/accountingReports.routes"));
const financialStatements_routes_1 = __importDefault(require("./routes/financialStatements.routes"));
const reconciliation_routes_1 = __importDefault(require("./routes/reconciliation.routes"));
const balanceValidation_routes_1 = __importDefault(require("./routes/balanceValidation.routes"));
const agedBalance_routes_1 = __importDefault(require("./routes/agedBalance.routes"));
const fiscalPeriod_routes_1 = __importDefault(require("./routes/fiscalPeriod.routes"));
const tva_routes_1 = __importDefault(require("./routes/tva.routes"));
const bankReconciliation_routes_1 = __importDefault(require("./routes/bankReconciliation.routes"));
const fiscalExport_routes_1 = __importDefault(require("./routes/fiscalExport.routes"));
const depreciation_routes_1 = __importDefault(require("./routes/depreciation.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const approvalWorkflow_routes_1 = __importDefault(require("./routes/approvalWorkflow.routes"));
const support_routes_1 = __importDefault(require("./routes/support.routes"));
const branding_routes_1 = __importDefault(require("./routes/branding.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const hr_routes_1 = __importDefault(require("./routes/hr.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const realtime_routes_1 = __importDefault(require("./routes/realtime.routes"));
const cron_routes_1 = __importDefault(require("./routes/cron.routes"));
const paypal_routes_1 = __importDefault(require("./routes/paypal.routes"));
const datarissage_routes_1 = __importDefault(require("./routes/datarissage.routes"));
const stock_movement_routes_1 = __importDefault(require("./routes/stock-movement.routes"));
const supplier_routes_1 = __importDefault(require("./routes/supplier.routes"));
const package_routes_1 = __importDefault(require("./routes/package.routes"));
const superadmin_routes_1 = __importDefault(require("./routes/superadmin.routes"));
const warehouse_routes_1 = __importDefault(require("./routes/warehouse.routes"));
const account_deletion_routes_1 = __importDefault(require("./routes/account-deletion.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
// Initialiser les handlers d'événements au démarrage
(0, events_1.initializeEventHandlers)();
const app = (0, express_1.default)();
// SPRINT 5 - TASK 5.3 (SCALE-002): Standardized Rate Limiting
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// ⚠️ IMPORTANT :
// On conserve des limiteurs ciblés (login, gros rapports) mais on désactive
// le rate limit global sur toutes les routes `/api/`, car cela perturbait
// fortement l'onboarding (429 sur dashboard, packages, subscription, etc.)
// pour des utilisateurs légitimes derrière la même IP.
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // jusqu'à 50 tentatives de login par 15 minutes et par IP
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // ne compter que les échecs
    message: { success: false, message: 'Too many login attempts, please try again later.' },
});
const reportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Max 20 rapports par 5 minutes
    message: { success: false, message: 'Reporting limit reached, please wait.' },
});
// Trust proxy - Nécessaire pour que Express reconnaisse les requêtes HTTPS via nginx
// Faire confiance au premier proxy (nginx) pour les headers X-Forwarded-*
app.set('trust proxy', 1);
// Middleware de sécurité
app.use((0, helmet_1.default)());
// Configuration CORS sécurisée avec whitelist d'origines
const allowedOrigins = env_1.default.CORS_ORIGIN
    ? env_1.default.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Autoriser les requêtes sans origine (Postman, curl, mobile apps)
        if (!origin)
            return callback(null, true);
        // Vérifier si l'origine est dans la whitelist
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Rejeter les autres origines
        logger_1.default.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
// Parser JSON
app.use(cookie_parser_1.default());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ARCH-012: Exposer explicitement la version d'API
app.use((req, res, next) => {
    if (req.path.startsWith('/api/v1/')) {
        res.setHeader('X-API-Version', 'v1');
    }
    next();
});
// Fichiers statiques (logos, avatars)
const uploadDir = path_1.default.join(process.cwd(), env_1.default.UPLOAD_DIR || 'uploads');
app.use('/uploads', express_1.default.static(uploadDir));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Appliquer les limiteurs ciblés (SPRINT 5)
// Rate limiting ajusté : 50 tentatives par 15 min et par IP (ne compte que les échecs)
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/accounting-reports', reportLimiter);
app.use('/api/v1/financial-statements', reportLimiter);
// Routes API
// ── Mode lecture seule ─────────────────────────────────────────────
// Bloquer les écritures (POST/PUT/PATCH/DELETE) si l'abonnement est
// expiré ou inexistant. Les routes exclues (auth, subscription, admin,
// packages, cron, dashboard, settings, notifications, search, realtime,
// paypal, support, account) ne sont pas concernées.
const readonlyExcludedPrefixes = [
    '/api/v1/auth',
    '/api/v1/subscription',
    '/api/v1/packages',
    '/api/v1/super-admin',
    '/api/v1/admin',
    '/api/v1/cron',
    '/api/v1/dashboard',
    '/api/v1/settings',
    '/api/v1/notifications',
    '/api/v1/search',
    '/api/v1/realtime',
    '/api/v1/paypal',
    '/api/v1/support',
    '/api/v1/account',
    '/api/v1/webhooks',
];
app.use('/api/v1/', (req, res, next) => {
    // Laisser passer les GET (lecture)
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next();
    }
    // Laisser passer les routes exclues
    const fullPath = req.originalUrl || req.url;
    if (readonlyExcludedPrefixes.some((prefix) => fullPath.startsWith(prefix))) {
        return next();
    }
    // Pour les écritures sur les routes métier → vérifier l'abonnement
    return readonly_middleware_1.requireActiveSubscription(req, res, next);
});
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/customers', customer_routes_1.default);
app.use('/api/v1/products', product_routes_1.default);
app.use('/api/v1/invoices', invoice_routes_1.default);
app.use('/api/v1/quotations', quotation_routes_1.default);
app.use('/api/v1/credit-notes', creditNote_routes_1.default);
app.use('/api/v1/expenses', expense_routes_1.default);
app.use('/api/v1/payments', payment_routes_1.default);
app.use('/api/v1/accounts', account_routes_1.default);
app.use('/api/v1/journal-entries', journalEntry_routes_1.default);
app.use('/api/v1/reporting', reporting_routes_1.default);
app.use('/api/v1/settings', settings_routes_1.default);
app.use('/api/v1/subscription', subscription_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/users', user_routes_1.default);
app.use('/api/v1/accountants', accountant_routes_1.default);
app.use('/api/v1/contracts', contract_routes_1.default);
app.use('/api/v1/dashboard', dashboard_routes_1.default);
app.use('/api/v1/recurring-invoices', recurringInvoice_routes_1.default);
app.use('/api/v1/accounting-reports', accountingReports_routes_1.default);
app.use('/api/v1/financial-statements', financialStatements_routes_1.default);
app.use('/api/v1/reconciliation', reconciliation_routes_1.default);
app.use('/api/v1/balance-validation', balanceValidation_routes_1.default);
app.use('/api/v1/aged-balance', agedBalance_routes_1.default);
app.use('/api/v1/fiscal-periods', fiscalPeriod_routes_1.default);
app.use('/api/v1/tva', tva_routes_1.default);
app.use('/api/v1/bank-reconciliation', bankReconciliation_routes_1.default);
app.use('/api/v1/fiscal-export', fiscalExport_routes_1.default);
app.use('/api/v1/depreciations', depreciation_routes_1.default);
app.use('/api/v1/audit', audit_routes_1.default);
app.use('/api/v1/approval-requests', approvalWorkflow_routes_1.default);
app.use('/api/v1/support', support_routes_1.default);
app.use('/api/v1/branding', branding_routes_1.default);
app.use('/api/v1/webhooks', webhook_routes_1.default);
app.use('/api/v1/hr', hr_routes_1.default);
app.use('/api/v1/search', search_routes_1.default);
app.use('/api/v1/realtime', realtime_routes_1.default);
app.use('/api/v1/cron', cron_routes_1.default);
app.use('/api/v1/paypal', paypal_routes_1.default);
app.use('/api/v1/datarissage', datarissage_routes_1.default);
app.use('/api/v1/stock-movements', stock_movement_routes_1.default);
app.use('/api/v1/suppliers', supplier_routes_1.default);
app.use('/api/v1/packages', package_routes_1.default);
app.use('/api/v1/super-admin', superadmin_routes_1.default);
app.use('/api/v1/warehouses', warehouse_routes_1.default);
app.use('/api/v1/account', account_deletion_routes_1.default);
app.use('/api/v1/admin/cache', admin_routes_1.default);
// Middleware de gestion d'erreurs (doit être le dernier)
app.use(error_middleware_1.errorHandler);
// Route 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map