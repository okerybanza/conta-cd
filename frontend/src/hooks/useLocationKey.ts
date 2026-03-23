import { useLocation } from 'react-router-dom';

/**
 * Hook qui retourne une clé basée sur la location actuelle
 * Utile pour forcer le rechargement des composants lors de la navigation
 */
export function useLocationKey(): string {
  const location = useLocation();
  return location.pathname + location.search;
}

