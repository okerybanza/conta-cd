import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useToastContext } from '../../contexts/ToastContext';

// 20 minutes d'inactivité avant déconnexion automatique (recommandation standard)
const IDLE_TIMEOUT_MS = 20 * 60 * 1000;
// Avertir l'utilisateur 2 minutes avant la déconnexion
const WARNING_BEFORE_MS = 2 * 60 * 1000;

interface SessionTimeoutManagerProps {
  children: React.ReactNode;
}

export function SessionTimeoutManager({ children }: SessionTimeoutManagerProps) {
  const { isAuthenticated, logout } = useAuthStore();
  const { showToast } = useToastContext();

  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    function updateActivity() {
      lastActivityRef.current = Date.now();
      warningShownRef.current = false;
    }

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];

    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(() => {
      if (!isAuthenticated) {
        return;
      }

      const now = Date.now();
      const idleTime = now - lastActivityRef.current;

      // Afficher un avertissement peu avant la déconnexion
      if (
        idleTime >= IDLE_TIMEOUT_MS - WARNING_BEFORE_MS &&
        idleTime < IDLE_TIMEOUT_MS &&
        !warningShownRef.current
      ) {
        warningShownRef.current = true;
        showToast(
          'Votre session va expirer bientôt pour inactivité. Bougez la souris ou cliquez pour rester connecté.',
          'warning'
        );
      }

      // Déconnexion automatique après le délai d'inactivité
      if (idleTime >= IDLE_TIMEOUT_MS) {
        logout();
        showToast('Votre session a expiré pour inactivité. Veuillez vous reconnecter.', 'info');
        window.location.href = '/login?reason=session_expired';
      }
    }, 30_000); // Vérification toutes les 30 secondes

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, logout, showToast]);

  return <>{children}</>;
}

