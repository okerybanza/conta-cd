import { createContext, useContext, ReactNode } from 'react';
import { useAuthStore } from '../store/auth.store';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  twoFactorEnabled?: boolean;
  subscription?: {
    packageId: string;
    package?: {
      features?: {
        expenses?: boolean;
        accounting?: boolean;
        recurring_invoices?: boolean;
        api?: boolean;
        custom_templates?: boolean;
        multi_currency?: boolean;
        advanced_reports?: boolean;
        workflows?: boolean;
        custom_branding?: boolean;
      };
    };
  };
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
  visapay_enabled?: boolean;
  currency?: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, company, isAuthenticated } = useAuthStore();

  return (
    <AuthContext.Provider value={{ user: user as User | null, company, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

