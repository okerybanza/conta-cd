import api from './api';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'admin' | 'accountant' | 'manager' | 'employee' | 'rh';
  permissions?: Record<string, any>;
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  lockedUntil?: string | null;
}

export interface InviteUserData {
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'accountant' | 'manager' | 'employee' | 'rh';
  permissions?: Record<string, any>;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'admin' | 'accountant' | 'manager' | 'employee' | 'rh';
  permissions?: Record<string, any>;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'admin' | 'accountant' | 'manager' | 'employee' | 'rh';
  permissions?: Record<string, any>;
  lockedUntil?: Date | null;
}

export interface UserFilters {
  role?: string;
  search?: string;
}

class UserService {
  /**
   * Inviter un utilisateur par email
   */
  async invite(data: InviteUserData): Promise<User> {
    const response = await api.post('/users/invite', data);
    return response.data.data;
  }

  /**
   * Créer un utilisateur directement
   */
  async create(data: CreateUserData): Promise<User> {
    const response = await api.post('/users', data);
    return response.data.data;
  }

  /**
   * Lister les utilisateurs
   */
  async list(filters?: UserFilters): Promise<User[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/users?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Obtenir un utilisateur par ID
   */
  async getById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  }

  /**
   * Mettre à jour un utilisateur
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data.data;
  }

  /**
   * Supprimer un utilisateur
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    await api.post(`/users/${id}/reset-password`, { newPassword });
  }
}

export default new UserService();

