import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import quotationService from '../../services/quotation.service';

export default function QuotationFormPage() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    try {
      setLoading(true);
      const created = await quotationService.create({ customerId, quotationDate, expiryDate: expiryDate || undefined });
      navigate(`/quotations/${created.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card p-6 space-y-4 max-w-xl" onSubmit={handleSubmit}>
      <h1 className="text-xl font-semibold">Nouveau devis</h1>
      <div>
        <label className="block text-sm mb-1">Client (ID)</label>
        <input className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm mb-1">Date devis</label>
        <input className="input" type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm mb-1">Date echeance</label>
        <input className="input" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary" onClick={() => navigate('/quotations')}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creation...' : 'Creer'}</button>
      </div>
    </form>
  );
}
