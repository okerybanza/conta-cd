/**
 * Configuration de l'API avec détection automatique de l'URL
 */

/**
 * Détecte automatiquement l'URL de l'API selon l'environnement
 */
export function getApiUrl(): string {
  // Détection automatique basée sur l'URL actuelle
  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  const currentProtocol = window.location.protocol; // 'https:' ou 'http:'
  
  // Forcer HTTPS si on est sur HTTPS (éviter Mixed Content)
  const protocol = currentProtocol === 'https:' ? 'https:' : 'http:';

  // 1. Vérifier si VITE_API_URL est défini explicitement
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    // Si on est sur conta.cd en HTTPS, ignorer VITE_API_URL et utiliser le chemin relatif
    // pour éviter d'utiliser l'IP directe qui n'a pas de certificat SSL
    if (currentHost.includes('conta.cd') && currentProtocol === 'https:') {
      return '/api/v1';
    }
    // Si on est sur HTTPS mais que VITE_API_URL utilise HTTP, corriger le protocole
    if (currentProtocol === 'https:' && envApiUrl.startsWith('http://')) {
      // Si l'URL contient une IP directe avec un port, utiliser le chemin relatif à la place
      // car le backend direct n'a pas de certificat SSL
      if (envApiUrl.includes(':3001') || envApiUrl.includes(':3000')) {
        return '/api/v1';
      }
      // Sinon, remplacer http:// par https:// pour éviter Mixed Content
      return envApiUrl.replace('http://', 'https://');
    }
    // Sinon, utiliser l'URL telle quelle
    return envApiUrl;
  }

  // 2. Détection automatique basée sur l'URL actuelle
  // Si on est en développement local
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    // Utiliser le port 3001 pour le backend en développement
    return `${protocol}//${currentHost}:3001/api/v1`;
  }

  // Si on est sur l'IP publique (185.250.37.250)
  if (currentHost === '185.250.37.250' || currentHost.includes('185.250.37.250')) {
    // Utiliser le port 3001 pour le backend avec le même protocole
    return `${protocol}//${currentHost}:3001/api/v1`;
  }

  // Si on est sur conta.cd ou un domaine de production
  if (currentHost.includes('conta.cd') || currentHost.includes('kazurihost')) {
    // Utiliser l'API sur le même domaine avec le chemin /api/v1
    // Toujours utiliser le même protocole que la page actuelle
    return `${protocol}//${currentHost}/api/v1`;
  }

  // Par défaut, utiliser le chemin relatif (sera géré par le proxy nginx)
  // Cela évite les problèmes de Mixed Content car c'est le même domaine
  return '/api/v1';
}

export const API_BASE_URL = getApiUrl();

// Log pour le débogage (uniquement en développement)
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    detectedUrl: API_BASE_URL,
    currentHost: window.location.hostname,
    currentPort: window.location.port,
  });
}
