import api from './api';

export interface LeaveBalance {
  id: string;
  companyId: string;
  employeeId: string;
  leaveType: string;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  carriedForward: number;
  createdAt: string;
  updatedAt: string;
}

class LeaveBalanceService {
  async getBalance(employeeId: string, leaveType: string, year?: number): Promise<LeaveBalance> {
    const response = await api.get(`/hr/leave-balances/employee/${employeeId}/balance`, {
      params: { leaveType, year },
    });
    return response.data;
  }

  async getEmployeeBalances(employeeId: string, year?: number): Promise<LeaveBalance[]> {
    const response = await api.get(`/hr/leave-balances/employee/${employeeId}`, {
      params: { year },
    });
    return response.data;
  }
}

export default new LeaveBalanceService();

