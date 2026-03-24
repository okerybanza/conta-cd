import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import quotationService, { Quotation } from '../../services/quotation.service';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function QuotationsListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await quotationService.list({ page: 1, limit: 100 });
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
          <h1 className="text-xl font-display font-bold text-text-primary">Devis</h1>
          <p className="text-text-secondary mt-1">Gerez vos devis</p>
        </div>
        <Link to="/quotations/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>Nouveau devis</span>
        </Link>
      </div>

      {loading ? (
        <div className="card p-8 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-6 py-3">Numero</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Echeance</th>
                  <th className="text-left px-6 py-3">Montant</th>
                  <th className="text-left px-6 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => (
                  <tr key={q.id} className="table-row cursor-pointer" onClick={() => navigate(`/quotations/${q.id}`)}>
                    <td className="px-6 py-4 font-medium">{q.quotationNumber}</td>
                    <td className="px-6 py-4">{formatDate(q.quotationDate)}</td>
                    <td className="px-6 py-4">{q.expiryDate ? formatDate(q.expiryDate) : '-'}</td>
                    <td className="px-6 py-4">{formatCurrency(q.totalAmount || 0, q.currency || 'CDF')}</td>
                    <td className="px-6 py-4">{q.status}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td className="px-6 py-8 text-text-secondary" colSpan={5}>Aucun devis trouve.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
