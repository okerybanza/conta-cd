import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CashFlowStatement } from '../../services/financialStatements.service';

interface Props {
  data: CashFlowStatement;
}

function CashFlowStatementComponent({ data }: Props) {
  const { period, operating, investing, financing, netChange, openingBalance, closingBalance } = data;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Tableau de Flux de Trésorerie</h2>
        <p className="text-sm text-gray-600 mt-1">
          Période : {formatDate(period.startDate)} au {formatDate(period.endDate)}
        </p>
      </div>

      {/* Solde d'ouverture */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-blue-900">Solde d'ouverture de trésorerie</span>
          <span className="text-lg font-bold text-blue-900">
            {formatCurrency(openingBalance)}
          </span>
        </div>
      </div>

      {/* FLUX D'EXPLOITATION */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 bg-green-100 p-2 rounded">
          FLUX D'EXPLOITATION
        </h3>
        
        {operating.items.length > 0 ? (
          <div className="space-y-2">
            {operating.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  {item.type === 'inflow' ? (
                    <ArrowDownCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-800">{item.description}</span>
                </div>
                <span className={`text-sm font-medium ${
                  item.type === 'inflow' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.type === 'inflow' ? '+' : '-'}{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic px-3">Aucun flux d'exploitation</p>
        )}

        <div className="border-t-2 border-gray-300 pt-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">Total Flux d'Exploitation</span>
            <span className={`text-base font-bold ${
              operating.total >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(operating.total)}
            </span>
          </div>
        </div>
      </div>

      {/* FLUX D'INVESTISSEMENT */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 bg-blue-100 p-2 rounded">
          FLUX D'INVESTISSEMENT
        </h3>
        
        {investing.items.length > 0 ? (
          <div className="space-y-2">
            {investing.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  {item.type === 'inflow' ? (
                    <ArrowDownCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-800">{item.description}</span>
                </div>
                <span className={`text-sm font-medium ${
                  item.type === 'inflow' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.type === 'inflow' ? '+' : '-'}{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic px-3">Aucun flux d'investissement</p>
        )}

        <div className="border-t-2 border-gray-300 pt-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">Total Flux d'Investissement</span>
            <span className={`text-base font-bold ${
              investing.total >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(investing.total)}
            </span>
          </div>
        </div>
      </div>

      {/* FLUX DE FINANCEMENT */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 bg-purple-100 p-2 rounded">
          FLUX DE FINANCEMENT
        </h3>
        
        {financing.items.length > 0 ? (
          <div className="space-y-2">
            {financing.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  {item.type === 'inflow' ? (
                    <ArrowDownCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-800">{item.description}</span>
                </div>
                <span className={`text-sm font-medium ${
                  item.type === 'inflow' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.type === 'inflow' ? '+' : '-'}{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic px-3">Aucun flux de financement</p>
        )}

        <div className="border-t-2 border-gray-300 pt-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">Total Flux de Financement</span>
            <span className={`text-base font-bold ${
              financing.total >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(financing.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Variation de trésorerie */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-gray-900">Variation de Trésorerie</span>
          <span className={`text-lg font-bold ${
            netChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {netChange >= 0 ? '+' : ''}{formatCurrency(netChange)}
          </span>
        </div>
      </div>

      {/* Solde de clôture */}
      <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-green-900">Solde de clôture de trésorerie</span>
          <span className="text-xl font-bold text-green-900">
            {formatCurrency(closingBalance)}
          </span>
        </div>
        <div className="mt-2 text-sm text-green-700">
          = Solde d'ouverture ({formatCurrency(openingBalance)}) + Variation ({formatCurrency(netChange)})
        </div>
      </div>
    </div>
  );
}

export default CashFlowStatementComponent;

