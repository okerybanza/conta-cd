/**
 * DOC-10 : Dashboard adaptatif par rôle
 * L'UX est pensée par rôle, pas par fonctionnalités
 * Un rôle voit d'abord ce qui est utile, découvre le reste si nécessaire
 */
import { RoleBasedDashboard } from '../../components/dashboard/RoleBasedDashboard';
import { SubscriptionStatusBanner } from '../../components/subscription/SubscriptionStatusBanner';

/**
 * DOC-10 : Dashboard adaptatif par rôle
 * Utilise RoleBasedDashboard qui affiche le dashboard approprié selon le rôle
 */
function DashboardPage() {
  return (
    <div className="p-4 space-y-4">
      <SubscriptionStatusBanner />
      <RoleBasedDashboard />
    </div>
  );
}

export default DashboardPage;
