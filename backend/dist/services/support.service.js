"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const email_service_1 = __importDefault(require("./email.service"));
const env_1 = __importDefault(require("../config/env"));
class SupportService {
    // Créer un ticket de support
    async createTicket(data) {
        try {
            // Vérifier que l'entreprise existe
            const company = await database_1.default.companies.findUnique({
                where: { id: data.companyId },
            });
            if (!company) {
                throw new Error('Company not found');
            }
            // Créer le ticket
            const ticket = await database_1.default.supportTicket.create({
                data: {
                    companyId: data.companyId,
                    userId: data.userId,
                    userEmail: data.userEmail,
                    subject: data.subject,
                    message: data.message,
                    category: data.category || 'other',
                    priority: data.priority || 'medium',
                    status: 'open',
                },
                include: {
                    company: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    users: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                        },
                    },
                },
            });
            // Envoyer un email de confirmation au client
            if (data.userEmail) {
                try {
                    await email_service_1.default.sendEmail({
                        from: env_1.default.SMTP_FROM || env_1.default.SMTP_USER,
                        to: data.userEmail,
                        subject: `Ticket de support créé - ${data.subject}`,
                        template: 'support-ticket-created',
                        data: {
                            ticketId: ticket.id,
                            subject: data.subject,
                            message: data.message,
                            category: data.category || 'other',
                            priority: data.priority || 'medium',
                        },
                    });
                }
                catch (error) {
                    logger_1.default.warn('Error sending support ticket confirmation email', {
                        ticketId: ticket.id,
                        error: error.message,
                    });
                }
            }
            // Envoyer une notification au support
            if (env_1.default.SMTP_FROM || env_1.default.SMTP_USER) {
                try {
                    await email_service_1.default.sendEmail({
                        from: env_1.default.SMTP_FROM || env_1.default.SMTP_USER,
                        to: env_1.default.SMTP_FROM || env_1.default.SMTP_USER || process.env.SUPPORT_EMAIL || 'support@conta.cd', // Utiliser l'email SMTP comme destination par défaut
                        subject: `[Support] Nouveau ticket - ${data.subject}`,
                        template: 'support-ticket-notification',
                        data: {
                            ticketId: ticket.id,
                            companyName: company.name,
                            userEmail: data.userEmail,
                            subject: data.subject,
                            message: data.message,
                            category: data.category || 'other',
                            priority: data.priority || 'medium',
                        },
                    });
                }
                catch (error) {
                    logger_1.default.warn('Error sending support ticket notification to support team', {
                        ticketId: ticket.id,
                        error: error.message,
                    });
                }
            }
            logger_1.default.info('Support ticket created', {
                ticketId: ticket.id,
                companyId: data.companyId,
            });
            return ticket;
        }
        catch (error) {
            logger_1.default.error('Error creating support ticket', {
                companyId: data.companyId,
                error: error.message,
            });
            throw error;
        }
    }
    // Récupérer les tickets d'une entreprise
    async getCompanyTickets(companyId, filters) {
        try {
            const page = filters?.page || 1;
            const limit = filters?.limit || 20;
            const skip = (page - 1) * limit;
            const where = {
                companyId,
            };
            if (filters?.status) {
                where.status = filters.status;
            }
            if (filters?.category) {
                where.category = filters.category;
            }
            if (filters?.priority) {
                where.priority = filters.priority;
            }
            const [tickets, total] = await Promise.all([
                database_1.default.support_tickets.findMany({
                    where,
                    orderBy: {
                        created_at: 'desc',
                    },
                    skip,
                    take: limit,
                    include: {
                        users: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                }),
                database_1.default.supportTicket.count({ where }),
            ]);
            return {
                tickets,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching company tickets', {
                companyId,
                error: error.message,
            });
            throw error;
        }
    }
    // Récupérer un ticket spécifique
    async getTicket(ticketId, companyId) {
        try {
            const ticket = await database_1.default.supportTicket.findFirst({
                where: {
                    id: ticketId,
                    companyId,
                },
                include: {
                    company: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    users: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                        },
                    },
                },
            });
            if (!ticket) {
                throw new Error('Ticket not found');
            }
            return ticket;
        }
        catch (error) {
            logger_1.default.error('Error fetching ticket', {
                ticketId,
                companyId,
                error: error.message,
            });
            throw error;
        }
    }
    // Mettre à jour un ticket
    async updateTicket(ticketId, companyId, data) {
        try {
            const ticket = await database_1.default.supportTicket.findFirst({
                where: {
                    id: ticketId,
                    companyId,
                },
            });
            if (!ticket) {
                throw new Error('Ticket not found');
            }
            const updateData = {};
            if (data.status !== undefined) {
                updateData.status = data.status;
                if (data.status === 'resolved' || data.status === 'closed') {
                    updateData.respondedAt = new Date();
                }
            }
            if (data.response !== undefined) {
                updateData.response = data.response;
                if (!updateData.respondedAt) {
                    updateData.respondedAt = new Date();
                }
            }
            if (data.assignedTo !== undefined) {
                updateData.assignedTo = data.assignedTo;
            }
            if (data.priority !== undefined) {
                updateData.priority = data.priority;
            }
            const updatedTicket = await database_1.default.supportTicket.update({
                where: { id: ticketId },
                data: updateData,
                include: {
                    company: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    users: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                        },
                    },
                },
            });
            // Envoyer un email de réponse si une réponse a été ajoutée
            if (data.response && ticket.userEmail) {
                try {
                    await email_service_1.default.sendEmail({
                        to: ticket.userEmail,
                        subject: `Réponse à votre ticket de support - ${ticket.subject}`,
                        template: 'support-ticket-response',
                        data: {
                            ticketId: ticket.id,
                            subject: ticket.subject,
                            response: data.response,
                        },
                    });
                }
                catch (error) {
                    logger_1.default.warn('Error sending support ticket response email', {
                        ticketId: ticket.id,
                        error: error.message,
                    });
                }
            }
            logger_1.default.info('Support ticket updated', {
                ticketId,
                companyId,
                updates: Object.keys(updateData),
            });
            return updatedTicket;
        }
        catch (error) {
            logger_1.default.error('Error updating support ticket', {
                ticketId,
                companyId,
                error: error.message,
            });
            throw error;
        }
    }
}
exports.SupportService = SupportService;
exports.default = new SupportService();
//# sourceMappingURL=support.service.js.map