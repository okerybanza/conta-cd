import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, Loader2, AlertCircle, Edit, Trash2, Star, StarOff } from 'lucide-react';
import warehouseService, { Warehouse } from '../../services/warehouse.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import ActionsMenu from '../../components/shared/ActionsMenu';

function WarehouseListPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWarehouses();
  }, [includeInactive]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await warehouseService.list(includeInactive);
      let filtered = response.data;

      // Filtre de recherche côté client
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (w) =>
            w.name.toLowerCase().includes(term) ||
            w.code?.toLowerCase().includes(term) ||
            w.city?.toLowerCase().includes(term) ||
            w.address?.toLowerCase().includes(term)
        );
      }

      setWarehouses(filtered);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des entrepôts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await confirm.confirm({
      title: 'Supprimer l\'entrepôt',
      message: `Êtes-vous sûr de vouloir supprimer l'entrepôt "${name}" ? Cette action est irréversible.`,
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });

    if (!result.confirmed) return;

    try {
      await warehouseService.delete(id);
      showSuccess('Entrepôt supprimé avec succès.');
      loadWarehouses();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression';
      showError(errorMessage);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await warehouseService.update(id, { isActive: !currentStatus });
      showSuccess(`Entrepôt ${!currentStatus ? 'activé' : 'désactivé'} avec succès.`);
      loadWarehouses();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la modification';
      showError(errorMessage);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="text-primary" size={28} />
          <div>
            <h1 className="text-3xl font-display font-bold text-text-primary">Entrepôts</h1>
            <p className="text-text-secondary mt-1">
              Gérez vos entrepôts et suivez vos stocks par localisation.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/stock/warehouses/new')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Nouvel entrepôt</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, code, ville, adresse..."
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm text-text-secondary">Inclure les entrepôts inactifs</span>
            </label>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="card border-danger/20 bg-danger/5 flex items-start space-x-3">
          <AlertCircle className="text-danger flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-danger flex-1">{error}</p>
        </div>
      )}

      {/* Tableau */}
      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="ml-3 text-text-secondary">Chargement des entrepôts...</span>
          </div>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="mx-auto text-text-muted mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Aucun entrepôt</h3>
          <p className="text-text-secondary mb-6">
            Commencez par créer votre premier entrepôt pour mieux gérer vos stocks.
          </p>
          <button
            type="button"
            onClick={() => navigate('/stock/warehouses/new')}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Nouvel entrepôt</span>
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left px-6 py-3">Nom</th>
                  <th className="text-left px-6 py-3">Code</th>
                  <th className="text-left px-6 py-3">Adresse</th>
                  <th className="text-left px-6 py-3">Ville</th>
                  <th className="text-left px-6 py-3">Pays</th>
                  <th className="text-center px-6 py-3">Statut</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((warehouse) => (
                  <tr
                    key={warehouse.id}
                    className={`table-row ${!warehouse.isActive ? 'opacity-60' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-text-primary">{warehouse.name}</div>
                        {warehouse.isDefault && (
                          <Star className="text-primary" size={16} fill="currentColor" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {warehouse.code || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {warehouse.address || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {warehouse.city || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {warehouse.country || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          warehouse.isActive
                            ? 'bg-success/10 text-success'
                            : 'bg-text-muted/10 text-text-muted'
                        }`}
                      >
                        {warehouse.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionsMenu
                        actions={[
                          {
                            label: 'Modifier',
                            icon: <Edit size={14} />,
                            onClick: () => navigate(`/stock/warehouses/${warehouse.id}/edit`),
                          },
                          {
                            label: warehouse.isActive ? 'Désactiver' : 'Activer',
                            icon: warehouse.isActive ? <StarOff size={14} /> : <Star size={14} />,
                            onClick: () => handleToggleActive(warehouse.id, warehouse.isActive),
                          },
                          {
                            label: 'Supprimer',
                            icon: <Trash2 size={14} />,
                            onClick: () => handleDelete(warehouse.id, warehouse.name),
                            className: 'text-red-600',
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default WarehouseListPage;
