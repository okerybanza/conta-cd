import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Inscription impossible');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form className="w-full max-w-md card p-6 space-y-4" onSubmit={submit}>
        <h1 className="text-2xl font-bold">Inscription</h1>
        {error && <div className="text-sm text-danger">{error}</div>}
        <input className="input" value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} placeholder="Prenom" />
        <input className="input" value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} placeholder="Nom" />
        <input className="input" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} placeholder="Email" required />
        <input className="input" type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} placeholder="Mot de passe" required />
        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Creation...' : 'Creer le compte'}</button>
        <Link to="/login" className="text-primary text-sm">Retour connexion</Link>
      </form>
    </div>
  );
}
