import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, AlertCircle, Eye, Edit, Trash2 } from 'lucide-react';
import contractService, { Contract } from '../../services/contract.service';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', pending: 'En attente', signed: 'Signe',
  expired: 'Expire', cancelled: 'Annule',
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  signed: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function ContractsListPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await contractService.list();
      setContracts(res.data ?? []);
    } catch {
      setError('Erreur de chargement des contrats.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Annuler ce contrat ?')) return;
    try {
      setDeleting(id);
      await contractService.cancel(id);
      setContracts(c => c.filter(x => x.id !== id));
    } catch {
      setError('Erreur lors de la suppression.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contrats</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contracts.length} contrat(s)</p>
        </div>
        <Link to="/contracts/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus size={16} /> Nouveau contrat
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun contrat</p>
            <p className="text-sm text-gray-400 mt-1">Creez votre premier contrat</p>
            <Link to="/contracts/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus size={16} /> Nouveau contrat
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Titre</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Date debut</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Date fin</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Signe entreprise</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Signe comptable</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.company?.name ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.type || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{fmtDate(c.startDate)}</td>
                    <td className="px-4 py-3 text-gray-700">{fmtDate(c.endDate)}</td>
                    <td className="px-4 py-3">
                      {c.companySignedAt ? (
                        <span className="text-xs text-green-700">{fmtDate(c.companySignedAt)}</span>
                      ) : (
                        <span className="text-xs text-gray-400">Non signe</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.accountantSignedAt ? (
                        <span className="text-xs text-green-700">{fmtDate(c.accountantSignedAt)}</span>
                      ) : (
                        <span className="text-xs text-gray-400">Non signe</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/contracts/edit/${c.id}`)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => navigate(`/contracts/edit/${c.id}`)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
