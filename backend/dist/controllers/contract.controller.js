"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractController = void 0;
const contract_service_1 = __importDefault(require("../services/contract.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const zod_1 = require("zod");
// Schémas de validation
const createContractSchema = zod_1.z.object({
    companyId: zod_1.z.string().uuid(),
    accountantId: zod_1.z.string().uuid(),
    type: zod_1.z.string().optional(),
    title: zod_1.z.string().min(1, 'Title is required'),
    content: zod_1.z.string().optional(),
    templateId: zod_1.z.string().optional(),
    fileUrl: zod_1.z.string().url().optional(),
    startDate: zod_1.z.coerce.date().optional(),
    endDate: zod_1.z.coerce.date().optional(),
});
const updateContractSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
    templateId: zod_1.z.string().optional(),
    fileUrl: zod_1.z.string().url().optional(),
    status: zod_1.z.enum(['draft', 'pending', 'signed', 'expired', 'cancelled']).optional(),
    startDate: zod_1.z.coerce.date().optional(),
    endDate: zod_1.z.coerce.date().optional(),
});
const signContractSchema = zod_1.z.object({
    signature: zod_1.z.string().min(1, 'Signature is required'),
});
class ContractController {
    /**
     * POST /api/v1/contracts
     * Créer un contrat
     */
    async create(req, res, next) {
        try {
            const data = createContractSchema.parse(req.body);
            const contract = await contract_service_1.default.create(data);
            res.status(201).json({
                success: true,
                data: contract,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/contracts/:id
     * Obtenir un contrat
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || undefined;
            const accountantId = req.user?.id || undefined;
            const contract = await contract_service_1.default.getById(id, companyId, accountantId);
            res.json({
                success: true,
                data: contract,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/contracts
     * Lister les contrats
     */
    async list(req, res, next) {
        try {
            const filters = {
                companyId: req.query.companyId,
                accountantId: req.query.accountantId,
                status: req.query.status,
                type: req.query.type,
            };
            // Si l'utilisateur a une entreprise, filtrer par défaut
            if (req.user?.companyId && !filters.companyId) {
                filters.companyId = req.user.companyId;
            }
            // Si l'utilisateur est un expert, filtrer par défaut
            if (req.user?.id && !filters.accountantId && req.user.companyId === null) {
                filters.accountantId = req.user.id;
            }
            const contracts = await contract_service_1.default.list(filters);
            res.json({
                success: true,
                data: contracts,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/contracts/:id
     * Mettre à jour un contrat
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = updateContractSchema.parse(req.body);
            const companyId = req.user?.companyId || undefined;
            const accountantId = req.user?.id || undefined;
            const contract = await contract_service_1.default.update(id, data, companyId, accountantId);
            res.json({
                success: true,
                data: contract,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/contracts/:id/sign/company
     * Signer un contrat (par l'entreprise)
     */
    async signByCompany(req, res, next) {
        try {
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const data = signContractSchema.parse(req.body);
            const contract = await contract_service_1.default.signByCompany(id, {
                ...data,
                signedBy: req.user.id,
            });
            res.json({
                success: true,
                data: contract,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/contracts/:id/sign/accountant
     * Signer un contrat (par l'expert)
     */
    async signByAccountant(req, res, next) {
        try {
            const { id } = req.params;
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated');
            }
            const data = signContractSchema.parse(req.body);
            const contract = await contract_service_1.default.signByAccountant(id, {
                ...data,
                signedBy: req.user.id,
            });
            res.json({
                success: true,
                data: contract,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/contracts/:id
     * Annuler un contrat
     */
    async cancel(req, res, next) {
        try {
            const { id } = req.params;
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated');
            }
            const companyId = req.user?.companyId || undefined;
            const accountantId = req.user?.id || undefined;
            const contract = await contract_service_1.default.cancel(id, req.user.id, companyId, accountantId);
            res.json({
                success: true,
                data: contract,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/contracts/templates
     * Obtenir les templates de contrats
     */
    async getTemplates(req, res, next) {
        try {
            const templates = await contract_service_1.default.getTemplates();
            res.json({
                success: true,
                data: templates,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ContractController = ContractController;
exports.default = new ContractController();
//# sourceMappingURL=contract.controller.js.map