import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Mail, Phone, MapPin, Users, CreditCard, 
  Loader2, AlertCircle, Package, Ban, CheckCircle2,
  Save, AlertTriangle, BarChart3
} from 'lucide-react';
import adminService from '../../services/admin.service';
import { useToastContext } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/formatters';
import api from '../../services/api';

interface CompanyDetail {
  id: string;
  name: string;
  businessName?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  nif?: string;
  rccm?: string;
  logoUrl?: string;
  deletedAt?: string | null;
  createdAt: string;
  subscription?: {
    id: string;
    status: string;
    billingCycle: string;
    startDate: string;
    endDate?: string;
    package: {
      id: string;
      name: string;
      code: string;
      price: number;
      currency: string;
      limits: Record<string, any>;
      features: Record<string, boolean>;
    };
  };
  users: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    lastLoginAt?: string;
    createdAt: string;
  }>;
  _count?: {
    customers: number;
    invoices: number;
    products: number;
  };
}

interface UsageData {
  customers: number;
  invoices: number;
  products: number;
  users: number;
  expenses: number;
  suppliers: number;
}

interface Package {
  id: string;
  code: string;
  name: string;
  price: number;
  currency: string;
}

function AdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);

  useEffect(() => {
    if (id) {
      loadCompany();
      loadUsage();
      loadPackages();
    }
  }, [id]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCompanyById(id!);
      // Le backend retourne déjà les users, donc on peut utiliser directement response.data
      setCompany(response.data as CompanyDetail);
      if (response.data.subscription) {
        setSelectedPackageId(response.data.subscription.package.id);
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du chargement de l\'entreprise');
    } finally {
      setLoading(false);
    }
  };

  const loadUsage = async () => {
    try {
      const response = await api.get(`/super-admin/companies/${id}/usage`);
      setUsage(response.data.data);
    } catch (err: any) {
      console.error('Error loading usage:', err);
      // Ne pas afficher d'erreur si l'endpoint n'existe pas encore
    }
  };

  const loadPackages = async () => {
    try {
      const response = await adminService.getPackages();
      setPackages(response.data);
    } catch (err: any) {
      console.error('Error loading packages:', err);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPackageId || !company) return;

    try {
      setSaving(true);
      await api.put(`/super-admin/companies/${id}/subscription`, {
        packageId: selectedPackageId,
        notifyUser,
      });
      showSuccess('Plan modifié avec succès');
      setShowChangePlan(false);
      loadCompany();
      loadUsage();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la modification du plan');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (!company) return;

    try {
      setSaving(true);
      await api.put(`/super-admin/companies/${id}/status`, {
        status: company.deletedAt ? 'active' : 'suspended',
        reason: suspendReason,
      });
      showSuccess(company.deletedAt ? 'Entreprise réactivée avec succès' : 'Entreprise suspendue avec succès');
      setShowSuspendModal(false);
      setSuspendReason('');
      loadCompany();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la modification du statut');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <p className="text-text-secondary">Entreprise non trouvée</p>
        </div>
      </div>
    );
  }

  const subscription = company.subscription;
  const limits = subscription?.package.limits || {};
  const isSuspended = !!company.deletedAt;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/companies')}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span>Retour</span>
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold text-text-primary">{company.name}</h1>
            {company.businessName && (
              <p className="text-text-secondary mt-1">{company.businessName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {subscription && (
            <button
              onClick={() => setShowChangePlan(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Package size={18} />
              <span>Changer le plan</span>
            </button>
          )}
          <button
            onClick={() => setShowSuspendModal(true)}
            className={`btn-secondary flex items-center gap-2 ${isSuspended ? 'text-green-600' : 'text-red-600'}`}
          >
            {isSuspended ? <CheckCircle2 size={18} /> : <Ban size={18} />}
            <span>{isSuspended ? 'Réactiver' : 'Suspendre'}</span>
          </button>
        </div>
      </div>

      {/* Statut suspendu */}
      {isSuspended && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={20} />
            <span className="font-medium">Cette entreprise est suspendue</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations générales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de l'entreprise */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Building2 size={20} />
              Informations de l'entreprise
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Email</label>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-text-muted" />
                  <span className="text-text-primary">{company.email}</span>
                </div>
              </div>
              {company.phone && (
                <div>
                  <label className="block text-sm text-text-muted mb-1">Téléphone</label>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-text-muted" />
                    <span className="text-text-primary">{company.phone}</span>
                  </div>
                </div>
              )}
              {(company.city || company.country) && (
                <div>
                  <label className="block text-sm text-text-muted mb-1">Localisation</label>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-text-muted" />
                    <span className="text-text-primary">
                      {company.city}
                      {company.city && company.country && ', '}
                      {company.country}
                    </span>
                  </div>
                </div>
              )}
              {company.nif && (
                <div>
                  <label className="block text-sm text-text-muted mb-1">NIF</label>
                  <span className="text-text-primary">{company.nif}</span>
                </div>
              )}
              {company.rccm && (
                <div>
                  <label className="block text-sm text-text-muted mb-1">RCCM</label>
                  <span className="text-text-primary">{company.rccm}</span>
                </div>
              )}
              <div>
                <label className="block text-sm text-text-muted mb-1">Date de création</label>
                <span className="text-text-primary">{formatDate(company.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Abonnement */}
          {subscription && (
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <CreditCard size={20} />
                Abonnement
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Plan actuel</span>
                  <span className="font-semibold text-text-primary">{subscription.package.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Statut</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      subscription.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : subscription.status === 'trial'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {subscription.status === 'active' ? 'Actif' : subscription.status === 'trial' ? 'Essai' : subscription.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Cycle de facturation</span>
                  <span className="text-text-primary">
                    {subscription.billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Prix</span>
                  <span className="font-semibold text-text-primary">
                    {subscription.package.price.toLocaleString('fr-FR')} {subscription.package.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Date de début</span>
                  <span className="text-text-primary">{formatDate(subscription.startDate)}</span>
                </div>
                {subscription.endDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Date de fin</span>
                    <span className="text-text-primary">{formatDate(subscription.endDate)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Utilisateurs */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Users size={20} />
              Utilisateurs ({company.users.length})
            </h2>
            <div className="space-y-2">
              {company.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-text-primary">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-text-secondary">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                      {user.role}
                    </span>
                    {user.lastLoginAt && (
                      <p className="text-xs text-text-muted mt-1">
                        Dernière connexion: {formatDate(user.lastLoginAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usage et limites */}
        <div className="space-y-6">
          {/* Usage réel */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Usage réel
            </h2>
            {usage && subscription ? (
              <div className="space-y-4">
                {/* Clients */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">Clients</span>
                    <span className="text-sm font-medium text-text-primary">
                      {usage.customers} / {limits.customers === null ? '∞' : limits.customers}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        limits.customers === null
                          ? 'bg-green-500'
                          : usage.customers >= limits.customers
                          ? 'bg-red-500'
                          : usage.customers >= limits.customers * 0.8
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${
                          limits.customers === null
                            ? 0
                            : Math.min(100, (usage.customers / limits.customers) * 100)
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Factures */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">Factures</span>
                    <span className="text-sm font-medium text-text-primary">
                      {usage.invoices} / {limits.invoices === null ? '∞' : limits.invoices}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        limits.invoices === null
                          ? 'bg-green-500'
                          : usage.invoices >= limits.invoices
                          ? 'bg-red-500'
                          : usage.invoices >= limits.invoices * 0.8
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${
                          limits.invoices === null
                            ? 0
                            : Math.min(100, (usage.invoices / limits.invoices) * 100)
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Produits */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">Produits</span>
                    <span className="text-sm font-medium text-text-primary">
                      {usage.products} / {limits.products === null ? '∞' : limits.products}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        limits.products === null
                          ? 'bg-green-500'
                          : usage.products >= limits.products
                          ? 'bg-red-500'
                          : usage.products >= limits.products * 0.8
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${
                          limits.products === null
                            ? 0
                            : Math.min(100, (usage.products / limits.products) * 100)
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Utilisateurs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">Utilisateurs</span>
                    <span className="text-sm font-medium text-text-primary">
                      {usage.users} / {limits.users === null ? '∞' : limits.users}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        limits.users === null
                          ? 'bg-green-500'
                          : usage.users >= limits.users
                          ? 'bg-red-500'
                          : usage.users >= limits.users * 0.8
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${
                          limits.users === null
                            ? 0
                            : Math.min(100, (usage.users / limits.users) * 100)
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-text-secondary text-sm">Chargement des données d'usage...</p>
            )}
          </div>

          {/* Statistiques */}
          {company._count && (
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Statistiques</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Clients</span>
                  <span className="font-semibold text-text-primary">{company._count.customers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Factures</span>
                  <span className="font-semibold text-text-primary">{company._count.invoices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Produits</span>
                  <span className="font-semibold text-text-primary">{company._count.products || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal changement de plan */}
      {showChangePlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Changer le plan</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nouveau plan
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="input w-full"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {pkg.price.toLocaleString('fr-FR')} {pkg.currency}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifyUser"
                  checked={notifyUser}
                  onChange={(e) => setNotifyUser(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="notifyUser" className="text-sm text-text-secondary">
                  Notifier l'entreprise par email
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowChangePlan(false)}
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Annuler
              </button>
              <button
                onClick={handleChangePlan}
                disabled={saving || !selectedPackageId}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suspension */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">
              {isSuspended ? 'Réactiver l\'entreprise' : 'Suspendre l\'entreprise'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Raison {isSuspended ? 'de la réactivation' : 'de la suspension'}
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Expliquez la raison..."
                  className="input w-full"
                  rows={3}
                />
              </div>
              {!isSuspended && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <AlertTriangle size={16} className="inline mr-1" />
                    Les utilisateurs de cette entreprise ne pourront plus se connecter.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason('');
                }}
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Annuler
              </button>
              <button
                onClick={handleSuspend}
                disabled={saving || !suspendReason.trim()}
                className={`btn-primary flex-1 flex items-center justify-center gap-2 ${
                  isSuspended ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    {isSuspended ? <CheckCircle2 size={18} /> : <Ban size={18} />}
                    <span>{isSuspended ? 'Réactiver' : 'Suspendre'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCompanyDetailPage;

