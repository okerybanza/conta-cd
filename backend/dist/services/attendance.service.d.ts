export interface CreateAttendanceData {
    employeeId: string;
    date: Date | string;
    checkIn?: Date | string;
    checkOut?: Date | string;
    hoursWorked?: number;
    status?: string;
    leaveType?: string;
    notes?: string;
}
export interface UpdateAttendanceData extends Partial<CreateAttendanceData> {
}
export interface AttendanceFilters {
    employeeId?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    status?: string;
    page?: number;
    limit?: number;
}
export declare class AttendanceService {
    create(companyId: string, data: CreateAttendanceData): Promise<any>;
    getById(companyId: string, attendanceId: string): Promise<any>;
    list(companyId: string, filters?: AttendanceFilters): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    update(companyId: string, attendanceId: string, data: UpdateAttendanceData): Promise<any>;
    delete(companyId: string, attendanceId: string): Promise<{
        success: boolean;
    }>;
    getEmployeeStats(companyId: string, employeeId: string, startDate: Date, endDate: Date): Promise<{
        totalDays: any;
        presentDays: any;
        absentDays: any;
        leaveDays: any;
        totalHours: number;
    }>;
}
declare const _default: AttendanceService;
export default _default;
//# sourceMappingURL=attendance.service.d.ts.map