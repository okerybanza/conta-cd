import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Mail,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowRight,
  Award,
  Plus,
} from 'lucide-react';
import accountantService from '../../services/accountant.service';
import contractService from '../../services/contract.service';
import { useAuthStore } from '../../store/auth.store';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/formatters';

interface CompanySummary {
  id: string;
  name: string;
  businessName?: string;
  logoUrl?: string;
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  activeCustomers: number;
  status: 'active' | 'pending';
}

interface ConsolidatedStats {
  totalCompanies: number;
  activeCompanies: number;
  pendingRequests: number;
  totalRevenue: number;
  totalInvoices: number;
  unpaidInvoices: number;
  totalUnpaidAmount: number;
  activeCustomers: number;
  upcomingVatAlerts: number;
  activeContracts: number;
}

function AccountantDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showError, showSuccess } = useToastContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ConsolidatedStats | null>(null);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [creatingCabinet, setCreatingCabinet] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Charger les stats consolidées backend
      const apiStats = await accountantService.getDashboardStats();

      // 2. Charger les entreprises gérées pour le détail (cartes "Mes Entreprises")
      const managedCompanies = await accountantService.getManagedCompanies();

      // 3. Charger les demandes en attente (pour cohérence avec l'ancien comportement)
      const requestsResponse = await accountantService.getInvitations('pending');
      const pendingRequestsCount = (requestsResponse as any)?.length || 0;
      setPendingRequests(pendingRequestsCount);

      // 4. Charger les contrats actifs (contrats signés)
      const contractsResponse = await contractService.list({ status: 'signed' });
      const activeContracts = contractsResponse.data?.length || 0;

      const consolidatedStats: ConsolidatedStats = {
        totalCompanies: apiStats.totalCompanies ?? apiStats.activeCompaniesCount ?? managedCompanies.length,
        activeCompanies: apiStats.activeCompanies ?? apiStats.activeCompaniesCount ?? managedCompanies.length,
        pendingRequests: apiStats.pendingInvitations ?? apiStats.pendingInvitationsCount ?? pendingRequestsCount,
        totalRevenue: apiStats.totalRevenue ?? apiStats.totalAmount ?? 0,
        totalInvoices: apiStats.totalInvoices ?? apiStats.invoicesCount ?? 0,
        unpaidInvoices: apiStats.unpaidInvoices ?? apiStats.totalUnpaidInvoices ?? 0,
        totalUnpaidAmount: apiStats.totalUnpaidAmount ?? 0,
        activeCustomers: apiStats.activeCustomers ?? 0,
        upcomingVatAlerts: apiStats.upcomingVatAlerts ?? 0,
        activeContracts,
      };

      setStats(consolidatedStats);

      // Préparer les résumés d'entreprises (top entreprises côté backend si dispo)
      const companiesStats = apiStats.companiesStats || [];
      const companySummaries: CompanySummary[] =
        companiesStats.length > 0
          ? companiesStats.map((c: any) => ({
              id: c.id,
              name: c.name,
              businessName: c.businessName,
              logoUrl: c.logoUrl,
              totalInvoices: c.totalInvoices ?? 0,
              totalRevenue: c.revenue ?? 0,
              pendingInvoices: c.pendingInvoices ?? 0,
              activeCustomers: c.activeCustomers ?? 0,
              status: 'active',
            }))
          : managedCompanies.map((company: any) => ({
              id: company.id,
              name: company.name || company.businessName,
              businessName: company.businessName,
              logoUrl: company.logoUrl,
              totalInvoices: 0,
              totalRevenue: 0,
              pendingInvoices: 0,
              activeCustomers: 0,
              status: company.status || 'active',
            }));

      setCompanies(companySummaries);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du dashboard');
      showError(err.response?.data?.message || 'Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCabinet = async () => {
    if (!user) return;

    // Utiliser le nom du cabinet du profil si disponible
    const profileResponse = await accountantService.getProfile(user.id);
    const profile = profileResponse.data?.profile;
    const cabinetName = profile?.companyName || `Cabinet ${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Mon Cabinet';

    try {
      setCreatingCabinet(true);
      const response = await accountantService.createCabinet({
        name: cabinetName,
        email: user.email,
      });
      
      showSuccess('Cabinet créé avec succès !');
      // Recharger la page pour mettre à jour le contexte
      window.location.reload();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la création du cabinet');
    } finally {
      setCreatingCabinet(false);
    }
  };

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award className="text-primary" size={24} />
            <h1 className="text-3xl font-display font-bold text-text-primary">
              Dashboard Expert Comptable
            </h1>
          </div>
          <p className="text-text-secondary">
            {user?.companyId 
              ? 'Vue consolidée de votre cabinet et de vos entreprises gérées'
              : 'Vue consolidée de toutes vos entreprises gérées'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!user?.companyId && (
            <button
              onClick={handleCreateCabinet}
              disabled={creatingCabinet}
              className="btn-primary flex items-center gap-2"
            >
              {creatingCabinet ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Créer mon cabinet</span>
                </>
              )}
            </button>
          )}
          {pendingRequests > 0 && (
            <button
              onClick={() => navigate('/accountant/requests')}
              className="btn-primary flex items-center gap-2"
            >
              <Mail size={18} />
              <span>Voir les demandes ({pendingRequests})</span>
            </button>
          )}
        </div>
      </div>

      {/* Statistiques consolidées */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted mb-1">Entreprises gérées</p>
                <p className="text-2xl font-bold text-text-primary">
                  {stats.activeCompanies} / {stats.totalCompanies}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="text-primary" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted mb-1">Factures en attente</p>
                <p className="text-2xl font-bold text-text-primary">{stats.unpaidInvoices}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted mb-1">Montant impayé total</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatCurrency(stats.totalUnpaidAmount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted mb-1">Clients actifs / Alertes TVA</p>
                <p className="text-2xl font-bold text-text-primary">
                  {stats.activeCustomers} / {stats.upcomingVatAlerts}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/accountant/requests')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Mail className="text-yellow-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Demandes reçues</h3>
              <p className="text-sm text-text-secondary">
                {pendingRequests > 0
                  ? `${pendingRequests} demande${pendingRequests > 1 ? 's' : ''} en attente`
                  : 'Aucune demande'}
              </p>
            </div>
          </div>
          <ArrowRight className="text-text-muted ml-auto" size={18} />
        </button>

        <button
          onClick={() => navigate('/accountant/profile')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Award className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Mon Profil</h3>
              <p className="text-sm text-text-secondary">Gérer votre profil public</p>
            </div>
          </div>
          <ArrowRight className="text-text-muted ml-auto" size={18} />
        </button>

        <button
          onClick={() => navigate('/contracts')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Contrats</h3>
              <p className="text-sm text-text-secondary">Gérer les contrats</p>
            </div>
          </div>
          <ArrowRight className="text-text-muted ml-auto" size={18} />
        </button>
      </div>

      {/* Liste des entreprises */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Mes Entreprises</h2>
          <button
            onClick={() => {
              // Utiliser le sélecteur d'entreprise dans le Header pour changer de contexte
              // Toutes les entreprises sont accessibles via le toggle en haut de page
            }}
            className="btn-ghost text-sm"
          >
            Voir tout
          </button>
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto text-text-muted mb-4" size={48} />
            <p className="text-text-secondary">Aucune entreprise gérée pour le moment</p>
            <p className="text-sm text-text-muted mt-2">
              Les entreprises que vous gérez apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <div
                key={company.id}
                onClick={() => {
                  // Utiliser le sélecteur d'entreprise dans le Header pour changer de contexte
                  // Le CompanySelector gère déjà le changement d'entreprise active
                }}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="text-primary" size={24} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary truncate">{company.name}</h3>
                    {company.businessName && (
                      <p className="text-sm text-text-secondary truncate">{company.businessName}</p>
                    )}
                  </div>
                  {company.status === 'active' ? (
                    <CheckCircle2 className="text-green-500 flex-shrink-0" size={18} />
                  ) : (
                    <Clock className="text-yellow-500 flex-shrink-0" size={18} />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-muted">Factures</p>
                    <p className="font-semibold text-text-primary">{company.totalInvoices}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Revenus</p>
                    <p className="font-semibold text-text-primary">
                      {formatCurrency(company.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted">En attente</p>
                    <p className="font-semibold text-text-primary">{company.pendingInvoices}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Clients</p>
                    <p className="font-semibold text-text-primary">{company.activeCustomers}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountantDashboardPage;

