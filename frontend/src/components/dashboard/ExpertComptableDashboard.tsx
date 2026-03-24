/**
 * DOC-10 : Dashboard Expert-comptable (DOC-05)
 * Liste des entreprises clientes avec acces delegue
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, FileText, CheckCircle2, Eye, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export function ExpertComptableDashboard() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accountants/my-companies');
      setCompanies(res.data?.data?.companies ?? res.data?.data ?? []);
    } catch (err: any) {
      // Fallback: try the accountants endpoint
      try {
        const res2 = await api.get('/accountants');
        setCompanies(res2.data?.data?.companies ?? res2.data?.data ?? []);
      } catch {
        if ((err as any)?.response?.status !== 401) setError('Erreur de chargement des entreprises clientes.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#FAFBFC] min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord — Expert-comptable</h1>
        <p className="text-gray-500 text-sm mt-1">Acces delegue en lecture et validation (DOC-05)</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Rappel acces delegue */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Eye className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900 text-sm">Acces delegue</p>
          <p className="text-xs text-blue-800 mt-0.5">
            Lecture etendue et validation comptable autorisee. Aucune decision structurelle (DOC-05, DOC-06).
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Entreprises clientes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{companies.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-600"><Building2 className="h-6 w-6 text-white" /></div>
      </div>

      {/* Liste entreprises */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Mes entreprises clientes</h2>
          <Link to="/accountant/companies" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Gerer <ArrowRight size={14} />
          </Link>
        </div>
        {companies.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucune entreprise cliente</p>
            <Link to="/accountant/requests" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              Voir les demandes recues
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {companies.map((company: any) => (
              <div key={company.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{company.name ?? company.companyName}</p>
                    <p className="text-xs text-gray-500">{company.businessType ?? company.type ?? '—'}</p>
                  </div>
                </div>
                <Link
                  to={`/accountant/companies`}
                  className="text-xs font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors">
                  Acceder
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/accountant/requests" className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <Building2 size={20} className="text-blue-600" />
          <span className="font-medium text-gray-900">Demandes recues</span>
        </Link>
        <Link to="/accountant/profile" className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <FileText size={20} className="text-green-600" />
          <span className="font-medium text-gray-900">Mon profil</span>
        </Link>
        <Link to="/reports" className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <CheckCircle2 size={20} className="text-purple-600" />
          <span className="font-medium text-gray-900">Validations</span>
        </Link>
      </div>
    </div>
  );
}

export default ExpertComptableDashboard;
