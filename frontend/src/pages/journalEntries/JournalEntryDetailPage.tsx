import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import journalEntryService, { JournalEntry, JournalEntryStatus } from '../../services/journalEntry.service';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeature } from '../../utils/featureToggle';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

function JournalEntryDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const canAccessAccounting = user && hasFeature(user, 'accounting');

  useEffect(() => {
    if (canAccessAccounting && id) {
      loadEntry(id);
    } else {
      setLoading(false);
    }
  }, [id, canAccessAccounting]);

  const loadEntry = async (entryId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await journalEntryService.getById(entryId);
      setEntry(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'écriture comptable');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = await confirm.confirm({
      title: 'Supprimer l\'écriture comptable',
      message: 'Êtes-vous sûr de vouloir supprimer cette écriture comptable ? Cette action est irréversible.',
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await journalEntryService.delete(id);
      showSuccess('Écriture comptable supprimée avec succès.');
      navigate('/journal-entries');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression';
      showError(errorMessage);
    }
  };

  const handleReverse = async () => {
    if (!id) return;
    const result = await confirm.confirm({
      title: 'Contrepasser l\'écriture',
      message: 'Voulez-vous vraiment contrepasser cette écriture ? Une nouvelle écriture inversée sera créée.',
      variant: 'warning',
      confirmText: 'Contrepasser',
      cancelText: 'Annuler',
      requireJustification: true,
      justificationPlaceholder: 'Motif de la contrepassation (requis)',
    });

    if (!result.confirmed) return;

    try {
      if (!result.justification) {
        showError('Justification requise');
        return;
      }
      await journalEntryService.reverse(id, result.justification);
      loadEntry(id);
      showSuccess('Écriture contrepassée avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la contrepassation';
      showError(errorMessage);
    }
  };

  const handlePost = async () => {
    if (!id) return;
    try {
      setPosting(true);
      await journalEntryService.post(id);
      showSuccess('Écriture comptable comptabilisée avec succès.');
      loadEntry(id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la comptabilisation';
      showError(errorMessage);
    } finally {
      setPosting(false);
    }
  };

  const getStatusBadge = (status: JournalEntryStatus) => {
    const badges = {
      draft: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Brouillon' },
      posted: { icon: CheckCircle2, color: 'bg-green-100 text-green-800', label: 'Comptabilisée' },
      reversed: { icon: RotateCcw, color: 'bg-red-100 text-red-800', label: 'Contre-passée' },
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon size={16} className="mr-2" />
        {badge.label}
      </span>
    );
  };

  const getSourceTypeLabel = (sourceType: string) => {
    const labels: Record<string, string> = {
      invoice: 'Facture',
      expense: 'Dépense',
      payment: 'Paiement',
      manual: 'Manuelle',
    };
    return labels[sourceType] || sourceType;
  };

  const calculateTotals = () => {
    if (!entry) return { debit: 0, credit: 0 };
    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);
    return { debit: totalDebit, credit: totalCredit };
  };

  if (!canAccessAccounting) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-lg shadow-md">
        <BookOpen size={64} className="text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Accès Restreint</h2>
        <p className="text-gray-600 mb-4 text-center">
          Votre abonnement actuel ne vous donne pas accès à la fonctionnalité de comptabilité.
        </p>
        <Link to="/settings/subscription" className="btn-primary">
          Gérer l'abonnement
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            <span>{error || 'Écriture comptable non trouvée'}</span>
          </div>
        </div>
        <Link to="/journal-entries" className="btn-secondary mt-4 inline-flex items-center">
          <ArrowLeft size={18} className="mr-2" />
          Retour à la liste
        </Link>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <Link to="/journal-entries" className="btn-secondary flex items-center space-x-2">
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
        <div className="flex space-x-2">
          {entry.status === 'draft' && (
            <>
              <Link to={`/journal-entries/${entry.id}/edit`} className="btn-primary flex items-center space-x-2">
                <Edit size={20} />
                <span>Modifier</span>
              </Link>
              <button onClick={handlePost} disabled={posting} className="btn-success flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {posting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                <span>Comptabiliser</span>
              </button>
              <button onClick={handleDelete} className="btn-danger flex items-center space-x-2">
                <Trash2 size={20} />
                <span>Supprimer</span>
              </button>
            </>
          )}
          {entry.status === 'posted' && (
            <button onClick={handleReverse} className="btn-danger flex items-center space-x-2">
              <RotateCcw size={20} />
              <span>Contrepasser</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* En-tête */}
        <div className="border-b pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{entry.entryNumber}</h1>
              <p className="text-gray-600 mt-1">{entry.description || 'Sans description'}</p>
            </div>
            <div>{getStatusBadge(entry.status)}</div>
          </div>
        </div>

        {/* Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'écriture</label>
            <div className="flex items-center text-gray-900">
              <Calendar size={16} className="mr-2 text-gray-400" />
              {new Date(entry.entryDate).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <div className="text-gray-900">{getSourceTypeLabel(entry.sourceType)}</div>
          </div>
          {entry.reference && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
              <div className="text-gray-900">{entry.reference}</div>
            </div>
          )}
          {entry.sourceId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Source</label>
              <div className="text-gray-900 font-mono text-sm">{entry.sourceId}</div>
            </div>
          )}
        </div>

        {/* Lignes d'écriture */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Lignes d'écriture</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Compte</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">Débit</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">Crédit</th>
                </tr>
              </thead>
              <tbody>
                {entry.lines.map((line) => (
                  <tr key={line.id} className="border-b border-gray-200">
                    <td className="py-3 px-4">
                      <div className="font-medium">{line.account.code}</div>
                      <div className="text-sm text-gray-600">{line.account.name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{line.description || '-'}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={2} className="py-3 px-4 text-right">Total</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(totals.debit)}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(totals.credit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-700">
              {entry.notes}
            </div>
          </div>
        )}

        {/* Reason for Reversal */}
        {(entry as any).reason && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-red-700 mb-2">Motif de contrepassation</label>
            <div className="bg-red-50 p-4 rounded border border-red-200 text-red-800 font-medium">
              {(entry as any).reason}
            </div>
          </div>
        )}

        {/* Métadonnées */}
        <div className="border-t pt-4 text-sm text-gray-500">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Créée le :</span>{' '}
              {new Date(entry.createdAt).toLocaleString('fr-FR')}
            </div>
            <div>
              <span className="font-medium">Modifiée le :</span>{' '}
              {new Date(entry.updatedAt).toLocaleString('fr-FR')}
            </div>
          </div>
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
        requireJustification={confirm.options.requireJustification}
        justificationPlaceholder={confirm.options.justificationPlaceholder}
      />
    </div>
  );
}

export default JournalEntryDetailPage;

