import { useState, useEffect } from 'react';
import {
  TrendingUp,
  FileText,
  DollarSign,
  Loader2,
  AlertCircle,
  Download,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import financialStatementsService, {
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  FinancialStatementFilters,
} from '../../services/financialStatements.service';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeature } from '../../utils/featureToggle';
import IncomeStatementComponent from '../../components/financialStatements/IncomeStatement';
import BalanceSheetComponent from '../../components/financialStatements/BalanceSheet';
import CashFlowStatementComponent from '../../components/financialStatements/CashFlowStatement';

type StatementType = 'income-statement' | 'balance-sheet' | 'cash-flow';

function FinancialStatementsPage() {
  const { user } = useAuth();
  const [activeStatement, setActiveStatement] = useState<StatementType>('income-statement');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [filters, setFilters] = useState<FinancialStatementFilters>({
    period: 'year',
  });

  // Données
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [cashFlowStatement, setCashFlowStatement] = useState<CashFlowStatement | null>(null);

  const canAccessAccounting = user && hasFeature(user, 'accounting');

  useEffect(() => {
    if (canAccessAccounting) {
      loadStatement();
    }
  }, [activeStatement, filters, canAccessAccounting]);

  const loadStatement = async () => {
    if (!canAccessAccounting) return;

    setLoading(true);
    setError(null);

    try {
      switch (activeStatement) {
        case 'income-statement':
          const incomeData = await financialStatementsService.getIncomeStatement(filters);
          setIncomeStatement(incomeData);
          break;
        case 'balance-sheet':
          const balanceData = await financialStatementsService.getBalanceSheet(filters);
          setBalanceSheet(balanceData);
          break;
        case 'cash-flow':
          const cashFlowData = await financialStatementsService.getCashFlowStatement(filters);
          setCashFlowStatement(cashFlowData);
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des états financiers.');
      console.error('Error loading financial statement:', err);
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
              Votre abonnement ne permet pas d'accéder aux États Financiers. Veuillez upgrader votre plan.
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
          <h1 className="text-2xl font-bold text-gray-900">États Financiers</h1>
          <p className="text-gray-600 mt-1">Compte de Résultat, Bilan et Flux de Trésorerie</p>
        </div>
        <button
          onClick={loadStatement}
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

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveStatement('income-statement')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeStatement === 'income-statement'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Compte de Résultat
            </div>
          </button>
          <button
            onClick={() => setActiveStatement('balance-sheet')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeStatement === 'balance-sheet'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Bilan
            </div>
          </button>
          <button
            onClick={() => setActiveStatement('cash-flow')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeStatement === 'cash-flow'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Flux de Trésorerie
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
          {activeStatement === 'income-statement' && incomeStatement && (
            <IncomeStatementComponent data={incomeStatement} />
          )}
          {activeStatement === 'balance-sheet' && balanceSheet && (
            <BalanceSheetComponent data={balanceSheet} />
          )}
          {activeStatement === 'cash-flow' && cashFlowStatement && (
            <CashFlowStatementComponent data={cashFlowStatement} />
          )}
        </div>
      )}
    </div>
  );
}

export default FinancialStatementsPage;

