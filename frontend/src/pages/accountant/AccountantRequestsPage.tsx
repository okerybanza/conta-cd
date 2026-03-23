import { useState, useEffect } from 'react';
import { Mail, Building2, Calendar, CheckCircle2, XCircle, FileText, Loader2, AlertCircle, Eye } from 'lucide-react';
import accountantService, { CompanyAccountant } from '../../services/accountant.service';
import contractService from '../../services/contract.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../utils/formatters';

type Invitation = Omit<CompanyAccountant, 'company'> & {
  company?: {
    id: string;
    name?: string;
    businessName?: string;
    logoUrl?: string;
    city?: string;
    country?: string;
  };
  invitedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  contract?: {
    status: string;
  };
};

function AccountantRequestsPage() {
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CompanyAccountant['status']>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, [statusFilter]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await accountantService.getInvitations(statusFilter || undefined);
      setInvitations(response as Invitation[]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    const confirmed = await confirm.confirm({
      title: 'Accepter l\'invitation',
      message: 'Voulez-vous accepter cette invitation et commencer à gérer la comptabilité de cette entreprise ?',
      variant: 'info',
      confirmText: 'Accepter',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      setProcessingId(invitationId);
      await accountantService.acceptInvitation(invitationId, {});
      showSuccess('Invitation acceptée avec succès !');
      loadInvitations();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'acceptation';
      showError(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitationId: string) => {
    const reason = rejectionReason[invitationId];
    if (!reason || reason.trim().length === 0) {
      showError('Veuillez fournir une raison de refus');
      return;
    }

    const confirmed = await confirm.confirm({
      title: 'Rejeter l\'invitation',
      message: 'Êtes-vous sûr de vouloir rejeter cette invitation ?',
      variant: 'danger',
      confirmText: 'Rejeter',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      setProcessingId(invitationId);
      await accountantService.rejectRequest(invitationId, reason);
      showSuccess('Invitation rejetée');
      setShowRejectForm(null);
      setRejectionReason({ ...rejectionReason, [invitationId]: '' });
      loadInvitations();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du rejet';
      showError(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: CompanyAccountant['status']) => {
    const badges = {
      pending: (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
          En attente
        </span>
      ),
      accepted: (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          Actif
        </span>
      ),
      rejected: (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          Rejeté
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">Mes Demandes</h1>
        <p className="text-text-secondary mt-1">
          Gérez les invitations reçues des entreprises
        </p>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex gap-4">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente ({invitations.filter((i) => i.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('accepted')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'accepted'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Actives ({invitations.filter((i) => i.status === 'accepted').length})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'rejected'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejetées ({invitations.filter((i) => i.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Liste des invitations */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : invitations.length === 0 ? (
        <div className="card text-center py-12">
          <Mail className="mx-auto text-text-muted mb-4" size={48} />
          <p className="text-text-secondary">
            Aucune invitation {statusFilter === 'pending' ? 'en attente' : statusFilter === 'accepted' ? 'actives' : statusFilter}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {invitation.company?.logoUrl ? (
                      <img
                        src={invitation.company.logoUrl}
                        alt={invitation.company.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="text-primary" size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary">
                        {invitation.company?.name || invitation.company?.businessName}
                      </h3>
                      {invitation.company?.city && invitation.company?.country && (
                        <p className="text-sm text-text-secondary">
                          {invitation.company.city}, {invitation.company.country}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(invitation.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-text-muted">Invité le :</span>
                      <p className="text-text-primary font-medium">
                        {formatDate(invitation.invitedAt)}
                      </p>
                    </div>
                    {invitation.acceptedAt && (
                      <div>
                        <span className="text-text-muted">Accepté le :</span>
                        <p className="text-text-primary font-medium">
                          {formatDate(invitation.acceptedAt)}
                        </p>
                      </div>
                    )}
                    {invitation.rejectedAt && (
                      <div>
                        <span className="text-text-muted">Rejeté le :</span>
                        <p className="text-text-primary font-medium">
                          {formatDate(invitation.rejectedAt)}
                        </p>
                      </div>
                    )}
                    {invitation.contract && (
                      <div>
                        <span className="text-text-muted">Contrat :</span>
                        <p className="text-text-primary font-medium flex items-center gap-1">
                          <FileText size={16} />
                          {invitation.contract.status}
                        </p>
                      </div>
                    )}
                  </div>

                  {invitation.rejectionReason && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>Raison du refus :</strong> {invitation.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Formulaire de rejet */}
                  {showRejectForm === invitation.id && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Raison du refus <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={rejectionReason[invitation.id] || ''}
                        onChange={(e) =>
                          setRejectionReason({ ...rejectionReason, [invitation.id]: e.target.value })
                        }
                        placeholder="Expliquez pourquoi vous refusez cette invitation..."
                        className="input w-full min-h-[100px]"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  {invitation.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAccept(invitation.id)}
                        disabled={processingId === invitation.id}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50"
                      >
                        {processingId === invitation.id ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Traitement...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={18} />
                            <span>Accepter</span>
                          </>
                        )}
                      </button>
                      {showRejectForm !== invitation.id ? (
                        <button
                          onClick={() => setShowRejectForm(invitation.id)}
                          className="btn-secondary flex items-center gap-2"
                        >
                          <XCircle size={18} />
                          <span>Rejeter</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleReject(invitation.id)}
                            disabled={processingId === invitation.id}
                            className="btn-danger flex items-center gap-2 disabled:opacity-50"
                          >
                            {processingId === invitation.id ? (
                              <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>Envoi...</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={18} />
                                <span>Confirmer le rejet</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowRejectForm(null);
                              setRejectionReason({ ...rejectionReason, [invitation.id]: '' });
                            }}
                            className="btn-ghost"
                          >
                            Annuler
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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

export default AccountantRequestsPage;

