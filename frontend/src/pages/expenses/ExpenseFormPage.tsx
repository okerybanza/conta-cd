import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import expenseService from '../../services/expense.service';

export default function ExpenseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ expenseDate: new Date().toISOString().split('T')[0], description: '', amountTtc: 0, paymentMethod: 'cash', amountHt: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const res = await expenseService.getById(id);
      const e = res.data;
      setForm({ expenseDate: e.expenseDate?.split('T')[0] || '', description: e.description || '', amountTtc: Number(e.amountTtc || 0), paymentMethod: e.paymentMethod || 'cash', amountHt: Number(e.amountHt || 0) });
    };
    load();
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEdit && id) await expenseService.update(id, form as any);
      else await expenseService.create(form as any);
      navigate('/expenses');
    } finally { setLoading(false); }
  };

  return (
    <form className="card p-6 space-y-4 max-w-xl" onSubmit={submit}>
      <h1 className="text-xl font-semibold">{isEdit ? 'Modifier depense' : 'Nouvelle depense'}</h1>
      <input className="input" type="date" value={form.expenseDate} onChange={(e)=>setForm({...form, expenseDate:e.target.value})} required />
      <input className="input" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} placeholder="Description" />
      <input className="input" type="number" min={0} step="0.01" value={form.amountHt} onChange={(e)=>setForm({...form, amountHt:Number(e.target.value||0)})} placeholder="Montant HT" required />
      <input className="input" type="number" min={0} step="0.01" value={form.amountTtc} onChange={(e)=>setForm({...form, amountTtc:Number(e.target.value||0)})} placeholder="Montant TTC" required />
      <select className="input" value={form.paymentMethod} onChange={(e)=>setForm({...form, paymentMethod:e.target.value})}><option value="cash">Especes</option><option value="bank_transfer">Virement</option><option value="mobile_money">Mobile Money</option><option value="card">Carte</option><option value="check">Cheque</option></select>
      <div className="flex gap-2"><button type="button" className="btn-secondary" onClick={()=>navigate('/expenses')}>Annuler</button><button className="btn-primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</button></div>
    </form>
  );
}
