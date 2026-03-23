/**
 * DOC-10 : Dashboard Expert-comptable
 * Lecture + validation déléguée
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, FileText, CheckCircle2, Eye, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

export function ExpertComptableDashboard() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Charger les entreprises clientes (DOC-05)
      setCompanies([]);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord - Expert-comptable</h1>
        <p className="text-gray-600 mt-1">Lecture + validation déléguée (DOC-05)</p>
      </div>

      {/* Informations importantes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Eye className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-blue-900 mb-1">Accès délégué</p>
            <p className="text-sm text-blue-800">
              Vous avez un accès en lecture étendue et validation comptable autorisée sur les entreprises clientes.
              Aucune décision structurelle n'est autorisée (DOC-05, DOC-06).
            </p>
          </div>
        </div>
      </div>

      {/* Entreprises clientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Entreprises clientes</h2>
          <Link to="/accountant/requests" className="text-sm text-primary hover:underline">Gérer les demandes</Link>
        </div>
        <div className="space-y-2">
          {companies.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune entreprise cliente</p>
          ) : (
            companies.map((company) => (
              <div key={company.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                <div>
                  <p className="font-medium text-gray-900">{company.name}</p>
                  <p className="text-sm text-gray-600">{company.businessName}</p>
                </div>
                <Link to={`/accountant/companies/${company.id}`} className="btn-secondary text-sm">
                  Accéder
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/accountant/requests" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
          <Building2 className="h-8 w-8 text-blue-600 mb-3" />
          <p className="font-medium text-gray-900">Demandes reçues</p>
          <p className="text-sm text-gray-600 mt-1">Nouvelles demandes d'accès</p>
        </Link>
        <Link to="/accountant/profile" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
          <FileText className="h-8 w-8 text-green-600 mb-3" />
          <p className="font-medium text-gray-900">Mon profil</p>
          <p className="text-sm text-gray-600 mt-1">Paramètres expert-comptable</p>
        </Link>
        <Link to="/reports" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
          <CheckCircle2 className="h-8 w-8 text-purple-600 mb-3" />
          <p className="font-medium text-gray-900">Validations</p>
          <p className="text-sm text-gray-600 mt-1">Écritures à valider</p>
        </Link>
      </div>
    </div>
  );
}
