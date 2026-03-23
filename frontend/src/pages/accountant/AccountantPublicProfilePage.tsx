/**
 * Page de profil public d'un expert comptable
 * Style LinkedIn - Affichage pour les entreprises qui cherchent un expert
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Users,
  Star,
  Award,
  Calendar,
  Briefcase,
  Send,
  ArrowLeft,
  CheckCircle2,
  FileText,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import accountantService, { Accountant } from '../../services/accountant.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

function AccountantPublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [accountant, setAccountant] = useState<Accountant | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!id) {
        setError('ID expert comptable manquant');
        return;
      }
      // Utiliser la route GET /accountants/:id pour obtenir le profil public
      const response = await accountantService.getPublicProfile(id);
      if (response.success && response.data) {
        setAccountant(response.data);
      } else {
        setError('Expert comptable non trouvé');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
      showError(err.response?.data?.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!accountant) return;

    const confirmed = await confirm.confirm({
      title: 'Inviter cet expert comptable',
      message: `Voulez-vous envoyer une invitation à ${accountant.companyName || accountant.user?.name || 'cet expert'} pour gérer votre comptabilité ?`,
      variant: 'info',
      confirmText: 'Inviter',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      setInviting(true);
      await accountantService.invite({ accountantId: accountant.id });
      showSuccess('Invitation envoyée avec succès !');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation';
      showError(errorMessage);
    } finally {
      setInviting(false);
    }
  };

  const getFullName = (accountant: Accountant) => {
    if (accountant.user?.name) {
      return accountant.user.name;
    }
    if (accountant.email) {
      return accountant.email.split('@')[0];
    }
    return 'Expert Comptable';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !accountant) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>{error || 'Expert comptable non trouvé'}</span>
        </div>
        <button onClick={() => navigate('/settings/accountants/search')} className="btn-secondary mt-4">
          <ArrowLeft size={18} className="mr-2" />
          Retour à la recherche
        </button>
      </div>
    );
  }

  const fullName = getFullName(accountant);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/settings/accountants/search')}
          className="btn-ghost flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Retour</span>
        </button>
      </div>

      {/* Bannière de profil (style LinkedIn) */}
      <div className="card p-0 overflow-hidden">
        {/* Bannière */}
        <div className="h-48 bg-gradient-to-r from-primary to-primary-dark relative">
          {/* Photo de profil ou logo du cabinet */}
          <div className="absolute bottom-0 left-8 transform translate-y-1/2">
            <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <Building2 className="text-primary" size={48} />
            </div>
          </div>
        </div>

        {/* Informations principales */}
        <div className="pt-20 px-8 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {accountant.companyName || fullName}
              </h1>
              {accountant.companyName && (
                <p className="text-lg text-text-secondary mb-4">{fullName}</p>
              )}
              
              {/* Badge Expert Comptable */}
              <div className="flex items-center gap-2 mb-4">
                <Award className="text-primary" size={20} />
                <span className="text-sm font-medium text-text-primary">Expert Comptable Certifié</span>
                {accountant.registrationNumber && (
                  <span className="text-sm text-text-secondary">
                    • {accountant.registrationNumber}
                  </span>
                )}
              </div>

              {/* Localisation */}
              {(accountant.city || accountant.province || accountant.country) && (
                <div className="flex items-center gap-2 text-text-secondary mb-4">
                  <MapPin size={18} />
                  <span>
                    {accountant.city && `${accountant.city}`}
                    {accountant.province && `, ${accountant.province}`}
                    {accountant.country && `, ${accountant.country}`}
                  </span>
                </div>
              )}

              {/* Statistiques rapides */}
              <div className="flex items-center gap-6 mt-4">
                {accountant.totalCompanies !== undefined && (
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-text-muted" />
                    <span className="text-sm text-text-secondary">
                      {accountant.totalCompanies} entreprise{accountant.totalCompanies > 1 ? 's' : ''} gérée{accountant.totalCompanies > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {accountant.experienceYears && (
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-text-muted" />
                    <span className="text-sm text-text-secondary">
                      {accountant.experienceYears} an{accountant.experienceYears > 1 ? 's' : ''} d'expérience
                    </span>
                  </div>
                )}
                {accountant.rating && accountant.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-text-primary">
                      {accountant.rating.toFixed(1)} / 5.0
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton d'action principal */}
            <div className="flex items-center gap-3">
              {accountant.isAvailable ? (
                <button
                  onClick={handleInvite}
                  disabled={inviting}
                  className="btn-primary flex items-center gap-2"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Envoi...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Inviter</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} />
                  <span>Non disponible</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal - 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* À propos */}
          {(accountant as any).bio && (
            <div className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4">À propos</h2>
              <p className="text-text-secondary whitespace-pre-line">{(accountant as any).bio}</p>
            </div>
          )}

          {/* Spécialisations */}
          {accountant.specialization && accountant.specialization.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Briefcase size={20} />
                Spécialisations
              </h2>
              <div className="flex flex-wrap gap-2">
                {accountant.specialization.map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Expérience */}
          {accountant.experienceYears && (
            <div className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                Expérience
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="text-primary" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">
                      Expert Comptable
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {accountant.companyName || fullName}
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      {accountant.experienceYears} an{accountant.experienceYears > 1 ? 's' : ''} d'expérience
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Certifications */}
          {(accountant as any).certifications && (accountant as any).certifications.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Award size={20} />
                Certifications
              </h2>
              <div className="space-y-3">
                {((accountant as any).certifications as string[]).map((cert, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-medium text-text-primary">{cert}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations de contact */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Contact</h3>
            <div className="space-y-3">
              {accountant.email && (
                <div className="flex items-center gap-3">
                  <Mail className="text-text-muted flex-shrink-0" size={18} />
                  <a
                    href={`mailto:${accountant.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {accountant.email}
                  </a>
                </div>
              )}
              {accountant.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="text-text-muted flex-shrink-0" size={18} />
                  <a
                    href={`tel:${accountant.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {accountant.phone}
                  </a>
                </div>
              )}
              {accountant.website && (
                <div className="flex items-center gap-3">
                  <Globe className="text-text-muted flex-shrink-0" size={18} />
                  <a
                    href={accountant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Site web
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Statistiques</h3>
            <div className="space-y-4">
              {accountant.totalCompanies !== undefined && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Entreprises actives</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {accountant.totalCompanies}
                  </p>
                </div>
              )}
              {accountant.rating && accountant.rating > 0 && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Note moyenne</p>
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-500 fill-current" size={20} />
                    <p className="text-2xl font-bold text-text-primary">
                      {accountant.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Disponibilité */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Disponibilité</h3>
            <div className="space-y-2">
              {accountant.isAvailable ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-medium">Accepte de nouvelles entreprises</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">Non disponible pour le moment</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={confirm.handleCancel}
        onConfirm={confirm.handleConfirm}
        title={confirm.options.title ?? 'Confirmation'}
        message={confirm.options.message}
        confirmText={confirm.options.confirmText}
        cancelText={confirm.options.cancelText}
        variant={confirm.options.variant}
        requireJustification={confirm.options.requireJustification}
        justificationPlaceholder={confirm.options.justificationPlaceholder}
      />
    </div>
  );
}

export default AccountantPublicProfilePage;
