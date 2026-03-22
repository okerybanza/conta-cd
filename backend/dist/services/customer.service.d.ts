export interface CreateCustomerData {
    type: 'particulier' | 'entreprise';
    firstName?: string;
    lastName?: string;
    businessName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    nif?: string;
    rccm?: string;
    notes?: string;
    tags?: string[];
}
export interface UpdateCustomerData extends Partial<CreateCustomerData> {
}
export interface CustomerFilters {
    type?: 'particulier' | 'entreprise';
    search?: string;
    city?: string;
    country?: string;
    page?: number;
    limit?: number;
}
export declare class CustomerService {
    create(companyId: string, data: CreateCustomerData): Promise<any>;
    getById(companyId: string, customerId: string): Promise<any>;
    list(companyId: string, filters?: CustomerFilters): Promise<{}>;
    update(companyId: string, customerId: string, data: UpdateCustomerData): Promise<any>;
    delete(companyId: string, customerId: string): Promise<{
        success: boolean;
    }>;
    exportToCSV(companyId: string, filters?: CustomerFilters): Promise<string>;
}
declare const _default: CustomerService;
export default _default;
//# sourceMappingURL=customer.service.d.ts.map