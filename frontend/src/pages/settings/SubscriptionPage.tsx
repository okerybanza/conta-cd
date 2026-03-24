import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Loader2,
  Package as PackageIcon,
  DollarSign,
} from 'lucide-react';
import { subscriptionService, packageService, Subscription, Package } from '../../services/package.service';
import { paypalService } from '../../services/paypal.service';
import { visapayService } from '../../services/visapay.service';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuthStore } from '../../store/auth.store';

function SubscriptionPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const { company } = useAuthStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState<'direct' | 'paypal' | 'visapay'>('direct');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les packages en premier (toujours nécessaire)
      const packagesResponse = await packageService.list();
      setPackages(packagesResponse.data.sort((a, b) => a.displayOrder - b.displayOrder));
      
      // Essayer de charger l'abonnement actif (peut ne pas exister)
      try {
        const subResponse = await subscriptionService.getActive();
        const subData = subResponse.data;
        
        // Log détaillé pour debug
        console.log('📦 Subscription API Response:', {
          success: subResponse.success,
          hasData: !!subData,
          hasPackage: !!subData?.package,
          packageName: subData?.package?.name,
          packageCode: subData?.package?.code,
          subscriptionId: subData?.id,
          packageId: subData?.packageId,
          fullResponse: subResponse,
        });
        
        // Vérifier que le package existe, sinon logger une erreur
        if (subData && !subData.package) {
          console.error('❌ Subscription loaded but package is missing:', {
            subscription: subData,
            hasPackageId: !!subData.packageId,
            packageId: subData.packageId,
            responseKeys: Object.keys(subData),
          });
          // Ne pas afficher d'erreur bloquante, juste un avertissement
          console.warn('⚠️ Package manquant pour l\'abonnement, affichage des plans disponibles uniquement');
        } else if (subData?.package) {
          console.log('✅ Package trouvé dans la réponse:', {
            name: subData.package.name,
            code: subData.package.code,
            features: Object.keys(subData.package.features || {}),
          });
        }
        setSubscription(subData);
      } catch (subErr: any) {
        // Si l'erreur est "pas d'abonnement trouvé", c'est normal
        if (subErr.response?.data?.code === 'SUBSCRIPTION_NOT_FOUND' || subErr.response?.status === 404) {
          setSubscription(null);
        } else {
          // Autre erreur (expiré, etc.)
          setError(subErr.response?.data?.message || 'Erreur lors du chargement de l\'abonnement');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/settings/subscription/upgrade');
  };

  const handleCancel = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler votre abonnement ? Vous perdrez l\'accès à la fin de la période payée.')) {
      return;
    }

    try {
      setCancelling(true);
      await subscriptionService.cancel();
      await loadData();
      showSuccess('Abonnement annulé avec succès');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  const handleRenew = async () => {
    if (!subscription) return;

    try {
      setRenewing(true);

      // Si PayPal est sélectionné
      if (renewalPaymentMethod === 'paypal') {
        const amount = Number(subscription.package?.priceMonthly || 0);
        const returnUrl = `${window.location.origin}/payments/paypal/return?type=subscription&subscriptionId=${subscription.id}`;
        const cancelUrl = `${window.location.origin}/settings/subscription`;

        // Créer l'order PayPal
        const orderResponse = await paypalService.createOrder({
          subscriptionId: subscription.id,
          packageId: subscription.packageId,
          amount: amount,
          currency: subscription.package?.currency || 'USD',
          description: `Renouvellement abonnement ${subscription.package?.name || 'N/A'}`,
          type: 'subscription',
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
        });

        // Rediriger vers PayPal
        const approvalUrl = paypalService.getApprovalUrl(orderResponse.data);
        if (approvalUrl) {
          window.location.href = approvalUrl;
        } else {
          showError('Erreur lors de la création du paiement PayPal');
          setRenewing(false);
        }
        return;
      }

      // Si Visapay est sélectionné
      if (renewalPaymentMethod === 'visapay' && company?.visapay_enabled) {
        if (!subscription.package) {
          showError('Le package de l\'abonnement n\'a pas été trouvé. Veuillez contacter le support.');
          setRenewing(false);
          return;
        }
        const amount = Number(subscription.package.priceMonthly || 0);
        const returnUrl = `${window.location.origin}/payments/visapay/return?type=subscription&subscriptionId=${subscription.id}`;
        const cancelUrl = `${window.location.origin}/settings/subscription`;

        // Initialiser le paiement Visapay
        const paymentResponse = await visapayService.initPayment({
          subscriptionId: subscription.id,
          packageId: subscription.packageId,
          amount: amount,
          currency: subscription.package.currency || 'USD',
          description: `Renouvellement abonnement ${subscription.package.name || 'N/A'}`,
          type: 'subscription',
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
        });

        if (paymentResponse.success && paymentResponse.data.paymentUrl) {
          // Rediriger vers Visapay
          window.location.href = paymentResponse.data.paymentUrl;
        } else {
          showError('Erreur lors de la création du paiement Visapay');
          setRenewing(false);
        }
        return;
      }

      // Renouvellement direct
      await subscriptionService.renew();
      await loadData();
      showSuccess('Abonnement renouvelé avec succès');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du renouvellement');
    } finally {
      setRenewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { icon: CheckCircle2, color: 'bg-green-100 text-green-800', label: 'Actif' },
      trial: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Essai' },
      expired: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Expiré' },
      cancelled: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800', label: 'Annulé' },
    };
    const badge = badges[status as keyof typeof badges] || badges.active;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon size={16} className="mr-2" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestion de l'Abonnement</h1>
            <p className="text-gray-600 mt-1">Gérez votre plan et votre facturation</p>
          </div>
          {subscription ? (
            <button
              onClick={handleUpgrade}
              className="btn-primary flex items-center space-x-2"
            >
              <ArrowRight size={18} />
              <span>Changer de plan</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/settings/subscription/upgrade')}
              className="btn-primary flex items-center space-x-2"
            >
              <PackageIcon size={18} />
              <span>Choisir un plan</span>
            </button>
          )}
        </div>

        {/* Message d'erreur (si erreur critique) */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Message si pas d'abonnement */}
        {!subscription && !error && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <PackageIcon className="text-blue-600 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Aucun abonnement actif</h3>
                <p className="text-blue-700 mb-4">
                  Vous n'avez pas encore d'abonnement actif. Choisissez un plan ci-dessous pour commencer.
                </p>
                <button
                  onClick={() => navigate('/settings/subscription/upgrade')}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <PackageIcon size={18} />
                  <span>Voir les plans disponibles</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Abonnement actuel */}
        {subscription && subscription.package ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Abonnement Actuel</h2>
                <div className="flex items-center gap-3">
                  {getStatusBadge(subscription.status)}
                  <span className="text-gray-600">
                    Plan: <strong>{subscription.package?.name || 'N/A'}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <PackageIcon size={20} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Plan</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{subscription.package.name || 'N/A'}</p>
                <p className="text-sm text-gray-600 mt-1">{subscription.package.description || ''}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={20} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Prix</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(Number(subscription.package.priceMonthly || 0), subscription.package.currency || 'CDF')}/mois
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Facturation {subscription.billingCycle === 'monthly' ? 'mensuelle' : 'annuelle'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={20} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Période</span>
                </div>
                <p className="text-sm text-gray-900">
                  Du {formatDate(subscription.startDate)}
                </p>
                {subscription.endDate && (
                  <p className="text-sm text-gray-900">
                    Au {formatDate(subscription.endDate)}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={20} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Prochain paiement</span>
                </div>
                {subscription.nextPaymentDate ? (
                  <p className="text-sm text-gray-900">
                    {formatDate(subscription.nextPaymentDate)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Non défini</p>
                )}
              </div>
            </div>

            {/* Fonctionnalités */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Fonctionnalités Incluses</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(subscription.package.features || {}).map(([key, enabled]) => {
                  if (!enabled) return null;
                  const labels: Record<string, string> = {
                    expenses: 'Module Dépenses',
                    accounting: 'Comptabilité Avancée',
                    recurring_invoices: 'Factures Récurrentes',
                    api: 'API Access',
                    custom_templates: 'Templates Personnalisés',
                    multi_currency: 'Multi-devises',
                    advanced_reports: 'Rapports Avancés',
                    workflows: 'Workflows Automatisés',
                    custom_branding: 'Branding Personnalisé',
                  };
                  return (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="text-gray-700">{labels[key] || key}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              {subscription.status === 'expired' && (
                <>
                  {/* Méthode de paiement pour renouvellement */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Méthode de paiement</h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="renewalPaymentMethod"
                          value="direct"
                          checked={renewalPaymentMethod === 'direct'}
                          onChange={(e) => setRenewalPaymentMethod(e.target.value as 'direct' | 'paypal')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Paiement direct (facturation manuelle)</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="renewalPaymentMethod"
                          value="paypal"
                          checked={renewalPaymentMethod === 'paypal'}
                          onChange={(e) => setRenewalPaymentMethod(e.target.value as 'direct' | 'paypal' | 'visapay')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 flex items-center gap-2">
                          <span>PayPal</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Sécurisé</span>
                        </span>
                      </label>
                      {company?.visapay_enabled && (
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="renewalPaymentMethod"
                            value="visapay"
                            checked={renewalPaymentMethod === 'visapay'}
                            onChange={(e) => setRenewalPaymentMethod(e.target.value as 'direct' | 'paypal' | 'visapay')}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 flex items-center gap-2">
                            <span>Visapay</span>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Visa Direct</span>
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleRenew}
                    disabled={renewing}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {renewing ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Renouvellement...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        <span>
                          {renewalPaymentMethod === 'paypal'
                            ? 'Renouveler avec PayPal'
                            : renewalPaymentMethod === 'visapay'
                            ? 'Renouveler avec Visapay'
                            : 'Renouveler l\'abonnement'}
                        </span>
                      </>
                    )}
                  </button>
                </>
              )}
              {subscription.status === 'active' && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="btn-secondary text-danger hover:bg-danger/10"
                >
                  {cancelling ? 'Annulation...' : 'Annuler l\'abonnement'}
                </button>
              )}
            </div>
          </div>
        ) : subscription ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-yellow-600 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Abonnement sans package</h3>
                <p className="text-yellow-700 mb-4">
                  Votre abonnement existe mais le package associé n'a pas été trouvé. Veuillez contacter le support.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tous les plans disponibles */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Tous les Plans Disponibles</h2>
          {packages.length === 0 ? (
            <div className="text-center py-8">
              <PackageIcon className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">Aucun plan disponible pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`border-2 rounded-lg p-6 ${
                  subscription?.packageId === pkg.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                  {subscription?.packageId === pkg.id && (
                    <span className="text-xs bg-primary text-white px-2 py-1 rounded">Actuel</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(Number(pkg.priceMonthly), pkg.currency)}
                  </span>
                  <span className="text-gray-600">/mois</span>
                </div>
                <button
                  onClick={() => navigate(`/settings/subscription/upgrade?packageId=${pkg.id}`)}
                  className={`w-full py-2 rounded-lg font-medium ${
                    subscription?.packageId === pkg.id
                      ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                  disabled={subscription?.packageId === pkg.id}
                >
                  {subscription?.packageId === pkg.id ? 'Plan actuel' : 'Choisir ce plan'}
                </button>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPage;

