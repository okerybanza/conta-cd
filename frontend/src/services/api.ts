import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
});

// Intercepteur requête — injection du token JWT depuis localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Gestion des erreurs réseau (CORS, timeout, etc.)
    if (!error.response) {
      // Erreur réseau (pas de réponse du serveur)
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        const corsError = new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet et que le serveur backend est démarré.');
        (corsError as any).isNetworkError = true;
        (corsError as any).isCorsError = error.message?.includes('CORS') || false;
        return Promise.reject(corsError);
      }
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        const timeoutError = new Error('Le serveur met trop de temps à répondre. Veuillez réessayer.');
        (timeoutError as any).isTimeoutError = true;
        return Promise.reject(timeoutError);
      }
    }

    // Gestion des erreurs 429 (Too Many Requests) avec retry automatique
    if (error.response?.status === 429) {
      const config = error.config;
      // Éviter les boucles infinies
      if (!config._retryCount) {
        config._retryCount = 0;
      }
      config._retryCount += 1;

      // Retry jusqu'à 3 fois avec backoff exponentiel
      if (config._retryCount <= 3) {
        const delay = Math.pow(2, config._retryCount - 1) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        return api.request(config);
      }
      // Si tous les retries ont échoué, rejeter avec un message clair
      error.message = 'Trop de requêtes. Veuillez patienter quelques instants.';
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const originalRequest = error.config;

      // Ne pas tenter de refresh sur la route de refresh elle-même
      if (originalRequest?.url && originalRequest.url.includes('/auth/refresh')) {
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Éviter les boucles infinies
      if (!originalRequest._retry401) {
        originalRequest._retry401 = true;
        try {
          // Le refresh repose sur le cookie HttpOnly `refreshToken`
          await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            null,
            { withCredentials: true }
          );
          // Les cookies étant mis à jour côté serveur, on peut rejouer la requête originale
          return api.request(originalRequest);
        } catch {
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }

      window.location.href = '/login';
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api;

