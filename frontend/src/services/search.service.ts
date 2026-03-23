import api from './api';

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
  success: boolean;
  data: SearchResult[];
  total: number;
}

export interface SearchParams {
  q: string;
  limit?: number;
}

const searchService = {
  /**
   * Recherche globale dans tous les modules
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    const { q, limit = 10 } = params;
    const response = await api.get<SearchResponse>('/search', {
      params: { q, limit },
    });
    return response.data;
  },
};

export default searchService;

