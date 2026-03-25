import { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Calculator,
  Table,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import depreciationService, { Depreciation, CreateDepreciationData } from '../../services/depreciation.service';
import accountService from '../../services/account.service';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeature } from '../../utils/featureToggle';
import { useNavigate } from 'react-router-dom';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

function DepreciationsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depreciations, setDepreciations] = useState<Depreciation[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showTable, setShowTable] = useState<string | null>(null);
  const [selectedDepreciation, setSelectedDepreciation] = useState<Depreciation | null>(null);
  const [depreciationTable, setDepreciationTable] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  // Formulaire
  const [formData, setFormData] = useState<CreateDepreciationData>({
    assetAccountId: '',
    depreciationAccountId: '',
    assetName: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: 0,
    depreciationMethod: 'linear',
    depreciationRate: undefined,
    usefulLife: 5,
    notes: '',
  });

  const canAccessAccounting = user && hasFeature(user, 'accounting');

  useEffect(() => {
    if (canAccessAccounting) {
      loadDepreciations();
      loadAccounts();
    }
  }, [canAccessAccounting]);

  const loadDepreciations = async () => {
    if (!canAccessAccounting) return;

    setLoading(true);
    setError(null);

    try {
      const response = await depreciationService.list();
      setDepreciations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des amortissements.');
      console.error('Error loading depreciations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    if (!canAccessAccounting) return;

    try {
      const response = await accountService.list();
      setAccounts(response.data || []);
    } catch (err: any) {
      console.error('Error loading accounts:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAccessAccounting) return;

    setLoading(true);
    setError(null);

    try {
      if (selectedDepreciation) {
        await depreciationService.update(selectedDepreciation.id, formData);
      } else {
        await depreciationService.create(formData);
      }
      await loadDepreciations();
      setShowForm(false);
      setSelectedDepreciation(null);
      setFormData({
        assetAccountId: '',
        depreciationAccountId: '',
        assetName: '',
        acquisitionDate: new Date().toISOString().split('T')[0],
        acquisitionCost: 0,
        depreciationMethod: 'linear',
        depreciationRate: undefined,
        usefulLife: 5,
        notes: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
      console.error('Error saving depreciation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canAccessAccounting) return;

    const confirmed = await confirm.confirm({
      title: 'Supprimer le plan d\'amortissement',
      message: 'Êtes-vous sûr de vouloir supprimer ce plan d\'amortissement ? Cette action est irréversible.',
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await depreciationService.delete(id);
      await loadDepreciations();
      showSuccess('Plan d\'amortissement supprimé avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression.';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error deleting depreciation:', err);
    }
  };

  const handleGenerateEntry = async (id: string, period: string) => {
    if (!canAccessAccounting) return;

    // Valider le format de la période
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      const errorMessage = 'Format de période invalide. Format attendu: YYYY-MM (ex: 2025-01)';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Invalid period format:', period);
      return;
    }

    try {
      await depreciationService.generateEntry(id, period);
      await loadDepreciations();
      showSuccess('Écriture d\'amortissement générée avec succès !');
    } catch (err: any) {
      console.error('Error generating entry:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      
      // Extraire le message d'erreur de différentes structures possibles
      let errorMessage = 'Erreur lors de la génération de l\'écriture.';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error?.message) {
          errorMessage = err.response.data.error.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('Extracted error message:', errorMessage);
      setError(errorMessage);
      showError(errorMessage);
    }
  };

  const handleShowTable = async (depreciation: Depreciation) => {
    setSelectedDepreciation(depreciation);
    setLoadingTable(true);
    try {
      const response = await depreciationService.generateTable(depreciation.id);
      setDepreciationTable(response.data);
      setShowTable(depreciation.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la génération du tableau.');
      console.error('Error generating table:', err);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleEdit = (depreciation: Depreciation) => {
    setSelectedDepreciation(depreciation);
    setFormData({
      assetAccountId: depreciation.assetAccountId,
      depreciationAccountId: depreciation.depreciationAccountId,
      assetName: depreciation.assetName,
      acquisitionDate: depreciation.acquisitionDate.split('T')[0],
      acquisitionCost: depreciation.acquisitionCost,
      depreciationMethod: depreciation.depreciationMethod,
      depreciationRate: depreciation.depreciationRate,
      usefulLife: depreciation.usefulLife,
      notes: depreciation.notes || '',
    });
    setShowForm(true);
  };

  const assetAccounts = accounts.filter((acc) => acc.type === 'asset');
  const depreciationAccounts = accounts.filter((acc) => acc.code?.startsWith('68')); // Comptes d'amortissement

  if (!canAccessAccounting) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              Votre abonnement ne permet pas d'accéder à la gestion des amortissements. Veuillez upgrader votre plan.
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Amortissements</h1>
          <p className="text-gray-600 mt-1">Plans d'amortissement des actifs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadDepreciations}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => {
              setSelectedDepreciation(null);
              setFormData({
                assetAccountId: '',
                depreciationAccountId: '',
                assetName: '',
                acquisitionDate: new Date().toISOString().split('T')[0],
                acquisitionCost: 0,
                depreciationMethod: 'linear',
                depreciationRate: undefined,
                usefulLife: 5,
                notes: '',
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau Plan
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedDepreciation ? 'Modifier le Plan' : 'Nouveau Plan d\'Amortissement'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'actif *
                </label>
                <input
                  type="text"
                  value={formData.assetName}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'acquisition *
                </label>
                <input
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coût d'acquisition *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.acquisitionCost}
                  onChange={(e) => setFormData({ ...formData, acquisitionCost: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée d'utilisation (années) *
                </label>
                <input
                  type="number"
                  value={formData.usefulLife}
                  onChange={(e) => setFormData({ ...formData, usefulLife: parseInt(e.target.value) || 0 })}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Méthode d'amortissement *
                </label>
                <select
                  value={formData.depreciationMethod}
                  onChange={(e) => setFormData({ ...formData, depreciationMethod: e.target.value as 'linear' | 'declining' })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="linear">Linéaire</option>
                  <option value="declining">Dégressif</option>
                </select>
              </div>
              {formData.depreciationMethod === 'declining' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taux d'amortissement (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.depreciationRate || ''}
                    onChange={(e) => setFormData({ ...formData, depreciationRate: parseFloat(e.target.value) || undefined })}
                    required
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compte Actif *
                </label>
                <select
                  value={formData.assetAccountId}
                  onChange={(e) => setFormData({ ...formData, assetAccountId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Sélectionner un compte</option>
                  {assetAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compte Amortissement *
                </label>
                <select
                  value={formData.depreciationAccountId}
                  onChange={(e) => setFormData({ ...formData, depreciationAccountId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Sélectionner un compte</option>
                  {depreciationAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : selectedDepreciation ? 'Modifier' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedDepreciation(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des amortissements */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : depreciations.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actif</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Acquisition</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Coût</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Méthode</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Mensuel</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accumulé</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valeur Nette</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {depreciations.map((dep) => {
                  const netBookValue = dep.acquisitionCost - dep.accumulatedDepreciation;
                  return (
                    <tr key={dep.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{dep.assetName}</div>
                        <div className="text-xs text-gray-500">{dep.assetAccount?.code} - {dep.assetAccount?.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(dep.acquisitionDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(dep.acquisitionCost)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {dep.depreciationMethod === 'linear' ? 'Linéaire' : 'Dégressif'}
                        {dep.depreciationRate && ` (${dep.depreciationRate}%)`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(dep.monthlyDepreciation)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(dep.accumulatedDepreciation)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                        <span className={netBookValue <= 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatCurrency(netBookValue)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {dep.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleShowTable(dep)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir le tableau"
                          >
                            <Table className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(dep)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(dep.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun plan d'amortissement</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Créer le premier plan
          </button>
        </div>
      )}

      {/* Tableau d'amortissement */}
      {showTable && selectedDepreciation && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Tableau d'Amortissement - {selectedDepreciation.assetName}
            </h2>
            <button
              onClick={() => setShowTable(null)}
              className="text-gray-600 hover:text-gray-900"
            >
              Fermer
            </button>
          </div>
          {loadingTable ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amortissement Mensuel</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amortissement Accumulé</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valeur Nette</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {depreciationTable.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{entry.period}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(entry.monthlyDepreciation)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(entry.accumulatedDepreciation)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                        <span className={entry.netBookValue <= 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatCurrency(entry.netBookValue)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => {
                            if (entry.period) {
                              handleGenerateEntry(selectedDepreciation.id, entry.period);
                            } else {
                              showError('Période invalide pour cette entrée');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Générer l'écriture"
                          disabled={!entry.period}
                        >
                          <Calculator className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
      />
    </div>
  );
}

export default DepreciationsPage;

