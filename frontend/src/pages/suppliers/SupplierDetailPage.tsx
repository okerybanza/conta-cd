import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import supplierService, { Supplier } from '../../services/supplier.service';

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setSupplier(await supplierService.getById(id));
    };
    load();
  }, [id]);

  if (!supplier) return <div className="card p-6">Fournisseur introuvable</div>;
  return (
    <div className="space-y-4">
      <div className="flex gap-2"><Link to="/suppliers" className="btn-secondary btn-sm">Retour</Link><button className="btn-primary btn-sm" onClick={()=>navigate(`/suppliers/${supplier.id}/edit`)}>Modifier</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><p className="text-xs text-text-secondary mb-1">Nom</p><p>{supplier.name}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Email</p><p>{supplier.email || '-'}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Telephone</p><p>{supplier.phone || '-'}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Localisation</p><p>{[supplier.city, supplier.country].filter(Boolean).join(', ') || '-'}</p></div>
      </div>
    </div>
  );
}
