import api from './api';

export type JournalEntrySourceType = 'invoice' | 'expense' | 'payment' | 'manual';
export type JournalEntryStatus = 'draft' | 'posted' | 'reversed';

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
  currency: string;
  account: {
    id: string;
    code: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  companyId: string;
  entryNumber: string;
  entryDate: string;
  description?: string;
  reference?: string;
  sourceType: JournalEntrySourceType;
  sourceId?: string;
  status: JournalEntryStatus;
  notes?: string;
  createdBy?: string;
  lines: JournalEntryLine[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLineData {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
  currency?: string;
}

export interface CreateJournalEntryData {
  entryDate: string | Date;
  description?: string;
  reference?: string;
  sourceType: JournalEntrySourceType;
  sourceId?: string;
  lines: JournalEntryLineData[];
  notes?: string;
}

export interface UpdateJournalEntryData {
  entryDate?: string | Date;
  description?: string;
  reference?: string;
  lines?: JournalEntryLineData[];
  notes?: string;
  status?: JournalEntryStatus;
}

export interface JournalEntryFilters {
  startDate?: string | Date;
  endDate?: string | Date;
  sourceType?: JournalEntrySourceType;
  sourceId?: string;
  status?: JournalEntryStatus;
  accountId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface JournalEntryListResponse {
  success: boolean;
  data: JournalEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class JournalEntryService {
  async create(data: CreateJournalEntryData): Promise<{ success: boolean; data: JournalEntry }> {
    const response = await api.post('/journal-entries', data);
    return response.data;
  }

  async getById(id: string): Promise<{ success: boolean; data: JournalEntry }> {
    const response = await api.get(`/journal-entries/${id}`);
    return response.data;
  }

  async list(filters?: JournalEntryFilters): Promise<JournalEntryListResponse> {
    const response = await api.get('/journal-entries', { params: filters });
    return response.data;
  }

  async update(id: string, data: UpdateJournalEntryData): Promise<{ success: boolean; data: JournalEntry }> {
    const response = await api.put(`/journal-entries/${id}`, data);
    return response.data;
  }

  async post(id: string): Promise<{ success: boolean; data: JournalEntry }> {
    const response = await api.post(`/journal-entries/${id}/post`);
    return response.data;
  }

  async reverse(id: string, reason: string): Promise<{ success: boolean; data: JournalEntry; reversalEntry: JournalEntry }> {
    const response = await api.post(`/journal-entries/${id}/reverse`, { reason });
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await api.delete(`/journal-entries/${id}`);
    return response.data;
  }
}

export default new JournalEntryService();

