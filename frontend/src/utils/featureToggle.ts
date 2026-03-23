import packageService from '../services/package.service';
import api from '../services/api';

export type PackageFeature = 
  | 'expenses'
  | 'accounting'
  | 'recurring_invoices'
  | 'api'
  | 'custom_templates'
  | 'multi_currency'
  | 'advanced_reports'
  | 'workflows'
  | 'custom_branding'
  | 'stock'
  | 'hr';

interface User {
  id: string;
  email: string;
  subscription?: {
    packageId: string;
    package?: {
      features?: Partial<Record<PackageFeature, boolean>>;
    };
  };
}

/**
 * Vérifie si un utilisateur a accès à une fonctionnalité
 * Pour l'instant, on fait un appel API pour obtenir les features
 * TODO: Optimiser en mettant les features dans le store après login
 */
export async function hasFeatureAsync(user: User | null, feature: PackageFeature): Promise<boolean> {
  if (!user) return false;
  
  try {
    // Si les features sont déjà dans l'utilisateur, les utiliser
    if (user.subscription?.package?.features) {
      return user.subscription.package.features[feature] === true;
    }

    // Sinon, faire un appel API pour obtenir les features
    const response = await api.get('/subscription/quota-summary');
    const features = response.data.data.features || {};
    return features[feature] === true;
  } catch (error) {
    console.error('Error checking feature:', error);
    return false;
  }
}

/**
 * Vérifie si un utilisateur a accès à une fonctionnalité (synchrone)
 * Utilise les features déjà chargées dans l'utilisateur
 */
export function hasFeature(user: User | null, feature: PackageFeature): boolean {
  if (!user) return false;
  
  // Si les features sont dans l'utilisateur, les utiliser
  if (user.subscription?.package?.features) {
    return user.subscription.package.features[feature] === true;
  }

  // ⚠️ IMPORTANT :
  // Dans l'état actuel, les features ne sont pas encore injectées dans l'utilisateur au login.
  // Si on retourne false ici, on bloque l'UI alors que le backend autorise déjà
  // l'accès via requireFeature('accounting') / autres.
  //
  // Stratégie : si on ne peut pas vérifier côté frontend, on ne bloque PAS.
  // Le backend reste la source de vérité et refusera si le package ne possède pas la feature.
  return true;
}

