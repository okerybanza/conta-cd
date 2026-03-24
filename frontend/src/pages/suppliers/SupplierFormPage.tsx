import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import supplierService from '../../services/supplier.service';

export default function SupplierFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', country: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const s = await supplierService.getById(id);
      setForm({ name: s.name || '', email: s.email || '', phone: s.phone || '', city: s.city || '', country: s.country || '' });
    };
    load();
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEdit && id) await supplierService.update(id, form as any);
      else await supplierService.create(form as any);
      navigate('/suppliers');
    } finally { setLoading(false); }
  };

  return (
    <form className="card p-6 space-y-4 max-w-xl" onSubmit={submit}>
      <h1 className="text-xl font-semibold">{isEdit ? 'Modifier fournisseur' : 'Nouveau fournisseur'}</h1>
      <input className="input" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Nom" required />
      <input className="input" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="Email" />
      <input className="input" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="Telephone" />
      <input className="input" value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})} placeholder="Ville" />
      <input className="input" value={form.country} onChange={(e)=>setForm({...form,country:e.target.value})} placeholder="Pays" />
      <div className="flex gap-2"><button type="button" className="btn-secondary" onClick={()=>navigate('/suppliers')}>Annuler</button><button className="btn-primary" disabled={loading}>{loading?'Enregistrement...':'Enregistrer'}</button></div>
    </form>
  );
}
