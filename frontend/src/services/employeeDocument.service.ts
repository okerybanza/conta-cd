import api from './api';

export interface EmployeeDocument {
  id: string;
  companyId: string;
  employeeId: string;
  documentType: string;
  name: string;
  description?: string;
  fileId: string;
  expiryDate?: string;
  isExpired: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position?: string;
    department?: string;
  };
  file?: {
    id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
  };
}

export interface CreateEmployeeDocumentData {
  employeeId: string;
  documentType: string;
  name: string;
  description?: string;
  fileId: string;
  expiryDate?: string;
  notes?: string;
}

export interface UpdateEmployeeDocumentData {
  documentType?: string;
  name?: string;
  description?: string;
  fileId?: string;
  expiryDate?: string | null;
  notes?: string;
}

export interface EmployeeDocumentFilters {
  employeeId?: string;
  documentType?: string;
  isExpired?: boolean;
  page?: number;
  limit?: number;
}

class EmployeeDocumentService {
  async create(data: CreateEmployeeDocumentData): Promise<EmployeeDocument> {
    const response = await api.post('/hr/employee-documents', data);
    return response.data;
  }

  async getById(id: string): Promise<EmployeeDocument> {
    const response = await api.get(`/hr/employee-documents/${id}`);
    return response.data;
  }

  async list(filters: EmployeeDocumentFilters = {}): Promise<{ data: EmployeeDocument[]; pagination: any }> {
    const response = await api.get('/hr/employee-documents', { params: filters });
    return response.data;
  }

  async update(id: string, data: UpdateEmployeeDocumentData): Promise<EmployeeDocument> {
    const response = await api.put(`/hr/employee-documents/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/hr/employee-documents/${id}`);
  }

  async getExpiring(days: number = 30): Promise<EmployeeDocument[]> {
    const response = await api.get('/hr/employee-documents/expiring', { params: { days } });
    return response.data;
  }

  async getExpired(): Promise<EmployeeDocument[]> {
    const response = await api.get('/hr/employee-documents/expired');
    return response.data;
  }
}

export default new EmployeeDocumentService();

