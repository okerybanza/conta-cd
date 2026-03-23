import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Package as PackageIcon, X, ArrowRight } from 'lucide-react';
import { packageService, Package } from '../services/package.service';

interface QuotaErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: {
    metric: string;
    limit: number;
    currentUsage: number;
    message?: string;
  } | null;
}

export function QuotaErrorModal({ isOpen, onClose, error }: QuotaErrorModalProps) {
  const navigate = useNavigate();
  const [upgradePackages, setUpgradePackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && error) {
      loadUpgradePackages();
    }
  }, [isOpen, error]);

  const loadUpgradePackages = async () => {
    try {
      setLoading(true);
      const response = await packageService.list();
      // Filtrer les plans supérieurs (PRO et PREMIUM)
      const packages = response.data
        .filter((pkg) => ['PRO', 'PREMIUM'].includes(pkg.code.toUpperCase()))
        .sort((a, b) => a.displayOrder - b.displayOrder);
      setUpgradePackages(packages);
    } catch (err) {
      console.error('Error loading packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (packageId: string) => {
    navigate(`/settings/subscription/upgrade?packageId=${packageId}`);
    onClose();
  };

  if (!isOpen || !error) return null;

  const getMetricLabel = (metric: string): string => {
    const labels: Record<string, string> = {
      invoices: 'Factures',
      customers: 'Clients',
      products: 'Produits',
      expenses: 'Dépenses',
      suppliers: 'Fournisseurs',
      users: 'Utilisateurs',
      storage: 'Espace de stockage',
      emails_sent: 'Emails envoyés',
      recurring_invoices: 'Factures récurrentes',
    };
    return labels[metric] || metric;
  };

  const formatStorage = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatValue = (value: number, metric: string): string => {
    if (metric === 'storage') {
      return formatStorage(value);
    }
    return value.toString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Limite atteinte</h2>
              <p className="text-sm text-text-secondary">Votre plan actuel a atteint sa limite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Details */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-800 mb-2">
              <strong>{getMetricLabel(error.metric)}</strong> : Vous avez atteint votre limite de{' '}
              <strong>{formatValue(error.limit, error.metric)}</strong>
            </p>
            <p className="text-sm text-orange-700">
              Utilisation actuelle : <strong>{formatValue(error.currentUsage, error.metric)}</strong> /{' '}
              {formatValue(error.limit, error.metric)}
            </p>
            {error.message && (
              <p className="text-sm text-orange-700 mt-2">{error.message}</p>
            )}
          </div>

          {/* Upgrade Options */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <PackageIcon className="w-5 h-5 text-primary" />
              Passez à un plan supérieur
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-text-secondary">Chargement des plans...</p>
              </div>
            ) : upgradePackages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary">Aucun plan disponible pour l'upgrade</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upgradePackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => handleUpgrade(pkg.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-text-primary">{pkg.name}</h4>
                      {pkg.code.toUpperCase() === 'PRO' && (
                        <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                          Populaire
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mb-3">{pkg.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-text-primary">
                        {pkg.priceMonthly === 0
                          ? 'Gratuit'
                          : `${pkg.priceMonthly.toLocaleString()} ${pkg.currency}/mois`}
                      </span>
                      <button className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                        Choisir
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Plus tard
          </button>
          <button
            onClick={() => {
              navigate('/settings/subscription/upgrade');
              onClose();
            }}
            className="btn-primary px-4 py-2 flex items-center gap-2"
          >
            Voir tous les plans
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
