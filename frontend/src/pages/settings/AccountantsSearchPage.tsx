import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Users, Mail, Phone, Globe, Send, Loader2, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import accountantService, { Accountant, SearchAccountantFilters } from '../../services/accountant.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useNavigate } from 'react-router-dom';

type AccountantSearchResult = Accountant & {
  profile?: {
    companyName?: string;
    city?: string;
    province?: string;
    country?: string;
    professionalPhone?: string;
    website?: string;
    rating?: number;
    specialization?: string[];
    isAvailable?: boolean;
  };
  activeCompaniesCount?: number;
};

function AccountantsSearchPage() {
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [accountants, setAccountants] = useState<AccountantSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchAccountantFilters>({
    page: 1,
    limit: 20,
    isAvailable: true,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [invitingId, setInvitingId] = useState<string | null>(null);

  useEffect(() => {
    loadAccountants();
  }, [filters]);

  const loadAccountants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await accountantService.search(filters);
      setAccountants(response.accountants as AccountantSearchResult[]);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des experts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchTerm || undefined,
      country: countryFilter || undefined,
      province: provinceFilter || undefined,
      city: cityFilter || undefined,
      page: 1,
    });
  };

  const handleInvite = async (accountantId: string) => {
    const confirmed = await confirm.confirm({
      title: 'Inviter cet expert comptable',
      message: 'Voulez-vous envoyer une invitation à cet expert comptable pour gérer votre comptabilité ?',
      variant: 'info',
      confirmText: 'Inviter',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      setInvitingId(accountantId);
      await accountantService.invite({ accountantId });
      showSuccess('Invitation envoyée avec succès !');
      loadAccountants();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation';
      showError(errorMessage);
    } finally {
      setInvitingId(null);
    }
  };

  const getFullName = (accountant: AccountantSearchResult) => {
    return (
      accountant.profile?.companyName ||
      accountant.companyName ||
      accountant.user?.name ||
      (accountant.email ? accountant.email.split('@')[0] : '')
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">Rechercher un Expert Comptable</h1>
        <p className="text-text-secondary mt-1">
          Trouvez et invitez un expert comptable pour gérer votre comptabilité
        </p>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Nom, email, cabinet..."
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Pays</label>
            <input
              type="text"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              placeholder="RDC, France..."
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Province</label>
            <input
              type="text"
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              placeholder="Kinshasa, Katanga..."
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Ville</label>
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Kinshasa, Lubumbashi..."
              className="input"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSearch} className="btn-primary">
            Rechercher
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Liste des experts */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : accountants.length === 0 ? (
        <div className="card text-center py-12">
          <AlertCircle className="mx-auto text-text-muted mb-4" size={48} />
          <p className="text-text-secondary">Aucun expert comptable trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accountants.map((accountant) => (
            <div key={accountant.id} className="card hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    {accountant.profile?.companyName || getFullName(accountant)}
                  </h3>
                  {accountant.profile?.companyName && (
                    <p className="text-sm text-text-secondary">{getFullName(accountant)}</p>
                  )}
                </div>
                {accountant.profile?.rating && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={16} fill="currentColor" />
                    <span className="text-sm font-medium">{accountant.profile.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Informations */}
              <div className="space-y-2 mb-4">
                {accountant.profile?.city && accountant.profile?.country && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <MapPin size={16} />
                    <span>
                      {accountant.profile.city}
                      {accountant.profile.province && `, ${accountant.profile.province}`}
                      {accountant.profile.country && `, ${accountant.profile.country}`}
                    </span>
                  </div>
                )}
                {accountant.email && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Mail size={16} />
                    <span>{accountant.email}</span>
                  </div>
                )}
                {accountant.profile?.professionalPhone && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Phone size={16} />
                    <span>{accountant.profile.professionalPhone}</span>
                  </div>
                )}
                {accountant.profile?.website && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Globe size={16} />
                    <a
                      href={accountant.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Site web
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Users size={16} />
                  <span>
                    {(accountant.activeCompaniesCount ?? 0)} entreprise
                    {(accountant.activeCompaniesCount ?? 0) > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Spécialisations */}
              {accountant.profile?.specialization && accountant.profile.specialization.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {accountant.profile.specialization.slice(0, 3).map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => navigate(`/accountants/${accountant.id}`)}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <FileText size={18} />
                  <span>Voir le profil</span>
                </button>
                <button
                  onClick={() => handleInvite(accountant.id)}
                  disabled={invitingId === accountant.id || !accountant.profile?.isAvailable}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {invitingId === accountant.id ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Envoi...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Inviter</span>
                    </>
                  )}
                </button>
                {!accountant.profile?.isAvailable && (
                  <p className="text-xs text-text-muted text-center mt-2">
                    Non disponible pour de nouvelles entreprises
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
            disabled={filters.page === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="text-text-secondary">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
            disabled={filters.page === pagination.totalPages}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={confirm.handleCancel}
        onConfirm={confirm.handleConfirm}
        title={confirm.options.title ?? 'Confirmation'}
        message={confirm.options.message}
        confirmText={confirm.options.confirmText}
        cancelText={confirm.options.cancelText}
        variant={confirm.options.variant}
        requireJustification={confirm.options.requireJustification}
        justificationPlaceholder={confirm.options.justificationPlaceholder}
      />
    </div>
  );
}

export default AccountantsSearchPage;

