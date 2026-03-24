import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import journalEntryService from '../../services/journalEntry.service';

export default function JournalEntryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const res = await journalEntryService.getById(id);
      const e = res.data;
      setEntryDate(e.entryDate?.split('T')[0] || '');
      setDescription(e.description || '');
      setReference(e.reference || '');
    };
    load();
  }, [id]);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    try {
      setLoading(true);
      const payload = { entryDate, description, reference, sourceType: 'manual' as const, lines: [{ accountId: 'manual-account', debit: 0, credit: 0 }] };
      if (isEdit && id) await journalEntryService.update(id, payload as any);
      else await journalEntryService.create(payload as any);
      navigate('/journal-entries');
    } finally { setLoading(false); }
  };

  return (
    <form className="card p-6 space-y-4 max-w-xl" onSubmit={submit}>
      <h1 className="text-xl font-semibold">{isEdit ? 'Modifier ecriture' : 'Nouvelle ecriture'}</h1>
      <input className="input" type="date" value={entryDate} onChange={(e)=>setEntryDate(e.target.value)} required />
      <input className="input" value={reference} onChange={(e)=>setReference(e.target.value)} placeholder="Reference" />
      <textarea className="input" value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Description" rows={3} />
      <div className="flex gap-2"><button type="button" className="btn-secondary" onClick={()=>navigate('/journal-entries')}>Annuler</button><button className="btn-primary" disabled={loading}>{loading?'Enregistrement...':'Enregistrer'}</button></div>
    </form>
  );
}
