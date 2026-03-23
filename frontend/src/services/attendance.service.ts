import api from './api';

export interface Attendance {
  id: string;
  companyId: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  status: string;
  leaveType?: string;
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
}

export interface CreateAttendanceData {
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  status?: string;
  leaveType?: string;
  notes?: string;
}

export interface AttendanceFilters {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
}

class AttendanceService {
  async create(data: CreateAttendanceData): Promise<Attendance> {
    const response = await api.post('/hr/attendance', data);
    return response.data.data;
  }

  async getById(id: string): Promise<Attendance> {
    const response = await api.get(`/hr/attendance/${id}`);
    return response.data.data;
  }

  async list(filters: AttendanceFilters = {}): Promise<{ data: Attendance[]; pagination: any }> {
    const response = await api.get('/hr/attendance', { params: filters });
    return response.data;
  }

  async update(id: string, data: Partial<CreateAttendanceData>): Promise<Attendance> {
    const response = await api.put(`/hr/attendance/${id}`, data);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/hr/attendance/${id}`);
  }

  async getEmployeeStats(employeeId: string, startDate: string, endDate: string): Promise<any> {
    const response = await api.get(`/hr/attendance/employee/${employeeId}/stats`, {
      params: { startDate, endDate },
    });
    return response.data.data;
  }
}

export default new AttendanceService();

