import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { visapayService } from '../../services/visapay.service';
import { useToastContext } from '../../contexts/ToastContext';

interface CardData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

function VisapayCardCollectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState<CardData>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
  });

  // Récupérer les paramètres de l'URL
  const invoiceId = searchParams.get('invoiceId');
  const subscriptionId = searchParams.get('subscriptionId');
  const packageId = searchParams.get('packageId');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency') || 'USD';
  const type = (searchParams.get('type') as 'invoice' | 'subscription') || 'invoice';
  const returnUrl = searchParams.get('returnUrl') || '/payments/visapay/return';
  const cancelUrl = searchParams.get('cancelUrl') || '/invoices';

  // Générer les années d'expiration (années actuelles + 20 ans)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return month.toString().padStart(2, '0');
  });

  // Formater le numéro de carte (ajouter des espaces tous les 4 chiffres)
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 chiffres + 3 espaces
  };

  // Valider le numéro de carte (algorithme de Luhn)
  const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardData({ ...cardData, cardNumber: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Valider les champs
      if (!cardData.cardNumber || !cardData.expiryMonth || !cardData.expiryYear || !cardData.cvv || !cardData.cardholderName) {
        throw new Error('Veuillez remplir tous les champs');
      }

      // Valider le numéro de carte
      if (!validateCardNumber(cardData.cardNumber)) {
        throw new Error('Numéro de carte invalide');
      }

      // Valider la date d'expiration
      const expiryDate = new Date(parseInt(cardData.expiryYear), parseInt(cardData.expiryMonth) - 1);
      if (expiryDate < new Date()) {
        throw new Error('La carte a expiré');
      }

      // Valider le CVV
      if (cardData.cvv.length < 3 || cardData.cvv.length > 4) {
        throw new Error('CVV invalide');
      }

      // Préparer les données de paiement
      const paymentData = {
        invoiceId: invoiceId || undefined,
        subscriptionId: subscriptionId || undefined,
        packageId: packageId || undefined,
        amount: parseFloat(amount || '0'),
        currency,
        type,
        returnUrl: `${returnUrl}?type=${type}${invoiceId ? `&invoiceId=${invoiceId}` : ''}${subscriptionId ? `&subscriptionId=${subscriptionId}` : ''}`,
        cancelUrl: `${cancelUrl}?type=${type}`,
        // Informations de carte (seront envoyées au backend pour PushFunds)
        cardData: {
          cardNumber: cardData.cardNumber.replace(/\s/g, ''),
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          cvv: cardData.cvv,
          cardholderName: cardData.cardholderName,
        },
      };

      // Initier le paiement avec les informations de carte
      const result = await visapayService.initPayment(paymentData);

      if (result.success) {
        // Rediriger vers la page de retour avec les informations de transaction
        navigate(`${result.data.paymentUrl}?transactionId=${result.data.transactionId}&reference=${result.data.reference}&type=${type}`);
      } else {
        throw new Error('Erreur lors de l\'initiation du paiement');
      }
    } catch (error: any) {
      console.error('Error processing card payment:', error);
      showError(error.response?.data?.message || error.message || 'Erreur lors du traitement du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(cancelUrl)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold">Paiement sécurisé</h2>
            <div className="w-5" /> {/* Spacer */}
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Lock size={16} />
            <span>Vos informations sont sécurisées et cryptées</span>
          </div>
        </div>

        {/* Card Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Montant */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600">Montant à payer</div>
            <div className="text-2xl font-bold text-gray-900">
              {amount} {currency}
            </div>
          </div>

          {/* Nom du titulaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du titulaire de la carte *
            </label>
            <input
              type="text"
              value={cardData.cardholderName}
              onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value.toUpperCase() })}
              placeholder="JOHN DOE"
              required
              className="input w-full"
              maxLength={50}
            />
          </div>

          {/* Numéro de carte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de carte *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={cardData.cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                required
                className="input w-full pl-10"
                maxLength={19}
              />
            </div>
          </div>

          {/* Date d'expiration et CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'expiration *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={cardData.expiryMonth}
                  onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
                  required
                  className="input"
                >
                  <option value="">Mois</option>
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={cardData.expiryYear}
                  onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
                  required
                  className="input"
                >
                  <option value="">Année</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV *
              </label>
              <input
                type="text"
                value={cardData.cvv}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setCardData({ ...cardData, cvv: value });
                }}
                placeholder="123"
                required
                className="input w-full"
                maxLength={4}
              />
            </div>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Traitement...</span>
              </>
            ) : (
              <>
                <Lock size={20} />
                <span>Payer {amount} {currency}</span>
              </>
            )}
          </button>

          {/* Sécurité */}
          <div className="text-center text-xs text-gray-500 pt-2">
            <div className="flex items-center justify-center space-x-1">
              <Lock size={12} />
              <span>Paiement sécurisé par Visa Direct</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VisapayCardCollectionPage;

