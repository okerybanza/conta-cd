export interface CreateEmployeeData {
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    mobile?: string;
    dateOfBirth?: Date | string;
    gender?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    position?: string;
    department?: string;
    hireDate: Date | string;
    terminationDate?: Date | string;
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
export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
}
export interface EmployeeFilters {
    search?: string;
    department?: string;
    status?: string;
    position?: string;
    page?: number;
    limit?: number;
}
export declare class EmployeeService {
    create(companyId: string, data: CreateEmployeeData, userId?: string): Promise<any>;
    getById(companyId: string, employeeId: string): Promise<any>;
    list(companyId: string, filters?: EmployeeFilters): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    update(companyId: string, employeeId: string, data: UpdateEmployeeData, userId?: string): Promise<any>;
    delete(companyId: string, employeeId: string, userId?: string): Promise<{
        success: boolean;
    }>;
}
declare const _default: EmployeeService;
export default _default;
//# sourceMappingURL=employee.service.d.ts.map