/**
 * DOC-10 : Dashboard Owner / Admin
 * KPIs CA, factures, paiements + listes récentes + graphique mensuel
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, FileText, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import dashboardService, { DashboardStats } from '../../services/dashboard.service';
import api from '../../services/api';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(n);

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée',
  partial: 'Partiel', overdue: 'En retard', cancelled: 'Annulée',
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', partial: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500',
};

export function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [statsData, invRes, payRes] = await Promise.all([
        dashboardService.getStats(),
        api.get('/invoices?limit=5&sortBy=createdAt&sortOrder=desc'),
        api.get('/payments?limit=5&sortBy=createdAt&sortOrder=desc'),
      ]);
      setStats(statsData);
      setInvoices(invRes.data?.data?.invoices ?? invRes.data?.data ?? []);
      setPayments(payRes.data?.data?.payments ?? payRes.data?.data ?? []);
    } catch (err: any) {
      if (err?.response?.status !== 401) setError('Erreur de chargement des données.');
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

  const chartData = stats?.revenueByMonth?.slice(-6) ?? [];

  return (
    <div className="p-6 space-y-6 bg-[#FAFBFC] min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="CA du mois" value={fmt(stats?.revenueThisMonth ?? 0)} icon={TrendingUp} color="bg-blue-600" />
        <KpiCard label="Factures impayées" value={String(stats?.unpaidInvoices ?? 0)} icon={FileText} color="bg-orange-500" />
        <KpiCard label="Paiements ce mois" value={fmt(stats?.paymentsThisMonth ?? 0)} icon={CreditCard} color="bg-green-600" />
        <KpiCard label="Dépenses du mois" value={fmt(stats?.expensesThisMonth ?? 0)} icon={DollarSign} color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières factures */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Dernières factures</h2>
            <Link to="/invoices" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
          </div>
          {invoices.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune facture</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv: any) => (
                <Link key={inv.id} to={`/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber || inv.number}</p>
                    <p className="text-xs text-gray-500">{inv.customer?.name ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{fmt(inv.totalAmount ?? inv.total ?? 0)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Derniers paiements */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Derniers paiements</h2>
            <Link to="/payments" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun paiement</p>
          ) : (
            <div className="space-y-2">
              {payments.map((pay: any) => (
                <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{pay.reference ?? pay.invoiceNumber ?? '—'}</p>
                    <p className="text-xs text-gray-500">
                      {pay.paymentDate ? new Date(pay.paymentDate).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-green-700">{fmt(pay.amount ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Graphique CA mensuel */}
      {chartData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Chiffre d'affaires — 6 derniers mois</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => fmt(v)} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;
