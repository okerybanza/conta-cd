import { useState, useEffect, type ElementType } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  Send,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import creditNoteService, { CreditNote } from '../../services/creditNote.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

function CreditNoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [creditNote, setCreditNote] = useState<CreditNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (id) {
      loadCreditNote(id);
    }
  }, [id, location.pathname]);

  const loadCreditNote = async (creditNoteId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await creditNoteService.getById(creditNoteId);
      setCreditNote(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    const confirmed = await confirm.confirm({
      title: 'Appliquer l\'avoir',
      message: 'Êtes-vous sûr de vouloir appliquer cet avoir à la facture ? Cela réduira le montant dû.',
      variant: 'info',
      confirmText: 'Appliquer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      setApplying(true);
      await creditNoteService.apply(id!);
      showSuccess('Avoir appliqué avec succès !');
      loadCreditNote(id!);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'application';
      showError(errorMessage);
    } finally {
      setApplying(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'CDF') => {
    if (isNaN(price) || price === null || price === undefined) return '0,00 CDF';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: ElementType }> = {
      draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800', icon: FileText },
      sent: { label: 'Envoyé', className: 'bg-blue-100 text-blue-800', icon: Send },
      applied: { label: 'Appliqué', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: FileText };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        <Icon className="h-4 w-4 mr-2" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !creditNote) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error || 'Avoir non trouvé'}
        </div>
        <Link to="/credit-notes" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <Link to="/credit-notes" className="btn-secondary flex items-center space-x-2">
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
        <div className="flex space-x-2">
          {(creditNote.status === 'draft' || creditNote.status === 'sent') && (
            <Link to={`/credit-notes/${creditNote.id}/edit`} className="btn-secondary flex items-center space-x-2">
              <Edit size={18} />
              <span>Modifier</span>
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{creditNote.creditNoteNumber}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(creditNote.creditNoteDate)}
              </div>
            </div>
          </div>
          <div>{getStatusBadge(creditNote.status)}</div>
        </div>

        {/* Informations facture */}
        {creditNote.invoices && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Facture associée</h3>
            <Link
              to={`/invoices/${creditNote.invoiceId}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {creditNote.invoices.invoiceNumber}
            </Link>
            <div className="mt-2 text-sm text-gray-600">
              <div>Montant total: {formatPrice(Number(creditNote.invoices.totalAmount), creditNote.currency)}</div>
              <div>
                Montant payé: {formatPrice(Number(creditNote.invoices.paidAmount), creditNote.currency)}
              </div>
            </div>
          </div>
        )}

        {/* Montants */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Montant HT</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(creditNote.amount, creditNote.currency)}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">TVA</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(creditNote.taxAmount, creditNote.currency)}
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Montant total TTC</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(creditNote.totalAmount, creditNote.currency)}
            </div>
          </div>
        </div>

        {creditNote.returnStock && (
          <div className="mb-6 p-4 bg-amber-50 rounded-lg text-sm text-amber-800">
            Retour en stock activé pour cet avoir.
          </div>
        )}

        {creditNote.lines && creditNote.lines.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Lignes de l'avoir</h3>
            <div className="space-y-2">
              {creditNote.lines.map((line) => (
                <div key={line.id || `${line.productId}-${line.description}`} className="flex justify-between text-sm text-gray-700">
                  <div>
                    <div className="font-medium">{line.description}</div>
                    <div className="text-xs text-gray-500">
                      {line.quantity} x {formatPrice(line.unitPrice, creditNote.currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    {formatPrice(line.total || (line.quantity * line.unitPrice), creditNote.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raison */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Raison de l'avoir</h3>
          <p className="text-gray-900">{creditNote.reason}</p>
        </div>

        {/* Notes */}
        {creditNote.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{creditNote.notes}</p>
          </div>
        )}

        {/* Référence */}
        {creditNote.reference && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Référence</h3>
            <p className="text-gray-900">{creditNote.reference}</p>
          </div>
        )}

        {/* Date d'application */}
        {creditNote.status === 'applied' && creditNote.appliedAt && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-1">Appliqué le</div>
            <div className="text-green-900">{formatDate(creditNote.appliedAt)}</div>
            <div className="text-sm text-green-700 mt-1">
              Montant appliqué: {formatPrice(creditNote.appliedAmount, creditNote.currency)}
            </div>
          </div>
        )}

        {/* Actions */}
        {creditNote.status === 'sent' && (
          <div className="flex space-x-3">
            <button
              onClick={handleApply}
              disabled={applying}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {applying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>Appliquer l'avoir</span>
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={confirm.handleCancel}
        onConfirm={confirm.handleConfirm}
        title={confirm.options.title ?? 'Confirmation'}
        message={confirm.options.message}
        confirmText={confirm.options.confirmText}
        cancelText={confirm.options.cancelText}
        variant={confirm.options.variant}
        requireJustification={confirm.options.requireJustification}
        justificationPlaceholder={confirm.options.justificationPlaceholder}
      />
    </div>
  );
}

export default CreditNoteDetailPage;

