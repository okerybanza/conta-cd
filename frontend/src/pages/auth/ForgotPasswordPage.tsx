import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Mail, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import brandingService from '../../services/branding.service';

const schema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis'),
});

function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('/uploads/logos/logo-color.png');
  
  // Récupérer l'email depuis les paramètres URL
  const emailFromUrl = searchParams.get('email');

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: emailFromUrl || '',
    },
  });

  // Pré-remplir l'email si présent dans l'URL
  useEffect(() => {
    if (emailFromUrl) {
      setValue('email', emailFromUrl);
    }
  }, [emailFromUrl, setValue]);

  const onSubmit = async (data: any) => {
    try {
      setError(null);
      setIsSubmitting(true);
      await api.post('/auth/forgot-password', { email: data.email });
      setSuccess(true);
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
      const errorMessage = errorData?.message || responseData?.message || 'Erreur lors de l\'envoi de l\'email';
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
              <div className="flex-1">
                <p className="font-medium mb-1 text-xs text-success">Email de réinitialisation envoyé</p>
                <p className="text-xs text-text-secondary">
                  Si l'email existe dans notre système, vous recevrez un lien de réinitialisation dans les prochaines minutes.
                </p>
              </div>
            </div>

            <div className="text-xs text-text-muted mb-4 space-y-1">
              <p>⚠️ Vérifiez votre boîte de réception (et vos spams).</p>
              <p>Le lien est valide pendant 1 heure.</p>
            </div>

            <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2">
              <span>Retour à la connexion</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Forgot Password Card */}
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

          <p className="text-xs text-text-secondary mb-4">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="email"
                  {...register('email')}
                  className={`input pl - 10 ${ errors.email ? 'input-error' : '' } `}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {errors.email && (
                <p className="text-danger text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Envoi...</span>
                </>
              ) : (
                <span>Envoyer le lien</span>
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

export default ForgotPasswordPage;

