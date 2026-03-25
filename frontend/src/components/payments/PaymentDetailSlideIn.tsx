import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SlideIn } from '../ui/SlideIn';
import { Trash2, FileText, CreditCard, User, AlertCircle, Calendar } from 'lucide-react';
import paymentService, { Payment } from '../../services/payment.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
  onRefresh?: () => void;
}

const fmt = (n: number, currency = 'CDF') =>
  new Intl.NumberFormat('fr-CD', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const METHOD_LABELS: Record<string, string> = {
  cash: 'Especes', bank_transfer: 'Virement bancaire', mobile_money: 'Mobile Money',
  card: 'Carte bancaire', check: 'Cheque', paypal: 'PayPal', visapay: 'VisaPay',
};
const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700', refunded: 'bg-gray-100 text-gray-600',
};
const STATUS_LABELS: Record<string, string> = {
  completed: 'Complete', pending: 'En attente', failed: 'Echoue', refunded: 'Rembourse',
};

export function PaymentDetailSlideIn({ isOpen, onClose, paymentId, onRefresh }: Props) {
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !paymentId) return;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const data = await paymentService.getById(paymentId);
        setPayment(data);
      } catch { setError('Erreur de chargement.'); }
      finally { setLoading(false); }
    };
    load();
  }, [isOpen, paymentId]);

  const handleDelete = async () => {
    if (!payment || !window.confirm('Supprimer ce paiement ?')) return;
    try {
      setDeleting(true);
      await paymentService.delete(payment.id);
      onRefresh?.(); onClose();
    } catch { setError('Erreur lors de la suppression.'); setDeleting(false); }
  };

  const customerName = payment?.invoice?.customer
    ? payment.invoice.customer.type === 'particulier'
      ? `${(payment.invoice.customer as any).firstName ?? ''} ${(payment.invoice.customer as any).lastName ?? ''}`.trim() || '—'
      : (payment.invoice.customer as any).businessName ?? '—'
    : '—';

  return (
    <SlideIn isOpen={isOpen} onClose={onClose} title="Detail paiement" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : !payment ? (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error || 'Paiement introuvable'}
        </div>
      ) : (
        <div className="space-y-6">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle size={16} /> {error}</div>}

          {/* Montant principal */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-green-700">{fmt(Number(payment.amount), payment.currency ?? 'CDF')}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[payment.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[payment.status] ?? payment.status}
              </span>
            </div>
          </div>

          {/* Infos paiement */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paiement</h4>
            <div className="flex items-center gap-2 text-sm">
              <CreditCard size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('fr-FR') : '—'}</span>
            </div>
            {(payment.transactionReference || payment.reference) && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Reference</span>
                <span className="font-medium text-gray-900 font-mono text-xs">{payment.transactionReference ?? payment.reference}</span>
              </div>
            )}
            {payment.mobileMoneyProvider && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Operateur</span>
                <span className="font-medium text-gray-900">{payment.mobileMoneyProvider}</span>
              </div>
            )}
            {payment.mobileMoneyNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Numero</span>
                <span className="font-medium text-gray-900">{payment.mobileMoneyNumber}</span>
              </div>
            )}
          </div>

          {/* Facture liee */}
          {payment.invoice && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-gray-400" />
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Facture liee</h4>
              </div>
              <Link to={`/invoices/${payment.invoiceId}`} onClick={onClose}
                className="flex items-center justify-between hover:bg-white rounded-lg p-2 -mx-2 transition-colors">
                <span className="font-medium text-blue-600 hover:underline">{payment.invoice.invoiceNumber}</span>
                <span className="text-sm text-gray-700">{fmt(Number((payment.invoice as any).totalTtc ?? (payment.invoice as any).totalAmount ?? 0))}</span>
              </Link>
            </div>
          )}

          {/* Client */}
          {customerName !== '—' && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-gray-400" />
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</h4>
              </div>
              <p className="font-medium text-gray-900">{customerName}</p>
              {payment.invoice?.customer && (payment.invoice.customer as any).email && (
                <p className="text-sm text-gray-500 mt-0.5">{(payment.invoice.customer as any).email}</p>
              )}
            </div>
          )}

          {/* Notes */}
          {payment.notes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{payment.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            {payment.invoice && (
              <Link to={`/invoices/${payment.invoiceId}`} onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                <FileText size={15} /> Voir facture
              </Link>
            )}
            <button onClick={handleDelete} disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium">
              <Trash2 size={15} /> {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      )}
    </SlideIn>
  );
}

export default PaymentDetailSlideIn;
