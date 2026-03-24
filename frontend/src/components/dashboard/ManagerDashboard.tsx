/**
 * DOC-10 : Dashboard Manager
 * Factures draft + dépenses en attente d'approbation
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Receipt, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(n);

export function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [draftInvoices, setDraftInvoices] = useState<any[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [invRes, expRes] = await Promise.all([
        api.get('/invoices?limit=5&status=draft&sortBy=createdAt&sortOrder=desc'),
        api.get('/expenses/approvals/pending'),
      ]);
      setDraftInvoices(invRes.data?.data?.invoices ?? invRes.data?.data ?? []);
      setPendingExpenses(expRes.data?.data?.approvals ?? expRes.data?.data ?? []);
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
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Actions en attente</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Factures brouillon</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{draftInvoices.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-600">
            <FileText className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Dépenses en attente</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{pendingExpenses.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-500">
            <Receipt className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factures draft */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Factures à envoyer</h2>
            <Link to="/invoices?status=draft" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          {draftInvoices.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune facture en brouillon</p>
          ) : (
            <div className="space-y-2">
              {draftInvoices.map((inv: any) => (
                <Link key={inv.id} to={`/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber ?? inv.number}</p>
                    <p className="text-xs text-gray-500">{inv.customer?.name ?? '—'}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{fmt(inv.totalAmount ?? inv.total ?? 0)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Dépenses en attente */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Dépenses à approuver</h2>
            <Link to="/expenses/approvals" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          {pendingExpenses.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune dépense en attente</p>
          ) : (
            <div className="space-y-2">
              {pendingExpenses.map((exp: any) => (
                <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{exp.expense?.description ?? exp.description ?? '—'}</p>
                    <p className="text-xs text-gray-500">{exp.requestedBy?.name ?? exp.employee?.name ?? '—'}</p>
                  </div>
                  <span className="text-sm font-medium text-orange-700">{fmt(exp.expense?.amount ?? exp.amount ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/invoices/new"
          className="bg-blue-600 text-white rounded-xl p-4 flex items-center gap-3 hover:bg-blue-700 transition-colors">
          <FileText size={20} />
          <span className="font-medium">Créer une facture</span>
        </Link>
        <Link to="/expenses/approvals"
          className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <Receipt size={20} className="text-orange-500" />
          <span className="font-medium text-gray-900">Approuver les dépenses</span>
        </Link>
      </div>
    </div>
  );
}

export default ManagerDashboard;
