import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Package,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ArrowLeftRight,
  Eye,
  Check,
  RotateCcw,
} from 'lucide-react';
import stockMovementService, { StockMovement, StockMovementFilters } from '../../services/stockMovement.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../utils/formatters';

function StockMovementsListPage() {
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StockMovementFilters>({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<StockMovementFilters['movementType'] | ''>('');
  const [statusFilter, setStatusFilter] = useState<StockMovementFilters['status'] | ''>('');

  useEffect(() => {
    loadMovements();
  }, [filters]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await stockMovementService.list(filters);
      setMovements(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.code === 'FEATURE_NOT_AVAILABLE') {
        setError('La fonctionnalité Gestion de Stock n\'est pas disponible dans votre package. Veuillez upgrader votre plan.');
      } else {
        setError(err.response?.data?.message || 'Erreur lors du chargement des mouvements de stock');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      page: 1,
      reference: searchTerm || undefined,
    });
  };

  const handleFilter = () => {
    setFilters({
      ...filters,
      page: 1,
      movementType: typeFilter === '' ? undefined : typeFilter,
      status: statusFilter === '' ? undefined : statusFilter,
    });
  };

  const handleValidate = async (id: string) => {
    try {
      await stockMovementService.validate(id);
      showSuccess('Mouvement validé avec succès');
      loadMovements();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la validation du mouvement');
    }
  };

  const handleReverse = async (id: string) => {
    const result = await confirm.confirm({
      title: 'Inverser le mouvement',
      message: 'Veuillez indiquer la raison de l\'inversion (minimum 5 caractères)',
      confirmText: 'Inverser',
      cancelText: 'Annuler',
      variant: 'warning',
      requireJustification: true,
      justificationPlaceholder: 'Raison de l\'inversion (minimum 5 caractères)',
    });

    if (!result.confirmed || !result.justification || result.justification.length < 5) {
      if (result.confirmed) {
        showError('La raison doit contenir au moins 5 caractères');
      }
      return;
    }

    try {
      await stockMovementService.reverse(id, result.justification);
      showSuccess('Mouvement inversé avec succès');
      loadMovements();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de l\'inversion du mouvement');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <ArrowDown className="text-success" size={16} />;
      case 'OUT':
        return <ArrowUp className="text-danger" size={16} />;
      case 'TRANSFER':
        return <ArrowLeftRight className="text-primary" size={16} />;
      case 'ADJUSTMENT':
        return <RefreshCw className="text-warning" size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'IN':
        return 'Entrée';
      case 'OUT':
        return 'Sortie';
      case 'TRANSFER':
        return 'Transfert';
      case 'ADJUSTMENT':
        return 'Ajustement';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALIDATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
            <CheckCircle2 size={12} />
            Validé
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
            <AlertCircle size={12} />
            Brouillon
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  // Utiliser formatDate de utils/formatters

  if (loading && movements.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={32} />
          <p className="text-text-secondary">Chargement des mouvements de stock...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 text-danger">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Mouvements de Stock</h1>
          <p className="text-text-secondary mt-1">Gérez les entrées, sorties et transferts de stock</p>
        </div>
        <Link to="/stock/movements/new" className="btn-primary">
          <Plus size={18} />
          Nouveau Mouvement
        </Link>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Numéro, référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as StockMovementFilters['movementType'] | '')}
              className="input"
            >
              <option value="">Tous les types</option>
              <option value="IN">Entrée</option>
              <option value="OUT">Sortie</option>
              <option value="TRANSFER">Transfert</option>
              <option value="ADJUSTMENT">Ajustement</option>
            </select>
          </div>
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-text-secondary mb-1">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StockMovementFilters['status'] | '')}
              className="input"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="VALIDATED">Validé</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleFilter} className="btn-secondary">
              <Search size={18} />
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* Liste des mouvements */}
      {movements.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="mx-auto mb-4 text-text-muted" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Aucun mouvement trouvé</h3>
          <p className="text-text-secondary mb-4">Commencez par créer votre premier mouvement de stock</p>
          <Link to="/stock/movements/new" className="btn-primary">
            <Plus size={18} />
            Créer un mouvement
          </Link>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="text-left">Numéro</th>
                    <th className="text-left">Type</th>
                    <th className="text-left">Produits</th>
                    <th className="text-left">Date</th>
                    <th className="text-left">Statut</th>
                    <th className="text-left">Créé par</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id} className="table-row">
                      <td className="px-6 py-4">
                        <Link
                          to={`/stock/movements/${movement.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {movement.movementNumber}
                        </Link>
                        {movement.reference && (
                          <p className="text-xs text-text-muted mt-0.5">{movement.reference}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(movement.movementType)}
                          <span className="text-sm">{getTypeLabel(movement.movementType)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {movement.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">{item.product?.name || 'Produit inconnu'}</span>
                              <span className="text-text-muted"> × {item.quantity}</span>
                            </div>
                          ))}
                          {movement.items.length > 2 && (
                            <p className="text-xs text-text-muted">+{movement.items.length - 2} autre(s)</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {formatDate(movement.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(movement.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {movement.creator
                          ? `${movement.creator.firstName || ''} ${movement.creator.lastName || ''}`.trim() || 'N/A'
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/stock/movements/${movement.id}`}
                            className="btn-ghost p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Voir"
                          >
                            <Eye size={18} />
                          </Link>
                          {movement.status === 'DRAFT' && (
                            <button
                              onClick={() => handleValidate(movement.id)}
                              className="btn-ghost p-2 rounded-lg hover:bg-success/10 hover:text-success transition-colors"
                              title="Valider"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          {movement.status === 'VALIDATED' && (
                            <button
                              onClick={() => handleReverse(movement.id)}
                              className="btn-ghost p-2 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors"
                              title="Inverser"
                            >
                              <RotateCcw size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="card">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-text-secondary">
                  Page <span className="font-semibold text-text-primary">{pagination.page}</span> sur{' '}
                  <span className="font-semibold text-text-primary">{pagination.totalPages}</span> ({pagination.total} mouvement{pagination.total > 1 ? 's' : ''})
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={confirm.handleCancel}
        onConfirm={confirm.handleConfirm}
        title={confirm.options.title || 'Confirmation'}
        message={confirm.options.message}
        confirmText={confirm.options.confirmText}
        cancelText={confirm.options.cancelText}
        variant={confirm.options.variant}
      />
    </div>
  );
}

export default StockMovementsListPage;
