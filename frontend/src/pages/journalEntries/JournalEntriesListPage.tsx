import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Plus, Search, CheckCircle2, Clock, RotateCcw, AlertCircle } from 'lucide-react';
import journalEntryService, { JournalEntry, JournalEntryFilters, JournalEntryStatus } from '../../services/journalEntry.service';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const STATUS_CONFIG: Record<JournalEntryStatus, { label: string; cls: string; icon: React.ElementType }> = {
  draft:    { label: 'Brouillon',      cls: 'badge-warning',   icon: Clock },
  posted:   { label: 'Comptabilisee', cls: 'badge-success',   icon: CheckCircle2 },
  reversed: { label: 'Contrepassee',  cls: 'badge-secondary', icon: RotateCcw },
};

const SOURCE_LABELS: Record<string, string> = {
  invoice: 'Facture', expense: 'Depense', payment: 'Paiement', manual: 'Manuelle',
};

export default function JournalEntriesListPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();

  const [rows, setRows] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<JournalEntryFilters>({ page: 1, limit: 50 });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [posting, setPosting] = useState<string | null>(null);

  useEffect(() => { load(); }, [filters]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await journalEntryService.list(filters);
      setRows(res.data || []);
      setPagination(res.pagination ?? { page: 1, limit: 50, total: res.data?.length ?? 0, totalPages: 1 });
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur de chargement');
    } finally { setLoading(false); }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      status: statusFilter as JournalEntryStatus || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 1,
    });
  };

  const handlePost = async (id: string) => {
    const ok = await confirm.confirm({
      title: 'Comptabiliser l\'ecriture',
      message: 'Confirmer la comptabilisation ? L\'ecriture ne pourra plus etre modifiee.',
      variant: 'info', confirmText: 'Comptabiliser',
    });
    if (!ok) return;
    try {
      setPosting(id);
      await journalEntryService.post(id);
      showSuccess('Ecriture comptabilisee.');
      load();
    } catch (err: any) { showError(err.response?.data?.message || 'Erreur'); }
    finally { setPosting(null); }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm.confirm({
      title: 'Supprimer l\'ecriture', message: 'Cette action est irreversible.',
      variant: 'danger', confirmText: 'Supprimer',
    });
    if (!ok) return;
    try {
      await journalEntryService.delete(id);
      showSuccess('Ecriture supprimee.');
      load();
    } catch (err: any) { showError(err.response?.data?.message || 'Erreur'); }
  };

  const getLineTotals = (entry: JournalEntry) => {
    const debit = entry.lines?.reduce((s, l) => s + Number(l.debit || 0), 0) ?? 0;
    const credit = entry.lines?.reduce((s, l) => s + Number(l.credit || 0), 0) ?? 0;
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 };
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Ecritures comptables</h1>
          <p className="text-text-secondary mt-1">Journal comptable — partie double</p>
        </div>
        <Link to="/journal-entries/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /><span>Nouvelle ecriture</span>
        </Link>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Statut</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input">
              <option value="">Tous</option>
              <option value="draft">Brouillon</option>
              <option value="posted">Comptabilisee</option>
              <option value="reversed">Contrepassee</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Date debut</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Date fin</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} className="btn-primary w-full flex items-center justify-center gap-2">
              <Search size={18} /><span>Filtrer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="ml-3 text-text-secondary">Chargement...</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="card text-center py-12">
          <AlertCircle className="mx-auto text-text-muted mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Aucune ecriture trouvee</h3>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-6 py-3">Numero</th>
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-left px-6 py-3">Description</th>
                    <th className="text-left px-6 py-3">Source</th>
                    <th className="text-right px-6 py-3">Debit</th>
                    <th className="text-right px-6 py-3">Credit</th>
                    <th className="text-center px-6 py-3">Equilibre</th>
                    <th className="text-left px-6 py-3">Statut</th>
                    <th className="text-right px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const { debit, credit, balanced } = getLineTotals(r);
                    const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.draft;
                    const Icon = cfg.icon;
                    return (
                      <tr key={r.id} className="table-row cursor-pointer" onClick={() => navigate(`/journal-entries/${r.id}`)}>
                        <td className="px-6 py-4 font-mono text-sm font-medium text-primary">{r.entryNumber}</td>
                        <td className="px-6 py-4 text-text-secondary">{formatDate(r.entryDate)}</td>
                        <td className="px-6 py-4 max-w-[200px] truncate text-text-primary">{r.description || '—'}</td>
                        <td className="px-6 py-4 text-text-secondary">{SOURCE_LABELS[r.sourceType] ?? r.sourceType}</td>
                        <td className="px-6 py-4 text-right font-medium">{debit > 0 ? formatCurrency(debit) : '—'}</td>
                        <td className="px-6 py-4 text-right font-medium">{credit > 0 ? formatCurrency(credit) : '—'}</td>
                        <td className="px-6 py-4 text-center">
                          {debit === 0 && credit === 0 ? (
                            <span className="text-xs text-text-muted">—</span>
                          ) : balanced ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              <CheckCircle2 size={11} /> OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                              <AlertCircle size={11} /> Desequilibre
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${cfg.cls} flex items-center gap-1 w-fit`}>
                            <Icon size={12} />{cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            {r.status === 'draft' && (
                              <>
                                <button onClick={() => handlePost(r.id)} disabled={posting === r.id}
                                  className="btn-success btn-sm" title="Comptabiliser">
                                  {posting === r.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                </button>
                                <button onClick={() => handleDelete(r.id)} className="btn-danger btn-sm" title="Supprimer">
                                  <AlertCircle size={14} />
                                </button>
                              </>
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
                <span className="text-sm text-text-secondary">Page {pagination.page} / {pagination.totalPages} ({pagination.total} ecritures)</span>
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
