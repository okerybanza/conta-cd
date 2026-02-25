"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeavePolicyController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const leavePolicy_service_1 = __importDefault(require("../services/leavePolicy.service"));
const zod_1 = require("zod");
const createLeavePolicySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    leaveType: zod_1.z.string().min(1),
    daysPerYear: zod_1.z.number().nonnegative(),
    daysPerMonth: zod_1.z.number().nonnegative().optional(),
    maxAccumulation: zod_1.z.number().nonnegative().optional(),
    carryForward: zod_1.z.boolean().optional(),
    requiresApproval: zod_1.z.boolean().optional(),
    minNoticeDays: zod_1.z.number().int().nonnegative().optional(),
    description: zod_1.z.string().optional(),
});
const updateLeavePolicySchema = createLeavePolicySchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
const listLeavePoliciesSchema = zod_1.z.object({
    leaveType: zod_1.z.string().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
});
class LeavePolicyController {
    async create(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const data = createLeavePolicySchema.parse(req.body);
            const policy = await leavePolicy_service_1.default.create((0, auth_middleware_1.getCompanyId)(req), data);
            res.status(201).json(policy);
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
            const policy = await leavePolicy_service_1.default.getById((0, auth_middleware_1.getCompanyId)(req), id);
            res.json(policy);
        }
        catch (error) {
            next(error);
        }
    }
    async getByType(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { type } = req.params;
            const policy = await leavePolicy_service_1.default.getByType((0, auth_middleware_1.getCompanyId)(req), type);
            if (!policy) {
                return res.status(404).json({ message: 'Leave policy not found' });
            }
            res.json(policy);
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const filters = listLeavePoliciesSchema.parse(req.query);
            const result = await leavePolicy_service_1.default.list((0, auth_middleware_1.getCompanyId)(req), filters);
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
            const data = updateLeavePolicySchema.parse(req.body);
            const policy = await leavePolicy_service_1.default.update((0, auth_middleware_1.getCompanyId)(req), id, data);
            res.json(policy);
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
            await leavePolicy_service_1.default.delete((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({ success: true });
        }
        catch (error) {
            next(error);
        }
    }
    async createDefaults(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const policies = await leavePolicy_service_1.default.createDefaultPolicies((0, auth_middleware_1.getCompanyId)(req));
            res.status(201).json(policies);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LeavePolicyController = LeavePolicyController;
exports.default = new LeavePolicyController();
//# sourceMappingURL=leavePolicy.controller.js.map