import { AlertCircle, Lock, ArrowRight } from 'lucide-react';

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

/**
 * Modal affiché quand l'utilisateur essaie d'effectuer une action
 * alors que son abonnement est expiré ou inexistant
 */
export function SubscriptionRequiredModal({
  isOpen,
  onClose,
  message,
}: SubscriptionRequiredModalProps) {
  if (!isOpen) return null;

  const handleSubscribe = () => {
    onClose();
    // Utiliser window.location au lieu de useNavigate car ce composant
    // peut être rendu en dehors du Router (dans main.tsx)
    window.location.href = '/settings/subscription/upgrade';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Lock className="text-amber-600" size={24} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Abonnement requis
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {message ||
                "Votre abonnement est expiré ou inexistant. Pour continuer à créer et modifier des éléments, vous devez vous abonner à un plan."}
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={14} />
                <span>
                  Vous pouvez toujours <strong>consulter</strong> toutes vos données en mode lecture seule.
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSubscribe}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <span>Choisir un plan</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
