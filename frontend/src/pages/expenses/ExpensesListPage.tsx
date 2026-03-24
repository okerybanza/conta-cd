import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import expenseService, { Expense } from '../../services/expense.service';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function ExpensesListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await expenseService.list({ page: 1, limit: 100 });
        setRows(response.data || []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-display font-bold text-text-primary">Depenses</h1></div>
        <Link to="/expenses/new" className="btn-primary flex items-center gap-2"><Plus size={18} /><span>Nouvelle depense</span></Link>
      </div>
      {loading ? <div className="card p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div> : (
        <div className="card overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="table-header"><th className="text-left px-6 py-3">Numero</th><th className="text-left px-6 py-3">Date</th><th className="text-left px-6 py-3">Montant</th><th className="text-left px-6 py-3">Statut</th></tr></thead><tbody>
        {rows.map((r)=><tr key={r.id} className="table-row cursor-pointer" onClick={()=>navigate(`/expenses/${r.id}`)}><td className="px-6 py-4">{r.expenseNumber}</td><td className="px-6 py-4">{formatDate(r.expenseDate)}</td><td className="px-6 py-4">{formatCurrency(r.amountTtc||0,r.currency||'CDF')}</td><td className="px-6 py-4">{r.status}</td></tr>)}
        {!rows.length && <tr><td className="px-6 py-8 text-text-secondary" colSpan={4}>Aucune depense trouvee.</td></tr>}
        </tbody></table></div></div>
      )}
    </div>
  );
}
