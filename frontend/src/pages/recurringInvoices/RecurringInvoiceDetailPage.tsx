import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Play, Pause, AlertCircle, RefreshCw } from 'lucide-react';
import recurringInvoiceService, { RecurringInvoice } from '../../services/recurringInvoice.service';
import api from '../../services/api';

const FREQ_LABELS: Record<string, string> = {
  daily: 'Quotidienne', weekly: 'Hebdomadaire', monthly: 'Mensuelle',
  quarterly: 'Trimestrielle', yearly: 'Annuelle',
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyee', paid: 'Payee', overdue: 'En retard',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function RecurringInvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ri, setRi] = useState<RecurringInvoice | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const [riData, invRes] = await Promise.all([
        recurringInvoiceService.getById(id!),
        api.get(`/invoices?recurringInvoiceId=${id}&limit=10&sortBy=createdAt&sortOrder=desc`),
      ]);
      setRi(riData);
      setInvoices(invRes.data?.data?.invoices ?? invRes.data?.data ?? []);
    } catch {
      setError('Facture recurrente introuvable.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!ri) return;
    try {
      setToggling(true);
      const updated = await recurringInvoiceService.update(ri.id, { isActive: !ri.isActive });
      setRi(updated);
    } catch {
      setError('Erreur lors de la mise a jour du statut.');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette facture recurrente ?')) return;
    try {
      setDeleting(true);
      await recurringInvoiceService.delete(id!);
      navigate('/recurring-invoices');
    } catch {
      setError('Erreur lors de la suppression.');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (error || !ri) return (
    <div className="p-6">
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <AlertCircle size={18} /> {error || 'Introuvable'}
      </div>
    </div>
  );

  const customerName = ri.customer?.type === 'particulier'
    ? `${ri.customer?.firstName ?? ''} ${ri.customer?.lastName ?? ''}`.trim()
    : ri.customer?.businessName ?? '—';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/recurring-invoices')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ri.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{customerName}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleToggle} disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${ri.isActive ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>
            {ri.isActive ? <><Pause size={16} /> Desactiver</> : <><Play size={16} /> Activer</>}
          </button>
          <Link to={`/recurring-invoices/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <Edit size={16} /> Modifier
          </Link>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium">
            <Trash2 size={16} /> {deleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Statut actif */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${ri.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
        <span className={`w-2 h-2 rounded-full ${ri.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
        {ri.isActive ? 'Active' : 'Inactive'}
      </div>

      {/* Infos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Client', value: customerName },
          { label: 'Frequence', value: FREQ_LABELS[ri.frequency] ?? ri.frequency },
          { label: 'Intervalle', value: `Tous les ${ri.interval ?? 1} ${FREQ_LABELS[ri.frequency]?.toLowerCase() ?? ''}` },
          { label: 'Date de debut', value: fmtDate(ri.startDate) },
          { label: 'Date de fin', value: fmtDate(ri.endDate) },
          { label: 'Prochaine execution', value: fmtDate(ri.nextRunDate) },
          { label: 'Derniere execution', value: fmtDate(ri.lastRunDate) },
          { label: 'Factures generees', value: String(ri.totalGenerated ?? 0) },
          { label: 'Envoi auto', value: ri.autoSend ? 'Oui' : 'Non' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-medium text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Lignes */}
      {ri.lines?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Lignes de facturation</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Designation</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Qte</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Prix unit.</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {ri.lines.map((line: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-900">{line.name}</td>
                    <td className="py-2 text-right text-gray-700">{line.quantity}</td>
                    <td className="py-2 text-right text-gray-700">{fmt(line.unitPrice)}</td>
                    <td className="py-2 text-right font-medium text-gray-900">{fmt(line.quantity * line.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Factures generees */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Factures generees</h2>
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune facture generee pour le moment</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv: any) => (
              <Link key={inv.id} to={`/invoices/${inv.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber ?? inv.number}</p>
                  <p className="text-xs text-gray-500">{fmtDate(inv.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{fmt(inv.totalAmount ?? 0)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[inv.status] ?? inv.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
