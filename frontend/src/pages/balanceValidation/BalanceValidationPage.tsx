import { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calculator,
  Loader2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import balanceValidationService, {
  BalanceValidationReport,
  BalanceValidationResult,
} from '../../services/balanceValidation.service';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeature } from '../../utils/featureToggle';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

function BalanceValidationPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<BalanceValidationReport | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  const canAccessAccounting = user && hasFeature(user, 'accounting');

  useEffect(() => {
    if (canAccessAccounting) {
      loadValidation();
    }
  }, [canAccessAccounting]);

  const loadValidation = async () => {
    if (!canAccessAccounting) return;

    setLoading(true);
    setError(null);

    try {
      const response = await balanceValidationService.validateAllBalances(false);
      setReport(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation des soldes.');
      console.error('Error loading balance validation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateAll = async () => {
    if (!canAccessAccounting) return;

    const confirmed = await confirm.confirm({
      title: 'Recalculer tous les soldes',
      message: 'Êtes-vous sûr de vouloir recalculer tous les soldes ? Cette opération peut prendre quelques instants.',
      variant: 'warning',
      confirmText: 'Recalculer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    setRecalculating(true);
    setError(null);

    try {
      const response = await balanceValidationService.recalculateAllBalances();
      
      if (response.success) {
        // Recharger la validation après recalcul
        await loadValidation();
        
        showSuccess(
          `Recalcul terminé : ${response.data.recalculated} comptes recalculés, ` +
          `ajustement total de ${formatCurrency(response.data.totalAdjustment)}`
        );
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du recalcul des soldes.';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error recalculating balances:', err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleRecalculateAccount = async (accountId: string) => {
    if (!canAccessAccounting) return;

    setRecalculating(true);
    setError(null);

    try {
      const response = await balanceValidationService.recalculateAccountBalance(accountId);
      
      if (response.success) {
        // Recharger la validation après recalcul
        await loadValidation();
        
        showSuccess(
          `Solde recalculé : ${formatCurrency(response.data.oldBalance)} → ` +
          `${formatCurrency(response.data.newBalance)} ` +
          `(différence: ${formatCurrency(response.data.difference)})`
        );
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du recalcul du solde.';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error recalculating account balance:', err);
    } finally {
      setRecalculating(false);
    }
  };

  if (!canAccessAccounting) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              Votre abonnement ne permet pas d'accéder à la Validation des Soldes. Veuillez upgrader votre plan.
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
          <h1 className="text-2xl font-bold text-gray-900">Validation des Soldes</h1>
          <p className="text-gray-600 mt-1">
            Vérification et recalcul des soldes comptables depuis les écritures
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculateAll}
            disabled={loading || recalculating}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            <Calculator className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculer Tous
          </button>
          <button
            onClick={loadValidation}
            disabled={loading || recalculating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
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

      {/* Chargement */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Résumé */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border-2 ${
              report.desynchronized > 0
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {report.desynchronized > 0 ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                <span className="font-semibold text-gray-900">Statut</span>
              </div>
              <p className={`text-lg font-bold ${
                report.desynchronized > 0 ? 'text-red-900' : 'text-green-900'
              }`}>
                {report.desynchronized > 0 ? 'Désynchronisations détectées' : 'Tous synchronisés'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {report.desynchronized} compte(s) désynchronisé(s)
              </p>
            </div>

            <div className="p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Comptes</div>
              <div className="text-2xl font-bold text-gray-900">{report.totalAccounts}</div>
            </div>

            <div className="p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Synchronisés</div>
              <div className="text-2xl font-bold text-green-600">{report.synchronized}</div>
              <div className="text-xs text-gray-500 mt-1">
                {report.totalAccounts > 0
                  ? `${((report.synchronized / report.totalAccounts) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Désynchronisés</div>
              <div className="text-2xl font-bold text-red-600">{report.desynchronized}</div>
              <div className="text-xs text-gray-500 mt-1">
                Écart total: {formatCurrency(report.totalDifference)}
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900">
                  <strong>Validation effectuée le :</strong> {formatDate(report.validatedAt)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Les soldes sont comparés avec ceux calculés depuis toutes les écritures comptables.
                  Une désynchronisation peut indiquer une erreur dans les écritures ou dans la mise à jour des soldes.
                </p>
              </div>
            </div>
          </div>

          {/* Désynchronisations */}
          {report.desynchronized > 0 ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Désynchronisations Détectées ({report.desynchronized})
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Compte
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Solde Stocké
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Solde Calculé
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Écart
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.discrepancies.map((item) => (
                        <tr key={item.accountId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{item.accountCode}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{item.accountName}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-500">
                              {report.results.find((r) => r.accountId === item.accountId)?.accountType || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {formatCurrency(item.storedBalance)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(item.calculatedBalance)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-red-600">
                            {formatCurrency(item.difference)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleRecalculateAccount(item.accountId)}
                              disabled={recalculating}
                              className="px-3 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded hover:bg-orange-100 disabled:opacity-50"
                            >
                              Recalculer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ✅ Tous les soldes sont synchronisés
                </h3>
                <p className="text-gray-600">
                  Aucune désynchronisation détectée. Les soldes correspondent aux écritures comptables.
                </p>
              </div>
            </div>
          )}

          {/* Liste complète (optionnel, pour debug) */}
          {report.results.length > 0 && report.desynchronized > 0 && (
            <details className="bg-white rounded-lg shadow p-6">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Voir tous les comptes ({report.totalAccounts})
              </summary>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Compte
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Solde Stocké
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Solde Calculé
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Écart
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.results.map((item) => (
                      <tr
                        key={item.accountId}
                        className={`hover:bg-gray-50 ${
                          !item.isSynchronized ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.accountCode}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.accountName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                          {formatCurrency(item.storedBalance)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {formatCurrency(item.calculatedBalance)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                          <span
                            className={
                              item.isSynchronized
                                ? 'text-green-600'
                                : 'font-bold text-red-600'
                            }
                          >
                            {formatCurrency(item.difference)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {item.isSynchronized ? (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                              OK
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                              Erreur
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Aucune donnée disponible. Cliquez sur "Actualiser" pour lancer la validation.
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

export default BalanceValidationPage;

