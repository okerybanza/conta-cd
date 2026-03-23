import api from './api';

export interface Employee {
  id: string;
  companyId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  position?: string;
  department?: string;
  hireDate: string;
  terminationDate?: string;
  employmentType?: string;
  status: string;
  baseSalary: number;
  currency?: string;
  salaryFrequency?: string;
  bankAccount?: string;
  bankName?: string;
  nif?: string;
  socialSecurityNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  attendances?: any[];
  payrolls?: any[];
}

export interface CreateEmployeeData {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  position?: string;
  department?: string;
  hireDate: string;
  terminationDate?: string;
  employmentType?: string;
  status?: string;
  baseSalary: number;
  currency?: string;
  salaryFrequency?: string;
  bankAccount?: string;
  bankName?: string;
  nif?: string;
  socialSecurityNumber?: string;
  notes?: string;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  position?: string;
  page?: number;
  limit?: number;
}

class EmployeeService {
  async create(data: CreateEmployeeData): Promise<Employee> {
    const response = await api.post('/hr/employees', data);
    return response.data.data;
  }

  async getById(id: string): Promise<Employee> {
    const response = await api.get(`/hr/employees/${id}`);
    return response.data.data;
  }

  async list(filters: EmployeeFilters = {}): Promise<{ data: Employee[]; pagination: any }> {
    const response = await api.get('/hr/employees', { params: filters });
    return response.data;
  }

  async update(id: string, data: Partial<CreateEmployeeData>): Promise<Employee> {
    const response = await api.put(`/hr/employees/${id}`, data);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/hr/employees/${id}`);
  }
}

export default new EmployeeService();

