import api from './api';

export interface SupportTicket {
  id: string;
  companyId: string;
  userId?: string;
  userEmail: string;
  subject: string;
  message: string;
  category?: 'technical' | 'billing' | 'feature' | 'bug' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    name: string;
    email: string;
  };
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export interface CreateSupportTicketData {
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

class SupportService {
  // Créer un ticket de support
  async createTicket(data: CreateSupportTicketData): Promise<SupportTicket> {
    const response = await api.post('/support/tickets', data);
    return response.data.data;
  }

  // Lister les tickets de l'entreprise
  async listTickets(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tickets: SupportTicket[]; pagination: any }> {
    const response = await api.get('/support/tickets', { params: filters });
    return response.data;
  }

  // Récupérer un ticket spécifique
  async getTicket(ticketId: string): Promise<SupportTicket> {
    const response = await api.get(`/support/tickets/${ticketId}`);
    return response.data.data;
  }

  // Mettre à jour un ticket
  async updateTicket(ticketId: string, data: UpdateSupportTicketData): Promise<SupportTicket> {
    const response = await api.patch(`/support/tickets/${ticketId}`, data);
    return response.data.data;
  }
}

export default new SupportService();

