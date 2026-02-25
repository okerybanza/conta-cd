"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const attendance_service_1 = __importDefault(require("../services/attendance.service"));
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
const baseAttendanceSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid(),
    date: zod_1.z.string().min(1),
    checkIn: zod_1.z.string().optional(),
    checkOut: zod_1.z.string().optional(),
    hoursWorked: zod_1.z.number().nonnegative().optional(),
    status: zod_1.z.string().optional(),
    leaveType: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
const createAttendanceSchema = zod_1.z.preprocess(preprocessData, baseAttendanceSchema);
const updateAttendanceSchema = zod_1.z.preprocess(preprocessData, baseAttendanceSchema.partial());
const listAttendanceSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(1000).optional(),
});
class AttendanceController {
    async create(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const data = createAttendanceSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const attendance = await attendance_service_1.default.create(companyId, data);
            res.status(201).json({ success: true, data: attendance });
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const attendance = await attendance_service_1.default.getById(companyId, req.params.id);
            res.json({ success: true, data: attendance });
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const filters = listAttendanceSchema.parse(req.query);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const result = await attendance_service_1.default.list(companyId, filters);
            res.json({ success: true, ...result });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const data = updateAttendanceSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const attendance = await attendance_service_1.default.update(companyId, req.params.id, data);
            res.json({ success: true, data: attendance });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            await attendance_service_1.default.delete(companyId, req.params.id);
            res.json({ success: true, message: 'Attendance deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    async getEmployeeStats(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { employeeId } = req.params;
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'startDate and endDate are required' },
                });
            }
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const stats = await attendance_service_1.default.getEmployeeStats(companyId, employeeId, new Date(startDate), new Date(endDate));
            res.json({ success: true, data: stats });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AttendanceController = AttendanceController;
exports.default = new AttendanceController();
//# sourceMappingURL=attendance.controller.js.map