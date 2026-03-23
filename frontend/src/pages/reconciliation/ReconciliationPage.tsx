import { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  Download,
  Filter,
  Loader2,
} from 'lucide-react';
import reconciliationService, {
  ReconciliationReport,
  InvoiceReconciliationResult,
  JournalEntryReconciliationResult,
} from '../../services/reconciliation.service';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeature } from '../../utils/featureToggle';

type TabType = 'report' | 'invoices' | 'journal-entries';

function ReconciliationPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('report');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Période
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Données
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [invoiceResults, setInvoiceResults] = useState<InvoiceReconciliationResult[]>([]);
  const [journalEntryResults, setJournalEntryResults] = useState<JournalEntryReconciliationResult[]>([]);

  // Filtres
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'reconciled' | 'unreconciled'>('all');
  const [entryFilter, setEntryFilter] = useState<'all' | 'reconciled' | 'unreconciled' | 'missing'>('all');

  const canAccessAccounting = user && hasFeature(user, 'accounting');

  useEffect(() => {
    if (canAccessAccounting) {
      loadData();
    }
  }, [startDate, endDate, canAccessAccounting]);

  const loadData = async () => {
    if (!canAccessAccounting) return;

    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'report') {
        const response = await reconciliationService.generateReport({
          startDate,
          endDate,
        });
        setReport(response.data);
      } else if (activeTab === 'invoices') {
        const response = await reconciliationService.reconcileInvoices({
          startDate,
          endDate,
        });
        setInvoiceResults(response.data);
      } else if (activeTab === 'journal-entries') {
        const response = await reconciliationService.reconcileJournalEntries({
          startDate,
          endDate,
        });
        setJournalEntryResults(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données.');
      console.error('Error loading reconciliation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccessAccounting) {
      loadData();
    }
  }, [activeTab]);

  if (!canAccessAccounting) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              Votre abonnement ne permet pas d'accéder à la Réconciliation. Veuillez upgrader votre plan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredInvoices = invoiceResults.filter((item) => {
    if (invoiceFilter === 'reconciled') return item.isReconciled;
    if (invoiceFilter === 'unreconciled') return !item.isReconciled;
    return true;
  });

  const filteredEntries = journalEntryResults.filter((item) => {
    if (entryFilter === 'reconciled') return item.isReconciled;
    if (entryFilter === 'unreconciled') return !item.isReconciled;
    if (entryFilter === 'missing') return !item.journalEntryId;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réconciliation</h1>
          <p className="text-gray-600 mt-1">Vérification de la cohérence des données comptables</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filtres de période */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Période :</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">à</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'report'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Rapport Complet
            </div>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'invoices'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Factures/Paiements
            </div>
          </button>
          <button
            onClick={() => setActiveTab('journal-entries')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'journal-entries'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Écritures Comptables
            </div>
          </button>
        </nav>
      </div>

      {/* Contenu */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {/* Rapport Complet */}
          {activeTab === 'report' && report && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Rapport de Réconciliation</h2>
                <p className="text-sm text-gray-600">
                  Généré le {formatDate(report.generatedAt)} pour la période du{' '}
                  {formatDate(report.period.startDate)} au {formatDate(report.period.endDate)}
                </p>
              </div>

              {/* Résumé */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg border-2 ${
                  report.summary.hasIssues
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {report.summary.hasIssues ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <span className="font-semibold text-gray-900">Statut</span>
                  </div>
                  <p className={`text-lg font-bold ${
                    report.summary.hasIssues ? 'text-red-900' : 'text-green-900'
                  }`}>
                    {report.summary.hasIssues ? 'Problèmes détectés' : 'Tout est réconcilié'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {report.summary.totalIssues} problème(s) total, {report.summary.criticalIssues} critique(s)
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Factures</div>
                  <div className="text-2xl font-bold text-gray-900">{report.invoices.total}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {report.invoices.reconciled} réconciliées, {report.invoices.unreconciled} non réconciliées
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Écritures</div>
                  <div className="text-2xl font-bold text-gray-900">{report.journalEntries.total}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {report.journalEntries.reconciled} réconciliées, {report.journalEntries.unreconciled} non réconciliées
                  </div>
                </div>
              </div>

              {/* Factures non réconciliées */}
              {report.invoices.unreconciled > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Factures Non Réconciliées ({report.invoices.unreconciled})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Facture
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Client
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Montant Attendu
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Total Paiements
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Écart
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Problèmes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.invoices.results
                          .filter((r) => !r.isReconciled)
                          .map((item) => (
                            <tr key={item.invoiceId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{item.invoiceNumber}</div>
                                <div className="text-xs text-gray-500">{formatDate(item.invoiceDate)}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {item.customerName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                {formatCurrency(item.expectedAmount)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                {formatCurrency(item.totalPayments)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600">
                                {formatCurrency(Math.abs(item.difference))}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  {item.issues.map((issue, idx) => (
                                    <span key={idx} className="text-xs text-red-600">
                                      • {issue}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Écritures manquantes */}
              {report.journalEntries.missingEntries > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-3">
                    ⚠️ Écritures Comptables Manquantes ({report.journalEntries.missingEntries})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Montant
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Problèmes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.journalEntries.results
                          .filter((r) => !r.journalEntryId)
                          .map((item) => (
                            <tr key={item.transactionId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                                  {item.transactionType}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(item.transactionDate)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                {formatCurrency(item.transactionAmount)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  {item.issues.map((issue, idx) => (
                                    <span key={idx} className="text-xs text-red-600">
                                      • {issue}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Incohérences de montant */}
              {report.journalEntries.amountMismatches > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-3">
                    ⚠️ Incohérences de Montant ({report.journalEntries.amountMismatches})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Montant Transaction
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Écriture
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Problèmes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.journalEntries.results
                          .filter(
                            (r) =>
                              r.journalEntryId &&
                              r.issues.some((issue) => issue.includes('Incohérence de montant'))
                          )
                          .map((item) => (
                            <tr key={item.transactionId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                                  {item.transactionType}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(item.transactionDate)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                {formatCurrency(item.transactionAmount)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {item.journalEntryNumber || 'N/A'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  {item.issues.map((issue, idx) => (
                                    <span key={idx} className="text-xs text-red-600">
                                      • {issue}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {report.summary.totalIssues === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ✅ Toutes les données sont réconciliées
                  </h3>
                  <p className="text-gray-600">
                    Aucun problème détecté pour la période sélectionnée.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Factures/Paiements */}
          {activeTab === 'invoices' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Réconciliation Factures/Paiements</h2>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={invoiceFilter}
                    onChange={(e) => setInvoiceFilter(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="all">Toutes</option>
                    <option value="reconciled">Réconciliées</option>
                    <option value="unreconciled">Non réconciliées</option>
                  </select>
                </div>
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucune facture trouvée pour cette période.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Facture
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Client
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Montant Attendu
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total Paiements
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
                      {filteredInvoices.map((item) => (
                        <tr key={item.invoiceId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.invoiceNumber}</div>
                            <div className="text-xs text-gray-500">{formatDate(item.invoiceDate)}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.customerName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(item.expectedAmount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {formatCurrency(item.totalPayments)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                            <span className={item.isReconciled ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(Math.abs(item.difference))}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {item.isReconciled ? (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                                Réconciliée
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                                Non réconciliée
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Écritures Comptables */}
          {activeTab === 'journal-entries' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Réconciliation Écritures Comptables</h2>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={entryFilter}
                    onChange={(e) => setEntryFilter(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="all">Toutes</option>
                    <option value="reconciled">Réconciliées</option>
                    <option value="unreconciled">Non réconciliées</option>
                    <option value="missing">Écritures manquantes</option>
                  </select>
                </div>
              </div>

              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucune transaction trouvée pour cette période.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Montant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Écriture
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Statut
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Problèmes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEntries.map((item) => (
                        <tr key={item.transactionId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                              {item.transactionType}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(item.transactionDate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(item.transactionAmount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {item.journalEntryNumber || (
                              <span className="text-red-600 italic">Manquante</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {item.isReconciled ? (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                                Réconciliée
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                                Non réconciliée
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {item.issues.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {item.issues.map((issue, idx) => (
                                  <span key={idx} className="text-xs text-red-600">
                                    • {issue}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Aucun</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReconciliationPage;

