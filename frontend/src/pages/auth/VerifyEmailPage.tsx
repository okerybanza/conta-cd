import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function VerifyEmailPage() {
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErr(null);
      const res = await api.post('/auth/verify-email', { token });
      setMsg(res.data?.message || 'Email verifie avec succes.');
    } catch (error: any) {
      setErr(error.response?.data?.message || 'Verification impossible');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form className="w-full max-w-md card p-6 space-y-4" onSubmit={submit}>
        <h1 className="text-2xl font-bold">Verification email</h1>
        <input className="input" value={token} onChange={(e)=>setToken(e.target.value)} placeholder="Token de verification" required />
        {msg && <div className="text-sm text-success">{msg}</div>}
        {err && <div className="text-sm text-danger">{err}</div>}
        <button className="btn-primary w-full" type="submit">Verifier</button>
        <Link to="/login" className="text-primary text-sm">Aller a la connexion</Link>
      </form>
    </div>
  );
}
