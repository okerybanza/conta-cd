import api from './api';

export interface PayrollItem {
  id: string;
  payrollId: string;
  type: string;
  description: string;
  amount: number;
  isDeduction: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payroll {
  id: string;
  companyId: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  status: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  currency?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  paidBy?: string;
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
  items?: PayrollItem[];
}

export interface PayrollItemData {
  type: string;
  description: string;
  amount: number;
  isDeduction: boolean;
}

export interface CreatePayrollData {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  items: PayrollItemData[];
  notes?: string;
}

export interface PayrollFilters {
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

class PayrollService {
  async create(data: CreatePayrollData): Promise<Payroll> {
    const response = await api.post('/hr/payroll', data);
    return response.data.data;
  }

  async getById(id: string): Promise<Payroll> {
    const response = await api.get(`/hr/payroll/${id}`);
    return response.data.data;
  }

  async list(filters: PayrollFilters = {}): Promise<{ data: Payroll[]; pagination: any }> {
    const response = await api.get('/hr/payroll', { params: filters });
    return response.data;
  }

  async update(id: string, data: Partial<CreatePayrollData>): Promise<Payroll> {
    const response = await api.put(`/hr/payroll/${id}`, data);
    return response.data.data;
  }

  async approve(id: string): Promise<void> {
    await api.post(`/hr/payroll/${id}/approve`);
  }

  async markAsPaid(id: string, paymentMethod?: string, paymentReference?: string): Promise<Payroll> {
    const response = await api.post(`/hr/payroll/${id}/mark-paid`, {
      paymentMethod,
      paymentReference,
    });
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/hr/payroll/${id}`);
  }
}

export default new PayrollService();

