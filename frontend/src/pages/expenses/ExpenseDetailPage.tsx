import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Receipt,
  Building2,
  Calendar,
  DollarSign,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import expenseService, { Expense } from '../../services/expense.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import ExpenseAttachmentUpload, { ExpenseAttachment } from '../../components/expenses/ExpenseAttachmentUpload';
import ExpenseApprovalPanel from '../../components/expenses/ExpenseApprovalPanel';

function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ExpenseAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  useEffect(() => {
    if (id) {
      loadExpense();
    }
  }, [id]);

  const loadExpense = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await expenseService.getById(id!);
      setExpense(response.data);
      
      // Charger les justificatifs
      loadAttachments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadAttachments = async () => {
    if (!id) return;
    try {
      setLoadingAttachments(true);
      const response = await expenseService.listAttachments(id);
      setAttachments(response.data || []);
    } catch (err: any) {
      console.error('Error loading attachments:', err);
      // Ne pas bloquer l'affichage si les justificatifs ne se chargent pas
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm.confirm({
      title: 'Supprimer la dépense',
      message: 'Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.',
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await expenseService.delete(id!);
      showSuccess('Dépense supprimée avec succès.');
      navigate('/expenses');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression';
      showError(errorMessage);
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await expenseService.duplicate(id!);
      showSuccess('Dépense dupliquée avec succès.');
      navigate(`/expenses/${response.data.id}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la duplication';
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
      draft: { label: 'Brouillon', badgeClass: 'badge-primary', icon: Receipt },
      validated: { label: 'Validée', badgeClass: 'badge-success', icon: CheckCircle2 },
      paid: { label: 'Payée', badgeClass: 'badge-success', icon: CheckCircle2 },
      cancelled: { label: 'Annulée', badgeClass: 'badge-danger', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, badgeClass: 'badge-primary', icon: Receipt };
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

  if (error || !expense) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Dépense non trouvée'}
        </div>
        <Link to="/expenses" className="btn-secondary mt-4 inline-block">
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
            <Link to="/expenses" className="btn-ghost btn-sm flex-shrink-0">
              Retour
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg font-medium text-text-primary truncate">
                Dépense {expense.expenseNumber}
              </h1>
              {getStatusBadge(expense.status)}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to={`/expenses/${expense.id}/edit`}
              className="btn-secondary btn-sm flex items-center gap-1.5"
            >
              <Edit size={14} />
              Modifier
            </Link>
            <button
              onClick={handleDuplicate}
              className="btn-secondary btn-sm flex items-center gap-1.5"
            >
              <Copy size={14} />
              Dupliquer
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

      {/* Informations principales compactes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4">
        {/* Fournisseur */}
        <div className="card">
          <p className="text-xs text-text-secondary mb-1">Fournisseur</p>
          {expense.supplier?.id ? (
            <Link
              to={`/suppliers/${expense.supplier.id}`}
              className="font-medium text-sm text-text-primary hover:text-primary-dark"
            >
              {expense.supplier.name}
            </Link>
          ) : (
            <p className="font-medium text-sm text-text-primary">{expense.supplierName || '-'}</p>
          )}
          {expense.category && (
            <p className="text-xs text-text-secondary mt-1">Catégorie: {expense.category.name}</p>
          )}
        </div>

        {/* Dates */}
        <div className="card">
          <p className="text-xs text-text-secondary mb-1">Dates</p>
          <p className="text-xs text-text-primary">
            Effectuée: {formatDate(expense.expenseDate)}
          </p>
          {expense.paymentDate && (
            <p className="text-xs text-text-primary mt-0.5">
              Payée: {formatDate(expense.paymentDate)}
            </p>
          )}
        </div>

        {/* Total */}
        <div className="card">
          <p className="text-xs text-text-secondary mb-1">Total TTC</p>
          <p className="text-lg font-medium text-text-primary">
            {formatPrice(expense.amountTtc, expense.currency)}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            HT: {formatPrice(expense.amountHt, expense.currency)}
          </p>
        </div>
      </div>

      {/* Totaux détaillés - Une seule ligne */}
      <div className="card px-4">
        <p className="text-xs text-text-secondary mb-3">Détails des totaux</p>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Montant HT:</span>
            <span className="font-medium text-text-primary">
              {formatPrice(expense.amountHt, expense.currency)}
            </span>
          </div>
          {expense.taxRate && expense.taxRate > 0 && (
            <>
              <div className="w-px h-4 bg-border/30"></div>
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">TVA ({expense.taxRate}%):</span>
                <span className="font-medium text-text-primary">
                  {formatPrice(expense.taxAmount || 0, expense.currency)}
                </span>
              </div>
            </>
          )}
          <div className="w-px h-4 bg-border/30"></div>
          <div className="flex items-center gap-2 font-medium text-sm">
            <span>Total TTC:</span>
            <span>{formatPrice(expense.amountTtc, expense.currency)}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {expense.description && (
        <div className="card px-4">
          <p className="text-xs text-text-secondary mb-2">Description</p>
          <p className="text-xs text-text-primary whitespace-pre-wrap">{expense.description}</p>
        </div>
      )}

      {/* Paiement */}
      <div className="card px-4">
        <p className="text-xs text-text-secondary mb-2">Paiement</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-text-secondary">Méthode:</span>
            <p className="text-text-primary mt-0.5">{getPaymentMethodLabel(expense.paymentMethod)}</p>
          </div>
          {expense.mobileMoneyProvider && (
            <div>
              <span className="text-text-secondary">Opérateur:</span>
              <p className="text-text-primary mt-0.5">{expense.mobileMoneyProvider}</p>
            </div>
          )}
          {expense.mobileMoneyNumber && (
            <div>
              <span className="text-text-secondary">Numéro:</span>
              <p className="text-text-primary mt-0.5">{expense.mobileMoneyNumber}</p>
            </div>
          )}
          {expense.bankName && (
            <div>
              <span className="text-text-secondary">Banque:</span>
              <p className="text-text-primary mt-0.5">{expense.bankName}</p>
            </div>
          )}
          {expense.transactionReference && (
            <div>
              <span className="text-text-secondary">Référence:</span>
              <p className="text-text-primary mt-0.5">{expense.transactionReference}</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {expense.notes && (
        <div className="card px-4">
          <p className="text-xs text-text-secondary mb-2">Notes</p>
          <p className="text-xs text-text-primary whitespace-pre-wrap">{expense.notes}</p>
        </div>
      )}

      {/* Justificatifs */}
      <div className="card px-4">
        <p className="text-xs text-text-secondary mb-3">Justificatifs</p>
        <ExpenseAttachmentUpload
          expenseId={id!}
          attachments={attachments}
          onAttachmentsChange={(updatedAttachments) => {
            setAttachments(updatedAttachments);
          }}
        />
      </div>

      {/* Approbation */}
      <div className="card px-4">
        <ExpenseApprovalPanel
          expenseId={id!}
          expenseStatus={expense.status}
          approvalStatus={(expense as any).approvalStatus}
          onApprovalChange={() => {
            loadExpense(); // Recharger la dépense après changement d'approbation
          }}
        />
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
    </div>
  );
}

export default ExpenseDetailPage;

