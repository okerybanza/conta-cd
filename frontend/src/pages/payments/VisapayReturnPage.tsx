import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { visapayService } from '../../services/visapay.service';
import { useToastContext } from '../../contexts/ToastContext';

function VisapayReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToastContext();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Récupérer les paramètres de l'URL
        const transactionId = searchParams.get('transactionId') || searchParams.get('transaction_id');
        const reference = searchParams.get('reference') || searchParams.get('ref');
        const type = searchParams.get('type') as 'invoice' | 'subscription' | null;
        const statusParam = searchParams.get('status');
        const isOnboarding = searchParams.get('onboarding') === 'true';

        // Si le statut est dans l'URL et indique un échec
        if (statusParam === 'failed' || statusParam === 'cancelled') {
          throw new Error('Le paiement a été annulé ou a échoué');
        }

        // Vérifier le statut du paiement
        if (transactionId) {
          const result = await visapayService.checkPaymentStatus(transactionId);

          if (result.success) {
            const paymentStatus = result.data.status?.toLowerCase();

            if (paymentStatus === 'completed' || paymentStatus === 'success' || paymentStatus === 'approved') {
              setStatus('success');
              setMessage(
                type === 'subscription'
                  ? 'Paiement réussi ! Votre abonnement a été activé.'
                  : 'Paiement réussi ! Votre facture a été payée.'
              );
              showSuccess(message);

              // Rediriger après 2 secondes
              setTimeout(() => {
                if (type === 'subscription') {
                  // Si on vient de l'onboarding, rediriger vers le dashboard
                  navigate(isOnboarding ? '/dashboard' : '/settings/subscription');
                } else {
                  navigate('/invoices');
                }
              }, 2000);
            } else if (paymentStatus === 'pending' || paymentStatus === 'processing') {
              // Le paiement est en cours de traitement
              setStatus('processing');
              setMessage('Votre paiement est en cours de traitement. Vous recevrez une confirmation par email une fois le paiement confirmé.');
              
              // Rediriger après 3 secondes
              setTimeout(() => {
                if (type === 'subscription') {
                  // Si on vient de l'onboarding, rediriger vers la sélection de plan
                  navigate(isOnboarding ? '/onboarding/select-plan' : '/settings/subscription');
                } else {
                  navigate('/invoices');
                }
              }, 3000);
            } else {
              throw new Error(`Le paiement a le statut: ${paymentStatus}`);
            }
          } else {
            throw new Error('Impossible de vérifier le statut du paiement');
          }
        } else if (reference) {
          // Si on a seulement la référence, on considère que le paiement est en attente
          // Le webhook confirmera le paiement plus tard
          setStatus('processing');
          setMessage('Votre paiement est en cours de traitement. Vous recevrez une confirmation par email une fois le paiement confirmé.');
          
          // Rediriger après 3 secondes
          setTimeout(() => {
            if (type === 'subscription') {
              // Si on vient de l'onboarding, rediriger vers la sélection de plan
              navigate(isOnboarding ? '/onboarding/select-plan' : '/settings/subscription');
            } else {
              navigate('/invoices');
            }
          }, 3000);
        } else {
          throw new Error('Informations de transaction manquantes dans l\'URL');
        }
      } catch (error: any) {
        console.error('Error processing Visapay return:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || error.message || 'Erreur lors du traitement du paiement');
        showError(message);

        // Rediriger après 3 secondes
        setTimeout(() => {
          const type = searchParams.get('type');
          const isOnboarding = searchParams.get('onboarding') === 'true';
          if (type === 'subscription') {
            // Si on vient de l'onboarding, rediriger vers la sélection de plan
            navigate(isOnboarding ? '/onboarding/select-plan' : '/settings/subscription');
          } else {
            navigate('/invoices');
          }
        }, 3000);
      }
    };

    processPayment();
  }, [searchParams, navigate, showSuccess, showError]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Traitement du paiement...
            </h2>
            <p className="text-gray-600">
              {message || 'Veuillez patienter pendant que nous confirmons votre paiement.'}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="text-green-600 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Paiement réussi !
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Redirection en cours...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="text-red-600 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Erreur de paiement
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Redirection en cours...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default VisapayReturnPage;

