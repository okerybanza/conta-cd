import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/login', { email, password });
      const user = res.data?.data?.user || res.data?.user;
      const company = res.data?.data?.company || res.data?.company || { id: user?.companyId || 'default', name: 'Entreprise' };
      if (!user) throw new Error('Utilisateur introuvable dans la reponse');
      setAuth(user, company);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form className="w-full max-w-md card p-6 space-y-4" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold">Connexion</h1>
        {error && <div className="text-sm text-danger">{error}</div>}
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" required />
        <button className="btn-primary w-full" type="submit" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
        <div className="flex justify-between text-sm">
          <Link to="/register" className="text-primary">Creer un compte</Link>
          <Link to="/forgot-password" className="text-primary">Mot de passe oublie</Link>
        </div>
      </form>
    </div>
  );
}
