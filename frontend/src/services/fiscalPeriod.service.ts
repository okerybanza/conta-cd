import api from './api';

export interface CreateFiscalPeriodData {
  name: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface UpdateFiscalPeriodData {
  name?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface FiscalPeriod {
  id: string;
  companyId: string;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  notes?: string;
  closer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  locker?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FiscalPeriodFilters {
  isClosed?: boolean;
  isLocked?: boolean;
  year?: number;
}

class FiscalPeriodService {
  /**
   * Lister les exercices
   */
  async list(filters?: FiscalPeriodFilters): Promise<{ success: boolean; data: FiscalPeriod[] }> {
    const response = await api.get('/fiscal-periods', { params: filters });
    return response.data;
  }

  /**
   * Obtenir l'exercice en cours
   */
  async getCurrent(): Promise<{ success: boolean; data: FiscalPeriod | null }> {
    const response = await api.get('/fiscal-periods/current');
    return response.data;
  }

  /**
   * Obtenir un exercice par ID
   */
  async getById(id: string): Promise<{ success: boolean; data: FiscalPeriod }> {
    const response = await api.get(`/fiscal-periods/${id}`);
    return response.data;
  }

  /**
   * Créer un exercice
   */
  async create(data: CreateFiscalPeriodData): Promise<{ success: boolean; data: FiscalPeriod }> {
    const response = await api.post('/fiscal-periods', data);
    return response.data;
  }

  /**
   * Mettre à jour un exercice
   */
  async update(id: string, data: UpdateFiscalPeriodData): Promise<{ success: boolean; data: FiscalPeriod }> {
    const response = await api.put(`/fiscal-periods/${id}`, data);
    return response.data;
  }

  /**
   * Clôturer un exercice
   */
  async close(id: string): Promise<{ success: boolean; data: FiscalPeriod }> {
    const response = await api.put(`/fiscal-periods/${id}/close`);
    return response.data;
  }

  /**
   * Rouvrir un exercice
   */
  async reopen(id: string): Promise<{ success: boolean; data: FiscalPeriod }> {
    const response = await api.put(`/fiscal-periods/${id}/reopen`);
    return response.data;
  }

  /**
   * Verrouiller une période
   */
  async lock(id: string): Promise<{ success: boolean; data: FiscalPeriod }> {
    const response = await api.put(`/fiscal-periods/${id}/lock`);
    return response.data;
  }

  /**
   * Déverrouiller une période
   */
  async unlock(id: string): Promise<{ success: boolean; data: FiscalPeriod }> {
    const response = await api.put(`/fiscal-periods/${id}/unlock`);
    return response.data;
  }

  /**
   * Supprimer un exercice
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/fiscal-periods/${id}`);
    return response.data;
  }

  /**
   * Valider qu'une date est dans une période ouverte
   */
  async validatePeriod(date: string): Promise<{ isValid: boolean; period?: FiscalPeriod; message?: string }> {
    try {
      // On récupère l'exercice en cours et on vérifie manuellement
      const current = await this.getCurrent();
      if (!current.data) {
        return {
          isValid: false,
          message: 'Aucun exercice comptable en cours trouvé',
        };
      }

      const period = current.data;
      const checkDate = new Date(date);
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);

      if (checkDate < startDate || checkDate > endDate) {
        return {
          isValid: false,
          period,
          message: `La date n'est pas dans l'exercice en cours (${period.name})`,
        };
      }

      if (period.isClosed) {
        return {
          isValid: false,
          period,
          message: `L'exercice "${period.name}" est clos. Aucune modification n'est autorisée.`,
        };
      }

      if (period.isLocked) {
        return {
          isValid: false,
          period,
          message: `L'exercice "${period.name}" est verrouillé. Aucune modification n'est autorisée.`,
        };
      }

      return {
        isValid: true,
        period,
      };
    } catch (error: any) {
      return {
        isValid: false,
        message: error.response?.data?.message || 'Erreur lors de la validation de la période',
      };
    }
  }
}

export default new FiscalPeriodService();

