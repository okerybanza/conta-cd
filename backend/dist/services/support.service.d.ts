export interface CreateSupportTicketData {
    companyId: string;
    userId?: string;
    userEmail: string;
    subject: string;
    message: string;
    category?: 'technical' | 'billing' | 'feature' | 'bug' | 'other';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}
export interface UpdateSupportTicketData {
    status?: 'open' | 'in_progress' | 'resolved' | 'closed';
    response?: string;
    assignedTo?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}
export declare class SupportService {
    createTicket(data: CreateSupportTicketData): Promise<any>;
    getCompanyTickets(companyId: string, filters?: {
        status?: string;
        category?: string;
        priority?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        tickets: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getTicket(ticketId: string, companyId: string): Promise<any>;
    updateTicket(ticketId: string, companyId: string, data: UpdateSupportTicketData): Promise<any>;
}
declare const _default: SupportService;
export default _default;
//# sourceMappingURL=support.service.d.ts.map