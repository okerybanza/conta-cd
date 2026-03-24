import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import productService, { Product } from '../../services/product.service';
import { formatCurrency } from '../../utils/formatters';

export default function ProductsListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await productService.list({ page: 1, limit: 200 });
        setRows(response.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-text-primary">Produits</h1>
          <p className="text-text-secondary mt-1">Catalogue produits/services</p>
        </div>
        <Link to="/products/new" className="btn-primary flex items-center gap-2"><Plus size={18} /><span>Nouveau produit</span></Link>
      </div>

      {loading ? (
        <div className="card p-8 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-6 py-3">Nom</th>
                  <th className="text-left px-6 py-3">Description</th>
                  <th className="text-left px-6 py-3">Prix unitaire</th>
                  <th className="text-left px-6 py-3">TVA</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="table-row cursor-pointer" onClick={() => navigate(`/products/${p.id}/edit`)}>
                    <td className="px-6 py-4 font-medium">{p.name}</td>
                    <td className="px-6 py-4">{p.description || '-'}</td>
                    <td className="px-6 py-4">{formatCurrency(p.unitPrice || 0, 'CDF')}</td>
                    <td className="px-6 py-4">{p.taxRate ?? 0}%</td>
                  </tr>
                ))}
                {!rows.length && <tr><td className="px-6 py-8 text-text-secondary" colSpan={4}>Aucun produit trouve.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
