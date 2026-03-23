import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Repeat,
  Play,
  Pause,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  History,
  X,
  FileText,
} from 'lucide-react';
import recurringInvoiceService, { RecurringInvoice } from '../../services/recurringInvoice.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

function RecurringInvoicesListPage() {
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    isActive: undefined as boolean | undefined,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isCreateDisabled, setIsCreateDisabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecurringInvoices();
  }, [filters]);

  const loadRecurringInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recurringInvoiceService.list({
        page: filters.page,
        limit: filters.limit,
        isActive: filters.isActive,
      });
      setRecurringInvoices(response.data || []);
      setPagination(response.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } catch (err: any) {
      const code = err.response?.data?.code;
      setError(err.response?.data?.message || 'Erreur lors du chargement des factures récurrentes');
      if (
        code === 'SUBSCRIPTION_REQUIRED' ||
        code === 'SUBSCRIPTION_EXPIRED' ||
        code === 'SUBSCRIPTION_EXPIRED_READ_ONLY'
      ) {
        setIsCreateDisabled(true);
      }
      setRecurringInvoices([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm.confirm({
      title: 'Supprimer la facture récurrente',
      message: 'Êtes-vous sûr de vouloir supprimer cette facture récurrente ? Cette action est irréversible.',
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await recurringInvoiceService.delete(id);
      loadRecurringInvoices();
      showSuccess('Facture récurrente supprimée avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression';
      showError(errorMessage);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await recurringInvoiceService.update(id, { isActive: !currentStatus });
      loadRecurringInvoices();
      showSuccess(`Facture récurrente ${!currentStatus ? 'activée' : 'désactivée'} avec succès.`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour';
      showError(errorMessage);
    }
  };

  const handleGenerate = async (id: string) => {
    try {
      const result = await recurringInvoiceService.generate(id);
      showSuccess(`Facture générée avec succès ! ID: ${result.invoiceId}`);
      loadRecurringInvoices();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la génération';
      showError(errorMessage);
    }
  };

  const handleShowHistory = async (id: string) => {
    setHistoryModalOpen(id);
    setLoadingHistory(true);
    try {
      const invoices = await recurringInvoiceService.getHistory(id);
      setHistory(invoices);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoadingHistory(false);
    }
  };

  const getFrequencyLabel = (frequency: string, interval: number) => {
    const labels: Record<string, string> = {
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
      quarterly: 'Trimestriel',
      yearly: 'Annuel',
    };
    const base = labels[frequency] || frequency;
    return interval > 1 ? `Tous les ${interval} ${base.toLowerCase()}s` : base;
  };

  const getCustomerName = (recurring: RecurringInvoice) => {
    if (recurring.customer) {
      return recurring.customer.type === 'particulier'
        ? `${recurring.customer.firstName || ''} ${recurring.customer.lastName || ''}`.trim()
        : recurring.customer.businessName || '';
    }
    return 'Client inconnu';
  };

  const handleCreateRecurringClick = () => {
    if (isCreateDisabled) {
      showError(
        "Votre abonnement actuel ne permet plus de créer de nouvelles factures récurrentes. " +
          'Choisissez un plan pour continuer à automatiser votre facturation.'
      );
      navigate('/settings/subscription/upgrade');
      return;
    }

    navigate('/recurring-invoices/new');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary">
            Factures récurrentes
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Automatisez vos facturations périodiques (abonnements, loyers, contrats de service).
          </p>
          {pagination.total > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              <span className="px-2 py-1 rounded-full bg-background-gray text-text-secondary">
                Total :{' '}
                <span className="font-semibold text-text-primary">
                  {pagination.total}
                </span>
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleCreateRecurringClick}
          className="btn-primary flex items-center space-x-2 disabled:opacity-60"
          disabled={isCreateDisabled}
        >
          <Plus size={20} />
          <span>Nouvelle facture récurrente</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFilters({ ...filters, isActive: undefined, page: 1 })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.isActive === undefined
                ? 'bg-primary text-white'
                : 'bg-background-gray text-text-secondary hover:bg-background-gray/80'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilters({ ...filters, isActive: true, page: 1 })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.isActive === true
                ? 'bg-primary text-white'
                : 'bg-background-gray text-text-secondary hover:bg-background-gray/80'
            }`}
          >
            Actives
          </button>
          <button
            onClick={() => setFilters({ ...filters, isActive: false, page: 1 })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.isActive === false
                ? 'bg-primary text-white'
                : 'bg-background-gray text-text-secondary hover:bg-background-gray/80'
            }`}
          >
            Inactives
          </button>
        </div>
      </div>

      {/* List */}
      {recurringInvoices.length === 0 ? (
        <div className="card text-center py-12">
          <Repeat className="mx-auto text-text-muted mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Aucune facture récurrente</h3>
          <p className="text-text-secondary mb-6">
            Créez votre première facture récurrente pour automatiser vos facturations
          </p>
          <button
            type="button"
            onClick={handleCreateRecurringClick}
            className="btn-primary inline-flex items-center space-x-2 disabled:opacity-60"
            disabled={isCreateDisabled}
          >
            <Plus size={18} />
            <span>Créer une facture récurrente</span>
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left px-6 py-3">Nom</th>
                  <th className="text-left px-6 py-3">Client</th>
                  <th className="text-left px-6 py-3">Fréquence</th>
                  <th className="text-left px-6 py-3">Prochaine exécution</th>
                  <th className="text-right px-6 py-3">Générées</th>
                  <th className="text-left px-6 py-3">Statut</th>
                  <th className="text-right px-4 py-3 w-0" />
                </tr>
              </thead>
              <tbody>
                {recurringInvoices.map((recurring) => (
                  <tr key={recurring.id} className="table-row">
                    <td className="px-6 py-4 align-top">
                      <div>
                        <p className="font-semibold text-text-primary">{recurring.name}</p>
                        {recurring.description && (
                          <p className="text-sm text-text-muted truncate max-w-xs">
                            {recurring.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <Link
                        to={`/customers/${recurring.customerId}`}
                        className="text-primary hover:underline"
                      >
                        {getCustomerName(recurring)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center space-x-2">
                        <Repeat size={16} className="text-text-muted" />
                        <span className="text-sm">{getFrequencyLabel(recurring.frequency, recurring.interval)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} className="text-text-muted" />
                        <span className="text-sm">
                          {new Date(recurring.nextRunDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <span className="inline-flex items-center justify-end text-sm font-medium min-w-[3rem]">
                        {recurring.totalGenerated || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {recurring.isActive ? (
                        <span className="badge-success inline-flex items-center space-x-1">
                          <CheckCircle2 size={14} />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="badge-secondary inline-flex items-center space-x-1">
                          <Clock size={14} />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="relative flex justify-end">
                        <button
                          type="button"
                          className="btn-ghost p-2 rounded-lg hover:bg-background-gray transition-colors"
                          onClick={() =>
                            setOpenMenuId(openMenuId === recurring.id ? null : recurring.id)
                          }
                          aria-label="Actions facture récurrente"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openMenuId === recurring.id && (
                          <div className="absolute right-0 mt-2 w-52 bg-white border border-border rounded-lg shadow-lg z-10">
                            <div className="py-1 text-sm">
                              {recurring.isActive && (
                                <button
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-background-gray"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleGenerate(recurring.id);
                                  }}
                                >
                                  Générer une facture maintenant
                                </button>
                              )}
                              <button
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-background-gray"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleToggleActive(recurring.id, recurring.isActive || false);
                                }}
                              >
                                {recurring.isActive ? 'Mettre en pause' : 'Réactiver'}
                              </button>
                              <button
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-background-gray"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleShowHistory(recurring.id);
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  <History size={14} />
                                  <span>Voir l'historique</span>
                                </div>
                              </button>
                              <Link
                                to={`/recurring-invoices/${recurring.id}/edit`}
                                className="block w-full px-3 py-2 text-left hover:bg-background-gray"
                                onClick={() => setOpenMenuId(null)}
                              >
                                Modifier
                              </Link>
                              <button
                                type="button"
                                className="w-full px-3 py-2 text-left text-danger hover:bg-danger/5"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDelete(recurring.id);
                                }}
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-text-secondary">
              Page <span className="font-semibold text-text-primary">{pagination.page}</span> sur{' '}
              <span className="font-semibold text-text-primary">{pagination.totalPages}</span> ({pagination.total} facture{pagination.total > 1 ? 's' : ''})
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

      {/* History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-display font-bold text-text-primary">
                Historique des générations
              </h2>
              <button
                type="button"
                onClick={() => {
                  setHistoryModalOpen(null);
                  setHistory([]);
                }}
                className="btn-ghost p-2 rounded-lg hover:bg-background-gray"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-text-muted mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Aucune facture générée
                  </h3>
                  <p className="text-text-secondary">
                    Aucune facture n'a encore été générée depuis cette facture récurrente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="border border-border rounded-lg p-4 hover:bg-background-gray transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <FileText size={20} className="text-primary" />
                            <div>
                              <Link
                                to={`/invoices/${invoice.id}`}
                                className="font-semibold text-primary hover:underline"
                              >
                                {invoice.invoice_number}
                              </Link>
                              <p className="text-sm text-text-secondary">
                                {new Date(invoice.invoice_date).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-text-secondary">Montant HT:</span>{' '}
                              <span className="font-medium">
                                {Number(invoice.subtotal).toLocaleString('fr-FR')} {invoice.currency || 'CDF'}
                              </span>
                            </div>
                            <div>
                              <span className="text-text-secondary">Montant TTC:</span>{' '}
                              <span className="font-medium">
                                {Number(invoice.total_amount).toLocaleString('fr-FR')} {invoice.currency || 'CDF'}
                              </span>
                            </div>
                            <div>
                              <span className="text-text-secondary">Statut:</span>{' '}
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  invoice.status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : invoice.status === 'sent'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {invoice.status === 'paid'
                                  ? 'Payée'
                                  : invoice.status === 'sent'
                                  ? 'Envoyée'
                                  : 'Brouillon'}
                              </span>
                            </div>
                            <div>
                              <span className="text-text-secondary">Échéance:</span>{' '}
                              <span className="font-medium">
                                {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecurringInvoicesListPage;

