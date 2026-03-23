import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Receipt,
  User,
  Calendar,
  DollarSign,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import expenseService from '../../services/expense.service';
import { ExpenseApproval } from '../../components/expenses/ExpenseApprovalPanel';
import { useToastContext } from '../../contexts/ToastContext';
import { Modal } from '../../components/ui/Modal';

function ExpenseApprovalPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const [approvals, setApprovals] = useState<ExpenseApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectComments, setRejectComments] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await expenseService.listPendingApprovals();
      setApprovals(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des approbations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      setApprovingId(approvalId);
      await expenseService.approveExpense(approvalId);
      showSuccess('Dépense approuvée avec succès.');
      await loadApprovals();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'approbation';
      showError(errorMessage);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (approvalId: string) => {
    if (!rejectReason.trim()) {
      showError('Veuillez indiquer une raison de rejet.');
      return;
    }

    try {
      setRejectingId(approvalId);
      await expenseService.rejectExpense(approvalId, rejectReason, rejectComments || undefined);
      showSuccess('Dépense rejetée.');
      setRejectReason('');
      setRejectComments('');
      setShowRejectModal(null);
      await loadApprovals();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du rejet';
      showError(errorMessage);
    } finally {
      setRejectingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number, currency: string = 'CDF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatUserName = (user?: { firstName?: string; lastName?: string; email: string }) => {
    if (!user) return 'Inconnu';
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/expenses" className="btn-ghost btn-sm">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Clock className="text-yellow-600" size={24} />
              Approbations en attente
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {loading ? 'Chargement...' : `${approvals.length} demande${approvals.length > 1 ? 's' : ''} en attente`}
            </p>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="card border-danger/20 bg-danger/5 flex items-start space-x-3 animate-fade-in">
          <AlertCircle className="text-danger flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm text-danger flex-1">{error}</p>
          </div>
        </div>
      )}

      {/* Liste des approbations */}
      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="ml-3 text-text-secondary">Chargement des approbations...</span>
          </div>
        </div>
      ) : approvals.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle2 className="mx-auto text-green-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Aucune approbation en attente</h3>
          <p className="text-text-secondary mb-6">Toutes les demandes d'approbation ont été traitées.</p>
          <Link to="/expenses" className="btn-primary inline-flex items-center space-x-2">
            <ArrowLeft size={18} />
            <span>Retour aux dépenses</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div key={approval.id} className="card p-6 border-l-4 border-l-yellow-500">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      En attente d'approbation
                    </span>
                    {approval.rule && (
                      <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded">
                        Règle: {approval.rule.name}
                      </span>
                    )}
                  </div>

                  {/* Informations sur la dépense */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Dépense</p>
                      <Link
                        to={`/expenses/${approval.expenseId}`}
                        className="font-semibold text-text-primary hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <Receipt size={16} />
                        {approval.expense?.expenseNumber || 'N/A'}
                      </Link>
                      {approval.expense?.description && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                          {approval.expense.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-text-secondary mb-1">Montant</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {approval.expense?.amountTtc ? formatPrice(approval.expense.amountTtc) : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-text-secondary mb-1">Demandé par</p>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-text-muted" />
                        <span className="font-medium text-text-primary">
                          {formatUserName(approval.requester)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar size={14} className="text-text-muted" />
                        <span className="text-xs text-text-secondary">
                          {formatDate(approval.requestedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Commentaires */}
                  {approval.comments && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-2">
                        <MessageSquare size={16} className="text-text-muted mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-text-secondary mb-1">Commentaires du demandeur</p>
                          <p className="text-sm text-text-primary">{approval.comments}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fournisseur et catégorie si disponibles */}
                  {approval.expense && (approval.expense.supplier?.name || approval.expense.category?.name) && (
                    <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
                      {approval.expense.supplier?.name && (
                        <span>Fournisseur: {approval.expense.supplier.name}</span>
                      )}
                      {approval.expense.category?.name && (
                        <span>Catégorie: {approval.expense.category.name}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <Link
                  to={`/expenses/${approval.expenseId}`}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Receipt size={16} />
                  Voir la dépense
                </Link>
                <div className="flex-1" />
                <button
                  onClick={() => handleApprove(approval.id)}
                  disabled={approvingId === approval.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {approvingId === approval.id ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Approbation...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Approuver
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRejectModal(approval.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle size={16} />
                  Rejeter
                </button>
              </div>

              {/* Modal de rejet */}
              <Modal
                isOpen={showRejectModal === approval.id}
                onClose={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                  setRejectComments('');
                }}
                title="Rejeter la dépense"
                size="md"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Raison du rejet <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Indiquez la raison du rejet..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commentaires (optionnel)
                    </label>
                    <textarea
                      value={rejectComments}
                      onChange={(e) => setRejectComments(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Commentaires supplémentaires..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowRejectModal(null);
                        setRejectReason('');
                        setRejectComments('');
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleReject(approval.id)}
                      disabled={!rejectReason.trim() || rejectingId === approval.id}
                      className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rejectingId === approval.id ? 'Rejet...' : 'Rejeter'}
                    </button>
                  </div>
                </div>
              </Modal>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExpenseApprovalPage;

