/**
 * DOC-10 : Dashboard Employé
 * Demandes personnelles
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, User, Clock } from 'lucide-react';

export function EmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Charger les demandes personnelles (congés, documents, etc.)
      setMyRequests([]);
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
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord - Employé</h1>
        <p className="text-gray-600 mt-1">Demandes personnelles</p>
      </div>

      {/* Mes demandes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Mes demandes</h2>
        </div>
        <div className="space-y-2">
          {myRequests.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune demande en cours</p>
          ) : (
            myRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                <div>
                  <p className="font-medium text-gray-900">{req.type}</p>
                  <p className="text-sm text-gray-600">{req.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/hr/leaves/request" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
          <Calendar className="h-8 w-8 text-blue-600 mb-3" />
          <p className="font-medium text-gray-900">Demander un congé</p>
          <p className="text-sm text-gray-600 mt-1">Créer une demande</p>
        </Link>
        <Link to="/profile" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
          <User className="h-8 w-8 text-green-600 mb-3" />
          <p className="font-medium text-gray-900">Mon profil</p>
          <p className="text-sm text-gray-600 mt-1">Informations personnelles</p>
        </Link>
        <Link to="/hr/documents" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
          <FileText className="h-8 w-8 text-purple-600 mb-3" />
          <p className="font-medium text-gray-900">Mes documents</p>
          <p className="text-sm text-gray-600 mt-1">Documents RH</p>
        </Link>
      </div>
    </div>
  );
}
