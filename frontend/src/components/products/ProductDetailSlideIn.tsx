import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlideIn } from '../ui/SlideIn';
import { Edit, Trash2, Package, AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onRefresh?: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(n);

export function ProductDetailSlideIn({ isOpen, onClose, productId, onRefresh }: Props) {
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !productId) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/products/${productId}`);
        setProduct(res.data?.data ?? res.data);
      } catch {
        setError('Erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, productId]);

  const handleDelete = async () => {
    if (!product || !window.confirm('Supprimer ce produit ?')) return;
    try {
      setDeleting(true);
      await api.delete(`/products/${product.id}`);
      onRefresh?.();
      onClose();
    } catch {
      setError('Erreur lors de la suppression.');
      setDeleting(false);
    }
  };

  const stock = product?.currentStock ?? product?.stock ?? null;
  const minStock = product?.minStock ?? product?.minimumStock ?? null;
  const maxStock = product?.maxStock ?? product?.maximumStock ?? null;
  const isLowStock = stock !== null && minStock !== null && stock < minStock;
  const margin = product?.price && product?.cost
    ? Math.round(((product.price - product.cost) / product.price) * 100)
    : null;

  return (
    <SlideIn isOpen={isOpen} onClose={onClose} title="Produit" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : !product ? (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error || 'Produit introuvable'}
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Package size={22} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate">{product.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {product.sku && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    SKU: {product.sku}
                  </span>
                )}
                {product.type && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {product.type}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${product.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {product.isActive !== false ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>

          {/* Prix */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-lg font-bold text-gray-900">{product.price != null ? fmt(product.price) : '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Prix vente</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-lg font-bold text-gray-900">{product.cost != null ? fmt(product.cost) : '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Cout achat</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp size={14} className={margin !== null && margin > 0 ? 'text-green-600' : 'text-gray-400'} />
                <p className={`text-lg font-bold ${margin !== null && margin > 0 ? 'text-green-700' : 'text-gray-900'}`}>
                  {margin !== null ? `${margin}%` : '—'}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Marge</p>
            </div>
          </div>

          {/* Stock */}
          {stock !== null && (
            <div className={`rounded-xl p-4 border ${isLowStock ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                {isLowStock && <AlertTriangle size={16} className="text-red-600" />}
                <h4 className="text-sm font-semibold text-gray-700">Stock</h4>
                {isLowStock && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    Stock bas
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className={`text-2xl font-bold ${isLowStock ? 'text-red-700' : 'text-gray-900'}`}>{stock}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Actuel</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{minStock ?? '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Minimum</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{maxStock ?? '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Maximum</p>
                </div>
              </div>
            </div>
          )}

          {/* Infos complementaires */}
          {(product.unit || product.description) && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {product.unit && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Unite</span>
                  <span className="font-medium text-gray-900">{product.unit}</span>
                </div>
              )}
              {product.description && (
                <div className="text-sm">
                  <span className="text-gray-500">Description</span>
                  <p className="text-gray-700 mt-1">{product.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => { navigate(`/products/${product.id}/edit`); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <Edit size={15} /> Modifier
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium">
              <Trash2 size={15} /> {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      )}
    </SlideIn>
  );
}

export default ProductDetailSlideIn;
