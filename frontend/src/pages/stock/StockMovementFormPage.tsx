import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const MOVEMENT_TYPES = [
  { value: 'IN', label: 'Entree (achat / retour client)' },
  { value: 'OUT', label: 'Sortie (vente / perte)' },
  { value: 'TRANSFER', label: 'Transfert entre entrepots' },
  { value: 'ADJUSTMENT', label: 'Ajustement inventaire' },
];

export default function StockMovementFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'IN',
    productId: '',
    warehouseId: '',
    quantity: '',
    reference: '',
    justification: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, whRes] = await Promise.all([
          api.get('/products?limit=100'),
          api.get('/warehouses?limit=100'),
        ]);
        setProducts(prodRes.data?.data?.products ?? prodRes.data?.data ?? []);
        setWarehouses(whRes.data?.data?.warehouses ?? whRes.data?.data ?? []);
      } catch {
        setError('Impossible de charger les produits ou entrepots.');
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.productId) { setError('Veuillez selectionner un produit.'); return; }
    if (!form.warehouseId) { setError('Veuillez selectionner un entrepot.'); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { setError('La quantite doit etre superieure a 0.'); return; }
    if (form.type === 'ADJUSTMENT' && !form.justification.trim()) {
      setError('La justification est obligatoire pour un ajustement.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/stock-movements', {
        type: form.type,
        items: [{
          productId: form.productId,
          warehouseId: form.warehouseId,
          quantity: Number(form.quantity),
        }],
        reference: form.reference || undefined,
        justification: form.justification || undefined,
      });
      navigate('/stock/movements');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Erreur lors de la creation du mouvement.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/stock/movements')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau mouvement de stock</h1>
          <p className="text-sm text-gray-500 mt-0.5">Enregistrer une entree, sortie ou ajustement</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de mouvement *</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {MOVEMENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Produit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
          <select value={form.productId} onChange={e => set('productId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            required>
            <option value="">-- Selectionner un produit --</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Entrepot */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Entrepot *</label>
          <select value={form.warehouseId} onChange={e => set('warehouseId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            required>
            <option value="">-- Selectionner un entrepot --</option>
            {warehouses.map((w: any) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Quantite */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantite *</label>
          <input type="number" min="1" step="1" value={form.quantity}
            onChange={e => set('quantity', e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required />
        </div>

        {/* Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
          <input type="text" value={form.reference}
            onChange={e => set('reference', e.target.value)}
            placeholder="Ex: BON-2024-001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Justification (obligatoire pour ADJUSTMENT) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Justification {form.type === 'ADJUSTMENT' && <span className="text-red-500">*</span>}
          </label>
          <textarea value={form.justification}
            onChange={e => set('justification', e.target.value)}
            rows={3}
            placeholder={form.type === 'ADJUSTMENT' ? 'Obligatoire pour un ajustement...' : 'Optionnel...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/stock/movements')}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Enregistrement...' : 'Creer le mouvement'}
          </button>
        </div>
      </form>
    </div>
  );
}
