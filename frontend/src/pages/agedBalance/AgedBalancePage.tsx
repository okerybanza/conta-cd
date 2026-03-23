import { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  FileText,
  Loader2,
  Users,
  Building2,
} from 'lucide-react';
import agedBalanceService, {
  AgedBalanceReport,
  AgedBalanceType,
} from '../../services/agedBalance.service';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeature } from '../../utils/featureToggle';

function AgedBalancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<AgedBalanceType>('receivables');
  const [asOfDate, setAsOfDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [report, setReport] = useState<AgedBalanceReport | null>(null);

  const canAccessAccounting = user && hasFeature(user, 'accounting');

  useEffect(() => {
    if (canAccessAccounting) {
      loadReport();
    }
  }, [type, asOfDate, canAccessAccounting]);

  const loadReport = async () => {
    if (!canAccessAccounting) return;

    setLoading(true);
    setError(null);

    try {
      const response = await agedBalanceService.generateAgedBalance(type, asOfDate);
      setReport(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de la balance âgée');
      console.error('Error loading aged balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!report) return;

    const headers = type === 'receivables'
      ? ['N° Facture', 'Client', 'Date', 'Échéance', 'Jours Retard', 'Montant', '0-30j', '31-60j', '61-90j', '>90j']
      : ['N° Dépense', 'Fournisseur', 'Date', 'Échéance', 'Jours Retard', 'Montant', '0-30j', '31-60j', '61-90j', '>90j'];

    const rows = report.items.map((item) => [
      item.number,
      type === 'receivables' ? item.customerName || '' : item.supplierName || '',
      formatDate(item.date),
      formatDate(item.dueDate),
      item.daysOverdue.toString(),
      formatCurrency(item.amount),
      formatCurrency(item.current),
      formatCurrency(item.days1_30),
      formatCurrency(item.days31_60),
      formatCurrency(item.days61_90),
      formatCurrency(item.daysOver90),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      'TOTAUX',
      '',
      '',
      '',
      '',
      formatCurrency(report.totals.total),
      formatCurrency(report.totals.current),
      formatCurrency(report.totals.days1_30),
      formatCurrency(report.totals.days31_60),
      formatCurrency(report.totals.days61_90),
      formatCurrency(report.totals.daysOver90),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `balance-agee-${type}-${asOfDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!canAccessAccounting) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <p>Vous n'avez pas accès à cette fonctionnalité. La fonctionnalité "Comptabilité" est requise.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance Âgée</h1>
          <p className="text-sm text-gray-600 mt-1">
            Analyse des créances clients et dettes fournisseurs par tranches d'âge
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          {report && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de Balance
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setType('receivables')}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  type === 'receivables'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Créances Clients
                </div>
              </button>
              <button
                onClick={() => setType('payables')}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  type === 'payables'
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Dettes Fournisseurs
                </div>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de référence
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Rapport */}
      {!loading && report && (
        <div className="space-y-6">
          {/* Résumé */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total {type === 'receivables' ? 'Créances' : 'Dettes'}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(report.summary.totalAmount)}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Nombre d'éléments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {report.summary.totalItems}
                  </p>
                </div>
                <Building2 className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Retard moyen</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {Math.round(report.summary.averageDaysOverdue)} jours
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{'> 90 jours'}</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {formatCurrency(report.summary.amountOver90Days)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {report.summary.itemsOver90Days} éléments
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Tableau des totaux */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Totaux par Tranche d'Âge
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tranche
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pourcentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Courant (0-30 jours)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(report.totals.current)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {report.totals.total > 0
                        ? ((report.totals.current / report.totals.total) * 100).toFixed(1)
                        : '0.0'}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      1-30 jours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(report.totals.days1_30)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {report.totals.total > 0
                        ? ((report.totals.days1_30 / report.totals.total) * 100).toFixed(1)
                        : '0.0'}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      31-60 jours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(report.totals.days31_60)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {report.totals.total > 0
                        ? ((report.totals.days31_60 / report.totals.total) * 100).toFixed(1)
                        : '0.0'}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      61-90 jours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(report.totals.days61_90)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {report.totals.total > 0
                        ? ((report.totals.days61_90 / report.totals.total) * 100).toFixed(1)
                        : '0.0'}%
                    </td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-900">
                      Plus de 90 jours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-900">
                      {formatCurrency(report.totals.daysOver90)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-700">
                      {report.totals.total > 0
                        ? ((report.totals.daysOver90 / report.totals.total) * 100).toFixed(1)
                        : '0.0'}%
                    </td>
                  </tr>
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      TOTAL
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(report.totals.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      100.0%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Détail des éléments */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Détail des Éléments
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {type === 'receivables' ? 'N° Facture' : 'N° Dépense'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {type === 'receivables' ? 'Client' : 'Fournisseur'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Échéance
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jours Retard
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      0-30j
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      31-60j
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      61-90j
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {'>90j'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                        Aucun élément trouvé
                      </td>
                    </tr>
                  ) : (
                    report.items.map((item) => (
                      <tr
                        key={item.id}
                        className={item.daysOverdue > 90 ? 'bg-red-50' : ''}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {type === 'receivables' ? item.customerName : item.supplierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.daysOverdue > 90
                                ? 'bg-red-100 text-red-800'
                                : item.daysOverdue > 60
                                ? 'bg-orange-100 text-orange-800'
                                : item.daysOverdue > 30
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {item.daysOverdue}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {item.current > 0 ? formatCurrency(item.current) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {item.days1_30 > 0 ? formatCurrency(item.days1_30) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {item.days31_60 > 0 ? formatCurrency(item.days31_60) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {item.days61_90 > 0 ? formatCurrency(item.days61_90) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {item.daysOver90 > 0 ? (
                            <span className="font-medium text-red-600">
                              {formatCurrency(item.daysOver90)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgedBalancePage;

