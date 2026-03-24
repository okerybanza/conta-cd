import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import customerService, { Customer } from '../../services/customer.service';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setCustomer(await customerService.getById(id));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="card p-6">Chargement...</div>;
  if (!customer) return <div className="card p-6">Client introuvable</div>;

  const displayName =
    customer.type === 'particulier'
      ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '-'
      : customer.businessName || '-';

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Link to="/customers" className="btn-secondary btn-sm">Retour</Link>
        <button className="btn-primary btn-sm" onClick={() => navigate(`/customers/${customer.id}/edit`)}>
          Modifier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><p className="text-xs text-text-secondary mb-1">Nom</p><p>{displayName}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Type</p><p>{customer.type}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Email</p><p>{customer.email || '-'}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Telephone</p><p>{customer.phone || '-'}</p></div>
      </div>
    </div>
  );
}
