"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const customer_service_1 = __importDefault(require("../services/customer.service"));
const zod_1 = require("zod");
// Fonction helper pour nettoyer les valeurs (convertir chaînes vides en undefined)
const preprocessEmptyString = (val) => {
    if (val === '' || val === null)
        return undefined;
    return val;
};
// Fonction helper pour préprocesser les données
const preprocessData = (data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        cleaned[key] = preprocessEmptyString(value);
    }
    return cleaned;
};
// Schéma de base pour les clients
const baseCustomerSchema = zod_1.z.object({
    type: zod_1.z.enum(['particulier', 'entreprise']).optional(),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    businessName: zod_1.z.string().optional(),
    contactPerson: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('').transform(() => undefined)),
    phone: zod_1.z.string().optional(),
    mobile: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    postalCode: zod_1.z.string().optional(),
    nif: zod_1.z.string().optional(),
    rccm: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
}).passthrough();
// Schémas de validation
const createCustomerSchema = zod_1.z.preprocess(preprocessData, baseCustomerSchema.extend({
    type: zod_1.z.enum(['particulier', 'entreprise']), // Requis pour la création
}).refine((data) => {
    if (data.type === 'particulier') {
        return !!(data.firstName && data.lastName);
    }
    if (data.type === 'entreprise') {
        return !!data.businessName;
    }
    return true;
}, {
    message: 'Pour un particulier, prénom et nom sont requis. Pour une entreprise, la raison sociale est requise.',
}));
const updateCustomerSchema = zod_1.z.preprocess(preprocessData, baseCustomerSchema);
const listCustomersSchema = zod_1.z.object({
    type: zod_1.z.enum(['particulier', 'entreprise']).optional(),
    search: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(1000).optional(),
});
class CustomerController {
    // Créer un client
    async create(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const data = createCustomerSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const customer = await customer_service_1.default.create(companyId, data);
            res.status(201).json({
                success: true,
                data: customer,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtenir un client
    async getById(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const customer = await customer_service_1.default.getById(companyId, id);
            res.json({
                success: true,
                data: customer,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Lister les clients
    async list(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = listCustomersSchema.parse(req.query);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const result = await customer_service_1.default.list(companyId, filters);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Mettre à jour un client
    async update(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const data = updateCustomerSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const customer = await customer_service_1.default.update(companyId, id, data);
            res.json({
                success: true,
                data: customer,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Supprimer un client
    async delete(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            await customer_service_1.default.delete(companyId, id);
            res.json({
                success: true,
                message: 'Customer deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Exporter en CSV
    async exportCSV(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = listCustomersSchema.parse(req.query);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const csvContent = await customer_service_1.default.exportToCSV(companyId, filters);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
            res.send(csvContent);
        }
        catch (error) {
            next(error);
        }
    }
    async uploadLogo(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const { id } = req.params;
            if (!req.file) {
                return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'Aucun fichier fourni' } });
            }
            const logoUrl = '/uploads/logos/' + req.file.filename;
            await customer_service_1.default.update(companyId, id, { logo_url: logoUrl });
            res.json({ success: true, data: { logoUrl } });
        } catch (error) {
            next(error);
        }
    }
}
exports.CustomerController = CustomerController;
exports.default = new CustomerController();
//# sourceMappingURL=customer.controller.js.map