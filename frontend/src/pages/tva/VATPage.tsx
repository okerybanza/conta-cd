import { useState, useEffect } from 'react';
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import tvaService, { VATReport, VATReportFilters } from '../../services/tva.service';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeature } from '../../utils/featureToggle';

function VATPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<VATReport | null>(null);

  // Filtres
  const [filters, setFilters] = useState<VATReportFilters>({
    period: 'month',
  });

  const canAccessAccounting = user && hasFeature(user, 'accounting');

  useEffect(() => {
    if (canAccessAccounting) {
      loadReport();
    }
  }, [filters, canAccessAccounting]);

  const loadReport = async () => {
    if (!canAccessAccounting) return;

    setLoading(true);
    setError(null);

    try {
      const response = await tvaService.getVATReport(filters);
      setReport(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du rapport TVA.');
      console.error('Error loading VAT report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: 'month' | 'quarter' | 'year' | 'custom') => {
    if (period === 'custom') {
      setFilters({ ...filters, period: undefined });
    } else {
      setFilters({ ...filters, period, startDate: undefined, endDate: undefined });
    }
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFilters({ ...filters, startDate, endDate, period: undefined });
  };

  if (!canAccessAccounting) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              Votre abonnement ne permet pas d'accéder à la gestion TVA. Veuillez upgrader votre plan.
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion TVA</h1>
          <p className="text-gray-600 mt-1">Rapport TVA, TVA collectée, déductible et à payer</p>
        </div>
        <button
          onClick={loadReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Période :</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePeriodChange('month')}
              className={`px-3 py-1 rounded text-sm ${
                filters.period === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => handlePeriodChange('quarter')}
              className={`px-3 py-1 rounded text-sm ${
                filters.period === 'quarter'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Trimestre
            </button>
            <button
              onClick={() => handlePeriodChange('year')}
              className={`px-3 py-1 rounded text-sm ${
                filters.period === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Année
            </button>
            <button
              onClick={() => handlePeriodChange('custom')}
              className={`px-3 py-1 rounded text-sm ${
                !filters.period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Personnalisé
            </button>
          </div>
          {!filters.period && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleDateRangeChange(e.target.value, filters.endDate || '')}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-gray-500">à</span>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleDateRangeChange(filters.startDate || '', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          )}
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

      {/* Résumé */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : report ? (
        <>
          {/* Résumé TVA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-800">TVA Collectée</h3>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(report.summary.totalCollected)}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {report.collected.items.length} facture(s)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-800">TVA Déductible</h3>
                <TrendingDown className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(report.summary.totalDeductible)}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {report.deductible.items.length} dépense(s)
              </p>
            </div>

            <div className={`border-2 rounded-lg p-6 ${
              report.summary.vatToPay >= 0
                ? 'bg-red-50 border-red-300'
                : 'bg-green-50 border-green-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-medium ${
                  report.summary.vatToPay >= 0 ? 'text-red-800' : 'text-green-800'
                }`}>
                  {report.summary.vatToPay >= 0 ? 'TVA à Payer' : 'Crédit TVA'}
                </h3>
                {report.summary.vatToPay >= 0 ? (
                  <Receipt className="h-5 w-5 text-red-600" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className={`text-2xl font-bold ${
                report.summary.vatToPay >= 0 ? 'text-red-900' : 'text-green-900'
              }`}>
                {formatCurrency(Math.abs(report.summary.vatToPay))}
              </p>
              <p className={`text-xs mt-1 ${
                report.summary.vatToPay >= 0 ? 'text-red-700' : 'text-green-700'
              }`}>
                {report.summary.vatToPay >= 0
                  ? 'À payer à l\'administration fiscale'
                  : 'Crédit reportable'}
              </p>
            </div>
          </div>

          {/* Détails TVA Collectée */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">TVA Collectée (Factures)</h2>
              <p className="text-sm text-gray-600 mt-1">
                Période : {formatDate(report.period.startDate)} au {formatDate(report.period.endDate)}
              </p>
            </div>
            <div className="p-4">
              {report.collected.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facture</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant HT</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taux TVA</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">TVA</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.collected.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(item.date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.documentNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {item.customerName || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(item.amountHt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {item.taxRate.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600">
                            {formatCurrency(item.vatAmount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan={5} className="px-4 py-3 text-right text-sm text-gray-900">Total TVA Collectée</td>
                        <td className="px-4 py-3 text-right text-sm text-green-600">
                          {formatCurrency(report.collected.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4">
                  Aucune TVA collectée pour cette période
                </p>
              )}

              {/* Répartition par taux */}
              {report.collected.byRate.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Répartition par taux</h3>
                  <div className="space-y-1">
                    {report.collected.byRate.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">TVA {item.rate}% ({item.count} facture(s))</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Détails TVA Déductible */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">TVA Déductible (Dépenses)</h2>
            </div>
            <div className="p-4">
              {report.deductible.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dépense</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fournisseur</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant HT</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taux TVA</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">TVA</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.deductible.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(item.date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.documentNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {item.supplierName || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(item.amountHt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {item.taxRate.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                            {formatCurrency(item.vatAmount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan={5} className="px-4 py-3 text-right text-sm text-gray-900">Total TVA Déductible</td>
                        <td className="px-4 py-3 text-right text-sm text-blue-600">
                          {formatCurrency(report.deductible.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4">
                  Aucune TVA déductible pour cette période
                </p>
              )}

              {/* Répartition par taux */}
              {report.deductible.byRate.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Répartition par taux</h3>
                  <div className="space-y-1">
                    {report.deductible.byRate.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">TVA {item.rate}% ({item.count} dépense(s))</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucune donnée disponible pour cette période</p>
        </div>
      )}
    </div>
  );
}

export default VATPage;

