/**
 * DOC-10 : Dashboard Employe
 * Mes conges, mes soldes, mes bulletins de paie
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, AlertCircle, ArrowRight, Clock } from 'lucide-react';
import api from '../../services/api';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', approved: 'Approuve', rejected: 'Refuse', cancelled: 'Annule',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export function EmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [myPayrolls, setMyPayrolls] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [leaveRes, payrollRes] = await Promise.all([
        api.get('/hr/leave-requests?limit=5&sortBy=createdAt&sortOrder=desc'),
        api.get('/hr/payroll?limit=3&sortBy=createdAt&sortOrder=desc'),
      ]);
      setMyLeaves(leaveRes.data?.data?.leaveRequests ?? leaveRes.data?.data ?? []);
      setMyPayrolls(payrollRes.data?.data?.payrolls ?? payrollRes.data?.data ?? []);
    } catch (err: any) {
      if (err?.response?.status !== 401) setError('Erreur de chargement.');
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
        <h1 className="text-2xl font-bold text-gray-900">Mon espace</h1>
        <p className="text-gray-500 text-sm mt-1">Vos informations personnelles</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mes demandes de conge */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Mes demandes de conge</h2>
            <Link to="/hr/leave-requests" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          {myLeaves.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune demande</p>
          ) : (
            <div className="space-y-2">
              {myLeaves.map((leave: any) => (
                <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{leave.leaveType ?? leave.type ?? 'Conge'}</p>
                      <p className="text-xs text-gray-500">
                        {leave.startDate ? new Date(leave.startDate).toLocaleDateString('fr-FR') : '—'}
                        {' '}-{' '}
                        {leave.endDate ? new Date(leave.endDate).toLocaleDateString('fr-FR') : '—'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[leave.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[leave.status] ?? leave.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mes bulletins de paie */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Mes bulletins de paie</h2>
            <Link to="/hr/payroll" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          {myPayrolls.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun bulletin disponible</p>
          ) : (
            <div className="space-y-2">
              {myPayrolls.map((pay: any) => (
                <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">{pay.period ?? pay.month ?? '—'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${pay.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {pay.status === 'paid' ? 'Paye' : pay.status ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action rapide */}
      <div>
        <Link to="/hr/leave-requests"
          className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-3 hover:bg-blue-700 transition-colors font-medium">
          <Calendar size={18} />
          Faire une demande de conge
        </Link>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
