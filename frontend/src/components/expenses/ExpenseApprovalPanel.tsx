import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Send, User, MessageSquare, Calendar } from 'lucide-react';
import expenseService from '../../services/expense.service';
import { useToastContext } from '../../contexts/ToastContext';
import { Modal } from '../ui/Modal';
import { useAuthStore } from '../../store/auth.store';

export interface ExpenseApproval {
  id: string;
  expenseId: string;
  companyId: string;
  ruleId?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  expense?: {
    id: string;
    expenseNumber: string;
    amountTtc: number;
    description: string;
    supplier?: {
      id: string;
      name: string;
    };
    category?: {
      id: string;
      name: string;
    };
  };
  requester?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  approver?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  rejector?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  rule?: {
    id: string;
    name: string;
  };
}

interface ExpenseApprovalPanelProps {
  expenseId: string;
  expenseStatus?: string;
  approvalStatus?: string;
  currentUserId?: string;
  onApprovalChange?: () => void;
}

export default function ExpenseApprovalPanel({
  expenseId,
  expenseStatus,
  approvalStatus,
  currentUserId,
  onApprovalChange,
}: ExpenseApprovalPanelProps) {
  const { showSuccess, showError } = useToastContext();
  const { user } = useAuthStore();
  const [approvals, setApprovals] = useState<ExpenseApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectComments, setRejectComments] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, [expenseId]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const response = await expenseService.getApprovalsByExpense(expenseId);
      setApprovals(response.data || []);
    } catch (err: any) {
      console.error('Error loading approvals:', err);
      // Ne pas afficher d'erreur si c'est juste qu'il n'y a pas d'approbations
    } finally {
      setLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    try {
      setRequesting(true);
      await expenseService.requestApproval(expenseId, comments || undefined);
      showSuccess('Demande d\'approbation envoyée avec succès.');
      setShowRequestForm(false);
      setComments('');
      await loadApprovals();
      onApprovalChange?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la demande d\'approbation';
      showError(errorMessage);
    } finally {
      setRequesting(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      setApprovingId(approvalId);
      await expenseService.approveExpense(approvalId);
      showSuccess('Dépense approuvée avec succès.');
      await loadApprovals();
      onApprovalChange?.();
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
      await loadApprovals();
      onApprovalChange?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du rejet';
      showError(errorMessage);
    } finally {
      setRejectingId(null);
    }
  };

  const pendingApproval = approvals.find(a => a.status === 'pending');
  const lastApproval = approvals[approvals.length - 1];
  const canRequestApproval = expenseStatus !== 'validated' && !pendingApproval && approvalStatus !== 'approved';
  const userId = currentUserId || user?.id;
  const canApproveReject = pendingApproval && userId;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approuvé
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        );
      default:
        return null;
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

  const formatUserName = (user?: { firstName?: string; lastName?: string; email: string }) => {
    if (!user) return 'Inconnu';
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2 text-blue-600" />
          Approbation
        </h3>
        {getStatusBadge(lastApproval?.status || approvalStatus || 'none')}
      </div>

      {loading && approvals.length === 0 ? (
        <div className="text-center py-4 text-gray-500">Chargement...</div>
      ) : approvals.length === 0 && !canRequestApproval ? (
        <div className="text-center py-4 text-gray-500">Aucune approbation</div>
      ) : (
        <>
          {/* Historique des approbations */}
          {approvals.length > 0 && (
            <div className="space-y-4 mb-4">
              {approvals.map((approval) => (
                <div key={approval.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(approval.status)}
                        {approval.rule && (
                          <span className="text-xs text-gray-500">({approval.rule.name})</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            Demandé par <strong>{formatUserName(approval.requester)}</strong>
                          </span>
                          <Calendar className="w-4 h-4 ml-2" />
                          <span>{formatDate(approval.requestedAt)}</span>
                        </div>
                        {approval.status === 'approved' && approval.approver && (
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              Approuvé par <strong>{formatUserName(approval.approver)}</strong>
                            </span>
                            {approval.approvedAt && (
                              <>
                                <Calendar className="w-4 h-4 ml-2" />
                                <span>{formatDate(approval.approvedAt)}</span>
                              </>
                            )}
                          </div>
                        )}
                        {approval.status === 'rejected' && approval.rejector && (
                          <div className="flex items-center gap-2 text-red-700">
                            <XCircle className="w-4 h-4" />
                            <span>
                              Rejeté par <strong>{formatUserName(approval.rejector)}</strong>
                            </span>
                            {approval.rejectedAt && (
                              <>
                                <Calendar className="w-4 h-4 ml-2" />
                                <span>{formatDate(approval.rejectedAt)}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {approval.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          <strong>Raison du rejet :</strong> {approval.rejectionReason}
                        </div>
                      )}
                      {approval.comments && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          {approval.comments}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions pour approbation en attente */}
                  {approval.status === 'pending' && canApproveReject && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(approval.id)}
                          disabled={approvingId === approval.id}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approvingId === approval.id ? (
                            <>Chargement...</>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approuver
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setRejectReason('');
                            setRejectComments('');
                            setShowRejectModal(approval.id);
                          }}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
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
                              onClick={() => {
                                handleReject(approval.id);
                                setShowRejectModal(null);
                              }}
                              disabled={!rejectReason.trim() || rejectingId === approval.id}
                              className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {rejectingId === approval.id ? 'Rejet...' : 'Rejeter'}
                            </button>
                          </div>
                        </div>
                      </Modal>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bouton pour demander une approbation */}
          {canRequestApproval && !showRequestForm && (
            <button
              onClick={() => setShowRequestForm(true)}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Demander une approbation
            </button>
          )}

          {/* Formulaire de demande d'approbation */}
          {showRequestForm && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-3">Demander une approbation</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commentaires (optionnel)
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Ajoutez des commentaires pour les approbateurs..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRequestApproval}
                    disabled={requesting}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {requesting ? 'Envoi...' : 'Envoyer la demande'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRequestForm(false);
                      setComments('');
                    }}
                    disabled={requesting}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

