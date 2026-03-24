import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import quotaService, { QuotaSummary } from '../../services/quota.service';
import { AlertCircle, Clock, Sparkles } from 'lucide-react';

/**
 * Bannière globale d'état d'abonnement, affichée en haut du dashboard.
 * - Affiche une bannière d'essai lorsqu'un plan est en status "trial"
 * - Affiche une bannière "lecture seule / abonnement requis" si l'abonnement est expiré ou absent
 */
export function SubscriptionStatusBanner() {
  const [summary, setSummary] = useState<QuotaSummary | null>(null);
  const [mode, setMode] = useState<'none' | 'trial' | 'expired_or_required'>('none');
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      try {
        // Ne pas recharger en permanence si on change juste d'onglet dans le dashboard
        const data = await quotaService.getQuotaSummary();
        setSummary(data);

        const pkg = data.currentPackage;
        if (!pkg) {
          // Pas de package rattaché → pas d'abonnement explicite
          setMode('expired_or_required');
          setDaysLeft(null);
          return;
        }

        if (pkg.status === 'trial' && pkg.trialEndsAt) {
          const end = new Date(pkg.trialEndsAt);
          const now = new Date();
          const diffMs = end.getTime() - now.getTime();
          const d = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          setMode('trial');
          setDaysLeft(d);
          return;
        }

        if (pkg.status === 'expired' || pkg.status === 'cancelled') {
          setMode('expired_or_required');
          setDaysLeft(null);
          return;
        }

        // Status actif sans essai → pas de bannière
        setMode('none');
        setDaysLeft(null);
      } catch (err: any) {
        const code = err?.response?.data?.code;
        // Si le back dit explicitement qu'il faut un abonnement, on affiche la bannière "lecture seule"
        if (
          code === 'SUBSCRIPTION_REQUIRED' ||
          code === 'SUBSCRIPTION_EXPIRED' ||
          code === 'SUBSCRIPTION_EXPIRED_READ_ONLY' ||
          code === 'SUBSCRIPTION_NOT_FOUND'
        ) {
          setMode('expired_or_required');
          setSummary(null);
          setDaysLeft(null);
        } else {
          // Pour toutes les autres erreurs (ex: non authentifié), ne rien afficher
          setMode('none');
        }
      }
    };

    // Ne charger la bannière que sur les pages internes (dashboard & modules),
    // pas sur les pages d'onboarding ni les routes publiques.
    if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/')) {
      load();
    }
  }, [location.pathname]);

  if (mode === 'none') {
    return null;
  }

  if (mode === 'trial') {
    const pkgName = summary?.currentPackage?.name || 'votre plan actuel';
    return (
      <div className="mb-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
          <Clock className="text-blue-600 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium flex items-center gap-1">
              <Sparkles size={14} className="text-blue-600" />
              Période d'essai
            </p>
            <p className="text-xs text-blue-800 mt-1">
              {`Vous testez le plan ${pkgName}`}{' '}
              {typeof daysLeft === 'number' && (
                <>
                  Il reste{' '}
                  <span className="font-semibold">{daysLeft}</span>{' '}
                  {daysLeft > 1 ? 'jours' : 'jour'}
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => navigate('/settings/subscription')}
            className="text-xs font-medium text-blue-900 bg-white border border-blue-200 rounded px-3 py-1 hover:bg-blue-50 transition-colors"
          >
            Gérer l'abonnement
          </button>
        </div>
      </div>
    );
  }

  // mode === 'expired_or_required'
  return (
    <div className="mb-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="text-amber-700 mt-0.5" size={18} />
        <div className="flex-1">
          <p className="text-sm text-amber-900 font-medium">Essai expiré</p>
          <p className="text-xs text-amber-800 mt-1">
            Votre période d'essai est terminée. Choisissez un plan pour continuer.
          </p>
        </div>
        <button
          onClick={() => navigate('/settings/subscription/upgrade')}
          className="text-xs font-medium text-amber-900 bg-white border border-amber-200 rounded px-3 py-1 hover:bg-amber-100 transition-colors"
        >
          Choisir un plan
        </button>
      </div>
    </div>
  );
}

