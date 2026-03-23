import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Clock,
  Building2,
  Briefcase,
  Calendar,
  Shield,
  Lock,
  Settings,
  FileText,
  Edit,
  Save,
  X,
  Camera,
  Upload,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import userService from '../../services/user.service';
import api from '../../services/api';

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  avatarUrl?: string;
  language?: string;
  timezone?: string;
  department?: string;
}

function UserProfilePage() {
  const navigate = useNavigate();
  const { user: authUser, company, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (authUser) {
        const userData = await userService.getById(authUser.id);
        const profileData: UserProfile = {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          twoFactorEnabled: userData.twoFactorEnabled,
          lastLoginAt: userData.lastLoginAt,
          createdAt: userData.createdAt,
          language: 'fr', // TODO: Récupérer depuis les préférences
          timezone: 'Africa/Kinshasa', // TODO: Récupérer depuis les préférences
        };
        setProfile(profileData);
        setFormData(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData(profile);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (authUser && formData) {
        const updated = await userService.update(authUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        });
        setProfile({
          ...profile!,
          ...updated,
        });
        updateUser(updated);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoClick = () => {
    setShowPhotoModal(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    try {
      const formData = new FormData();
      formData.append('avatar', fileInputRef.current.files[0]);

      const response = await api.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.data?.avatarUrl) {
        setProfile({
          ...profile!,
          avatarUrl: response.data.data.avatarUrl,
        });
        setShowPhotoModal(false);
        setPhotoPreview(null);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erreur lors de l\'upload de la photo');
    }
  };

  const getUserInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    if (profile?.email) {
      return profile.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserName = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return profile?.email || 'Utilisateur';
  };

  const getUserRole = () => {
    if (authUser?.isSuperAdmin) return 'Super Admin';
    if (authUser?.isContaUser) return 'Admin Conta';
    if (authUser?.isAccountant) return 'Expert Comptable';
    if (profile?.role === 'admin') return 'Administrateur';
    if (profile?.role === 'manager') return 'Manager';
    if (profile?.role === 'employee') return 'Employé';
    return 'Utilisateur';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Profil non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFBFC' }}>
      {/* Header avec Bannière */}
      <div
        className="relative h-64"
        style={{
          background: `linear-gradient(135deg, #0D3B66 0%, #1a5a8a 100%)`,
        }}
      >
        {/* Bouton Retour */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
        </div>

        {/* Bouton Paramètres */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors"
          >
            <Settings size={20} className="text-white" />
          </button>
        </div>

        {/* Photo de Profil */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="relative group">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={getUserName()}
                className="w-32 h-32 rounded-full border-4 border-white object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={handlePhotoClick}
              />
            ) : company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={getUserName()}
                className="w-32 h-32 rounded-full border-4 border-white object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={handlePhotoClick}
              />
            ) : (
              <div
                className="w-32 h-32 rounded-full border-4 border-white flex items-center justify-center text-white text-3xl font-bold cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#0D3B66' }}
                onClick={handlePhotoClick}
              >
                {getUserInitials()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu Principal */}
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-8">
        {/* Informations Principales */}
        <div className="bg-white rounded-lg shadow-sm border border-border/30 p-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-text-primary mb-2">{getUserName()}</h1>
            <p className="text-text-secondary mb-2">{getUserRole()} • {company?.name || 'Sans entreprise'}</p>
            <p className="text-sm text-text-muted">{profile.email}</p>
          </div>

          {/* Boutons d'Action */}
          <div className="flex justify-center gap-3">
            {!isEditing ? (
              <>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                >
                  <Edit size={16} />
                  Modifier
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <X size={16} />
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>

        {/* Statistiques Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-border/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">0</p>
                <p className="text-xs text-text-secondary">Factures ce mois</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-border/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">0</p>
                <p className="text-xs text-text-secondary">Clients gérés</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-border/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {profile.lastLoginAt
                    ? new Date(profile.lastLoginAt).toLocaleDateString('fr-FR')
                    : 'Jamais'}
                </p>
                <p className="text-xs text-text-secondary">Dernière connexion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informations Personnelles */}
        <div className="bg-white rounded-lg shadow-sm border border-border/30 p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <User size={20} className="text-primary" />
            Informations Personnelles
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                <Mail size={16} className="inline mr-2" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-border/30 rounded-md bg-gray-50 text-text-secondary"
                />
              ) : (
                <p className="text-text-primary">{profile.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                <User size={16} className="inline mr-2" />
                Prénom
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-border/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-text-primary">{profile.firstName || 'Non renseigné'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                <User size={16} className="inline mr-2" />
                Nom
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-border/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-text-primary">{profile.lastName || 'Non renseigné'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                <Phone size={16} className="inline mr-2" />
                Téléphone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-text-primary">{profile.phone || 'Non renseigné'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Informations Professionnelles */}
        <div className="bg-white rounded-lg shadow-sm border border-border/30 p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-primary" />
            Informations Professionnelles
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                <Building2 size={16} className="inline mr-2" />
                Entreprise
              </label>
              <p className="text-text-primary">{company?.name || 'Sans entreprise'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                <Briefcase size={16} className="inline mr-2" />
                Rôle
              </label>
              <p className="text-text-primary">{getUserRole()}</p>
              <p className="text-xs text-text-muted mt-1">(Géré par l'administrateur)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                <Calendar size={16} className="inline mr-2" />
                Date d'inscription
              </label>
              <p className="text-text-primary">
                {new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Sécurité */}
        <div className="bg-white rounded-lg shadow-sm border border-border/30 p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            Sécurité
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Authentification à deux facteurs</p>
                <p className="text-xs text-text-secondary">
                  {profile.twoFactorEnabled ? 'Activée' : 'Désactivée'}
                </p>
              </div>
              <button
                onClick={() => navigate('/settings/security')}
                className="text-sm text-primary hover:underline"
              >
                {profile.twoFactorEnabled ? 'Désactiver' : 'Activer'}
              </button>
            </div>
            <div>
              <button
                onClick={() => navigate('/settings/security')}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Lock size={16} />
                Changer le mot de passe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Upload Photo */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setShowPhotoModal(false);
            setPhotoPreview(null);
          }}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Modifier la photo de profil
            </h3>
            <div className="mb-4">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-32 h-32 rounded-full mx-auto object-cover"
                />
              ) : (
                <div
                  className="w-32 h-32 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: '#0D3B66' }}
                >
                  {getUserInitials()}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-border/30 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Upload size={16} />
                Choisir une image
              </button>
              {company?.logoUrl && (
                <button
                  onClick={() => {
                    setProfile({ ...profile, avatarUrl: company.logoUrl });
                    setShowPhotoModal(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-border/30 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Building2 size={16} />
                  Logo entreprise
                </button>
              )}
            </div>
            {photoPreview && (
              <button
                onClick={handlePhotoUpload}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                <Check size={16} />
                Enregistrer
              </button>
            )}
            <button
              onClick={() => {
                setShowPhotoModal(false);
                setPhotoPreview(null);
              }}
              className="w-full mt-2 text-sm text-text-secondary hover:text-text-primary"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfilePage;

