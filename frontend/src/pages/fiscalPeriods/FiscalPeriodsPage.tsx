import { useState, useEffect } from 'react';
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import fiscalPeriodService, {
  FiscalPeriod,
  CreateFiscalPeriodData,
} from '../../services/fiscalPeriod.service';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeature } from '../../utils/featureToggle';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

function FiscalPeriodsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<FiscalPeriod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<FiscalPeriod | null>(null);

  // Formulaire
  const [formData, setFormData] = useState<CreateFiscalPeriodData>({
    name: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  const canAccessAccounting = user && hasFeature(user, 'accounting');

  useEffect(() => {
    if (canAccessAccounting) {
      loadPeriods();
      loadCurrentPeriod();
    }
  }, [canAccessAccounting]);

  const loadPeriods = async () => {
    if (!canAccessAccounting) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fiscalPeriodService.list();
      setPeriods(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des exercices.');
      console.error('Error loading periods:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentPeriod = async () => {
    if (!canAccessAccounting) return;

    try {
      const response = await fiscalPeriodService.getCurrent();
      setCurrentPeriod(response.data);
    } catch (err: any) {
      console.error('Error loading current period:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canAccessAccounting) return;

    setLoading(true);
    setError(null);

    try {
      await fiscalPeriodService.create(formData);
      setShowCreateForm(false);
      setFormData({ name: '', startDate: '', endDate: '', notes: '' });
      loadPeriods();
      loadCurrentPeriod();
      showSuccess('Exercice créé avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la création de l\'exercice.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (periodId: string) => {
    const result = await confirm.confirm({
      title: 'Clôturer l\'exercice',
      message: 'Êtes-vous sûr de vouloir clôturer cet exercice ? Cette action verrouillera automatiquement l\'exercice et empêchera toute modification future.',
      variant: 'warning',
      confirmText: 'Clôturer et Verrouiller',
      cancelText: 'Annuler',
    });

    if (!result.confirmed) return;

    setLoading(true);
    setError(null);

    try {
      // Clôturer l'exercice
      await fiscalPeriodService.close(periodId);

      // Verrouiller automatiquement après clôture
      try {
        await fiscalPeriodService.lock(periodId);
        showSuccess('Exercice clôturé et verrouillé automatiquement avec succès.');
      } catch (lockErr: any) {
        // Si le verrouillage échoue, on informe mais on considère la clôture réussie
        console.error('Period closed but lock failed:', lockErr);
        showSuccess('Exercice clôturé avec succès. Le verrouillage automatique a échoué, veuillez verrouiller manuellement.');
      }

      await loadPeriods();
      await loadCurrentPeriod();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la clôture de l\'exercice.';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error closing period:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async (periodId: string) => {
    const result = await confirm.confirm({
      title: 'Rouvrir l\'exercice',
      message: 'Voulez-vous rouvrir cet exercice comptable ? Cette action est exceptionnelle et nécessite une justification.',
      variant: 'info',
      confirmText: 'Rouvrir',
      cancelText: 'Annuler',
      requireJustification: true,
      justificationPlaceholder: 'Expliquez pourquoi vous réouvrez cet exercice...',
    });

    if (!result.confirmed) return;

    setLoading(true);
    setError(null);

    try {
      if (!result.justification) {
        showError('Justification requise');
        return;
      }
      await fiscalPeriodService.reopen(periodId);
      await loadPeriods();
      await loadCurrentPeriod();
      showSuccess('Exercice rouvert avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la réouverture de l\'exercice.';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error reopening period:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async (periodId: string) => {
    const result = await confirm.confirm({
      title: 'Verrouiller la période',
      message: 'Êtes-vous sûr de vouloir verrouiller cette période ? Aucune modification ne sera autorisée.',
      variant: 'warning',
      confirmText: 'Verrouiller',
      cancelText: 'Annuler',
    });

    if (!result.confirmed) return;

    setLoading(true);
    setError(null);

    try {
      await fiscalPeriodService.lock(periodId);
      await loadPeriods();
      await loadCurrentPeriod();
      showSuccess('Période verrouillée avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du verrouillage de la période.';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error locking period:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (periodId: string) => {
    const result = await confirm.confirm({
      title: 'Déverrouiller la période',
      message: 'Êtes-vous sûr de vouloir déverrouiller cette période ?',
      variant: 'info',
      confirmText: 'Déverrouiller',
      cancelText: 'Annuler',
    });

    if (!result.confirmed) return;

    setLoading(true);
    setError(null);

    try {
      await fiscalPeriodService.unlock(periodId);
      await loadPeriods();
      await loadCurrentPeriod();
      showSuccess('Période déverrouillée avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du déverrouillage de la période.';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error unlocking period:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (periodId: string) => {
    const result = await confirm.confirm({
      title: 'Supprimer l\'exercice',
      message: 'Êtes-vous sûr de vouloir supprimer cet exercice ? Cette action est irréversible.',
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });

    if (!result.confirmed) return;

    setLoading(true);
    setError(null);

    try {
      await fiscalPeriodService.delete(periodId);
      loadPeriods();
      loadCurrentPeriod();
      showSuccess('Exercice supprimé avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression de l\'exercice.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!canAccessAccounting) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              Votre abonnement ne permet pas d'accéder à la gestion des exercices comptables. Veuillez upgrader votre plan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exercices Comptables</h1>
          <p className="text-gray-600 mt-1">Gérer les périodes comptables et verrouiller les exercices</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadPeriods}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nouvel Exercice
          </button>
        </div>
      </div>

      {/* Exercice en cours */}
      {currentPeriod && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Exercice en cours</h3>
              <p className="text-sm text-blue-700 mt-1">
                {currentPeriod.name} - Du {formatDate(currentPeriod.startDate)} au {formatDate(currentPeriod.endDate)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentPeriod.isClosed && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                  Clos
                </span>
              )}
              {currentPeriod.isLocked && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
                  Verrouillé
                </span>
              )}
              {!currentPeriod.isClosed && !currentPeriod.isLocked && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                  Ouvert
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Créer un nouvel exercice</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'exercice *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                placeholder="Ex: Exercice 2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Notes optionnelles..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', startDate: '', endDate: '', notes: '' });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Liste des exercices */}
      {loading && periods.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exercice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clôturé par
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {periods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucun exercice comptable trouvé. Créez-en un pour commencer.
                  </td>
                </tr>
              ) : (
                periods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{period.name}</div>
                      {period.notes && (
                        <div className="text-sm text-gray-500">{period.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {period.isClosed ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Clos
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Ouvert
                          </span>
                        )}
                        {period.isLocked && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Verrouillé
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {period.closer ? (
                        <div className="text-sm text-gray-900">
                          {period.closer.firstName} {period.closer.lastName}
                          {period.closedAt && (
                            <div className="text-xs text-gray-500">
                              {formatDate(period.closedAt)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {!period.isClosed ? (
                          <button
                            onClick={() => handleClose(period.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Clôturer"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReopen(period.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Rouvrir"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {!period.isLocked ? (
                          <button
                            onClick={() => handleLock(period.id)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Verrouiller"
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnlock(period.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Déverrouiller"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                        )}
                        {!period.isClosed && !period.isLocked && (
                          <button
                            onClick={() => handleDelete(period.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
        requireJustification={confirm.options.requireJustification}
        justificationPlaceholder={confirm.options.justificationPlaceholder}
      />
    </div>
  );
}

export default FiscalPeriodsPage;

