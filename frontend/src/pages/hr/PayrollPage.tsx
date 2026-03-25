import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DollarSign, User, Search, Plus, Loader2, AlertCircle, CheckCircle2, Clock, FileText, CreditCard } from 'lucide-react';
import payrollService, { Payroll, PayrollFilters } from '../../services/payroll.service';
import employeeService, { Employee } from '../../services/employee.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  draft:    { label: 'Brouillon', cls: 'badge-secondary' },
  approved: { label: 'Valide',    cls: 'badge-success' },
  paid:     { label: 'Paye',      cls: 'badge-primary' },
  cancelled:{ label: 'Annule',    cls: 'badge-danger' },
};

export default function PayrollPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();

  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PayrollFilters>({ page: 1, limit: 20 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadEmployees(); }, []);
  useEffect(() => { loadPayrolls(); }, [filters]);

  const loadEmployees = async () => {
    try {
      const res = await employeeService.list({ limit: 1000 });
      setEmployees(res.data);
    } catch { /* non bloquant */ }
  };

  const loadPayrolls = async () => {
    try {
      setLoading(true); setError(null);
      const res = await payrollService.list(filters);
      setPayrolls(res.data);
      setPagination(res.pagination ?? { page: 1, limit: 20, total: res.data.length, totalPages: 1 });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement des paies');
    } finally { setLoading(false); }
  };

  const handleSearch = () => {
    setFilters({ ...filters, employeeId: selectedEmployee || undefined, status: statusFilter || undefined, page: 1 });
  };

  const handleApprove = async (id: string) => {
    const ok = await confirm.confirm({ title: 'Valider la paie', message: 'Confirmer la validation de cette paie ?', variant: 'info', confirmText: 'Valider' });
    if (!ok) return;
    try {
      await payrollService.approve(id);
      loadPayrolls();
      showSuccess('Paie validee avec succes.');
    } catch (err: any) { showError(err.response?.data?.message || 'Erreur lors de la validation'); }
  };

  const handleMarkPaid = async (id: string) => {
    const ok = await confirm.confirm({ title: 'Marquer comme paye', message: 'Confirmer le paiement de cette paie ?', variant: 'info', confirmText: 'Confirmer' });
    if (!ok) return;
    try {
      await payrollService.markAsPaid(id);
      loadPayrolls();
      showSuccess('Paie marquee comme payee.');
    } catch (err: any) { showError(err.response?.data?.message || 'Erreur'); }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Paie</h1>
          <p className="text-text-secondary mt-1">Gestion des bulletins de paie</p>
        </div>
        <button onClick={() => navigate('/hr/payroll/new')} className="btn-primary flex items-center space-x-2">
          <Plus size={18} /><span>Nouvelle paie</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Employe</label>
            <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="input">
              <option value="">Tous les employes</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} (#{e.employeeNumber})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Statut</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input">
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="approved">Valide</option>
              <option value="paid">Paye</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} className="btn-primary w-full flex items-center justify-center space-x-2">
              <Search size={18} /><span>Rechercher</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="card border-danger/20 bg-danger/5 flex items-start space-x-3">
          <AlertCircle className="text-danger flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="ml-3 text-text-secondary">Chargement...</span>
        </div>
      ) : payrolls.length === 0 ? (
        <div className="card text-center py-12">
          <DollarSign className="mx-auto text-text-muted mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Aucune paie trouvee</h3>
          <p className="text-text-secondary">Creez votre premiere paie</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-6 py-3">Employe</th>
                    <th className="text-left px-6 py-3">Periode</th>
                    <th className="text-right px-6 py-3">Salaire brut</th>
                    <th className="text-right px-6 py-3">Deductions</th>
                    <th className="text-right px-6 py-3">Salaire net</th>
                    <th className="text-left px-6 py-3">Statut</th>
                    <th className="text-right px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map(p => {
                    const cfg = STATUS_CONFIG[p.status] ?? { label: p.status, cls: 'badge-secondary' };
                    return (
                      <tr key={p.id} className="table-row">
                        <td className="px-6 py-4">
                          {p.employee ? (
                            <div className="flex items-center space-x-2">
                              <User size={16} className="text-text-muted" />
                              <Link to={`/hr/employees/${p.employeeId}`} className="text-primary hover:underline font-medium" onClick={e => e.stopPropagation()}>
                                {p.employee.firstName} {p.employee.lastName}
                              </Link>
                              <span className="text-xs text-text-muted">(#{p.employee.employeeNumber})</span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-text-secondary">
                          {formatDate(p.periodStart)} — {formatDate(p.periodEnd)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.grossSalary, p.currency || 'CDF')}</td>
                        <td className="px-6 py-4 text-right text-danger">{formatCurrency(p.totalDeductions, p.currency || 'CDF')}</td>
                        <td className="px-6 py-4 text-right font-bold text-success">{formatCurrency(p.netSalary, p.currency || 'CDF')}</td>
                        <td className="px-6 py-4">
                          <span className={`badge ${cfg.cls} flex items-center gap-1 w-fit`}>
                            {p.status === 'paid' ? <CheckCircle2 size={12} /> : p.status === 'approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link to={`/hr/payroll/${p.id}`} className="btn-secondary btn-sm" title="Voir bulletin">
                              <FileText size={14} />
                            </Link>
                            {p.status === 'draft' && (
                              <button onClick={() => handleApprove(p.id)} className="btn-success btn-sm" title="Valider">
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                            {p.status === 'approved' && (
                              <button onClick={() => handleMarkPaid(p.id)} className="btn-primary btn-sm" title="Marquer paye">
                                <CreditCard size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="card">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Page {pagination.page} / {pagination.totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setFilters({ ...filters, page: pagination.page - 1 })} disabled={pagination.page === 1} className="btn-secondary disabled:opacity-50">Precedent</button>
                  <button onClick={() => setFilters({ ...filters, page: pagination.page + 1 })} disabled={pagination.page === pagination.totalPages} className="btn-secondary disabled:opacity-50">Suivant</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog isOpen={confirm.isOpen} onClose={confirm.handleCancel} onConfirm={confirm.handleConfirm}
        title={confirm.options.title || 'Confirmation'} message={confirm.options.message}
        confirmText={confirm.options.confirmText} cancelText={confirm.options.cancelText} variant={confirm.options.variant} />
    </div>
  );
}
