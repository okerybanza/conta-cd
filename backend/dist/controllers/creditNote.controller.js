"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditNoteController = void 0;
const zod_1 = require("zod");
const creditNote_service_1 = __importDefault(require("../services/creditNote.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
// Fonction helper pour nettoyer les valeurs (convertir chaînes vides en undefined)
const preprocessEmptyString = (val) => {
    if (val === '' || val === null)
        return undefined;
    return val;
};
// Fonction helper pour préprocesser les données (ne transforme pas les champs requis)
const preprocessData = (data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    // Liste des champs requis qui ne doivent pas être transformés en undefined
    const requiredFields = ['invoiceId', 'amount', 'reason'];
    for (const [key, value] of Object.entries(data)) {
        // Ne pas transformer les champs requis en undefined
        if (requiredFields.includes(key) && value === '') {
            cleaned[key] = value; // Garder la chaîne vide pour que la validation Zod échoue avec un message clair
        }
        else {
            cleaned[key] = preprocessEmptyString(value);
        }
    }
    return cleaned;
};
// Schéma de base pour les avoirs
const baseCreditNoteSchema = zod_1.z.object({
    taxAmount: zod_1.z.number().nonnegative().optional(),
    reference: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    creditNoteDate: zod_1.z.coerce.date().optional(),
    currency: zod_1.z.string().length(3).optional(),
    templateId: zod_1.z.string().optional(),
    footerText: zod_1.z.string().optional(),
    returnStock: zod_1.z.boolean().optional(),
    lines: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().uuid().optional(),
        description: zod_1.z.string().min(1, 'Description requise'),
        quantity: zod_1.z.number().positive('Quantité invalide'),
        unitPrice: zod_1.z.number().nonnegative('Prix unitaire invalide'),
        taxRate: zod_1.z.number().nonnegative('TVA invalide').optional(),
    })).optional(),
}).passthrough();
// Schémas de validation
const createCreditNoteSchema = zod_1.z.preprocess(preprocessData, baseCreditNoteSchema.extend({
    invoiceId: zod_1.z.string().uuid('Invalid invoice ID').min(1, 'Invoice ID is required'), // Requis pour la création
    amount: zod_1.z.number().positive('Amount must be positive'), // Requis pour la création
    reason: zod_1.z.string().min(1, 'Reason is required'), // Requis pour la création
}));
const updateCreditNoteSchema = zod_1.z.preprocess(preprocessData, baseCreditNoteSchema.extend({
    reason: zod_1.z.string().min(1).optional(),
    status: zod_1.z.enum(['draft', 'sent', 'applied', 'cancelled']).optional(),
}));
class CreditNoteController {
    /**
     * Créer un avoir
     */
    async create(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const userId = req.user.id;
            const validatedData = createCreditNoteSchema.parse(req.body);
            const creditNote = await creditNote_service_1.default.create(companyId, userId, validatedData);
            res.status(201).json({
                success: true,
                data: creditNote,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtenir un avoir par ID
     */
    async getById(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const { id } = req.params;
            const creditNote = await creditNote_service_1.default.getById(companyId, id);
            res.json({
                success: true,
                data: creditNote,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Lister les avoirs
     */
    async list(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const filters = {
                invoiceId: req.query.invoiceId,
                status: req.query.status,
                search: req.query.search,
                page: req.query.page ? parseInt(req.query.page, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
            };
            const result = await creditNote_service_1.default.list(companyId, filters);
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Mettre à jour un avoir
     */
    async update(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const userId = req.user.id;
            const { id } = req.params;
            const validatedData = updateCreditNoteSchema.parse(req.body);
            const creditNote = await creditNote_service_1.default.update(companyId, id, userId, validatedData);
            res.json({
                success: true,
                data: creditNote,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Supprimer un avoir
     */
    async delete(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const { id } = req.params;
            await creditNote_service_1.default.delete(companyId, id);
            res.json({
                success: true,
                message: 'Credit note deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Appliquer un avoir à une facture
     */
    async apply(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const userId = req.user.id;
            const { id } = req.params;
            const creditNote = await creditNote_service_1.default.applyCreditNote(companyId, id, userId);
            res.json({
                success: true,
                data: creditNote,
                message: 'Credit note applied successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CreditNoteController = CreditNoteController;
exports.default = new CreditNoteController();
//# sourceMappingURL=creditNote.controller.js.map