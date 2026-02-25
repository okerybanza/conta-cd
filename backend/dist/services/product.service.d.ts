export interface CreateProductData {
    name: string;
    description?: string;
    sku?: string;
    type?: 'service' | 'product';
    unitPrice: number;
    currency?: string;
    taxRate?: number;
    category?: string;
    trackStock?: boolean;
    lowStockThreshold?: number;
    isActive?: boolean;
}
export interface UpdateProductData extends Partial<CreateProductData> {
}
export interface ProductFilters {
    type?: 'service' | 'product';
    category?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
export declare class ProductService {
    create(companyId: string, data: CreateProductData): Promise<{
        id: any;
        companyId: any;
        name: any;
        description: any;
        sku: any;
        type: "service" | "product";
        unitPrice: number;
        currency: any;
        taxRate: number;
        category: any;
        trackStock: boolean;
        stockQuantity: number;
        lowStockThreshold: number;
        isActive: boolean;
        createdAt: any;
        updatedAt: any;
    }>;
    getById(companyId: string, productId: string): Promise<{
        id: any;
        companyId: any;
        name: any;
        description: any;
        sku: any;
        type: "service" | "product";
        unitPrice: number;
        currency: any;
        taxRate: number;
        category: any;
        trackStock: boolean;
        stockQuantity: number | undefined;
        lowStockThreshold: number;
        isActive: boolean;
        createdAt: any;
        updatedAt: any;
    }>;
    list(companyId: string, filters?: ProductFilters): Promise<{}>;
    getCategories(companyId: string): Promise<any>;
    update(companyId: string, productId: string, data: UpdateProductData): Promise<{
        id: any;
        companyId: any;
        name: any;
        description: any;
        sku: any;
        type: "service" | "product";
        unitPrice: number;
        currency: any;
        taxRate: number;
        category: any;
        trackStock: boolean;
        stockQuantity: number | undefined;
        lowStockThreshold: number;
        isActive: boolean;
        createdAt: any;
        updatedAt: any;
    }>;
    delete(companyId: string, productId: string): Promise<{
        success: boolean;
    }>;
    exportToCSV(companyId: string, filters?: ProductFilters): Promise<string>;
}
declare const _default: ProductService;
export default _default;
//# sourceMappingURL=product.service.d.ts.map