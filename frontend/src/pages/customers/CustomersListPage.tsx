import { useNavigate } from 'react-router-dom';

export default function CustomersListPage() {
  const navigate = useNavigate();
  return (
    <div className="card p-6 space-y-4">
      <h1 className="text-2xl font-bold">Clients</h1>
      <p className="text-text-secondary">Liste en cours de restauration.</p>
      <button type="button" className="btn-primary" onClick={() => navigate('/customers/new')}>Nouveau client</button>
    </div>
  );
}
