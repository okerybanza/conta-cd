import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Search,
  Plus,
  FileText,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import creditNoteService, { CreditNote } from '../../services/creditNote.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import ActionsMenu, { ActionItem } from '../../components/shared/ActionsMenu';
import { formatDate, formatCurrency } from '../../utils/formatters';

function CreditNotesListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    invoiceId: searchParams.get('invoiceId') || undefined,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCreditNotes();
  }, [filters, location.pathname]);

  const loadCreditNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await creditNoteService.list({
        ...filters,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setCreditNotes(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des avoirs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      page: 1,
    });
    loadCreditNotes();
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm.confirm({
      title: 'Supprimer l\'avoir',
      message: 'Êtes-vous sûr de vouloir supprimer cet avoir ? Cette action est irréversible.',
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await creditNoteService.delete(id);
      loadCreditNotes();
      showSuccess('Avoir supprimé avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression';
      showError(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; badgeClass: string; icon: LucideIcon }> = {
      draft: { label: 'Brouillon', badgeClass: 'bg-gray-100 text-gray-700', icon: FileText },
      sent: { label: 'Envoyé', badgeClass: 'bg-blue-100 text-blue-700', icon: Send },
      applied: { label: 'Appliqué', badgeClass: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      cancelled: { label: 'Annulé', badgeClass: 'bg-red-100 text-red-700', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, badgeClass: 'bg-gray-100 text-gray-700', icon: FileText };
    const Icon = config.icon;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badgeClass} flex items-center space-x-1`}>
        <Icon size={12} />
        <span>{config.label}</span>
      </span>
    );
  };

  const formatPrice = (price: number, currency: string = 'CDF') => {
    return formatCurrency(price, currency);
  };

  const getActions = (creditNote: CreditNote): ActionItem[] => {
    const actions: ActionItem[] = [
      {
        label: 'Voir',
        icon: <Eye size={14} />,
        onClick: () => navigate(`/credit-notes/${creditNote.id}`),
      },
    ];

    if (creditNote.status === 'draft' || creditNote.status === 'sent') {
      actions.push({
        label: 'Modifier',
        icon: <Edit size={14} />,
        onClick: () => navigate(`/credit-notes/${creditNote.id}/edit`),
      });
    }

    if (creditNote.status === 'draft' || creditNote.status === 'sent') {
      actions.push({
        label: 'Supprimer',
        icon: <Trash2 size={14} />,
        onClick: () => handleDelete(creditNote.id),
        className: 'text-red-600',
      });
    }

    return actions;
  };

  if (loading && creditNotes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avoirs</h1>
          <p className="text-gray-600 mt-1">Gérez les avoirs et remboursements</p>
        </div>
        <Link
          to="/credit-notes/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvel avoir
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Numéro, référence, raison..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                handleSearch();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyé</option>
              <option value="applied">Appliqué</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      {creditNotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun avoir</h3>
          <p className="text-gray-600 mb-4">Commencez par créer un nouvel avoir.</p>
          <Link
            to="/credit-notes/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvel avoir
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raison
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {creditNotes.map((creditNote) => (
                  <tr key={creditNote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/credit-notes/${creditNote.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {creditNote.creditNoteNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {creditNote.invoices ? (
                        <Link
                          to={`/invoices/${creditNote.invoiceId}`}
                          className="text-sm text-gray-900 hover:text-blue-600"
                        >
                          {creditNote.invoices.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(creditNote.creditNoteDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(creditNote.totalAmount, creditNote.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={creditNote.reason}>
                        {creditNote.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(creditNote.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ActionsMenu actions={getActions(creditNote)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de {(pagination.page - 1) * pagination.limit + 1} à{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} résultats
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}

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

export default CreditNotesListPage;

