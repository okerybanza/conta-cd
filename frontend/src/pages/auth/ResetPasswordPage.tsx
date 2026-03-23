import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Mail, Lock, AlertCircle, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import brandingService from '../../services/branding.service';

const schema = yup.object({
  password: yup
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .matches(
      /^(?=.*[A-Z])(?=.*[0-9])/,
      'Le mot de passe doit contenir au moins une majuscule et un chiffre'
    )
    .required('Mot de passe requis'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas')
    .required('Confirmation du mot de passe requise'),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('/uploads/logos/logo-color.png');

  // Charger le logo du branding (en arrière-plan, le logo par défaut s'affiche immédiatement)
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const branding = await brandingService.getBranding();
        const newLogoUrl = brandingService.getLogoUrl(branding);
        if (newLogoUrl && newLogoUrl !== logoUrl) {
          setLogoUrl(newLogoUrl);
        }
      } catch (error) {
        // Le logo par défaut est déjà affiché, pas besoin de faire quoi que ce soit
      }
    };
    loadBranding();
  }, []);

  useEffect(() => {
    if (!token) {
      setError('Token de réinitialisation manquant');
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: any) => {
    if (!token) {
      setError('Token de réinitialisation manquant');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await api.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      // Gestion des erreurs réseau/CORS
      if (err.isNetworkError || err.isCorsError || !err.response) {
        const networkMessage = err.isCorsError
          ? 'Erreur de connexion au serveur. Vérifiez que le serveur backend est démarré et accessible.'
          : err.message || 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
        setError(networkMessage);
        console.error('Network/CORS error:', err);
        return;
      }

      // Extraire le message d'erreur
      const responseData = err.response?.data;
      const errorData = responseData?.error || responseData;
      const errorMessage = errorData?.message || responseData?.message || 'Erreur lors de la réinitialisation';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          {/* Success Card */}
          <div className="card">
            {/* Logo */}
            <div className="text-center mb-4">
              <img
                src={logoUrl}
                alt="Conta"
                className="w-40 h-40 mx-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.classList.remove('hidden');
                    fallback.style.display = 'flex';
                  }
                }}
              />
              <div className="inline-flex items-center justify-center w-40 h-40 mx-auto bg-primary rounded-lg hidden">
                <span className="text-white font-medium text-4xl">C</span>
              </div>
            </div>

            <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded flex items-start gap-2">
              <CheckCircle2 className="text-success flex-shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-success flex-1 font-medium">
                Votre mot de passe a été réinitialisé avec succès
              </p>
            </div>

            <p className="text-xs text-text-secondary mb-4 text-center">
              Vous allez être redirigé vers la page de connexion dans quelques secondes...
            </p>

            <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2">
              <span>Aller à la connexion</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Reset Password Card */}
        <div className="card">
          {/* Logo */}
          <div className="text-center mb-4">
            <img
              src={logoUrl}
              alt="Conta"
              className="w-40 h-40 mx-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.classList.remove('hidden');
                  fallback.style.display = 'flex';
                }
              }}
            />
            <div className="inline-flex items-center justify-center w-40 h-40 mx-auto bg-primary rounded-lg hidden">
              <span className="text-white font-medium text-4xl">C</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded flex items-start gap-2">
              <AlertCircle className="text-danger flex-shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-danger flex-1">{error}</p>
            </div>
          )}

          {!token && (
            <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded flex items-start gap-2">
              <AlertTriangle className="text-warning flex-shrink-0 mt-0.5" size={16} />
              <div className="flex-1">
                <p className="text-xs text-warning mb-1">Token de réinitialisation manquant ou invalide.</p>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Demander un nouveau lien
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="password"
                  {...register('password')}
                  className={`input pl-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  autoFocus
                />
              </div>
              {errors.password && (
                <p className="text-danger text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{errors.password.message}</span>
                </p>
              )}
              <p className="text-xs text-text-muted mt-1">
                Au moins 8 caractères, 1 majuscule et 1 chiffre
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-danger text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{errors.confirmPassword.message}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Réinitialisation...</span>
                </>
              ) : (
                <span>Réinitialiser le mot de passe</span>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-4 border-t border-border/30 text-center">
            <Link
              to="/login"
              className="text-xs text-primary hover:underline"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;

