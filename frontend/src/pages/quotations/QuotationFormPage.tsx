import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import quotationService from '../../services/quotation.service';
import customerService, { Customer } from '../../services/customer.service';
import productService from '../../services/product.service';

interface QuotationLine {
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

const emptyLine = (): QuotationLine => ({ name: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 });

export default function QuotationFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customerId: '',
    quotationDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    currency: 'CDF',
    notes: '',
    lines: [emptyLine()] as QuotationLine[],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          customerService.list({ page: 1, limit: 200 }),
          productService.list({ page: 1, limit: 200 }),
        ]);
        setCustomers(custRes.data || []);
        setProducts(prodRes.data || []);
      } catch { /* non bloquant */ }
    };
    loadData();

    if (id) {
      const loadQuotation = async () => {
        try {
          setLoading(true);
          const q = await quotationService.getById(id);
          setForm({
            customerId: (q as any).customerId || '',
            quotationDate: q.quotationDate?.split('T')[0] || '',
            expiryDate: (q as any).expiryDate?.split('T')[0] || '',
            currency: (q as any).currency || 'CDF',
            notes: (q as any).notes || '',
            lines: (q as any).lines?.length ? (q as any).lines.map((l: any) => ({
              productId: l.productId || '',
              name: l.name || '',
              description: l.description || '',
              quantity: Number(l.quantity || 1),
              unitPrice: Number(l.unitPrice || 0),
              taxRate: Number(l.taxRate || 0),
            })) : [emptyLine()],
          });
        } catch { setError('Erreur de chargement du devis.'); }
        finally { setLoading(false); }
      };
      loadQuotation();
    }
  }, [id]);

  const totals = useMemo(() => {
    const subtotal = form.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const tax = form.lines.reduce((s, l) => s + l.quantity * l.unitPrice * (l.taxRate / 100), 0);
    return { subtotal, tax, total: subtotal + tax };
  }, [form.lines]);

  const updateLine = (i: number, key: keyof QuotationLine, value: string | number) => {
    setForm(prev => ({ ...prev, lines: prev.lines.map((l, idx) => idx === i ? { ...l, [key]: value } : l) }));
  };

  const selectProduct = (i: number, productId: string) => {
    const p = products.find(x => x.id === productId);
    if (!p) { updateLine(i, 'productId', productId); return; }
    setForm(prev => ({
      ...prev,
      lines: prev.lines.map((l, idx) => idx === i ? {
        ...l, productId, name: p.name, description: p.description || '',
        unitPrice: Number(p.unitPrice || p.price || 0), taxRate: Number(p.taxRate || 0),
      } : l),
    }));
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-CD', { style: 'currency', currency: form.currency || 'CDF', maximumFractionDigits: 0 }).format(n);

  const customerLabel = (c: Customer) => c.type === 'particulier'
    ? `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || c.id
    : c.businessName || c.email || c.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.customerId) { setError('Veuillez selectionner un client.'); return; }
    const lines = form.lines.filter(l => l.name && l.quantity > 0);
    if (!lines.length) { setError('Ajoutez au moins une ligne valide.'); return; }
    try {
      setLoading(true);
      const payload = { ...form, lines, expiryDate: form.expiryDate || undefined };
      if (isEdit && id) {
        await quotationService.update(id, payload as any);
      } else {
        const created = await quotationService.create(payload as any);
        navigate(`/quotations/${created.id}`);
        return;
      }
      navigate('/quotations');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/quotations')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Modifier le devis' : 'Nouveau devis'}</h1>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos generales */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Informations generales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select value={form.customerId} onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
                <option value="">-- Selectionner un client --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{customerLabel(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
              <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="CDF">CDF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date devis *</label>
              <input type="date" value={form.quotationDate} onChange={e => setForm(p => ({ ...p, quotationDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date expiration</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Lignes */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Lignes du devis</h2>
            <button type="button" onClick={() => setForm(p => ({ ...p, lines: [...p.lines, emptyLine()] }))}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
              <Plus size={16} /> Ajouter une ligne
            </button>
          </div>

          <div className="space-y-3">
            {form.lines.map((line, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Produit (optionnel)</label>
                    <select value={line.productId || ''} onChange={e => selectProduct(i, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                      <option value="">-- Choisir un produit --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Designation *</label>
                    <input value={line.name} onChange={e => updateLine(i, 'name', e.target.value)}
                      placeholder="Nom du produit/service"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <input value={line.description || ''} onChange={e => updateLine(i, 'description', e.target.value)}
                    placeholder="Description optionnelle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="grid grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Quantite</label>
                    <input type="number" min="0" step="0.01" value={line.quantity}
                      onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Prix unitaire</label>
                    <input type="number" min="0" step="0.01" value={line.unitPrice}
                      onChange={e => updateLine(i, 'unitPrice', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">TVA %</label>
                    <input type="number" min="0" max="100" step="0.01" value={line.taxRate}
                      onChange={e => updateLine(i, 'taxRate', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total</p>
                      <p className="font-semibold text-gray-900 text-sm">{fmt(line.quantity * line.unitPrice)}</p>
                    </div>
                    <button type="button" onClick={() => setForm(p => ({ ...p, lines: p.lines.length === 1 ? p.lines : p.lines.filter((_, idx) => idx !== i) }))}
                      disabled={form.lines.length === 1}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-30 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totaux */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600"><span>Total HT</span><span>{fmt(totals.subtotal)}</span></div>
            <div className="flex justify-between text-sm text-gray-600"><span>TVA</span><span>{fmt(totals.tax)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200">
              <span>Total TTC</span><span>{fmt(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={3} placeholder="Notes ou conditions particulieres..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm" />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/quotations')}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Enregistrement...' : isEdit ? 'Modifier le devis' : 'Creer le devis'}
          </button>
        </div>
      </form>
    </div>
  );
}
