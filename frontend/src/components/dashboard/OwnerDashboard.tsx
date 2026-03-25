/**
 * DOC-10 : Dashboard Owner / Admin - Version améliorée
 * KPIs avec variations, Finance Score, graphiques avancés, objectifs
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, FileText, TrendingUp, TrendingDown, CreditCard, AlertCircle, 
  ArrowUpRight, ArrowDownRight, Target, Award, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import dashboardService, { DashboardStats } from '../../services/dashboard.service';
import api from '../../services/api';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(n);

const fmtPercent = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

// Composant KPI avec variation
function KpiCard({ 
  label, 
  value, 
  variation, 
  icon: Icon, 
  color,
  trend 
}: { 
  label: string; 
  value: string; 
  variation?: number;
  icon: any; 
  color: string;
  trend?: 'up' | 'down';
}) {
  const isPositive = variation !== undefined && variation >= 0;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {variation !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          <TrendIcon className={`h-4 w-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {fmtPercent(variation)}
          </span>
          <span className="text-xs text-gray-500">vs mois dernier</span>
        </div>
      )}
    </div>
  );
}

// Composant Finance Score
function FinanceScoreCard({ stats }: { stats: DashboardStats | null }) {
  if (!stats) return null;

  // Calcul du score (0-100)
  const collectionScore = stats.collectionRate || 0;
  const profitScore = Math.min(100, Math.max(0, (stats.profitMargin || 0) + 50));
  const paymentScore = Math.max(0, 100 - (stats.averageDaysToPay / 60) * 100);
  const overdueScore = stats.totalInvoices > 0 
    ? Math.max(0, 100 - (stats.overdueInvoices / stats.totalInvoices) * 100)
    : 100;

  const finalScore = Math.round(
    collectionScore * 0.4 + 
    profitScore * 0.3 + 
    paymentScore * 0.2 + 
    overdueScore * 0.1
  );

  const getRating = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-600' };
    if (score >= 70) return { label: 'Bon', color: 'text-blue-600', bg: 'bg-blue-600' };
    if (score >= 50) return { label: 'Moyen', color: 'text-orange-600', bg: 'bg-orange-600' };
    return { label: 'Faible', color: 'text-red-600', bg: 'bg-red-600' };
  };

  const rating = getRating(finalScore);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Score Financier</h3>
      </div>
      <div className="text-center py-4">
        <p className="text-4xl font-bold text-gray-900">{finalScore}%</p>
        <p className={`text-lg font-medium ${rating.color} mt-1`}>{rating.label}</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
        <div 
          className={`${rating.bg} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${finalScore}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
        <div>
          <p className="text-gray-500">Recouvrement</p>
          <p className="font-medium">{collectionScore.toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-gray-500">Marge</p>
          <p className="font-medium">{stats.profitMargin?.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-gray-500">Délai paiement</p>
          <p className="font-medium">{stats.averageDaysToPay}j</p>
        </div>
        <div>
          <p className="text-gray-500">Retards</p>
          <p className="font-medium">{stats.overdueInvoices}</p>
        </div>
      </div>
    </div>
  );
}

// Composant Trésorerie
function TreasuryCard({ stats }: { stats: DashboardStats | null }) {
  if (!stats) return null;

  const netTreasury = stats.totalRevenue - stats.totalExpenses;
  const isPositive = netTreasury >= 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Trésorerie</h3>
      </div>
      <p className="text-sm text-gray-500 mb-2">Solde net</p>
      <p className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {fmt(netTreasury)}
      </p>
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
        <div>
          <p className="text-xs text-gray-500">Revenus</p>
          <p className="text-sm font-medium text-green-600">{fmt(stats.totalRevenue)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Dépenses</p>
          <p className="text-sm font-medium text-red-600">{fmt(stats.totalExpenses)}</p>
        </div>
      </div>
    </div>
  );
}

// Composant Top Clients
function TopCustomersCard({ stats }: { stats: DashboardStats | null }) {
  if (!stats || !stats.topCustomers || stats.topCustomers.length === 0) return null;

  const maxRevenue = Math.max(...stats.topCustomers.map(c => c.totalRevenue));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Meilleurs clients</h3>
      <div className="space-y-3">
        {stats.topCustomers.slice(0, 5).map((customer, index) => {
          const percentage = (customer.totalRevenue / maxRevenue) * 100;
          return (
            <div key={customer.customerId}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {customer.customerName || 'Client inconnu'}
                </p>
                <p className="text-sm font-semibold text-gray-900">{fmt(customer.totalRevenue)}</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{customer.invoiceCount} facture(s)</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Composant Objectifs Financiers
function FinancialGoalsCard({ stats }: { stats: DashboardStats | null }) {
  if (!stats) return null;

  const goals = [
    {
      name: 'Taux de recouvrement',
      target: 100,
      current: stats.collectionRate || 0,
      color: 'bg-green-600',
    },
    {
      name: 'Marge bénéficiaire',
      target: 30,
      current: Math.max(0, stats.profitMargin || 0),
      color: 'bg-blue-600',
    },
    {
      name: 'Délai de paiement',
      target: 30,
      current: Math.max(0, 30 - (stats.averageDaysToPay - 30)),
      color: 'bg-purple-600',
      inverse: true,
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Objectifs financiers</h3>
      </div>
      <div className="space-y-4">
        {goals.map((goal, index) => {
          const percentage = Math.min(100, (goal.current / goal.target) * 100);
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">{goal.name}</p>
                <p className="text-sm font-semibold text-gray-900">
                  {goal.current.toFixed(0)}{goal.inverse ? 'j' : '%'} / {goal.target}{goal.inverse ? 'j' : '%'}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`${goal.color} h-2.5 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
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
  const profit = (stats?.revenueThisMonth ?? 0) - (stats?.expensesThisMonth ?? 0);
  const profitGrowth = stats?.revenueLastMonth && stats?.expensesLastMonth
    ? ((profit - ((stats.revenueLastMonth ?? 0) - (stats.expensesLastMonth ?? 0))) / 
       Math.abs((stats.revenueLastMonth ?? 0) - (stats.expensesLastMonth ?? 0))) * 100
    : 0;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-[#FAFBFC] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de votre activité</p>
        </div>
        <button 
          onClick={load}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* KPIs avec variations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          label="Revenus du mois" 
          value={fmt(stats?.revenueThisMonth ?? 0)} 
          variation={stats?.revenueGrowth}
          icon={TrendingUp} 
          color="bg-blue-600" 
        />
        <KpiCard 
          label="Dépenses du mois" 
          value={fmt(stats?.expensesThisMonth ?? 0)} 
          variation={stats?.expensesGrowth}
          icon={CreditCard} 
          color="bg-orange-500" 
        />
        <KpiCard 
          label="Profit du mois" 
          value={fmt(profit)} 
          variation={profitGrowth}
          icon={DollarSign} 
          color={profit >= 0 ? 'bg-green-600' : 'bg-red-600'} 
        />
        <KpiCard 
          label="Factures impayées" 
          value={fmt(stats?.unpaidAmount ?? 0)}
          icon={FileText} 
          color="bg-purple-600" 
        />
      </div>

      {/* Ligne 2: Graphique + Score + Trésorerie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Graphique Cashflow */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Cashflow — 6 derniers mois</h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span className="text-gray-600">Revenus</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span className="text-gray-600">Dépenses</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => fmt(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#dc2626" 
                strokeWidth={2} 
                dot={{ r: 4 }}
                data={stats?.expensesByMonth?.slice(-6) ?? []}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Colonne droite: Score + Trésorerie */}
        <div className="space-y-4">
          <FinanceScoreCard stats={stats} />
          <TreasuryCard stats={stats} />
        </div>
      </div>

      {/* Ligne 3: Top Clients + Objectifs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <TopCustomersCard stats={stats} />
        <FinancialGoalsCard stats={stats} />
      </div>

      {/* Ligne 4: Factures + Paiements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Dernières factures */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Dernières factures</h2>
            <Link to="/invoices" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
          </div>
          {invoices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune facture</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv: any) => (
                <Link key={inv.id} to={`/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{inv.invoiceNumber || inv.number}</p>
                    <p className="text-xs text-gray-500 truncate">{inv.customer?.name ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{fmt(inv.totalAmount ?? inv.total ?? 0)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
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
            <p className="text-sm text-gray-400 text-center py-8">Aucun paiement</p>
          ) : (
            <div className="space-y-2">
              {payments.map((pay: any) => (
                <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{pay.reference ?? pay.invoiceNumber ?? '—'}</p>
                    <p className="text-xs text-gray-500">
                      {pay.paymentDate ? new Date(pay.paymentDate).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-green-700 whitespace-nowrap ml-3">{fmt(pay.amount ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;
