import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Loader2, AlertCircle, FileText, Calculator } from 'lucide-react';
import accountService, { Account } from '../../services/account.service';

function AccountDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAccount();
    }
  }, [id]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await accountService.getById(id!);
      setAccount(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      asset: 'Actif',
      liability: 'Passif',
      equity: 'Capitaux propres',
      revenue: 'Produit',
      expense: 'Charge',
    };
    return labels[type] || type;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      current_asset: 'Actif circulant',
      fixed_asset: 'Actif immobilisé',
      current_liability: 'Passif circulant',
      long_term_liability: 'Passif à long terme',
      operating_revenue: 'Produit d\'exploitation',
      other_revenue: 'Autre produit',
      operating_expense: 'Charge d\'exploitation',
      other_expense: 'Autre charge',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="ml-3 text-text-secondary">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="space-y-6">
        <div className="card border-danger/20 bg-danger/5 flex items-start space-x-3">
          <AlertCircle className="text-danger flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-danger mb-1">Erreur</h3>
            <p className="text-sm text-danger">{error || 'Compte non trouvé'}</p>
          </div>
        </div>
        <Link to="/accounts" className="btn-secondary inline-flex items-center space-x-2">
          <ArrowLeft size={18} />
          <span>Retour à la liste</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in -mt-4 -mx-4">
      {/* Header sticky avec boutons */}
      <div className="sticky top-0 z-10 bg-white border-b border-border/30 shadow-sm px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link to="/accounts" className="btn-ghost btn-sm flex-shrink-0">
              Retour
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg font-medium text-text-primary truncate">
                {account.code} - {account.name}
              </h1>
              <span className={`badge ${
                account.type === 'asset' ? 'badge-primary' :
                account.type === 'liability' ? 'badge-warning' :
                account.type === 'equity' ? 'badge-info' :
                account.type === 'revenue' ? 'badge-success' :
                'badge-danger'
              }`}>
                {getTypeLabel(account.type)}
              </span>
              {!account.isActive && (
                <span className="badge badge-secondary">Inactif</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to={`/accounts/${account.id}/edit`}
              className="btn-secondary btn-sm flex items-center gap-1.5"
            >
              <Edit size={14} />
              Modifier
            </Link>
          </div>
        </div>
      </div>

      {/* Informations principales compactes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4">
        {/* Informations */}
        <div className="card px-4">
          <p className="text-xs text-text-secondary mb-2">Informations</p>
          <p className="text-sm font-medium text-text-primary font-mono">{account.code}</p>
          <p className="text-sm text-text-primary mt-1">{account.name}</p>
          {account.description && (
            <p className="text-xs text-text-secondary mt-2">{account.description}</p>
          )}
        </div>

        {/* Type et Catégorie */}
        <div className="card px-4">
          <p className="text-xs text-text-secondary mb-2">Type et Catégorie</p>
          <p className="text-sm text-text-primary">{getTypeLabel(account.type)}</p>
          {account.category && (
            <p className="text-xs text-text-secondary mt-1">
              {getCategoryLabel(account.category)}
            </p>
          )}
          {account.parent && (
            <p className="text-xs text-text-secondary mt-2">
              Parent: {account.parent.code} - {account.parent.name}
            </p>
          )}
        </div>

        {/* Solde */}
        <div className="card px-4">
          <p className="text-xs text-text-secondary mb-2">Solde</p>
          <p className="text-lg font-medium text-text-primary">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'CDF',
            }).format(account.balance)}
          </p>
          {account._count && (
            <p className="text-xs text-text-secondary mt-1">
              {account._count.children > 0 && `${account._count.children} sous-compte${account._count.children > 1 ? 's' : ''}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountDetailPage;

