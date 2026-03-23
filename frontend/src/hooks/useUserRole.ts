/**
 * DOC-10 : Hook pour déterminer le rôle principal de l'utilisateur
 * Utilisé pour personnaliser les dashboards et parcours
 */

import { useAuthStore } from '../store/auth.store';

export type UserRole = 'owner' | 'admin' | 'accountant' | 'rh' | 'manager' | 'employee' | 'expert-comptable' | 'super-admin';

export function useUserRole(): { role: UserRole; isOwner: boolean; isAdmin: boolean; isAccountant: boolean; isRH: boolean; isManager: boolean; isEmployee: boolean; isExpertComptable: boolean } {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return {
      role: 'employee',
      isOwner: false,
      isAdmin: false,
      isAccountant: false,
      isRH: false,
      isManager: false,
      isEmployee: true,
      isExpertComptable: false,
    };
  }

  // Super admin ou admin Conta
  if (user.isSuperAdmin || user.isContaUser) {
    return {
      role: 'super-admin',
      isOwner: false,
      isAdmin: true,
      isAccountant: false,
      isRH: false,
      isManager: false,
      isEmployee: false,
      isExpertComptable: false,
    };
  }

  // Expert-comptable indépendant
  if (user.isAccountant && !user.companyId) {
    return {
      role: 'expert-comptable',
      isOwner: false,
      isAdmin: false,
      isAccountant: true,
      isRH: false,
      isManager: false,
      isEmployee: false,
      isExpertComptable: true,
    };
  }

  // Rôles selon DOC-06
  const role = user.role?.toLowerCase() || 'employee';

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isAccountant = role === 'accountant';
  const isRH = role === 'rh';
  const isManager = role === 'manager';
  const isEmployee = role === 'employee';
  const isExpertComptable = user.isAccountant || false;

  return {
    role: (isOwner ? 'owner' : isAdmin ? 'admin' : isAccountant ? 'accountant' : isRH ? 'rh' : isManager ? 'manager' : 'employee') as UserRole,
    isOwner,
    isAdmin,
    isAccountant,
    isRH,
    isManager,
    isEmployee,
    isExpertComptable,
  };
}
