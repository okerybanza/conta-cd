import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { IncomeStatement } from '../../services/financialStatements.service';

interface Props {
  data: IncomeStatement;
}

function IncomeStatementComponent({ data }: Props) {
  const { period, revenues, expenses, results, comparison } = data;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Compte de Résultat</h2>
        <p className="text-sm text-gray-600 mt-1">
          Période : {formatDate(period.startDate)} au {formatDate(period.endDate)}
        </p>
      </div>

      {/* Revenus */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">REVENUS</h3>
        
        {/* Ventes */}
        {revenues.sales.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Ventes de produits/services</h4>
            <div className="space-y-1">
              {revenues.sales.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.accountCode}</span>
                    <span className="text-sm text-gray-800">{item.accountName}</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Autres revenus */}
        {revenues.otherRevenues.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Autres revenus</h4>
            <div className="space-y-1">
              {revenues.otherRevenues.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.accountCode}</span>
                    <span className="text-sm text-gray-800">{item.accountName}</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Revenus */}
        <div className="border-t-2 border-gray-300 pt-2 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">Total Revenus</span>
            <span className="text-base font-bold text-green-600">
              {formatCurrency(revenues.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Charges */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">CHARGES</h3>
        
        {/* Coût des ventes */}
        {expenses.costOfSales.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Coût des ventes</h4>
            <div className="space-y-1">
              {expenses.costOfSales.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.accountCode}</span>
                    <span className="text-sm text-gray-800">{item.accountName}</span>
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charges d'exploitation */}
        {expenses.operatingExpenses.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Charges d'exploitation</h4>
            <div className="space-y-1">
              {expenses.operatingExpenses.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.accountCode}</span>
                    <span className="text-sm text-gray-800">{item.accountName}</span>
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charges financières */}
        {expenses.financialExpenses.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Charges financières</h4>
            <div className="space-y-1">
              {expenses.financialExpenses.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.accountCode}</span>
                    <span className="text-sm text-gray-800">{item.accountName}</span>
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charges exceptionnelles */}
        {expenses.exceptionalExpenses.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Charges exceptionnelles</h4>
            <div className="space-y-1">
              {expenses.exceptionalExpenses.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.accountCode}</span>
                    <span className="text-sm text-gray-800">{item.accountName}</span>
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Charges */}
        <div className="border-t-2 border-gray-300 pt-2 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">Total Charges</span>
            <span className="text-base font-bold text-red-600">
              {formatCurrency(expenses.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="space-y-3">
        <div className="border-t-2 border-gray-400 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">Résultat Brut</span>
            <span className={`text-base font-bold ${
              results.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(results.grossProfit)}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-gray-900">Résultat d'Exploitation</span>
          <span className={`text-base font-bold ${
            results.operatingResult >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(results.operatingResult)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-gray-900">Résultat Financier</span>
          <span className={`text-base font-bold ${
            results.financialResult >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(results.financialResult)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-gray-900">Résultat Exceptionnel</span>
          <span className={`text-base font-bold ${
            results.exceptionalResult >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(results.exceptionalResult)}
          </span>
        </div>

        <div className="border-t-4 border-blue-600 pt-3 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">RÉSULTAT NET</span>
            <div className="flex items-center gap-2">
              {results.netResult >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-xl font-bold ${
                results.netResult >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(results.netResult)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparaison avec période précédente */}
      {comparison && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Comparaison avec période précédente</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">
                Période précédente ({formatDate(comparison.previousPeriod.startDate)} - {formatDate(comparison.previousPeriod.endDate)})
              </span>
              <span className="font-medium text-blue-900">
                {formatCurrency(comparison.previousPeriod.netResult)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Variation</span>
              <span className={`font-medium ${
                comparison.variation >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {comparison.variation >= 0 ? '+' : ''}{formatCurrency(comparison.variation)} ({comparison.variationPercent >= 0 ? '+' : ''}{comparison.variationPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IncomeStatementComponent;

