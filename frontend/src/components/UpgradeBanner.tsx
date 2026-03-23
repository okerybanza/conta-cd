import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';

interface UpgradeBannerProps {
  feature: string;
  message: string;
  currentPackage?: string;
}

export function UpgradeBanner({ feature, message, currentPackage }: UpgradeBannerProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package size={20} className="text-primary" />
          <div>
            <p className="text-sm font-medium text-text-primary">{message}</p>
            {currentPackage && (
              <p className="text-xs text-text-secondary mt-1">
                Plan actuel : {currentPackage.toUpperCase()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/settings/subscription/upgrade')}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          Upgradez maintenant
        </button>
      </div>
    </div>
  );
}

