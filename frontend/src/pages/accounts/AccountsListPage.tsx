import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  FileText,
  ChevronRight,
  ChevronDown,
  Loader2,
  AlertCircle,
  TreePine,
  List,
} from 'lucide-react';
import accountService, { Account, AccountFilters, AccountType } from '../../services/account.service';

function AccountsListPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [treeView, setTreeView] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AccountFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<AccountType | ''>('');

  useEffect(() => {
    loadAccounts();
  }, [filters, treeView]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = treeView
        ? await accountService.getTree(filters)
        : await accountService.list(filters);
      setAccounts(response.data);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.code === 'FEATURE_NOT_AVAILABLE') {
        setError('La fonctionnalité Comptabilité n\'est pas disponible dans votre package. Veuillez upgrader votre plan.');
      } else {
        setError(err.response?.data?.message || 'Erreur lors du chargement des comptes');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchTerm || undefined,
      type: selectedType || undefined,
    });
  };

  const toggleNode = (accountId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTree = (accounts: Account[], level: number = 0): JSX.Element[] => {
    return accounts.map((account) => {
      const hasChildren = account.children && account.children.length > 0;
      const isExpanded = expandedNodes.has(account.id);

      return (
        <div key={account.id}>
          <div
            className={`flex items-center space-x-2 p-2 hover:bg-gray-50 rounded ${
              level > 0 ? 'ml-' + level * 4 : ''
            }`}
            style={{ paddingLeft: `${level * 1.5}rem` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleNode(account.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-600" />
                ) : (
                  <ChevronRight size={16} className="text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <Link
              to={`/accounts/${account.id}`}
              className="flex-1 flex items-center space-x-3 hover:text-primary"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm text-gray-600">{account.code}</span>
                  <span className="font-medium">{account.name}</span>
                  <span className={`badge badge-sm ${
                    account.type === 'asset' ? 'badge-primary' :
                    account.type === 'liability' ? 'badge-warning' :
                    account.type === 'equity' ? 'badge-info' :
                    account.type === 'revenue' ? 'badge-success' :
                    'badge-danger'
                  }`}>
                    {account.type}
                  </span>
                  {!account.isActive && (
                    <span className="badge badge-sm badge-secondary">Inactif</span>
                  )}
                </div>
                {account.description && (
                  <p className="text-sm text-gray-500 mt-1">{account.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'CDF',
                  }).format(account.balance)}
                </div>
                {account._count && (
                  <div className="text-xs text-gray-500">
                    {account._count.children > 0 && `${account._count.children} sous-comptes`}
                    {account._count.expenses > 0 && ` • ${account._count.expenses} dépenses`}
                  </div>
                )}
              </div>
            </Link>
            <Link
              to={`/accounts/${account.id}/edit`}
              className="btn btn-sm btn-ghost"
              title="Modifier"
            >
              <FileText size={16} />
            </Link>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderTree(account.children || [], level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const getTypeLabel = (type: AccountType): string => {
    const labels: Record<AccountType, string> = {
      asset: 'Actif',
      liability: 'Passif',
      equity: 'Capitaux',
      revenue: 'Produit',
      expense: 'Charge',
    };
    return labels[type] || type;
  };

  const getCategoryLabel = (category?: string): string => {
    const labels: Record<string, string> = {
      '1': 'Financement Permanent',
      '2': 'Actif Immobilisé',
      '3': 'Stocks',
      '4': 'Tiers',
      '5': 'Trésorerie',
      '6': 'Charges',
      '7': 'Produits',
      '8': 'Résultats',
    };
    return labels[category || ''] || category || '';
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <AlertCircle className="mx-auto text-danger mb-4" size={48} />
          <h3 className="text-lg font-semibold mb-2">Erreur</h3>
          <p className="text-muted mb-4">{error}</p>
          {error.includes('fonctionnalité') && (
            <Link to="/settings/subscription" className="btn btn-primary">
              Voir les packages
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan Comptable</h1>
          <p className="text-muted mt-1">Gérez votre plan comptable</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTreeView(!treeView)}
            className="btn btn-outline flex items-center space-x-2"
            title={treeView ? 'Vue liste' : 'Vue arborescence'}
          >
            {treeView ? <List size={20} /> : <TreePine size={20} />}
            <span>{treeView ? 'Liste' : 'Arborescence'}</span>
          </button>
          <Link to="/accounts/new" className="btn btn-primary flex items-center space-x-2">
            <Plus size={20} />
            <span>Nouveau compte</span>
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par code ou nom..."
                  className="input pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <select
              className="input"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as AccountType | '')}
            >
              <option value="">Tous les types</option>
              <option value="asset">Actif</option>
              <option value="liability">Passif</option>
              <option value="equity">Capitaux</option>
              <option value="revenue">Produit</option>
              <option value="expense">Charge</option>
            </select>
            <button onClick={handleSearch} className="btn btn-secondary">
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Liste/Arborescence */}
      {accounts.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <FileText className="mx-auto text-muted mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">Aucun compte</h3>
            <p className="text-muted mb-4">Commencez par créer votre premier compte ou exécutez le seed</p>
            <Link to="/accounts/new" className="btn btn-primary">
              Créer un compte
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            {treeView ? (
              <div className="divide-y divide-gray-200">
                {renderTree(accounts)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Nom</th>
                      <th>Type</th>
                      <th>Catégorie</th>
                      <th>Solde</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id}>
                        <td>
                          <Link
                            to={`/accounts/${account.id}`}
                            className="font-mono text-primary hover:underline"
                          >
                            {account.code}
                          </Link>
                        </td>
                        <td>
                          <Link
                            to={`/accounts/${account.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {account.name}
                          </Link>
                          {account.parent && (
                            <div className="text-xs text-gray-500">
                              Parent: {account.parent.code} - {account.parent.name}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            account.type === 'asset' ? 'badge-primary' :
                            account.type === 'liability' ? 'badge-warning' :
                            account.type === 'equity' ? 'badge-info' :
                            account.type === 'revenue' ? 'badge-success' :
                            'badge-danger'
                          }`}>
                            {getTypeLabel(account.type)}
                          </span>
                        </td>
                        <td>
                          {account.category && (
                            <span className="text-sm text-gray-600">
                              {account.category} - {getCategoryLabel(account.category)}
                            </span>
                          )}
                        </td>
                        <td className="font-semibold">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'CDF',
                          }).format(account.balance)}
                        </td>
                        <td>
                          <Link
                            to={`/accounts/${account.id}/edit`}
                            className="btn btn-sm btn-ghost"
                            title="Modifier"
                          >
                            <FileText size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountsListPage;

