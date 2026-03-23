import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  Package as PackageIcon,
  Sparkles,
  ArrowRight,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import { subscriptionService, packageService, Package } from '../../services/package.service';
import { paypalService } from '../../services/paypal.service';
import { visapayService } from '../../services/visapay.service';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/formatters';


function SelectPlanPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<'direct' | 'paypal' | 'visapay'>('paypal');
  const [visapayMethod, setVisapayMethod] = useState<'card' | 'mobile_money'>('card');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const packagesResponse = await packageService.list();
      // Filtrer uniquement les 3 plans principaux (STARTER, PRO, PREMIUM)
      const mainPlans = packagesResponse.data
        .filter((pkg) => ['STARTER', 'PRO', 'PREMIUM'].includes(pkg.code.toUpperCase()))
        .sort((a, b) => a.displayOrder - b.displayOrder);
      setPackages(mainPlans);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du chargement des plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (pkg: Package) => {
    if (selecting) return;

    try {
      setSelecting(true);
      setSelectedPackageId(pkg.id);

      // Si le plan est gratuit (STARTER), créer directement l'abonnement
      if (Number(pkg.priceMonthly) === 0) {
        await subscriptionService.create({
          packageId: pkg.id,
          billingCycle: 'monthly',
        });
        showSuccess('Plan Starter activé avec succès !');
        navigate('/dashboard');
        return;
      }

      // Pour PRO et PREMIUM : créer un essai gratuit de 14 jours
      const planCode = pkg.code.toUpperCase();
      if (planCode === 'PRO' || planCode === 'PREMIUM') {
        await subscriptionService.create({
          packageId: pkg.id,
          billingCycle: 'monthly',
          trialDays: 14,
        });
        showSuccess(`Essai ${pkg.name} de 14 jours activé !`);
        navigate('/dashboard');
        return;
      }

      // Pour les autres plans payants, gérer le paiement normal
      await handlePaidPlanSelection(pkg);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la sélection du plan');
      setSelectedPackageId(null);
    } finally {
      setSelecting(false);
    }
  };

  const handlePaidPlanSelection = async (pkg: Package) => {
    const amount = Number(pkg.priceMonthly || 0);
    const currency = pkg.currency || 'CDF';

    // Si PayPal est sélectionné
    if (paymentProvider === 'paypal') {
      const returnUrl = `${window.location.origin}/payments/paypal/return?type=subscription&packageId=${pkg.id}&onboarding=true`;
      const cancelUrl = `${window.location.origin}/onboarding/select-plan`;

      const orderResponse = await paypalService.createOrder({
        packageId: pkg.id,
        amount: amount,
        currency: currency,
        description: `Abonnement ${pkg.name}`,
        type: 'subscription',
        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
      });

      const approvalUrl = paypalService.getApprovalUrl(orderResponse.data);
      if (approvalUrl) {
        window.location.href = approvalUrl;
      } else {
        showError('Erreur lors de la création du paiement PayPal');
        setSelectedPackageId(null);
      }
      return;
    }

    // Si Visapay est sélectionné
    if (paymentProvider === 'visapay') {
      const returnUrl = `${window.location.origin}/payments/visapay/return?type=subscription&packageId=${pkg.id}&onboarding=true`;
      const cancelUrl = `${window.location.origin}/onboarding/select-plan`;

      // Si c'est une carte bancaire, rediriger vers la page de saisie de carte
      if (visapayMethod === 'card') {
        const cardCollectionUrl = `/payments/visapay/card?packageId=${pkg.id}&amount=${amount}&currency=${currency}&type=subscription&returnUrl=${encodeURIComponent(returnUrl)}&cancelUrl=${encodeURIComponent(cancelUrl)}`;
        navigate(cardCollectionUrl);
        return;
      }

      // Si c'est mobile money, initier le paiement directement
      if (visapayMethod === 'mobile_money') {
        const paymentResponse = await visapayService.initPayment({
          packageId: pkg.id,
          amount: amount,
          currency: currency,
          description: `Abonnement ${pkg.name}`,
          type: 'subscription',
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
        });

        if (paymentResponse.success && paymentResponse.data.paymentUrl) {
          window.location.href = paymentResponse.data.paymentUrl;
        } else {
          showError('Erreur lors de la création du paiement Visapay');
          setSelectedPackageId(null);
        }
        return;
      }
    }

    // Paiement direct (pour le développement ou paiements manuels)
    await subscriptionService.create({
      packageId: pkg.id,
      billingCycle: 'monthly',
    });
    showSuccess(`Plan ${pkg.name} activé avec succès !`);
    navigate('/dashboard');
  };

  const getFeatureLabels = (): Record<string, string> => ({
    expenses: 'Module Dépenses',
    accounting: 'Comptabilité',
    recurring_invoices: 'Factures Récurrentes',
    api: 'API Access',
    custom_templates: 'Templates Personnalisés',
    multi_currency: 'Multi-devises',
    advanced_reports: 'Rapports Avancés',
    workflows: 'Workflows',
    custom_branding: 'Branding Personnalisé',
    stock: 'Gestion de Stock',
    hr: 'Ressources Humaines',
  });

  const getFeatureList = (pkg: Package): string[] => {
    const features: string[] = [];
    const labels = getFeatureLabels();

    Object.entries(pkg.features || {}).forEach(([key, value]) => {
      if (value && labels[key]) {
        features.push(labels[key]);
      }
    });

    return features;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-text-secondary">Chargement des plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Banner Essai Gratuit */}
        <div className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-text-primary">
              Essai gratuit de 14 jours pour PRO et PREMIUM
            </h2>
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <p className="text-text-secondary">
            Testez toutes les fonctionnalités sans engagement. Aucune carte bancaire requise.
          </p>
        </div>

        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <PackageIcon className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Choisissez votre plan
          </h1>
          <p className="text-lg text-text-secondary">
            Sélectionnez le plan qui correspond le mieux à vos besoins
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {packages.map((pkg) => {
            const isFree = Number(pkg.priceMonthly) === 0;
            const isSelected = selectedPackageId === pkg.id;
            const features = getFeatureList(pkg);

            return (
              <div
                key={pkg.id}
                className={`border-2 rounded-lg p-6 bg-white transition-all ${isSelected
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-gray-200 hover:border-primary/50 hover:shadow-md'
                  }`}
              >
                {/* Badges pour PRO et PREMIUM */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {pkg.code.toUpperCase() === 'PRO' && (
                    <span className="inline-block bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Le plus populaire
                    </span>
                  )}
                  {(pkg.code.toUpperCase() === 'PRO' || pkg.code.toUpperCase() === 'PREMIUM') && (
                    <span className="inline-block bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Essai gratuit 14 jours
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    {pkg.name}
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    {pkg.description}
                  </p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-text-primary">
                      {formatCurrency(Number(pkg.priceMonthly), pkg.currency)}
                    </span>
                    {!isFree && (
                      <span className="text-text-secondary">/mois</span>
                    )}
                  </div>
                </div>

                {/* Liste des fonctionnalités */}
                <div className="mb-6 space-y-2">
                  {features.length > 0 ? (
                    features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-text-secondary">{feature}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-secondary italic">
                      Aucune fonctionnalité spécifique
                    </p>
                  )}
                </div>

                {/* Bouton de sélection */}
                <button
                  onClick={() => handleSelectPlan(pkg)}
                  disabled={selecting}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${isSelected
                    ? 'bg-primary text-white'
                    : isFree
                      ? 'btn-primary'
                      : 'btn-secondary'
                    } ${selecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {selecting && isSelected ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Traitement...</span>
                    </div>
                  ) : isFree ? (
                    <div className="flex items-center justify-center gap-2">
                      <span>Commencer gratuitement</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  ) : (pkg.code.toUpperCase() === 'PRO' || pkg.code.toUpperCase() === 'PREMIUM') ? (
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Essayer {pkg.name} gratuitement (14 jours)</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Choisir ce plan</span>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Options de paiement pour les plans payants (sauf PRO et PREMIUM qui ont un essai gratuit) */}
        {selectedPackageId && packages.find((p) => {
          const isPaid = Number(p.priceMonthly) > 0;
          const isProOrPremium = p.code.toUpperCase() === 'PRO' || p.code.toUpperCase() === 'PREMIUM';
          return p.id === selectedPackageId && isPaid && !isProOrPremium;
        }) && (
            <div className="max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Choisissez votre méthode de paiement
              </h3>
              <div className="space-y-3">
                {/* PayPal */}
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                  <input
                    type="radio"
                    name="paymentProvider"
                    value="paypal"
                    checked={paymentProvider === 'paypal'}
                    onChange={(e) => setPaymentProvider(e.target.value as 'paypal')}
                    className="w-4 h-4 text-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-text-primary flex items-center gap-2">
                      <span>PayPal</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Sécurisé</span>
                    </div>
                    <div className="text-sm text-text-secondary">
                      Payer via PayPal avec votre compte ou carte bancaire
                    </div>
                  </div>
                </label>

                {/* Visapay */}
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                  <input
                    type="radio"
                    name="paymentProvider"
                    value="visapay"
                    checked={paymentProvider === 'visapay'}
                    onChange={(e) => setPaymentProvider(e.target.value as 'visapay')}
                    className="w-4 h-4 text-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-text-primary flex items-center gap-2">
                      <span>Visapay</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">RDC</span>
                    </div>
                    <div className="text-sm text-text-secondary">
                      Payer par carte bancaire ou mobile money
                    </div>
                  </div>
                </label>

                {/* Options Visapay détaillées */}
                {paymentProvider === 'visapay' && (
                  <div className="ml-8 mt-2 space-y-2 border-l-2 border-purple-200 pl-4">
                    <label className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-purple-50 transition-all">
                      <input
                        type="radio"
                        name="visapayMethod"
                        value="card"
                        checked={visapayMethod === 'card'}
                        onChange={(e) => setVisapayMethod(e.target.value as 'card')}
                        className="w-4 h-4 text-purple-600"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <CreditCard className="w-4 h-4 text-purple-600" />
                        <div>
                          <div className="font-medium text-text-primary text-sm">Carte bancaire</div>
                          <div className="text-xs text-text-secondary">Visa, Mastercard, etc.</div>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-purple-50 transition-all">
                      <input
                        type="radio"
                        name="visapayMethod"
                        value="mobile_money"
                        checked={visapayMethod === 'mobile_money'}
                        onChange={(e) => setVisapayMethod(e.target.value as 'mobile_money')}
                        className="w-4 h-4 text-purple-600"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Smartphone className="w-4 h-4 text-purple-600" />
                        <div>
                          <div className="font-medium text-text-primary text-sm">Mobile Money</div>
                          <div className="text-xs text-text-secondary">Orange Money, M-Pesa, Airtel Money</div>
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Paiement direct (optionnel) */}
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                  <input
                    type="radio"
                    name="paymentProvider"
                    value="direct"
                    checked={paymentProvider === 'direct'}
                    onChange={(e) => setPaymentProvider(e.target.value as 'direct')}
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <div className="font-medium text-text-primary">Paiement direct</div>
                    <div className="text-sm text-text-secondary">
                      Le paiement sera géré manuellement par notre équipe
                    </div>
                  </div>
                </label>

                <button
                  onClick={() => {
                    const selectedPkg = packages.find((p) => p.id === selectedPackageId);
                    if (selectedPkg) {
                      handlePaidPlanSelection(selectedPkg);
                    }
                  }}
                  disabled={selecting}
                  className="w-full btn-primary py-3 mt-4"
                >
                  {selecting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Traitement...</span>
                    </div>
                  ) : (
                    'Confirmer et payer'
                  )}
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default SelectPlanPage;