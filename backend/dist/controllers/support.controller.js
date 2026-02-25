"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportController = void 0;
const zod_1 = require("zod");
const support_service_1 = __importDefault(require("../services/support.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const createTicketSchema = zod_1.z.object({
    subject: zod_1.z.string().min(1).max(255),
    message: zod_1.z.string().min(1),
    category: zod_1.z.enum(['technical', 'billing', 'feature', 'bug', 'other']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});
const updateTicketSchema = zod_1.z.object({
    status: zod_1.z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    response: zod_1.z.string().optional(),
    assignedTo: zod_1.z.string().uuid().optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});
const listTicketsSchema = zod_1.z.object({
    status: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    priority: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional(),
});
class SupportController {
    // Créer un ticket de support
    async createTicket(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const userId = req.user.id;
            const userEmail = req.user.email;
            const validatedData = createTicketSchema.parse(req.body);
            const ticket = await support_service_1.default.createTicket({
                companyId,
                userId,
                userEmail,
                ...validatedData,
            });
            res.status(201).json({
                success: true,
                data: ticket,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: error.errors,
                });
            }
            next(error);
        }
    }
    // Lister les tickets de l'entreprise
    async listTickets(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const filters = listTicketsSchema.parse(req.query);
            const result = await support_service_1.default.getCompanyTickets(companyId, filters);
            res.json({
                success: true,
                data: result.tickets,
                pagination: result.pagination,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid query parameters',
                    details: error.errors,
                });
            }
            next(error);
        }
    }
    // Récupérer un ticket spécifique
    async getTicket(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const { ticketId } = req.params;
            const ticket = await support_service_1.default.getTicket(ticketId, companyId);
            res.json({
                success: true,
                data: ticket,
            });
        }
        catch (error) {
            if (error.message === 'Ticket not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Ticket not found',
                });
            }
            next(error);
        }
    }
    // Mettre à jour un ticket
    async updateTicket(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const { ticketId } = req.params;
            const validatedData = updateTicketSchema.parse(req.body);
            const ticket = await support_service_1.default.updateTicket(ticketId, companyId, validatedData);
            res.json({
                success: true,
                data: ticket,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: error.errors,
                });
            }
            if (error.message === 'Ticket not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Ticket not found',
                });
            }
            next(error);
        }
    }
}
exports.SupportController = SupportController;
exports.default = new SupportController();
//# sourceMappingURL=support.controller.js.map