import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import quotationService, { Quotation } from '../../services/quotation.service';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function QuotationDetailPage() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setQuotation(await quotationService.getById(id));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="card p-8 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  if (!quotation) return <div className="card p-6">Devis introuvable</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/quotations" className="btn-secondary btn-sm">Retour</Link>
        <h1 className="text-xl font-semibold">{quotation.quotationNumber}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><p className="text-xs text-text-secondary mb-1">Date</p><p>{formatDate(quotation.quotationDate)}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Echeance</p><p>{quotation.expiryDate ? formatDate(quotation.expiryDate) : '-'}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Montant</p><p>{formatCurrency(quotation.totalAmount || 0, quotation.currency || 'CDF')}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Statut</p><p>{quotation.status}</p></div>
      </div>
    </div>
  );
}
