import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CreditCard,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from 'lucide-react';
import paymentService, { Payment } from '../../services/payment.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PaymentFormSlideIn } from '../../components/payments/PaymentFormSlideIn';

function PaymentDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentEditSlideIn, setShowPaymentEditSlideIn] = useState(false);

  useEffect(() => {
    if (id) {
      loadPayment();
    }
  }, [id, location.pathname]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentService.getById(id!);
      setPayment(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm.confirm({
      title: 'Supprimer le paiement',
      message: 'Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.',
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await paymentService.delete(id!);
      showSuccess('Paiement supprimé avec succès.');
      navigate('/payments');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression';
      showError(errorMessage);
    }
  };

  const formatPrice = (price: number, currency: string = 'CDF') => {
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
    const statusConfig: Record<string, { label: string; badgeClass: string; icon: React.ElementType }> = {
      confirmed: { label: 'Confirmé', badgeClass: 'badge-success', icon: CheckCircle2 },
      pending: { label: 'En attente', badgeClass: 'badge-warning', icon: Clock },
      cancelled: { label: 'Annulé', badgeClass: 'badge-danger', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, badgeClass: 'badge-primary', icon: CheckCircle2 };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.badgeClass} flex items-center space-x-1`}>
        <Icon size={12} />
        <span>{config.label}</span>
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Espèces',
      mobile_money: 'Mobile Money',
      bank_transfer: 'Virement bancaire',
      check: 'Chèque',
      card: 'Carte bancaire',
      other: 'Autre',
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Paiement non trouvé'}
        </div>
        <Link to="/payments" className="btn-secondary mt-4 inline-block">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in -mt-4 -mx-4">
      {/* Header sticky avec boutons */}
      <div className="sticky top-0 z-10 bg-white border-b border-border/30 shadow-sm px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link to="/payments" className="btn-ghost btn-sm flex-shrink-0">
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg font-medium text-text-primary truncate">
                Paiement
              </h1>
              {getStatusBadge(payment.status)}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowPaymentEditSlideIn(true)}
              className="btn-secondary btn-sm flex items-center gap-1.5"
            >
              <Edit size={14} />
              Modifier
            </button>
            <button
              onClick={handleDelete}
              className="btn-danger btn-sm flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4">
        {/* Facture */}
        {payment.invoice && (
          <div className="card">
            <p className="text-xs text-text-secondary mb-1 flex items-center gap-1">
              <FileText size={12} />
              Facture
            </p>
            <Link
              to={`/invoices/${payment.invoiceId}`}
              className="font-medium text-sm text-primary hover:text-primary-dark"
            >
              {payment.invoice.invoiceNumber}
            </Link>
            <p className="text-xs text-text-secondary mt-1">
              Montant facture: {formatPrice(payment.invoice.totalTtc, payment.currency)}
            </p>
          </div>
        )}

        {/* Date */}
        <div className="card">
          <p className="text-xs text-text-secondary mb-1 flex items-center gap-1">
            <Calendar size={12} />
            Date de paiement
          </p>
          <p className="text-sm text-text-primary">
            {formatDate(payment.paymentDate)}
          </p>
        </div>

        {/* Montant */}
        <div className="card">
          <p className="text-xs text-text-secondary mb-1 flex items-center gap-1">
            <DollarSign size={12} />
            Montant
          </p>
          <p className="text-lg font-medium text-text-primary">
            {formatPrice(Number(payment.amount), payment.currency)}
          </p>
        </div>
      </div>

      {/* Détails du paiement */}
      <div className="card px-4">
        <p className="text-xs text-text-secondary mb-3 flex items-center gap-1">
          <CreditCard size={12} />
          Détails du paiement
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-text-secondary">Méthode:</span>
            <p className="text-text-primary mt-0.5 font-medium">
              {getPaymentMethodLabel(payment.paymentMethod)}
            </p>
          </div>
          {payment.mobileMoneyProvider && (
            <div>
              <span className="text-text-secondary">Opérateur:</span>
              <p className="text-text-primary mt-0.5">{payment.mobileMoneyProvider}</p>
            </div>
          )}
          {payment.mobileMoneyNumber && (
            <div>
              <span className="text-text-secondary">Numéro:</span>
              <p className="text-text-primary mt-0.5">{payment.mobileMoneyNumber}</p>
            </div>
          )}
          {payment.bankName && (
            <div>
              <span className="text-text-secondary">Banque:</span>
              <p className="text-text-primary mt-0.5">{payment.bankName}</p>
            </div>
          )}
          {payment.checkNumber && (
            <div>
              <span className="text-text-secondary">N° de chèque:</span>
              <p className="text-text-primary mt-0.5">{payment.checkNumber}</p>
            </div>
          )}
          {payment.cardLastFour && (
            <div>
              <span className="text-text-secondary">Carte (4 derniers):</span>
              <p className="text-text-primary mt-0.5">**** {payment.cardLastFour}</p>
            </div>
          )}
          {(payment.transactionReference || payment.reference) && (
            <div className="col-span-2">
              <span className="text-text-secondary">Référence transaction:</span>
              <p className="text-text-primary mt-0.5 font-mono text-xs">
                {payment.transactionReference || payment.reference}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {payment.notes && (
        <div className="card px-4">
          <p className="text-xs text-text-secondary mb-2">Notes</p>
          <p className="text-xs text-text-primary whitespace-pre-wrap">{payment.notes}</p>
        </div>
      )}

      {/* Informations système */}
      <div className="card px-4">
        <p className="text-xs text-text-secondary mb-2">Informations système</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-text-secondary">Créé le:</span>
            <p className="text-text-primary mt-0.5">
              {new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div>
            <span className="text-text-secondary">Modifié le:</span>
            <p className="text-text-primary mt-0.5">
              {new Date(payment.updatedAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          {payment.creator && (
            <div className="col-span-2">
              <span className="text-text-secondary">Créé par:</span>
              <p className="text-text-primary mt-0.5">
                {payment.creator.firstName || ''} {payment.creator.lastName || ''}
                {payment.creator.email && ` (${payment.creator.email})`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={confirm.handleCancel}
        onConfirm={confirm.handleConfirm}
        title={confirm.options.title || 'Confirmation'}
        message={confirm.options.message}
        confirmText={confirm.options.confirmText}
        cancelText={confirm.options.cancelText}
        variant={confirm.options.variant}
      />

      {/* Payment Edit Slide-in */}
      {payment && (
        <PaymentFormSlideIn
          isOpen={showPaymentEditSlideIn}
          onClose={() => {
            setShowPaymentEditSlideIn(false);
            loadPayment(); // Recharger le paiement après modification
          }}
          paymentId={payment.id}
          onSuccess={() => {
            loadPayment();
          }}
        />
      )}
    </div>
  );
}

export default PaymentDetailPage;

