import api from './api';

export type HrComplianceSeverity = 'info' | 'warning' | 'error';

export interface HrComplianceIssue {
  code: string;
  message: string;
  severity: HrComplianceSeverity;
  employeeId?: string;
  payrollId?: string;
  attendanceId?: string;
  leaveRequestId?: string;
  details?: Record<string, any>;
}

export interface HrComplianceSummary {
  periodStart: string;
  periodEnd: string;
  issues: HrComplianceIssue[];
}

export interface HrComplianceFilters {
  periodStart?: string;
  periodEnd?: string;
}

class HrComplianceService {
  async getRdcReport(filters: HrComplianceFilters = {}): Promise<HrComplianceSummary> {
    const response = await api.get('/hr/compliance/rdc', { params: filters });
    return response.data;
  }
}

export default new HrComplianceService();


