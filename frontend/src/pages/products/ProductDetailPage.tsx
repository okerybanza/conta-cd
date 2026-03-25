import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Package, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useConfirm } from '../../hooks/useConfirm';

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  IN: 'Entree', OUT: 'Sortie', TRANSFER: 'Transfert', ADJUSTMENT: 'Ajustement',
};
const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  IN: 'bg-green-100 text-green-700',
  OUT: 'bg-red-100 text-red-700',
  TRANSFER: 'bg-blue-100 text-blue-700',
  ADJUSTMENT: 'bg-yellow-100 text-yellow-700',
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [product, setProduct] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const [prodRes, movRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/stock-movements?productId=${id}&limit=10&sortBy=createdAt&sortOrder=desc`),
        ]);
        setProduct(prodRes.data?.data ?? prodRes.data);
        setMovements(movRes.data?.data?.movements ?? movRes.data?.data ?? []);
      } catch {
        setError('Produit introuvable.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    const confirmed = await confirm.confirm({
      title: 'Supprimer le produit',
      message: `Êtes-vous sûr de vouloir supprimer le produit "${product?.name}" ?`,
      confirmText: 'Supprimer',
      variant: 'danger',
      impact: 'Ce produit sera définitivement supprimé de votre catalogue.',
      isIrreversible: true,
      consequences: [
        'Le produit ne sera plus disponible pour les nouvelles factures',
        'L\'historique des mouvements de stock sera conservé',
        'Les factures existantes ne seront pas affectées',
      ],
    });

    if (!confirmed) return;

    try {
      setDeleting(true);
      await api.delete(`/products/${id}`);
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Erreur lors de la suppression.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle size={18} /> {error || 'Produit introuvable'}
        </div>
      </div>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/products')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            {product.sku && <p className="text-sm text-gray-500 mt-0.5">SKU : {product.sku}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/products/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            <Edit size={16} /> Modifier
          </Link>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium">
            <Trash2 size={16} /> {deleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Infos produit */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Nom', value: product.name },
          { label: 'SKU', value: product.sku || '—' },
          { label: 'Type', value: product.type || '—' },
          { label: 'Prix de vente', value: product.price != null ? fmt(product.price) : '—' },
          { label: 'Cout', value: product.cost != null ? fmt(product.cost) : '—' },
          { label: 'Unite', value: product.unit || '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-medium text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Stock */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Stock</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{product.currentStock ?? product.stock ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Stock actuel</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-700">{product.minStock ?? product.minimumStock ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Stock minimum</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">{product.maxStock ?? product.maximumStock ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Stock maximum</p>
          </div>
        </div>
      </div>

      {/* Historique mouvements */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Historique des mouvements</h2>
          <Link to="/stock/movements/new"
            className="text-sm text-blue-600 hover:underline">
            + Nouveau mouvement
          </Link>
        </div>
        {movements.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun mouvement enregistre</p>
        ) : (
          <div className="space-y-2">
            {movements.map((mv: any) => (
              <div key={mv.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MOVEMENT_TYPE_COLORS[mv.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {MOVEMENT_TYPE_LABELS[mv.type] ?? mv.type}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{mv.reference ?? '—'}</p>
                    <p className="text-xs text-gray-500">
                      {mv.createdAt ? new Date(mv.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${mv.type === 'IN' ? 'text-green-700' : mv.type === 'OUT' ? 'text-red-700' : 'text-gray-700'}`}>
                  {mv.type === 'IN' ? '+' : mv.type === 'OUT' ? '-' : ''}{mv.quantity ?? '?'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
