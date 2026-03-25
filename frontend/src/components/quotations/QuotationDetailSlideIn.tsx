import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SlideIn } from '../ui/SlideIn';
import { Edit, Trash2, FileText, Copy, Download, ArrowRight, AlertCircle, User } from 'lucide-react';
import quotationService, { Quotation } from '../../services/quotation.service';
import api from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quotationId: string;
  onRefresh?: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoye', accepted: 'Accepte',
  rejected: 'Refuse', expired: 'Expire', converted: 'Converti',
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700', converted: 'bg-purple-100 text-purple-700',
};

export function QuotationDetailSlideIn({ isOpen, onClose, quotationId, onRefresh }: Props) {
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !quotationId) return;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const data = await quotationService.getById(quotationId);
        setQuotation(data);
      } catch { setError('Erreur de chargement.'); }
      finally { setLoading(false); }
    };
    load();
  }, [isOpen, quotationId]);

  const handleDelete = async () => {
    if (!quotation || !window.confirm('Supprimer ce devis ?')) return;
    try {
      setDeleting(true);
      await quotationService.delete(quotation.id);
      onRefresh?.(); onClose();
    } catch { setError('Erreur lors de la suppression.'); setDeleting(false); }
  };

  const handleConvert = async () => {
    if (!quotation) return;
    try {
      setConverting(true);
      const res = await api.post(`/quotations/${quotation.id}/convert`);
      const invoiceId = res.data?.data?.id ?? res.data?.data?.invoiceId;
      onClose();
      if (invoiceId) navigate(`/invoices/${invoiceId}`);
      else navigate('/invoices');
    } catch { setError('Erreur lors de la conversion.'); setConverting(false); }
  };

  const customerName = quotation?.customer
    ? quotation.customer.type === 'particulier'
      ? `${quotation.customer.firstName ?? ''} ${quotation.customer.lastName ?? ''}`.trim() || '—'
      : quotation.customer.businessName ?? '—'
    : '—';

  const lines = quotation?.lines ?? quotation?.quotationLines ?? [];
  const totalHT = lines.reduce((s: number, l: any) => s + (l.quantity * l.unitPrice), 0);
  const totalTVA = lines.reduce((s: number, l: any) => s + (l.quantity * l.unitPrice * (l.taxRate ?? 0) / 100), 0);
  const totalTTC = totalHT + totalTVA;

  return (
    <SlideIn isOpen={isOpen} onClose={onClose} title="Devis" size="xl">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : !quotation ? (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error || 'Devis introuvable'}
        </div>
      ) : (
        <div className="space-y-6">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle size={16} /> {error}</div>}

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{quotation.quotationNumber}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[quotation.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[quotation.status] ?? quotation.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{fmt(quotation.totalAmount ?? totalTTC)}</p>
              <p className="text-xs text-gray-500">{quotation.currency ?? 'CDF'}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Date devis</p>
              <p className="font-medium text-gray-900 mt-0.5">{fmtDate(quotation.quotationDate)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Expiration</p>
              <p className="font-medium text-gray-900 mt-0.5">{fmtDate(quotation.expiryDate)}</p>
            </div>
          </div>

          {/* Client */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <User size={14} className="text-gray-400" />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</h4>
            </div>
            <p className="font-medium text-gray-900">{customerName}</p>
            {quotation.customer?.email && <p className="text-sm text-gray-500 mt-0.5">{quotation.customer.email}</p>}
          </div>

          {/* Lignes */}
          {lines.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Lignes du devis</h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">Designation</th>
                      <th className="text-right px-3 py-2 text-gray-500 font-medium">Qte</th>
                      <th className="text-right px-3 py-2 text-gray-500 font-medium">P.U.</th>
                      <th className="text-right px-3 py-2 text-gray-500 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lines.map((line: any, i: number) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-900">{line.name ?? line.description ?? '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{line.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{fmt(line.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">{fmt(line.quantity * line.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600"><span>Total HT</span><span>{fmt(totalHT)}</span></div>
                <div className="flex justify-between text-gray-600"><span>TVA</span><span>{fmt(totalTVA)}</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200">
                  <span>Total TTC</span><span>{fmt(totalTTC)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <button onClick={handleConvert} disabled={converting || quotation.status === 'converted'}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium">
              <ArrowRight size={15} /> {converting ? 'Conversion...' : 'Convertir en facture'}
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => { navigate(`/quotations/${quotation.id}/edit`); onClose(); }}
                className="flex items-center justify-center gap-1.5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                <Edit size={14} /> Modifier
              </button>
              <Link to={`/quotations/${quotation.id}`} onClick={onClose}
                className="flex items-center justify-center gap-1.5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                <Download size={14} /> PDF
              </Link>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center justify-center gap-1.5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium">
                <Trash2 size={14} /> {deleting ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SlideIn>
  );
}

export default QuotationDetailSlideIn;
