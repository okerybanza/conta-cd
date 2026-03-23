import { ReactNode, useState, useEffect } from 'react';
import { PackageFeature } from '../utils/featureToggle';
import { useAuthStore } from '../store/auth.store';
import quotaService from '../services/quota.service';

interface FeatureLockOverlayProps {
  feature: PackageFeature;
  children: ReactNode;
}

export function FeatureLockOverlay({ 
  feature, 
  children
}: FeatureLockOverlayProps) {
  const { user } = useAuthStore();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Vérifier l'accès de manière asynchrone via le service quota
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      
      try {
        // Utiliser le service quota pour vérifier les features
        const summary = await quotaService.getQuotaSummary();
        const featureAccess = summary.features[feature] || false;
        setHasAccess(featureAccess);
      } catch (error) {
        console.error('Error checking feature access:', error);
        // En cas d'erreur, permettre l'accès (le backend bloquera si nécessaire)
        setHasAccess(true);
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [user, feature]);
  
  // Pendant le chargement, afficher le contenu (pour éviter le flash)
  if (loading) {
    return <>{children}</>;
  }
  
  // Si l'utilisateur a accès, afficher le contenu normalement
  if (hasAccess) {
    return <>{children}</>;
  }

  // Si pas d'accès, ne rien afficher (cacher complètement)
  return null;
}

