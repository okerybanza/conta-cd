import api from './api';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: {
    page?: string;
    documentId?: string;
    documentType?: string;
  };
}

export interface AssistantSuggestion {
  id: string;
  type: 'action' | 'insight' | 'warning' | 'tip';
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AssistantContext {
  currentPage?: string;
  recentDocuments?: string[];
  userRole?: string;
  companyData?: Record<string, any>;
}

class AssistantService {
  async sendMessage(message: string, context?: AssistantContext): Promise<AssistantMessage> {
    const response = await api.post('/assistant/chat', { message, context });
    return response.data.data || response.data;
  }

  async getConversationHistory(limit?: number): Promise<AssistantMessage[]> {
    const response = await api.get('/assistant/history', { params: { limit } });
    return response.data.data || response.data;
  }

  async getSuggestions(context?: AssistantContext): Promise<AssistantSuggestion[]> {
    const response = await api.post('/assistant/suggestions', { context });
    return response.data.data || response.data;
  }

  async analyzeDocument(documentType: string, documentId: string): Promise<{
    insights: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    const response = await api.post('/assistant/analyze', { documentType, documentId });
    return response.data.data || response.data;
  }

  async generateReport(reportType: string, parameters: Record<string, any>): Promise<{
    summary: string;
    details: string;
    downloadUrl?: string;
  }> {
    const response = await api.post('/assistant/generate-report', { reportType, parameters });
    return response.data.data || response.data;
  }

  async clearHistory(): Promise<void> {
    await api.delete('/assistant/history');
  }
}

export default new AssistantService();
