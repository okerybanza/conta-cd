import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Sparkles,
  Package as PackageIcon,
} from 'lucide-react';
import { subscriptionService, packageService, Package, Subscription } from '../../services/package.service';
import { paypalService } from '../../services/paypal.service';
import { visapayService } from '../../services/visapay.service';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../store/auth.store';

function UpgradePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToastContext();
  const [packages, setPackages] = useState<Package[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    searchParams.get('packageId')
  );
  const [paymentMethod, setPaymentMethod] = useState<'direct' | 'paypal' | 'visapay'>('direct');
  const { company } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [packagesResponse, subscriptionResponse] = await Promise.all([
        packageService.list(),
        subscriptionService.getActive().catch(() => ({ success: false, data: null })),
      ]);
      setPackages(packagesResponse.data.sort((a, b) => a.displayOrder - b.displayOrder));
      if (subscriptionResponse.success && subscriptionResponse.data) {
        setCurrentSubscription(subscriptionResponse.data);
        if (!selectedPackageId) {
          setSelectedPackageId(subscriptionResponse.data.packageId);
        }
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPackageId) {
      showError('Veuillez sélectionner un plan');
      return;
    }

    if (currentSubscription && selectedPackageId === currentSubscription.packageId) {
      showError('Vous êtes déjà sur ce plan');
      return;
    }

    try {
      setUpgrading(true);
      
      const selectedPackage = packages.find((p) => p.id === selectedPackageId);
      
      // Si PayPal est sélectionné
      if (paymentMethod === 'paypal' && selectedPackage) {
        const amount = Number(selectedPackage.priceMonthly || 0);
        const returnUrl = `${window.location.origin}/payments/paypal/return?type=subscription&packageId=${selectedPackageId}`;
        const cancelUrl = `${window.location.origin}/settings/subscription/upgrade`;

        // Créer l'order PayPal
        const orderResponse = await paypalService.createOrder({
          packageId: selectedPackageId,
          amount: amount,
          currency: selectedPackage.currency || 'USD',
          description: `Abonnement ${selectedPackage.name}`,
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
          setUpgrading(false);
        }
        return;
      }

      // Si Visapay est sélectionné
      if (paymentMethod === 'visapay' && selectedPackage && company?.visapay_enabled) {
        const amount = Number(selectedPackage.priceMonthly || 0);
        const returnUrl = `${window.location.origin}/payments/visapay/return?type=subscription&packageId=${selectedPackageId}`;
        const cancelUrl = `${window.location.origin}/settings/subscription/upgrade`;

        // Initialiser le paiement Visapay
        const paymentResponse = await visapayService.initPayment({
          packageId: selectedPackageId,
          amount: amount,
          currency: selectedPackage.currency || 'USD',
          description: `Abonnement ${selectedPackage.name}`,
          type: 'subscription',
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
        });

        if (paymentResponse.success && paymentResponse.data.paymentUrl) {
          // Rediriger vers Visapay
          window.location.href = paymentResponse.data.paymentUrl;
        } else {
          showError('Erreur lors de la création du paiement Visapay');
          setUpgrading(false);
        }
        return;
      }

      // Paiement direct
      await subscriptionService.upgrade(selectedPackageId);
      showSuccess('Plan mis à jour avec succès ! Vous recevrez un email de confirmation.');
      navigate('/settings/subscription');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la mise à jour du plan');
    } finally {
      setUpgrading(false);
    }
  };

  const getFeatureLabels = (): Record<string, string> => ({
    expenses: 'Module Dépenses',
    accounting: 'Comptabilité Avancée',
    recurring_invoices: 'Factures Récurrentes',
    api: 'API Access',
    custom_templates: 'Templates Personnalisés',
    multi_currency: 'Multi-devises',
    advanced_reports: 'Rapports Avancés',
    workflows: 'Workflows Automatisés',
    custom_branding: 'Branding Personnalisé',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const currentPackage = currentSubscription?.package;
  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/settings/subscription')}
            className="btn-secondary flex items-center space-x-2 mb-4"
          >
            <ArrowLeft size={18} />
            <span>Retour</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Changer de Plan</h1>
          <p className="text-gray-600 mt-1">Sélectionnez le plan qui correspond le mieux à vos besoins</p>
        </div>

        {/* Plans disponibles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {packages.map((pkg) => {
            const isCurrent = currentPackage?.id === pkg.id;
            const isSelected = selectedPackageId === pkg.id;
            const isUpgrade = currentPackage && pkg.displayOrder > currentPackage.displayOrder;
            const isDowngrade = currentPackage && pkg.displayOrder < currentPackage.displayOrder;

            return (
              <div
                key={pkg.id}
                className={`relative border-2 rounded-xl p-6 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-primary/50'
                } ${isCurrent ? 'ring-2 ring-primary/20' : ''}`}
                onClick={() => setSelectedPackageId(pkg.id)}
              >
                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                      Actuel
                    </span>
                  </div>
                )}
                {isSelected && !isCurrent && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 size={24} className="text-primary" />
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <PackageIcon size={24} className="text-primary" />
                    <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(Number(pkg.priceMonthly), pkg.currency)}
                    </span>
                    <span className="text-gray-600">/mois</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Facturation mensuelle</p>
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-2 mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Fonctionnalités :</p>
                  {Object.entries(pkg.features || {}).map(([key, enabled]) => {
                    const labels = getFeatureLabels();
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {enabled ? (
                          <CheckCircle2 size={16} className="text-green-600" />
                        ) : (
                          <XCircle size={16} className="text-gray-300" />
                        )}
                        <span className={enabled ? 'text-gray-700' : 'text-gray-400 line-through'}>
                          {labels[key] || key}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Limites */}
                {pkg.limits && (
                  <div className="space-y-2 mb-6 text-xs text-gray-600">
                    {pkg.limits.customers && (
                      <div>Clients: {pkg.limits.customers === null ? 'Illimité' : pkg.limits.customers}</div>
                    )}
                    {pkg.limits.users && (
                      <div>Utilisateurs: {pkg.limits.users === null ? 'Illimité' : pkg.limits.users}</div>
                    )}
                    {pkg.limits.products && (
                      <div>Produits: {pkg.limits.products === null ? 'Illimité' : pkg.limits.products}</div>
                    )}
                  </div>
                )}

                {isCurrent && (
                  <div className="text-center py-2 text-sm text-gray-500 font-medium">
                    Plan actuel
                  </div>
                )}
                {!isCurrent && (
                  <div className="text-center py-2 text-sm font-medium">
                    {isUpgrade && <span className="text-green-600">↑ Upgrade</span>}
                    {isDowngrade && <span className="text-orange-600">↓ Downgrade</span>}
                    {!isUpgrade && !isDowngrade && <span className="text-gray-600">Changer</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Résumé et confirmation */}
        {selectedPackage && selectedPackageId !== currentPackage?.id && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Résumé du Changement</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plan actuel:</span>
                  <span className="font-medium">{currentPackage?.name || 'Aucun'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nouveau plan:</span>
                  <span className="font-medium text-primary">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-gray-600">Nouveau prix:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(Number(selectedPackage.priceMonthly), selectedPackage.currency)}/mois
                  </span>
                </div>
              </div>
            </div>

            {/* Méthode de paiement */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Méthode de paiement</h3>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="direct"
                    checked={paymentMethod === 'direct'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'direct' | 'paypal')}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Paiement direct</div>
                    <div className="text-sm text-gray-600">Le plan sera changé immédiatement (facturation manuelle)</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'direct' | 'paypal' | 'visapay')}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <span>PayPal</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Sécurisé</span>
                    </div>
                    <div className="text-sm text-gray-600">Payer via PayPal (redirection vers PayPal)</div>
                  </div>
                </label>
                {company?.visapay_enabled && (
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="visapay"
                      checked={paymentMethod === 'visapay'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'direct' | 'paypal' | 'visapay')}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <span>Visapay</span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Visa Direct</span>
                      </div>
                      <div className="text-sm text-gray-600">Payer via Visapay (Visa Direct)</div>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate('/settings/subscription')}
            className="btn-secondary"
          >
            Annuler
          </button>
          {selectedPackageId && selectedPackageId !== currentPackage?.id && (
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="btn-primary flex items-center space-x-2"
            >
              {upgrading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Mise à jour...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>
                    {selectedPackage && paymentMethod === 'paypal'
                      ? 'Payer avec PayPal'
                      : selectedPackage && paymentMethod === 'visapay'
                      ? 'Payer avec Visapay'
                      : 'Confirmer le changement'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UpgradePage;

