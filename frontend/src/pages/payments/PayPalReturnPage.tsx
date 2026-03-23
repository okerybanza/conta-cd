import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { paypalService } from '../../services/paypal.service';
import { useToastContext } from '../../contexts/ToastContext';

function PayPalReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToastContext();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Récupérer les paramètres de l'URL
        const token = searchParams.get('token');
        const type = searchParams.get('type') as 'invoice' | 'subscription' | null;
        const invoiceId = searchParams.get('invoiceId');
        const subscriptionId = searchParams.get('subscriptionId');
        const packageId = searchParams.get('packageId');
        const isOnboarding = searchParams.get('onboarding') === 'true';

        if (!token) {
          throw new Error('Token PayPal manquant dans l\'URL');
        }

        if (!type) {
          throw new Error('Type de paiement manquant');
        }

        // PayPal retourne le token qui correspond à l'orderId
        // Construire les données de capture
        const captureData: any = {
          orderId: token, // Le token PayPal est l'orderId
          type: type,
        };

        if (type === 'invoice' && invoiceId) {
          captureData.invoiceId = invoiceId;
        }

        if (type === 'subscription') {
          if (packageId) {
            captureData.packageId = packageId;
          }
          if (subscriptionId) {
            captureData.subscriptionId = subscriptionId;
          }
        }

        // Capturer l'order PayPal
        const result = await paypalService.captureOrder(captureData);

        if (result.success) {
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
        } else {
          throw new Error('Échec de la capture du paiement');
        }
      } catch (error: any) {
        console.error('Error processing PayPal return:', error);
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
            <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Traitement du paiement...
            </h2>
            <p className="text-gray-600">
              Veuillez patienter pendant que nous confirmons votre paiement.
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

export default PayPalReturnPage;

