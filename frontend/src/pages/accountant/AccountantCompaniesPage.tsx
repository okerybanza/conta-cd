import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  FileText,
  DollarSign,
  Users,
  Loader2,
  AlertCircle,
  ArrowRight,
  Eye,
} from 'lucide-react';
import accountantService from '../../services/accountant.service';
import { useAuthStore } from '../../store/auth.store';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/formatters';

interface ManagedCompany {
  id: string;
  name: string;
  businessName?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  relationId: string;
  acceptedAt?: string;
  contract?: {
    id: string;
    title: string;
    status: string;
  };
}

function AccountantCompaniesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showError } = useToastContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<ManagedCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await accountantService.getManagedCompanies();
      setCompanies(response || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des entreprises');
      showError(err.response?.data?.message || 'Erreur lors du chargement des entreprises');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCompany = (companyId: string) => {
    // TODO: Implémenter la navigation vers le contexte de l'entreprise
    // Cela nécessitera de mettre à jour le store pour changer l'entreprise active
    // et recharger les données dans ce contexte
    setSelectedCompany(companyId);
    // Pour l'instant, on peut naviguer vers le dashboard avec un paramètre
    navigate(`/dashboard?company=${companyId}`);
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
            <Building2 className="text-primary" size={24} />
            <h1 className="text-3xl font-display font-bold text-text-primary">
              Mes Entreprises Client
            </h1>
          </div>
          <p className="text-text-secondary">
            Gérez les entreprises pour lesquelles vous êtes expert comptable
          </p>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Total entreprises</p>
              <p className="text-2xl font-bold text-text-primary">{companies.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="text-primary" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Avec contrat</p>
              <p className="text-2xl font-bold text-text-primary">
                {companies.filter((c) => c.contract?.status === 'signed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Actives</p>
              <p className="text-2xl font-bold text-text-primary">
                {companies.filter((c) => c.acceptedAt).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des entreprises */}
      <div className="card">
        {companies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto text-text-muted mb-4" size={48} />
            <p className="text-text-secondary">Aucune entreprise gérée pour le moment</p>
            <p className="text-sm text-text-muted mt-2">
              Les entreprises qui vous invitent apparaîtront ici une fois que vous aurez accepté leur invitation
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="p-6 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="text-primary" size={32} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">{company.name}</h3>
                        {company.acceptedAt ? (
                          <CheckCircle2 className="text-green-500" size={18} />
                        ) : (
                          <Clock className="text-yellow-500" size={18} />
                        )}
                      </div>
                      {company.businessName && (
                        <p className="text-sm text-text-secondary mb-2">{company.businessName}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                        {company.email && (
                          <div className="flex items-center gap-1">
                            <Mail size={14} />
                            <span>{company.email}</span>
                          </div>
                        )}
                        {company.phone && (
                          <div className="flex items-center gap-1">
                            <span>{company.phone}</span>
                          </div>
                        )}
                        {(company.city || company.country) && (
                          <div className="flex items-center gap-1">
                            <span>
                              {[company.city, company.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      {company.contract && (
                        <div className="mt-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm">
                            <FileText size={14} />
                            <span>Contrat: {company.contract.title}</span>
                          </div>
                        </div>
                      )}
                      {company.acceptedAt && (
                        <p className="text-xs text-text-muted mt-2">
                          Accepté le {new Date(company.acceptedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewCompany(company.id)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Eye size={18} />
                      <span>Voir</span>
                    </button>
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

export default AccountantCompaniesPage;

