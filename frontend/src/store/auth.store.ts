import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  twoFactorEnabled?: boolean;
  isSuperAdmin?: boolean;
  isContaUser?: boolean;
  isAccountant?: boolean;
  contaRole?: string | null;
  companyId?: string;
  permissions?: Record<string, any>;
  preferences?: Record<string, any>;
}

interface Company {
  id: string;
  name: string;
  businessName?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  currency?: string;
}

interface AuthState {
  user: User | null;
  company: Company | null;
  activeCompanyId: string | null;
  isAuthenticated: boolean;
  companyVersion: number;
  setAuth: (user: User, company: Company) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  updateCompany: (data: Partial<Company>) => void;
  setActiveCompany: (company: Company) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      company: null,
      activeCompanyId: null,
      isAuthenticated: false,
      companyVersion: 0,
      setAuth: (user, company) => set({ user, company, activeCompanyId: company?.id || null, isAuthenticated: true, companyVersion: 0 }),
      logout: () => set({ user: null, company: null, activeCompanyId: null, isAuthenticated: false, companyVersion: 0 }),
      updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
      updateCompany: (data) => set((state) => ({ company: state.company ? { ...state.company, ...data } : null })),
      setActiveCompany: (company) => set((state) => ({ company, activeCompanyId: company.id, companyVersion: state.companyVersion + 1 })),
    }),
    {
      name: 'conta-auth-storage',
      partialize: (state) => ({ user: state.user, company: state.company, activeCompanyId: state.activeCompanyId, isAuthenticated: state.isAuthenticated }),
    }
  )
);
