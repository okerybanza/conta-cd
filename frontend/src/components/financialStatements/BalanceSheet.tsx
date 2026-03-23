import { CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BalanceSheet } from '../../services/financialStatements.service';

interface Props {
  data: BalanceSheet;
}

function BalanceSheetComponent({ data }: Props) {
  const { period, assets, liabilities, equation } = data;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Bilan</h2>
        <p className="text-sm text-gray-600 mt-1">
          Au {formatDate(period.asOfDate)}
        </p>
      </div>

      {/* Équation comptable - Alerte améliorée */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${
        equation.isBalanced
          ? 'bg-green-50 border-green-300'
          : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {equation.isBalanced ? (
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className={`font-bold text-base mb-1 ${
                equation.isBalanced ? 'text-green-900' : 'text-red-900'
              }`}>
                {equation.isBalanced 
                  ? '✅ Équation Comptable Équilibrée'
                  : '⚠️ Déséquilibre Détecté'
                }
              </div>
              <div className="text-sm text-gray-700 mb-2">
                Actif = Passif + Capitaux Propres
              </div>
              {!equation.isBalanced && (
                <div className="text-sm text-red-700 font-medium mt-2">
                  ⚠️ Attention : Un déséquilibre de {formatCurrency(Math.abs(equation.difference))} a été détecté.
                  Veuillez vérifier vos écritures comptables.
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <div className="text-xs text-gray-600 mb-1">Actif</div>
              <div className="font-bold text-lg text-gray-900">{formatCurrency(equation.assets)}</div>
            </div>
            <span className={`text-2xl font-bold ${
              equation.isBalanced ? 'text-green-600' : 'text-red-600'
            }`}>
              {equation.isBalanced ? '=' : '≠'}
            </span>
            <div className="text-right">
              <div className="text-xs text-gray-600 mb-1">Passif + Capitaux</div>
              <div className="font-bold text-lg text-gray-900">{formatCurrency(equation.liabilities)}</div>
            </div>
            {!equation.isBalanced && (
              <>
                <div className="text-right border-l-2 border-red-300 pl-4">
                  <div className="text-xs text-red-600 mb-1">Écart</div>
                  <div className="font-bold text-lg text-red-600">
                    {formatCurrency(Math.abs(equation.difference))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Deux colonnes : Actif et Passif */}
      <div className="grid grid-cols-2 gap-6">
        {/* ACTIF */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 bg-blue-100 p-2 rounded">
            ACTIF
          </h3>

          {/* Actif immobilisé */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Actif Immobilisé</h4>
            {assets.fixedAssets.length > 0 ? (
              <div className="space-y-1">
                {assets.fixedAssets.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{item.accountCode}</span>
                      <span className="text-sm text-gray-800">{item.accountName}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic px-3">Aucun actif immobilisé</p>
            )}
          </div>

          {/* Actif circulant */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Actif Circulant</h4>
            
            {/* Stocks */}
            {assets.currentAssets.inventory.length > 0 && (
              <div className="mb-2">
                <h5 className="text-xs font-medium text-gray-600 mb-1 px-3">Stocks</h5>
                <div className="space-y-1">
                  {assets.currentAssets.inventory.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-6 hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{item.accountCode}</span>
                        <span className="text-sm text-gray-800">{item.accountName}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Créances */}
            {assets.currentAssets.receivables.length > 0 && (
              <div className="mb-2">
                <h5 className="text-xs font-medium text-gray-600 mb-1 px-3">Créances</h5>
                <div className="space-y-1">
                  {assets.currentAssets.receivables.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-6 hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{item.accountCode}</span>
                        <span className="text-sm text-gray-800">{item.accountName}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trésorerie */}
            {assets.currentAssets.cash.length > 0 && (
              <div className="mb-2">
                <h5 className="text-xs font-medium text-gray-600 mb-1 px-3">Trésorerie</h5>
                <div className="space-y-1">
                  {assets.currentAssets.cash.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-6 hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{item.accountCode}</span>
                        <span className="text-sm text-gray-800">{item.accountName}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Total Actif */}
          <div className="border-t-2 border-gray-400 pt-2 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">TOTAL ACTIF</span>
              <span className="text-base font-bold text-gray-900">
                {formatCurrency(assets.total)}
              </span>
            </div>
          </div>
        </div>

        {/* PASSIF */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 bg-green-100 p-2 rounded">
            PASSIF
          </h3>

          {/* Capitaux propres */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Capitaux Propres</h4>
            {liabilities.equity.length > 0 ? (
              <div className="space-y-1">
                {liabilities.equity.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{item.accountCode}</span>
                      <span className="text-sm text-gray-800">{item.accountName}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic px-3">Aucun capital</p>
            )}
          </div>

          {/* Dettes */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Dettes</h4>
            
            {/* Emprunts */}
            {liabilities.debts.loans.length > 0 && (
              <div className="mb-2">
                <h5 className="text-xs font-medium text-gray-600 mb-1 px-3">Emprunts</h5>
                <div className="space-y-1">
                  {liabilities.debts.loans.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-6 hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{item.accountCode}</span>
                        <span className="text-sm text-gray-800">{item.accountName}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fournisseurs */}
            {liabilities.debts.payables.length > 0 && (
              <div className="mb-2">
                <h5 className="text-xs font-medium text-gray-600 mb-1 px-3">Fournisseurs</h5>
                <div className="space-y-1">
                  {liabilities.debts.payables.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-6 hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{item.accountCode}</span>
                        <span className="text-sm text-gray-800">{item.accountName}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Autres dettes */}
            {liabilities.debts.otherLiabilities.length > 0 && (
              <div className="mb-2">
                <h5 className="text-xs font-medium text-gray-600 mb-1 px-3">Autres Dettes</h5>
                <div className="space-y-1">
                  {liabilities.debts.otherLiabilities.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-6 hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{item.accountCode}</span>
                        <span className="text-sm text-gray-800">{item.accountName}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Total Passif */}
          <div className="border-t-2 border-gray-400 pt-2 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">TOTAL PASSIF</span>
              <span className="text-base font-bold text-gray-900">
                {formatCurrency(liabilities.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BalanceSheetComponent;

