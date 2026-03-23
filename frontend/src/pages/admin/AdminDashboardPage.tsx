import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, CreditCard, DollarSign, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import adminService, { GlobalStats } from '../../services/admin.service';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/formatters';

function AdminDashboardPage() {
  const navigate = useNavigate();
  const { showError } = useToastContext();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [growthData, setGrowthData] = useState<Array<{ month: string; entreprises: number }>>([]);
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenus: number }>>([]);

  useEffect(() => {
    loadStats();
    loadChartData();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getGlobalStats();
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des statistiques');
      showError(err.response?.data?.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      // Charger les données réelles depuis le backend
      const [revenueResponse, growthResponse] = await Promise.all([
        adminService.getMonthlyRevenueData(),
        adminService.getCompanyGrowthData(),
      ]);
      
      setRevenueData(revenueResponse.data);
      setGrowthData(growthResponse.data);
    } catch (err: any) {
      // En cas d'erreur, on continue avec des données vides plutôt que de bloquer
      console.error('Erreur lors du chargement des données de graphiques:', err);
      setRevenueData([]);
      setGrowthData([]);
    }
  };

  // Générer des données pour les graphiques - TOUS LES HOOKS DOIVENT ÊTRE AVANT LES RETURNS CONDITIONNELS
  const planDistributionData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.subscriptions.byPlan).map(([name, count]) => ({
      name,
      value: count as number,
    }));
  }, [stats]);

  const COLORS = ['#1FAB89', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];

  // Retours conditionnels APRÈS tous les hooks
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">Panneau d'Administration</h1>
        <p className="text-text-secondary mt-1">
          Vue d'ensemble de la plateforme Conta
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entreprises */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Total Entreprises</p>
              <p className="text-2xl font-bold text-text-primary">{stats.companies.total}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-text-secondary">
                  {stats.companies.active} actives
                </span>
                {stats.companies.newLast30Days > 0 && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp size={12} />
                    +{stats.companies.newLast30Days} (30j)
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Utilisateurs */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-text-primary">{stats.users.total}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-text-secondary">
                  {stats.users.activeLast30Days} actifs (30j)
                </span>
                {stats.users.accountants > 0 && (
                  <span className="text-xs text-purple-600">
                    {stats.users.accountants} experts
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Abonnements */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Abonnements Actifs</p>
              <p className="text-2xl font-bold text-text-primary">{stats.subscriptions.total}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-text-secondary">
                  Taux: {stats.subscriptions.conversionRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        {/* Revenus */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Revenus du Mois</p>
              <p className="text-2xl font-bold text-text-primary">
                {formatCurrency(stats.revenue.currentMonth)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-text-secondary">
                  Année: {formatCurrency(stats.revenue.currentYear)}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique de croissance des entreprises */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Évolution des Entreprises (12 mois)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorEntreprises" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="entreprises"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorEntreprises)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique de revenus */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Évolution des Revenus (12 mois)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(0)}k`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px',
                }}
                formatter={(value: number) => formatCurrency(value, 'CDF')}
              />
              <Bar dataKey="revenus" fill="#1FAB89" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Répartition des plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Répartition par Plan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {Object.entries(stats.subscriptions.byPlan).map(([plan, count]) => (
            <div key={plan} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-text-muted mb-1">{plan}</p>
              <p className="text-2xl font-bold text-text-primary">{count as number}</p>
            </div>
          ))}
        </div>
        </div>

        {/* Graphique en camembert */}
        {planDistributionData.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Répartition des Abonnements</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planDistributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/admin/companies')}
          className="card hover:shadow-lg transition-shadow text-left w-full"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Gérer les Entreprises</h3>
              <p className="text-sm text-text-secondary">Voir et gérer toutes les entreprises</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/plans')}
          className="card hover:shadow-lg transition-shadow text-left w-full"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="text-purple-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Gérer les Plans</h3>
              <p className="text-sm text-text-secondary">Modifier les prix et fonctionnalités</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/users')}
          className="card hover:shadow-lg transition-shadow text-left w-full"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Utilisateurs Conta</h3>
              <p className="text-sm text-text-secondary">Gérer les utilisateurs internes</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

export default AdminDashboardPage;

