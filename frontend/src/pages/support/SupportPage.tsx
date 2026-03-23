import { useState, useEffect } from 'react';
import { MessageCircle, Send, AlertCircle, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import supportService, { SupportTicket, CreateSupportTicketData } from '../../services/support.service';
import { useToastContext } from '../../contexts/ToastContext';

function SupportPage() {
  const { showSuccess, showError } = useToastContext();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [formData, setFormData] = useState<CreateSupportTicketData>({
    subject: '',
    message: '',
    category: 'technical',
    priority: 'medium',
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await supportService.listTickets();
      setTickets(response.tickets);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ticket = await supportService.createTicket(formData);
      setTickets([ticket, ...tickets]);
      setShowCreateModal(false);
      setFormData({
        subject: '',
        message: '',
        category: 'technical',
        priority: 'medium',
      });
      showSuccess('Ticket de support créé avec succès ! Vous recevrez une réponse par email.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erreur lors de la création du ticket';
      showError(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { icon: any; color: string; label: string }> = {
      open: { icon: Clock, color: 'bg-accent/10 text-accent', label: 'Ouvert' },
      in_progress: { icon: AlertCircle, color: 'bg-primary/10 text-primary', label: 'En cours' },
      resolved: { icon: CheckCircle, color: 'bg-green-500/10 text-green-600', label: 'Résolu' },
      closed: { icon: XCircle, color: 'bg-text-muted/10 text-text-muted', label: 'Fermé' },
    };

    const badge = badges[status] || badges.open;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      low: { color: 'bg-text-muted/10 text-text-muted', label: 'Faible' },
      medium: { color: 'bg-accent/10 text-accent', label: 'Moyenne' },
      high: { color: 'bg-orange-500/10 text-orange-600', label: 'Élevée' },
      urgent: { color: 'bg-danger/10 text-danger', label: 'Urgente' },
    };

    const badge = badges[priority] || badges.medium;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      technical: 'Technique',
      billing: 'Facturation',
      feature: 'Fonctionnalité',
      bug: 'Bug',
      other: 'Autre',
    };
    return labels[category || 'other'] || 'Autre';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-text-secondary">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Support Technique</h1>
          <p className="text-text-secondary mt-1">
            Contactez notre équipe pour toute question ou problème
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Nouveau ticket
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="card text-center py-12">
          <MessageCircle size={48} className="mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Aucun ticket de support
          </h3>
          <p className="text-text-secondary mb-6">
            Vous n'avez pas encore créé de ticket de support.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Créer un ticket
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {ticket.subject}
                    </h3>
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                  <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                    {ticket.message}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span>Catégorie: {getCategoryLabel(ticket.category)}</span>
                    <span>Créé le {formatDate(ticket.createdAt)}</span>
                    {ticket.response && (
                      <span className="text-accent">Répondu</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Nouveau ticket de support</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Sujet *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="input w-full"
                    placeholder="Décrivez brièvement votre problème"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="input w-full"
                  >
                    <option value="technical">Technique</option>
                    <option value="billing">Facturation</option>
                    <option value="feature">Demande de fonctionnalité</option>
                    <option value="bug">Signalement de bug</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Priorité *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="input w-full"
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Élevée</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    className="input w-full"
                    placeholder="Décrivez votre problème en détail..."
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <Send size={16} />
                    Envoyer le ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    {selectedTicket.subject}
                  </h2>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2">INFORMATIONS</h3>
                  <div className="bg-background-gray rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Catégorie:</span>
                      <span className="text-text-primary">{getCategoryLabel(selectedTicket.category)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Créé le:</span>
                      <span className="text-text-primary">{formatDate(selectedTicket.createdAt)}</span>
                    </div>
                    {selectedTicket.respondedAt && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Répondu le:</span>
                        <span className="text-text-primary">{formatDate(selectedTicket.respondedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2">MESSAGE</h3>
                  <div className="bg-background-gray rounded-lg p-4">
                    <p className="text-text-primary whitespace-pre-wrap">{selectedTicket.message}</p>
                  </div>
                </div>

                {selectedTicket.response && (
                  <div>
                    <h3 className="text-sm font-semibold text-text-secondary mb-2">RÉPONSE DU SUPPORT</h3>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <p className="text-text-primary whitespace-pre-wrap">{selectedTicket.response}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="btn-secondary"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportPage;

