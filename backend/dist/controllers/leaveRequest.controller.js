"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequestController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const leaveRequest_service_1 = __importDefault(require("../services/leaveRequest.service"));
const zod_1 = require("zod");
const preprocessEmptyString = (val) => {
    if (val === '' || val === null)
        return undefined;
    return val;
};
const preprocessData = (data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        cleaned[key] = preprocessEmptyString(value);
    }
    return cleaned;
};
const baseLeaveRequestSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid(),
    leaveType: zod_1.z.string().min(1),
    startDate: zod_1.z.string().or(zod_1.z.date()),
    endDate: zod_1.z.string().or(zod_1.z.date()),
    reason: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
const createLeaveRequestSchema = zod_1.z.preprocess(preprocessData, baseLeaveRequestSchema);
const updateLeaveRequestSchema = zod_1.z.preprocess(preprocessData, zod_1.z.object({
    leaveType: zod_1.z.string().min(1).optional(),
    startDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    endDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    reason: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
}).passthrough());
const listLeaveRequestsSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid().optional(),
    leaveType: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(1000).optional(),
});
const rejectLeaveRequestSchema = zod_1.z.preprocess(preprocessData, zod_1.z.object({
    rejectionReason: zod_1.z.string().optional(),
}).passthrough());
class LeaveRequestController {
    async create(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const data = createLeaveRequestSchema.parse(req.body);
            const leaveRequest = await leaveRequest_service_1.default.create((0, auth_middleware_1.getCompanyId)(req), data);
            res.status(201).json(leaveRequest);
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
            const leaveRequest = await leaveRequest_service_1.default.getById((0, auth_middleware_1.getCompanyId)(req), id);
            res.json(leaveRequest);
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const filters = listLeaveRequestsSchema.parse(req.query);
            const result = await leaveRequest_service_1.default.list((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async approve(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const leaveRequest = await leaveRequest_service_1.default.approve((0, auth_middleware_1.getCompanyId)(req), id, req.user.id);
            res.json(leaveRequest);
        }
        catch (error) {
            next(error);
        }
    }
    async reject(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const data = rejectLeaveRequestSchema.parse(req.body);
            const leaveRequest = await leaveRequest_service_1.default.reject((0, auth_middleware_1.getCompanyId)(req), id, req.user.id, data.rejectionReason);
            res.json(leaveRequest);
        }
        catch (error) {
            next(error);
        }
    }
    async cancel(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const leaveRequest = await leaveRequest_service_1.default.cancel((0, auth_middleware_1.getCompanyId)(req), id, req.user.id);
            res.json(leaveRequest);
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
            const data = updateLeaveRequestSchema.parse(req.body);
            const leaveRequest = await leaveRequest_service_1.default.update((0, auth_middleware_1.getCompanyId)(req), id, data);
            res.json(leaveRequest);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LeaveRequestController = LeaveRequestController;
exports.default = new LeaveRequestController();
//# sourceMappingURL=leaveRequest.controller.js.map