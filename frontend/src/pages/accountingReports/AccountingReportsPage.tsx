import { useState } from 'react';
import { Download, BookOpen, BarChart3, FileText } from 'lucide-react';
import ReportingPage from '../reporting/ReportingPage';
import api from '../../services/api';
import { useToastContext } from '../../contexts/ToastContext';

export default function AccountingReportsPage() {
  const { showSuccess, showError } = useToastContext();
  const [activeView, setActiveView] = useState<'reports' | 'balance' | 'ledger'>('reports');
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [balanceData, setBalanceData] = useState<any[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const loadBalance = async () => {
    try {
      setLoadingBalance(true);
      const res = await api.get('/accounting-reports/trial-balance', { params: { startDate, endDate } });
      setBalanceData(res.data?.data ?? []);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur de chargement de la balance');
    } finally { setLoadingBalance(false); }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setExporting(true);
      const res = await api.get('/accounting-reports/export', {
        params: { startDate, endDate, format },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-comptable-${startDate}-${endDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Export telecharge.');
    } catch {
      showError('Export non disponible pour ce plan.');
    } finally { setExporting(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Rapports comptables</h1>
          <p className="text-text-secondary mt-1">Balance, grand livre et etats financiers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} disabled={exporting}
            className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} /> PDF
          </button>
          <button onClick={() => handleExport('excel')} disabled={exporting}
            className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'reports', label: 'Rapports', icon: BarChart3 },
          { key: 'balance', label: 'Balance des comptes', icon: BookOpen },
          { key: 'ledger', label: 'Grand livre', icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveView(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeView === 'reports' && <ReportingPage />}

      {activeView === 'balance' && (
        <div className="space-y-4">
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Date debut</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Date fin</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
              </div>
              <div className="flex items-end">
                <button onClick={loadBalance} disabled={loadingBalance} className="btn-primary w-full">
                  {loadingBalance ? 'Chargement...' : 'Generer la balance'}
                </button>
              </div>
            </div>
          </div>

          {balanceData.length > 0 && (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      <th className="text-left px-6 py-3">Code</th>
                      <th className="text-left px-6 py-3">Compte</th>
                      <th className="text-right px-6 py-3">Debit</th>
                      <th className="text-right px-6 py-3">Credit</th>
                      <th className="text-right px-6 py-3">Solde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balanceData.map((row: any) => (
                      <tr key={row.id} className="table-row">
                        <td className="px-6 py-3 font-mono text-text-secondary">{row.code}</td>
                        <td className="px-6 py-3 font-medium text-text-primary">{row.name}</td>
                        <td className="px-6 py-3 text-right">{fmt(row.totalDebit ?? 0)}</td>
                        <td className="px-6 py-3 text-right">{fmt(row.totalCredit ?? 0)}</td>
                        <td className={`px-6 py-3 text-right font-bold ${(row.balance ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                          {fmt(row.balance ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {balanceData.length === 0 && !loadingBalance && (
            <div className="card text-center py-12">
              <BookOpen className="mx-auto text-text-muted mb-4" size={48} />
              <p className="text-text-secondary">Selectionnez une periode et cliquez sur "Generer la balance"</p>
            </div>
          )}
        </div>
      )}

      {activeView === 'ledger' && (
        <div className="card text-center py-12">
          <FileText className="mx-auto text-text-muted mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Grand livre</h3>
          <p className="text-text-secondary mb-4">Consultez les ecritures par compte dans le journal comptable</p>
          <a href="/journal-entries" className="btn-primary inline-flex items-center gap-2">
            <FileText size={16} /> Voir le journal
          </a>
        </div>
      )}
    </div>
  );
}
