import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, AlertCircle, Package } from 'lucide-react';
import warehouseService, { Warehouse } from '../../services/warehouse.service';
import api from '../../services/api';
import { useConfirm } from '../../hooks/useConfirm';

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  IN: 'Entree', OUT: 'Sortie', TRANSFER: 'Transfert', ADJUSTMENT: 'Ajustement',
};
const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  IN: 'bg-green-100 text-green-700', OUT: 'bg-red-100 text-red-700',
  TRANSFER: 'bg-blue-100 text-blue-700', ADJUSTMENT: 'bg-yellow-100 text-yellow-700',
};

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const [whRes, movRes] = await Promise.all([
        warehouseService.getById(id!),
        api.get(`/stock-movements?warehouseId=${id}&limit=10&sortBy=createdAt&sortOrder=desc`),
      ]);
      setWarehouse(whRes.data);
      setMovements(movRes.data?.data?.movements ?? movRes.data?.data ?? []);
    } catch {
      setError('Entrepot introuvable.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm.confirm({
      title: 'Supprimer l\'entrepôt',
      message: `Êtes-vous sûr de vouloir supprimer l'entrepôt "${warehouse?.name}" ?`,
      confirmText: 'Supprimer',
      variant: 'danger',
      impact: 'Cet entrepôt sera définitivement supprimé.',
      isIrreversible: true,
      consequences: [
        'L\'historique des mouvements de stock sera conservé',
        'Les produits ne seront plus associés à cet entrepôt',
        'Si c\'est l\'entrepôt par défaut, vous devrez en définir un nouveau',
      ],
    });

    if (!confirmed) return;

    try {
      setDeleting(true);
      await warehouseService.delete(id!);
      navigate('/stock/warehouses');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Erreur lors de la suppression.');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (error || !warehouse) return (
    <div className="p-6">
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <AlertCircle size={18} /> {error || 'Entrepot introuvable'}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/stock/warehouses')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
            {warehouse.code && <p className="text-sm text-gray-500 mt-0.5">Code : {warehouse.code}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/stock/warehouses/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <Edit size={16} /> Modifier
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium">
            <Trash2 size={16} /> {deleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Badges statut */}
      <div className="flex gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${warehouse.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          <span className={`w-2 h-2 rounded-full ${warehouse.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
          {warehouse.isActive ? 'Actif' : 'Inactif'}
        </span>
        {warehouse.isDefault && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
            Entrepot par defaut
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Nom', value: warehouse.name },
          { label: 'Code', value: warehouse.code || '—' },
          { label: 'Adresse', value: warehouse.address || '—' },
          { label: 'Ville', value: warehouse.city || '—' },
          { label: 'Pays', value: warehouse.country || '—' },
          { label: 'Notes', value: warehouse.notes || '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-medium text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Mouvements recents */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Mouvements de stock recents</h2>
        </div>
        {movements.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun mouvement enregistre dans cet entrepot</p>
        ) : (
          <div className="space-y-2">
            {movements.map((mv: any) => (
              <div key={mv.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MOVEMENT_TYPE_COLORS[mv.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {MOVEMENT_TYPE_LABELS[mv.type] ?? mv.type}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {mv.items?.[0]?.product?.name ?? mv.reference ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {mv.createdAt ? new Date(mv.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${mv.type === 'IN' ? 'text-green-700' : mv.type === 'OUT' ? 'text-red-700' : 'text-gray-700'}`}>
                  {mv.type === 'IN' ? '+' : mv.type === 'OUT' ? '-' : ''}
                  {mv.items?.[0]?.quantity ?? mv.quantity ?? '?'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
