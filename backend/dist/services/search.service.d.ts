export interface SearchResult {
    type: 'customer' | 'invoice' | 'product' | 'payment';
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    url: string;
    metadata?: Record<string, any>;
}
export interface SearchResponse {
    results: SearchResult[];
    total: number;
}
export declare class SearchService {
    /**
     * Recherche globale dans tous les modules
     */
    globalSearch(companyId: string, query: string, limit?: number): Promise<SearchResponse>;
}
declare const _default: SearchService;
export default _default;
//# sourceMappingURL=search.service.d.ts.map