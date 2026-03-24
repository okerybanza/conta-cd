import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import supplierService, { Supplier } from '../../services/supplier.service';

export default function SuppliersListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await supplierService.list({ page: 1, limit: 200 });
        setRows(response.data || []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center"><h1 className="text-xl font-display font-bold text-text-primary">Fournisseurs</h1><Link to="/suppliers/new" className="btn-primary flex items-center gap-2"><Plus size={18} /><span>Nouveau</span></Link></div>
      {loading ? <div className="card p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div> : <div className="card overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="table-header"><th className="text-left px-6 py-3">Nom</th><th className="text-left px-6 py-3">Email</th><th className="text-left px-6 py-3">Telephone</th></tr></thead><tbody>{rows.map((s)=><tr key={s.id} className="table-row cursor-pointer" onClick={()=>navigate(`/suppliers/${s.id}`)}><td className="px-6 py-4">{s.name}</td><td className="px-6 py-4">{s.email||'-'}</td><td className="px-6 py-4">{s.phone||'-'}</td></tr>)}{!rows.length&&<tr><td className="px-6 py-8 text-text-secondary" colSpan={3}>Aucun fournisseur trouve.</td></tr>}</tbody></table></div></div>}
    </div>
  );
}
