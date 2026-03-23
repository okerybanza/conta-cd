import { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Download,
  Loader2,
  Calendar,
  Building2,
  Search,
  Filter,
} from 'lucide-react';
import bankReconciliationService, {
  BankStatement,
  BankTransaction,
  BankStatementImport,
} from '../../services/bankReconciliation.service';
import accountService from '../../services/account.service';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeature } from '../../utils/featureToggle';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

type TabType = 'statements' | 'import' | 'reconcile';

function BankReconciliationPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<TabType>('statements');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Relevés bancaires
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);
  const [accountFilter, setAccountFilter] = useState<string>('');

  // Comptes bancaires
  const [bankAccounts, setBankAccounts] = useState<Array<{ id: string; code: string; name: string }>>([]);

  // Import
  const [csvContent, setCsvContent] = useState('');
  const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);
  const [importForm, setImportForm] = useState<Partial<BankStatementImport>>({
    accountId: '',
    statementNumber: '',
    startDate: '',
    endDate: '',
    openingBalance: 0,
    closingBalance: 0,
  });

  const canAccessAccounting = user && hasFeature(user, 'accounting');

  useEffect(() => {
    if (canAccessAccounting) {
      loadStatements();
      loadBankAccounts();
    }
  }, [canAccessAccounting, accountFilter]);

  useEffect(() => {
    if (selectedStatement && canAccessAccounting) {
      loadStatementDetails(selectedStatement.id);
    }
  }, [selectedStatement, canAccessAccounting]);

  const loadBankAccounts = async () => {
    try {
      const response = await accountService.list({ limit: 1000 });
      const accounts = response.data.filter(
        (acc: any) => acc.type === 'asset' && (acc.code?.startsWith('5') || acc.name?.toLowerCase().includes('banque'))
      );
      setBankAccounts(accounts);
    } catch (err: any) {
      console.error('Error loading bank accounts:', err);
    }
  };

  const loadStatements = async () => {
    if (!canAccessAccounting) return;

    setLoading(true);
    setError(null);

    try {
      const response = await bankReconciliationService.listBankStatements(
        accountFilter || undefined
      );
      setStatements(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des relevés.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadStatementDetails = async (statementId: string) => {
    try {
      const response = await bankReconciliationService.getBankStatement(statementId);
      setSelectedStatement(response.data);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du chargement du relevé.');
    }
  };

  const handleParseCSV = async () => {
    if (!csvContent.trim()) {
      showError('Veuillez coller le contenu CSV');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await bankReconciliationService.parseCSV(csvContent);
      if (response.success) {
        setParsedTransactions(response.data.transactions);
        showSuccess(`${response.data.count} transactions parsées avec succès.`);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du parsing CSV.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importForm.accountId || !importForm.statementNumber || !importForm.startDate || !importForm.endDate) {
      showError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (parsedTransactions.length === 0) {
      showError('Veuillez d\'abord parser le CSV.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const statementData: BankStatementImport = {
        accountId: importForm.accountId!,
        statementNumber: importForm.statementNumber!,
        startDate: importForm.startDate!,
        endDate: importForm.endDate!,
        openingBalance: importForm.openingBalance || 0,
        closingBalance: importForm.closingBalance || 0,
        transactions: parsedTransactions.map((tx) => ({
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          reference: tx.reference,
        })),
      };

      const response = await bankReconciliationService.importBankStatement(statementData);
      if (response.success) {
        showSuccess('Relevé bancaire importé avec succès.');
        setCsvContent('');
        setParsedTransactions([]);
        setImportForm({
          accountId: '',
          statementNumber: '',
          startDate: '',
          endDate: '',
          openingBalance: 0,
          closingBalance: 0,
        });
        loadStatements();
        setActiveTab('statements');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'import.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async (statementId: string) => {
    const confirmed = await confirm.confirm({
      title: 'Rapprocher le relevé',
      message: 'Voulez-vous lancer le rapprochement automatique de ce relevé ?',
      variant: 'info',
      confirmText: 'Rapprocher',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await bankReconciliationService.reconcileStatement(statementId);
      if (response.success) {
        showSuccess('Rapprochement effectué avec succès.');
        loadStatements();
        if (selectedStatement?.id === statementId) {
          loadStatementDetails(statementId);
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du rapprochement.';
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
              Votre abonnement ne permet pas d'accéder au Rapprochement Bancaire. Veuillez upgrader votre plan.
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
          <h1 className="text-2xl font-bold text-gray-900">Rapprochement Bancaire</h1>
          <p className="text-gray-600 mt-1">Import et rapprochement des relevés bancaires</p>
        </div>
        <button
          onClick={loadStatements}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('statements')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'statements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Relevés
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Importer
          </button>
          {selectedStatement && (
            <button
              onClick={() => setActiveTab('reconcile')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'reconcile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Rapprocher
            </button>
          )}
        </nav>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'statements' && (
        <div className="bg-white rounded-lg shadow">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les comptes</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Statements List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solde</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                    </td>
                  </tr>
                ) : statements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucun relevé bancaire trouvé
                    </td>
                  </tr>
                ) : (
                  statements.map((statement) => (
                    <tr
                      key={statement.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedStatement(statement);
                        setActiveTab('reconcile');
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {statement.statementNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {statement.account?.code} - {statement.account?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(statement.startDate)} - {formatDate(statement.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(statement.closingBalance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            statement.status === 'reconciled'
                              ? 'bg-green-100 text-green-800'
                              : statement.status === 'imported'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {statement.status === 'reconciled'
                            ? 'Rapproché'
                            : statement.status === 'imported'
                            ? 'Importé'
                            : 'Brouillon'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReconcile(statement.id);
                          }}
                          disabled={statement.status === 'reconciled'}
                          className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          Rapprocher
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Importer un relevé bancaire</h2>
            <p className="text-sm text-gray-600 mb-4">
              Collez le contenu CSV de votre relevé bancaire. Format attendu : Date,Description,Montant,Reference
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu CSV
                </label>
                <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="Date,Description,Montant,Reference&#10;2024-01-01,Transaction 1,1000,REF001&#10;2024-01-02,Transaction 2,-500,REF002"
                />
              </div>

              <button
                onClick={handleParseCSV}
                disabled={loading || !csvContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Parser CSV
              </button>

              {parsedTransactions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {parsedTransactions.length} transactions parsées
                  </p>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Description</th>
                          <th className="px-3 py-2 text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {parsedTransactions.slice(0, 10).map((tx, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{formatDate(tx.date)}</td>
                            <td className="px-3 py-2">{tx.description}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(tx.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {parsedTransactions.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-gray-900">Informations du relevé</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compte bancaire *
                      </label>
                      <select
                        value={importForm.accountId || ''}
                        onChange={(e) => setImportForm({ ...importForm, accountId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner un compte</option>
                        {bankAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de relevé *
                      </label>
                      <input
                        type="text"
                        value={importForm.statementNumber || ''}
                        onChange={(e) => setImportForm({ ...importForm, statementNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="RELEVE-2024-01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date début *
                      </label>
                      <input
                        type="date"
                        value={importForm.startDate || ''}
                        onChange={(e) => setImportForm({ ...importForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date fin *
                      </label>
                      <input
                        type="date"
                        value={importForm.endDate || ''}
                        onChange={(e) => setImportForm({ ...importForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Solde d'ouverture
                      </label>
                      <input
                        type="number"
                        value={importForm.openingBalance || 0}
                        onChange={(e) => setImportForm({ ...importForm, openingBalance: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Solde de clôture
                      </label>
                      <input
                        type="number"
                        value={importForm.closingBalance || 0}
                        onChange={(e) => setImportForm({ ...importForm, closingBalance: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleImport}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Import en cours...' : 'Importer le relevé'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reconcile' && selectedStatement && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Relevé {selectedStatement.statementNumber}
              </h2>
              <p className="text-sm text-gray-600">
                {formatDate(selectedStatement.startDate)} - {formatDate(selectedStatement.endDate)}
              </p>
            </div>
            <button
              onClick={() => handleReconcile(selectedStatement.id)}
              disabled={selectedStatement.status === 'reconciled'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Rapprocher automatiquement
            </button>
          </div>

          {selectedStatement.transactions && selectedStatement.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedStatement.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(tx.transactionDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{tx.description}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {tx.reference || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                        <span className={tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {tx.isReconciled ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucune transaction dans ce relevé</p>
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

export default BankReconciliationPage;

