import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PaymentFormSlideIn } from '../../components/payments/PaymentFormSlideIn';

export default function PaymentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const mode = useMemo(() => {
    if (!id) return 'create';
    return id === 'new' ? 'create' : 'edit';
  }, [id]);

  const paymentId = mode === 'edit' ? id : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {mode === 'edit' ? 'Modifier paiement' : 'Nouveau paiement'}
        </h1>
      </div>

      <PaymentFormSlideIn
        isOpen={true}
        onClose={() => navigate('/payments')}
        paymentId={paymentId}
        onSuccess={() => navigate('/payments')}
      />
    </div>
  );
}
