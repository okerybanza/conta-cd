import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import productService from '../../services/product.service';

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const p = await productService.getById(id);
      setName(p.name || '');
      setDescription(p.description || '');
      setUnitPrice(Number(p.unitPrice || 0));
      setTaxRate(Number(p.taxRate || 0));
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { name, description: description || undefined, unitPrice, taxRate };
      if (isEdit && id) {
        await productService.update(id, payload);
      } else {
        await productService.create(payload);
      }
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card p-6 space-y-4 max-w-xl" onSubmit={handleSubmit}>
      <h1 className="text-xl font-semibold">{isEdit ? 'Modifier produit' : 'Nouveau produit'}</h1>
      <div>
        <label className="block text-sm mb-1">Nom</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm mb-1">Description</label>
        <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Prix unitaire</label>
          <input className="input" type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value || 0))} required />
        </div>
        <div>
          <label className="block text-sm mb-1">TVA (%)</label>
          <input className="input" type="number" min={0} step="0.01" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value || 0))} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary" onClick={() => navigate('/products')}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  );
}
