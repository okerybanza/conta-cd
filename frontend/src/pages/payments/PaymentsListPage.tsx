import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, CreditCard, Edit, Trash2, Loader2, AlertCircle, CheckCircle2, Clock, XCircle, Filter, Eye } from 'lucide-react';
import paymentService, { Payment, PaymentFilters } from '../../services/payment.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ActionsMenu } from '../../components/shared/ActionsMenu';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { PaymentDetailSlideIn } from '../../components/payments/PaymentDetailSlideIn';

function PaymentsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [methodFilter, setMethodFilter] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    loadPayments();
  }, [filters, location.pathname]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.list(filters);
      setPayments(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      paymentMethod: methodFilter || undefined,
      page: 1,
    });
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm.confirm({
      title: 'Supprimer le paiement',
      message: 'Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.',
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await paymentService.delete(id);
      loadPayments();
      showSuccess('Paiement supprimé avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression';
      showError(errorMessage);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Espèces',
      mobile_money: 'Mobile Money',
      bank_transfer: 'Virement',
      check: 'Chèque',
      card: 'Carte',
      other: 'Autre',
    };
    return methods[method] || method;
  };

  const formatPrice = (price: number, currency: string = 'CDF') => {
    return formatCurrency(price, currency);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedPayments = [...payments].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case 'paymentDate':
        aValue = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
        bValue = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
        break;
      case 'invoice':
        aValue = a.invoice?.invoiceNumber || '';
        bValue = b.invoice?.invoiceNumber || '';
        break;
      case 'customer':
        aValue = a.invoice?.customer
          ? a.invoice.customer.type === 'particulier'
            ? `${a.invoice.customer.firstName || ''} ${a.invoice.customer.lastName || ''}`.trim()
            : a.invoice.customer.businessName || ''
          : '';
        bValue = b.invoice?.customer
          ? b.invoice.customer.type === 'particulier'
            ? `${b.invoice.customer.firstName || ''} ${b.invoice.customer.lastName || ''}`.trim()
            : b.invoice.customer.businessName || ''
          : '';
        break;
      case 'amount':
        aValue = Number(a.amount || 0);
        bValue = Number(b.amount || 0);
        break;
      case 'paymentMethod':
        aValue = a.paymentMethod;
        bValue = b.paymentMethod;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (column: string) => {
    if (sortColumn !== column || !sortDirection) {
      return null;
    }
    return sortDirection === 'asc' ? '↑' : '↓';
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-text-primary">Paiements</h1>
          <p className="text-text-secondary mt-1">
            Gérez vos paiements et leur suivi
          </p>
        </div>
        <Link to="/payments/new" className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Nouveau Paiement</span>
        </Link>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Mode de paiement</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="input"
            >
              <option value="">Tous les modes</option>
              <option value="cash">Espèces</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Virement</option>
              <option value="check">Chèque</option>
              <option value="card">Carte</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} className="btn-primary w-full flex items-center justify-center space-x-2">
              <Filter size={18} />
              <span>Filtrer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="card border-danger/20 bg-danger/5 flex items-start space-x-3 animate-fade-in">
          <AlertCircle className="text-danger flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-danger flex-1">{error}</p>
        </div>
      )}

      {/* Tableau */}
      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="ml-3 text-text-secondary">Chargement des paiements...</span>
          </div>
        </div>
      ) : payments.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="mx-auto text-text-muted mb-4" size={48} />
          <h3 className="text-base font-semibold text-text-primary mb-2">Aucun paiement trouvé</h3>
          <p className="text-text-secondary mb-6">
            {methodFilter ? 'Aucun résultat pour votre filtre' : 'Commencez par enregistrer votre premier paiement'}
          </p>
          {!methodFilter && (
            <Link to="/payments/new" className="btn-primary inline-flex items-center space-x-2">
              <Plus size={18} />
              <span>Enregistrer un paiement</span>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th 
                      className="text-left px-6 py-3 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('paymentDate')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Date</span>
                        {getSortIcon('paymentDate') && <span className="text-primary">{getSortIcon('paymentDate')}</span>}
                      </div>
                    </th>
                    <th 
                      className="text-left px-6 py-3 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('invoice')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Facture</span>
                        {getSortIcon('invoice') && <span className="text-primary">{getSortIcon('invoice')}</span>}
                      </div>
                    </th>
                    <th 
                      className="text-left px-6 py-3 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('customer')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Client</span>
                        {getSortIcon('customer') && <span className="text-primary">{getSortIcon('customer')}</span>}
                      </div>
                    </th>
                    <th 
                      className="text-left px-6 py-3 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Montant</span>
                        {getSortIcon('amount') && <span className="text-primary">{getSortIcon('amount')}</span>}
                      </div>
                    </th>
                    <th 
                      className="text-left px-6 py-3 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('paymentMethod')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Mode</span>
                        {getSortIcon('paymentMethod') && <span className="text-primary">{getSortIcon('paymentMethod')}</span>}
                      </div>
                    </th>
                    <th 
                      className="text-left px-6 py-3 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Statut</span>
                        {getSortIcon('status') && <span className="text-primary">{getSortIcon('status')}</span>}
                      </div>
                    </th>
                    <th className="text-right px-4 py-3 w-0"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPayments.map((payment) => {
                    const customerName = payment.invoice?.customer
                      ? payment.invoice.customer.type === 'particulier'
                        ? `${payment.invoice.customer.firstName || ''} ${payment.invoice.customer.lastName || ''}`.trim() || 'Client'
                        : payment.invoice.customer.businessName || 'Client'
                      : '-';
                    
                    return (
                    <tr 
                      key={payment.id} 
                      className="table-row cursor-pointer"
                      onClick={(e) => {
                        // Ne pas naviguer si on clique sur le menu
                        if ((e.target as HTMLElement).closest('button, a')) {
                          return;
                        }
                        setSelectedPaymentId(payment.id);
                      }}
                    >
                      <td className="px-6 py-4 text-left">
                        <div className="text-sm text-text-primary font-medium">
                          {formatDate(payment.paymentDate)}
                        </div>
                        {(payment.transactionReference || payment.reference) && (
                          <p className="text-text-muted text-xs mt-0.5">
                            Ref: {payment.transactionReference || payment.reference}
                          </p>
                        )}
                        {payment.createdAt && (
                          <p className="text-text-muted text-xs mt-0.5">
                            Créé: {formatDate(payment.createdAt)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-left">
                        {payment.invoice ? (
                          <Link
                            to={`/invoices/${payment.invoiceId}`}
                            className="text-primary hover:text-primary-dark font-medium transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {payment.invoice.invoiceNumber}
                          </Link>
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <span className="text-text-primary">{customerName}</span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <span className="font-semibold text-text-primary">
                          {formatPrice(Number(payment.amount), payment.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <span className="badge badge-primary">
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">{getStatusBadge(payment.status)}</td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <ActionsMenu
                          actions={[
                            {
                              label: 'Voir',
                              onClick: () => setSelectedPaymentId(payment.id),
                              icon: <Eye size={14} />,
                            },
                            {
                              label: 'Modifier',
                              onClick: () => setSelectedPaymentId(payment.id),
                              icon: <Edit size={14} />,
                            },
                            {
                              label: 'Supprimer',
                              onClick: () => handleDelete(payment.id),
                              icon: <Trash2 size={14} />,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="card">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-text-secondary">
                  Page <span className="font-semibold text-text-primary">{pagination.page}</span> sur{' '}
                  <span className="font-semibold text-text-primary">{pagination.totalPages}</span> ({pagination.total} paiement{pagination.total > 1 ? 's' : ''})
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

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

      {/* Payment Detail Slide-in */}
      {selectedPaymentId && (
        <PaymentDetailSlideIn
          isOpen={!!selectedPaymentId}
          onClose={() => setSelectedPaymentId(null)}
          paymentId={selectedPaymentId}
          onRefresh={loadPayments}
        />
      )}
    </div>
  );
}

export default PaymentsListPage;

