import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import journalEntryService, { JournalEntry } from '../../services/journalEntry.service';
import { formatDate } from '../../utils/formatters';

export default function JournalEntriesListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await journalEntryService.list({ page: 1, limit: 100 });
        setRows(res.data || []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center"><h1 className="text-xl font-display font-bold text-text-primary">Ecritures comptables</h1><Link to="/journal-entries/new" className="btn-primary flex items-center gap-2"><Plus size={18} /><span>Nouvelle ecriture</span></Link></div>
      {loading ? <div className="card p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div> : <div className="card overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="table-header"><th className="text-left px-6 py-3">Numero</th><th className="text-left px-6 py-3">Date</th><th className="text-left px-6 py-3">Type</th><th className="text-left px-6 py-3">Statut</th></tr></thead><tbody>{rows.map((r)=><tr key={r.id} className="table-row cursor-pointer" onClick={()=>navigate(`/journal-entries/${r.id}`)}><td className="px-6 py-4">{r.entryNumber}</td><td className="px-6 py-4">{formatDate(r.entryDate)}</td><td className="px-6 py-4">{r.sourceType}</td><td className="px-6 py-4">{r.status}</td></tr>)}{!rows.length&&<tr><td className="px-6 py-8 text-text-secondary" colSpan={4}>Aucune ecriture trouvee.</td></tr>}</tbody></table></div></div>}
    </div>
  );
}
