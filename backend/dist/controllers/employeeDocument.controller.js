"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeDocumentController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const employeeDocument_service_1 = __importDefault(require("../services/employeeDocument.service"));
const zod_1 = require("zod");
const createEmployeeDocumentSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid(),
    documentType: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    fileId: zod_1.z.string().uuid(),
    expiryDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    notes: zod_1.z.string().optional(),
});
const updateEmployeeDocumentSchema = zod_1.z.object({
    documentType: zod_1.z.string().min(1).optional(),
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    fileId: zod_1.z.string().uuid().optional(),
    expiryDate: zod_1.z.string().or(zod_1.z.date()).nullable().optional(),
    notes: zod_1.z.string().optional(),
});
const listEmployeeDocumentsSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid().optional(),
    documentType: zod_1.z.string().optional(),
    isExpired: zod_1.z.coerce.boolean().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(1000).optional(),
});
class EmployeeDocumentController {
    async create(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const data = createEmployeeDocumentSchema.parse(req.body);
            const document = await employeeDocument_service_1.default.create((0, auth_middleware_1.getCompanyId)(req), data);
            res.status(201).json(document);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const document = await employeeDocument_service_1.default.getById((0, auth_middleware_1.getCompanyId)(req), id);
            res.json(document);
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const filters = listEmployeeDocumentsSchema.parse(req.query);
            const result = await employeeDocument_service_1.default.list((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const data = updateEmployeeDocumentSchema.parse(req.body);
            const document = await employeeDocument_service_1.default.update((0, auth_middleware_1.getCompanyId)(req), id, data);
            res.json(document);
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            await employeeDocument_service_1.default.delete((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({ success: true });
        }
        catch (error) {
            next(error);
        }
    }
    async getExpiring(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const daysBeforeExpiry = req.query.days
                ? parseInt(req.query.days, 10)
                : 30;
            const documents = await employeeDocument_service_1.default.getExpiringDocuments((0, auth_middleware_1.getCompanyId)(req), daysBeforeExpiry);
            res.json(documents);
        }
        catch (error) {
            next(error);
        }
    }
    async getExpired(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const documents = await employeeDocument_service_1.default.getExpiredDocuments((0, auth_middleware_1.getCompanyId)(req));
            res.json(documents);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.EmployeeDocumentController = EmployeeDocumentController;
exports.default = new EmployeeDocumentController();
//# sourceMappingURL=employeeDocument.controller.js.map