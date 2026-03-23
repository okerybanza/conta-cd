import { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  Calendar,
  Building2,
  Plus,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import adminService from '../../services/admin.service';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface SubscriptionWithPayment {
  id: string;
  status: string;
  billingCycle: string;
  startDate: string;
  endDate: string | null;
  nextPaymentDate: string | null;
  lastPaymentDate: string | null;
  paymentMethod: string | null;
  package: {
    id: string;
    name: string;
    price: string;
    currency: string;
  };
  company: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  paymentStatus: {
    isOverdue: boolean;
    daysUntilPayment: number | null;
    lastPaymentDate: string | null;
    nextPaymentDate: string | null;
    paymentMethod: string | null;
  };
}

function AdminPaymentsPage() {
  const { showSuccess, showError } = useToastContext();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: '',
    paymentOverdue: false,
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithPayment | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency: 'USD',
    paymentMethod: 'bank_transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionReference: '',
    notes: '',
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, [pagination.page, filters.status, filters.paymentOverdue]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsResponse, statsResponse] = await Promise.all([
        adminService.getSubscriptionsWithPayments({
          status: filters.status || undefined,
          paymentOverdue: filters.paymentOverdue,
          page: pagination.page,
          limit: pagination.limit,
        }).catch((err) => {
          // Si erreur, retourner une structure vide
          console.error('Error loading subscriptions:', err);
          return {
            data: [],
            pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
          };
        }),
        adminService.getPaymentStatistics().catch((err) => {
          // Si erreur, retourner des stats vides
          console.error('Error loading statistics:', err);
          return {
            data: {
              activeSubscriptions: 0,
              overdueSubscriptions: 0,
              expiringThisMonth: 0,
              monthlyRevenue: 0,
              yearlyRevenue: 0,
              statusDistribution: [],
              billingCycleDistribution: [],
            },
          };
        }),
      ]);

      let filtered = subsResponse.data;
      if (filters.search) {
        filtered = filtered.filter(
          (sub: SubscriptionWithPayment) =>
            sub.company.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            sub.company.email.toLowerCase().includes(filters.search.toLowerCase()) ||
            sub.package.name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setSubscriptions(filtered);
      setPagination({
        ...pagination,
        total: subsResponse.pagination.total,
        totalPages: subsResponse.pagination.totalPages,
      });
      setStatistics(statsResponse.data);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedSubscription || !paymentForm.amount || !paymentForm.paymentMethod) {
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSavingPayment(true);
      await adminService.recordSubscriptionPayment(selectedSubscription.id, {
        amount: parseFloat(paymentForm.amount),
        currency: paymentForm.currency,
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        transactionReference: paymentForm.transactionReference || undefined,
        notes: paymentForm.notes || undefined,
      });

      showSuccess('Paiement enregistré avec succès');
      setShowPaymentModal(false);
      setSelectedSubscription(null);
      setPaymentForm({
        amount: '',
        currency: 'USD',
        paymentMethod: 'bank_transfer',
        paymentDate: new Date().toISOString().split('T')[0],
        transactionReference: '',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleViewHistory = async (subscription: SubscriptionWithPayment) => {
    setSelectedSubscription(subscription);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const response = await adminService.getSubscriptionPaymentHistory(subscription.id);
      setPaymentHistory(response.data);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
      trial: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
      expired: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };
    const badge = badges[status] || badges.active;
    const Icon = badge.icon;
    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} text-xs font-medium rounded-full flex items-center gap-1`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  if (loading && !statistics) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">Gestion des Paiements</h1>
        <p className="text-text-secondary mt-1">
          Gérez les paiements d'abonnement et suivez les statistiques
        </p>
      </div>

      {/* Statistiques */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Abonnements Actifs</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {statistics.activeSubscriptions}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">En Retard</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {statistics.overdueSubscriptions}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Revenus Mensuels</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {formatCurrency(statistics.monthlyRevenue, 'USD')}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Expirant ce Mois</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {statistics.expiringThisMonth}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graphiques de répartition */}
      {statistics && (statistics.statusDistribution?.length > 0 || statistics.billingCycleDistribution?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Répartition par statut */}
          {statistics.statusDistribution?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Répartition par Statut</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statistics.statusDistribution.map((item: any) => ({
                      name: item.status,
                      value: item.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statistics.statusDistribution.map((_: any, index: number) => {
                      const COLORS = ['#1FAB89', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];
                      return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Répartition par cycle de facturation */}
          {statistics.billingCycleDistribution?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Répartition par Cycle</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statistics.billingCycleDistribution.map((item: any) => ({
                      name: item.billingCycle === 'monthly' ? 'Mensuel' : 'Annuel',
                      value: item.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statistics.billingCycleDistribution.map((_: any, index: number) => {
                      const COLORS = ['#1FAB89', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];
                      return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input w-full pl-10"
                placeholder="Entreprise, email, plan..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="input w-full"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="trial">Essai</option>
              <option value="cancelled">Annulé</option>
              <option value="expired">Expiré</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Filtre</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.paymentOverdue}
                onChange={(e) => {
                  setFilters({ ...filters, paymentOverdue: e.target.checked });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="rounded"
              />
              <span className="text-sm">En retard de paiement</span>
            </label>
          </div>
        </div>
      </div>

      {/* Liste des abonnements */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="mx-auto text-text-muted mb-4" size={48} />
          <p className="text-text-secondary">Aucun abonnement trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className={`card ${sub.paymentStatus.isOverdue ? 'border-l-4 border-l-red-500' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{sub.company.name}</h3>
                      <p className="text-sm text-text-secondary">{sub.company.email}</p>
                    </div>
                    {getStatusBadge(sub.status)}
                    {sub.paymentStatus.isOverdue && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center gap-1">
                        <AlertTriangle size={12} />
                        En retard
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-text-secondary">Plan</p>
                      <p className="font-medium text-text-primary">{sub.package.name}</p>
                      <p className="text-xs text-text-muted">
                        {formatCurrency(Number(sub.package.price), sub.package.currency)} /{' '}
                        {sub.billingCycle === 'monthly' ? 'mois' : 'an'}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary">Dernier paiement</p>
                      <p className="font-medium text-text-primary">
                        {sub.paymentStatus.lastPaymentDate
                          ? formatDate(sub.paymentStatus.lastPaymentDate)
                          : 'Aucun'}
                      </p>
                      {sub.paymentStatus.paymentMethod && (
                        <p className="text-xs text-text-muted">{sub.paymentStatus.paymentMethod}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-text-secondary">Prochain paiement</p>
                      <p className="font-medium text-text-primary">
                        {sub.paymentStatus.nextPaymentDate
                          ? formatDate(sub.paymentStatus.nextPaymentDate)
                          : 'N/A'}
                      </p>
                      {sub.paymentStatus.daysUntilPayment !== null && (
                        <p
                          className={`text-xs ${
                            sub.paymentStatus.daysUntilPayment < 0
                              ? 'text-red-600'
                              : sub.paymentStatus.daysUntilPayment < 7
                              ? 'text-yellow-600'
                              : 'text-text-muted'
                          }`}
                        >
                          {sub.paymentStatus.daysUntilPayment < 0
                            ? `${Math.abs(sub.paymentStatus.daysUntilPayment)} jours de retard`
                            : `${sub.paymentStatus.daysUntilPayment} jours restants`}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-text-secondary">Date de fin</p>
                      <p className="font-medium text-text-primary">
                        {sub.endDate ? formatDate(sub.endDate) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleViewHistory(sub)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Eye size={18} />
                    <span>Historique</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSubscription(sub);
                      setPaymentForm({
                        amount: sub.package.price,
                        currency: sub.package.currency || 'USD',
                        paymentMethod: sub.paymentStatus.paymentMethod || 'bank_transfer',
                        paymentDate: new Date().toISOString().split('T')[0],
                        transactionReference: '',
                        notes: '',
                      });
                      setShowPaymentModal(true);
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={18} />
                    <span>Enregistrer Paiement</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
            disabled={pagination.page === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-text-secondary">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPagination({ ...pagination, page: Math.min(pagination.totalPages, pagination.page + 1) })
            }
            disabled={pagination.page >= pagination.totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modal d'enregistrement de paiement */}
      {showPaymentModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-text-primary">
                Enregistrer un Paiement
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {selectedSubscription.company.name} - {selectedSubscription.package.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Montant <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="input w-full"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Devise</label>
                  <select
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                    className="input w-full"
                  >
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Méthode de paiement <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="input w-full"
                  >
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="cash">Espèces</option>
                    <option value="check">Chèque</option>
                    <option value="card">Carte bancaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Date de paiement <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Référence de transaction
                </label>
                <input
                  type="text"
                  value={paymentForm.transactionReference}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, transactionReference: e.target.value })
                  }
                  className="input w-full"
                  placeholder="Numéro de transaction, chèque, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="input w-full"
                  rows={3}
                  placeholder="Notes supplémentaires..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedSubscription(null);
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button onClick={handleRecordPayment} disabled={savingPayment} className="btn-primary">
                {savingPayment ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} className="mr-2" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal historique */}
      {showHistoryModal && paymentHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-text-primary">Historique des Paiements</h3>
              <p className="text-sm text-text-secondary mt-1">
                {selectedSubscription?.company.name} - {selectedSubscription?.package.name}
              </p>
            </div>

            <div className="p-6">
              {loadingHistory ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : paymentHistory.history.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto text-text-muted mb-4" size={48} />
                  <p className="text-text-secondary">Aucun paiement enregistré</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.history.map((payment: any) => (
                    <div key={payment.id} className="card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-text-primary">
                            {formatCurrency(payment.amount, payment.currency)}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {formatDate(payment.date)} • {payment.paymentMethod}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setPaymentHistory(null);
                  setSelectedSubscription(null);
                }}
                className="btn-secondary w-full"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPaymentsPage;

