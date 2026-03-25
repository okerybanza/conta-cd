/**
 * DOC-10 : Dashboard par défaut
 * Utilisé quand le rôle n'est pas spécifique
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, DollarSign, Users, TrendingUp } from 'lucide-react';
import dashboardService, { DashboardStats } from '../../services/dashboard.service';

export function DefaultDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardStats = await dashboardService.getStats();
      setStats(dashboardStats);
    } catch (err: any) {
      // Gérer gracieusement les erreurs 401 (non authentifié)
      if (err.response?.status === 401) {
        // Ne pas afficher d'erreur, juste laisser les stats à null
      } else {
        console.error('Error loading dashboard:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  const totalInvoices = stats?.totalInvoices ?? 0;
  const paidInvoices = totalInvoices - (stats?.unpaidInvoices ?? 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalRevenue ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'CDF' }).format(stats.totalRevenue) : '0 CDF'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Factures</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalInvoices || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalCustomers || 0}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux de paiement</p>
              <p className="text-2xl font-bold text-gray-900">
                  {totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/invoices" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
          <FileText className="h-8 w-8 text-blue-600 mb-3" />
          <p className="font-medium text-gray-900">Factures</p>
          <p className="text-sm text-gray-600 mt-1">Gérer les factures</p>
        </Link>
        <Link to="/customers" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
          <Users className="h-8 w-8 text-green-600 mb-3" />
          <p className="font-medium text-gray-900">Clients</p>
          <p className="text-sm text-gray-600 mt-1">Gérer les clients</p>
        </Link>
        <Link to="/reports" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
          <TrendingUp className="h-8 w-8 text-purple-600 mb-3" />
          <p className="font-medium text-gray-900">Rapports</p>
          <p className="text-sm text-gray-600 mt-1">Voir les rapports</p>
        </Link>
      </div>
    </div>
  );
}
