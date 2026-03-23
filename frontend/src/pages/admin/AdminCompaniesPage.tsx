import { useState, useEffect } from 'react';
import { Search, Building2, Eye, Mail, Phone, MapPin, Users, FileText, CreditCard, Loader2, AlertCircle, Filter, X, Download } from 'lucide-react';
import adminService, { Company, Package } from '../../services/admin.service';
import { useToastContext } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

function AdminCompaniesPage() {
  const navigate = useNavigate();
  const { showError } = useToastContext();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    plan: '',
    country: '',
    isActive: undefined as boolean | undefined,
    dateFrom: '',
    dateTo: '',
  });
  const [packages, setPackages] = useState<Package[]>([]);

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.offset]);

  const loadPackages = async () => {
    try {
      const response = await adminService.getPackages();
      setPackages(response.data);
    } catch (err) {
      // Ignorer les erreurs silencieusement
    }
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getAllCompanies({
        search: searchTerm || undefined,
        plan: filters.plan || undefined,
        country: filters.country || undefined,
        isActive: filters.isActive,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      setCompanies(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des entreprises');
      showError(err.response?.data?.message || 'Erreur lors du chargement des entreprises');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, offset: 0 }));
    setTimeout(() => loadCompanies(), 100);
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleResetFilters = () => {
    setFilters({
      plan: '',
      country: '',
      isActive: undefined,
      dateFrom: '',
      dateTo: '',
    });
    setPagination((prev) => ({ ...prev, offset: 0 }));
    setTimeout(() => loadCompanies(), 100);
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, offset: 0 }));
    setTimeout(() => loadCompanies(), 100);
  };

  const handleExportCSV = () => {
    try {
      // Créer le CSV
      const headers = ['Nom', 'Email', 'Téléphone', 'Pays', 'Ville', 'Plan', 'Statut', 'Utilisateurs', 'Clients', 'Factures', 'Date de création'];
      const rows = companies.map((company) => [
        company.name,
        company.email || '',
        company.phone || '',
        company.country || '',
        company.city || '',
        company.subscription?.package?.name || 'Aucun plan',
        company.subscription?.status || 'N/A',
        company._count?.users || 0,
        company._count?.customers || 0,
        company._count?.invoices || 0,
        formatDate(company.createdAt),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      // Télécharger le fichier
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `entreprises_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      showError('Erreur lors de l\'export CSV');
    }
  };

  if (loading && companies.length === 0) {
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
        <h1 className="text-3xl font-display font-bold text-text-primary">Gestion des Entreprises</h1>
        <p className="text-text-secondary mt-1">
          Consultez et gérez toutes les entreprises de la plateforme
        </p>
      </div>

      {/* Recherche et Filtres */}
      <div className="card">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Rechercher par nom, email, NIF..."
              className="input pl-10 w-full"
            />
          </div>
          <button onClick={handleSearch} className="btn-primary">
            Rechercher
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary text-white' : ''}`}
          >
            <Filter size={18} />
            <span>Filtres</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="btn-secondary flex items-center gap-2"
            disabled={companies.length === 0}
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Plan
                </label>
                <select
                  value={filters.plan}
                  onChange={(e) => handleFilterChange('plan', e.target.value)}
                  className="input w-full"
                >
                  <option value="">Tous les plans</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.code}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Statut
                </label>
                <select
                  value={filters.isActive === undefined ? '' : filters.isActive ? 'active' : 'inactive'}
                  onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'active')}
                  className="input w-full"
                >
                  <option value="">Tous</option>
                  <option value="active">Actives</option>
                  <option value="inactive">Suspendues</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Pays
                </label>
                <input
                  type="text"
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  placeholder="Ex: RDC, France..."
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={handleApplyFilters} className="btn-primary">
                Appliquer les filtres
              </button>
              <button onClick={handleResetFilters} className="btn-secondary flex items-center gap-2">
                <X size={18} />
                <span>Réinitialiser</span>
              </button>
            </div>
          </div>
        )}
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

      {/* Liste des entreprises */}
      {companies.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="mx-auto text-text-muted mb-4" size={48} />
          <p className="text-text-secondary">Aucune entreprise trouvée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {companies.map((company) => (
            <div key={company.id} className="card hover:shadow-lg transition-shadow">
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
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      {company.name}
                    </h3>
                    {company.businessName && (
                      <p className="text-sm text-text-secondary mb-2">{company.businessName}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                      {company.email && (
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Mail size={16} />
                          <span className="truncate">{company.email}</span>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Phone size={16} />
                          <span>{company.phone}</span>
                        </div>
                      )}
                      {(company.city || company.country) && (
                        <div className="flex items-center gap-2 text-text-secondary">
                          <MapPin size={16} />
                          <span>
                            {company.city}
                            {company.city && company.country && ', '}
                            {company.country}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-text-secondary">
                        <CreditCard size={16} />
                        <span>
                          {company.subscription?.package?.name || 'Aucun plan'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-text-secondary">
                      {company._count && (
                        <>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>{company._count.users} utilisateur{company._count.users > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText size={14} />
                            <span>{company._count.invoices} facture{company._count.invoices > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>{company._count.customers} client{company._count.customers > 1 ? 's' : ''}</span>
                          </div>
                        </>
                      )}
                      <span className="text-xs">
                        Créée le {formatDate(company.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/admin/companies/${company.id}`)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Eye size={18} />
                  <span>Voir détails</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
            disabled={pagination.offset === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="text-text-secondary">
            Page {Math.floor(pagination.offset / pagination.limit) + 1} sur{' '}
            {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            onClick={() =>
              setPagination({ ...pagination, offset: pagination.offset + pagination.limit })
            }
            disabled={pagination.offset + pagination.limit >= pagination.total}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminCompaniesPage;

