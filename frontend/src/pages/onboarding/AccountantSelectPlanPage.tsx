import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  CreditCard,
  Smartphone,
  Building2,
} from 'lucide-react';
import { subscriptionService, packageService, Package } from '../../services/package.service';
import { paypalService } from '../../services/paypal.service';
import { visapayService } from '../../services/visapay.service';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../store/auth.store';

function AccountantSelectPlanPage() {
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
      // Filtrer uniquement les 3 plans experts comptables
      const accountantPlans = packagesResponse.data
        .filter((pkg) =>
          ['ACCOUNTANT_STARTER', 'ACCOUNTANT_PROFESSIONAL', 'ACCOUNTANT_ENTERPRISE'].includes(pkg.code.toUpperCase())
        )
        .sort((a, b) => a.displayOrder - b.displayOrder);

      if (accountantPlans.length === 0) {
        showError('Aucun plan expert comptable disponible. Veuillez contacter le support.');
        return;
      }

      setPackages(accountantPlans);
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

      // Tous les plans experts sont payants, donc on gère le paiement
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
      const returnUrl = `${window.location.origin}/payments/paypal/return?type=subscription&packageId=${pkg.id}&onboarding=true&accountant=true`;
      const cancelUrl = `${window.location.origin}/onboarding/accountant/select-plan`;

      const orderResponse = await paypalService.createOrder({
        packageId: pkg.id,
        amount: amount,
        currency: currency,
        description: `Abonnement Expert Comptable ${pkg.name}`,
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
      const returnUrl = `${window.location.origin}/payments/visapay/return?type=subscription&packageId=${pkg.id}&onboarding=true&accountant=true`;
      const cancelUrl = `${window.location.origin}/onboarding/accountant/select-plan`;

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
          description: `Abonnement Expert Comptable ${pkg.name}`,
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
    multi_companies: 'Multi-entreprises',
    consolidated_reports: 'Rapports Consolidés',
    priority_support: 'Support Prioritaire',
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

  const getLimitDisplay = (pkg: Package): string[] => {
    const limits: string[] = [];
    const limitsData = pkg.limits || {};

    if (limitsData.companies !== null && limitsData.companies !== undefined) {
      if (limitsData.companies === null || limitsData.companies === -1) {
        limits.push('Entreprises illimitées');
      } else {
        limits.push(`Jusqu'à ${limitsData.companies} entreprises`);
      }
    }

    if (limitsData.emails_per_month !== null && limitsData.emails_per_month !== undefined) {
      if (limitsData.emails_per_month === null || limitsData.emails_per_month === -1) {
        limits.push('Emails illimités');
      } else {
        limits.push(`${limitsData.emails_per_month} emails/mois`);
      }
    }

    if (limitsData.sms_per_month !== null && limitsData.sms_per_month !== undefined) {
      if (limitsData.sms_per_month === null || limitsData.sms_per_month === -1) {
        limits.push('SMS illimités');
      } else {
        limits.push(`${limitsData.sms_per_month} SMS/mois`);
      }
    }

    if (limitsData.storage_mb !== null && limitsData.storage_mb !== undefined) {
      if (limitsData.storage_mb === null || limitsData.storage_mb === -1) {
        limits.push('Stockage illimité');
      } else {
        const storageGB = Math.round(limitsData.storage_mb / 1024);
        limits.push(`${storageGB} GB de stockage`);
      }
    }

    return limits;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-text-secondary">Chargement des plans experts comptables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Plans Experts Comptables
          </h1>
          <p className="text-lg text-text-secondary">
            Choisissez le plan qui correspond à votre cabinet
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {packages.map((pkg) => {
            const isSelected = selectedPackageId === pkg.id;
            const features = getFeatureList(pkg);
            const limits = getLimitDisplay(pkg);
            const isPopular = pkg.code.toUpperCase() === 'ACCOUNTANT_PROFESSIONAL';

            return (
              <div
                key={pkg.id}
                className={`border-2 rounded-lg p-6 bg-white transition-all relative ${isSelected
                  ? 'border-primary shadow-lg scale-105'
                  : isPopular
                    ? 'border-primary/50 shadow-md'
                    : 'border-gray-200 hover:border-primary/50 hover:shadow-md'
                  }`}
              >
                {/* Badge "Le plus populaire" */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="inline-block bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Le plus populaire
                    </span>
                  </div>
                )}

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
                    <span className="text-text-secondary">/mois</span>
                  </div>
                </div>

                {/* Limites */}
                {limits.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      {limits.map((limit, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                          <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>{limit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                    : 'btn-primary'
                    } ${selecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {selecting && isSelected ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Traitement...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Choisir ce plan</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Options de paiement */}
        {selectedPackageId && (
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

export default AccountantSelectPlanPage;
