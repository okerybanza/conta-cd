/**
 * DOC-10 : Dashboard personnalisé par rôle
 * 
 * Principe : L'UX est pensée par rôle, pas par fonctionnalités
 * Un rôle voit d'abord ce qui est utile, découvre le reste si nécessaire
 */

import { useUserRole } from '../../hooks/useUserRole';
import { OwnerDashboard } from './OwnerDashboard';
import { AccountantDashboard } from './AccountantDashboard';
import { RHDashboard } from './RHDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';
import { ExpertComptableDashboard } from './ExpertComptableDashboard';
import { DefaultDashboard } from './DefaultDashboard';

export function RoleBasedDashboard() {
  const { role } = useUserRole();

  switch (role) {
    case 'owner':
      return <OwnerDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    case 'rh':
      return <RHDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    case 'expert-comptable':
      return <ExpertComptableDashboard />;
    case 'admin':
      // Admin peut avoir un dashboard similaire à Owner
      return <OwnerDashboard />;
    default:
      return <DefaultDashboard />;
  }
}
