/**
 * DOC-10 : Dashboard RH
 * Employes actifs, conges en attente, paies a valider
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, DollarSign, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export function RHDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [draftPayrolls, setDraftPayrolls] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [empRes, leaveRes, payrollRes] = await Promise.all([
        api.get('/hr/employees?limit=1'),
        api.get('/hr/leave-requests?status=pending&limit=5'),
        api.get('/hr/payroll?status=draft&limit=5'),
      ]);
      const empData = empRes.data?.data;
      setTotalEmployees(empData?.total ?? empData?.pagination?.total ?? empData?.employees?.length ?? 0);
      setPendingLeaves(leaveRes.data?.data?.leaveRequests ?? leaveRes.data?.data ?? []);
      setDraftPayrolls(payrollRes.data?.data?.payrolls ?? payrollRes.data?.data ?? []);
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
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord RH</h1>
        <p className="text-gray-500 text-sm mt-1">Gestion des ressources humaines</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Employes actifs</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalEmployees}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-600"><Users className="h-6 w-6 text-white" /></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Conges en attente</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{pendingLeaves.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-500"><Calendar className="h-6 w-6 text-white" /></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Paies a valider</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{draftPayrolls.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-green-600"><DollarSign className="h-6 w-6 text-white" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Conges a approuver</h2>
            <Link to="/hr/leave-requests" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          {pendingLeaves.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune demande en attente</p>
          ) : (
            <div className="space-y-2">
              {pendingLeaves.map((leave: any) => (
                <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {leave.employee?.firstName} {leave.employee?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{leave.leaveType ?? leave.type ?? '—'}</p>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {leave.daysRequested ?? leave.days ?? '?'} jour(s)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Paies a valider</h2>
            <Link to="/hr/payroll" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          {draftPayrolls.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune paie en attente</p>
          ) : (
            <div className="space-y-2">
              {draftPayrolls.map((pay: any) => (
                <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {pay.employee?.firstName} {pay.employee?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{pay.period ?? pay.month ?? '—'}</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Brouillon</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/hr/employees" className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <Users size={20} className="text-blue-600" />
          <span className="font-medium text-gray-900">Employes</span>
        </Link>
        <Link to="/hr/leave-requests" className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <Calendar size={20} className="text-orange-500" />
          <span className="font-medium text-gray-900">Conges</span>
        </Link>
        <Link to="/hr/payroll" className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <DollarSign size={20} className="text-green-600" />
          <span className="font-medium text-gray-900">Paie</span>
        </Link>
      </div>
    </div>
  );
}

export default RHDashboard;
