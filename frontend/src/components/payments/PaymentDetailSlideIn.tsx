import { useEffect, useState } from 'react';
import { SlideIn } from '../ui/SlideIn';
import paymentService, { Payment } from '../../services/payment.service';

interface PaymentDetailSlideInProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
  onRefresh?: () => void;
}

export function PaymentDetailSlideIn({ isOpen, onClose, paymentId }: PaymentDetailSlideInProps) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !paymentId) return;
      setLoading(true);
      try {
        const data = await paymentService.getById(paymentId);
        setPayment(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, paymentId]);

  return (
    <SlideIn isOpen={isOpen} onClose={onClose} title="Detail paiement" size="lg">
      {loading ? (
        <div className="p-6">Chargement...</div>
      ) : (
        <div className="p-6 space-y-2 text-sm">
          <div><strong>ID:</strong> {payment?.id}</div>
          <div><strong>Montant:</strong> {payment?.amount} {payment?.currency || 'CDF'}</div>
          <div><strong>Date:</strong> {payment?.paymentDate}</div>
          <div><strong>Methode:</strong> {payment?.paymentMethod}</div>
          <div><strong>Statut:</strong> {payment?.status}</div>
        </div>
      )}
    </SlideIn>
  );
}

export default PaymentDetailSlideIn;
