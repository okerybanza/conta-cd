import { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle2, Building2, MapPin, Mail, Phone, Globe, Users, Star, Award } from 'lucide-react';
import accountantService, { AccountantProfile, CreateAccountantProfileData } from '../../services/accountant.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useAuthStore } from '../../store/auth.store';

function AccountantProfilePage() {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToastContext();
  const [profile, setProfile] = useState<AccountantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAccountantProfileData>({
    companyName: '',
    registrationNumber: '',
    specialization: [],
    experienceYears: undefined,
    country: '',
    province: '',
    city: '',
    address: '',
    professionalEmail: '',
    professionalPhone: '',
    website: '',
    isAvailable: true,
    maxCompanies: undefined,
  });
  const [newSpecialization, setNewSpecialization] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const response = await accountantService.getProfile(user.id);
      setProfile(response);
      setFormData({
        companyName: response.companyName || '',
        registrationNumber: response.registrationNumber || '',
        specialization: response.specialization || [],
        experienceYears: response.experienceYears || undefined,
        country: response.country || '',
        province: response.province || '',
        city: response.city || '',
        address: response.address || '',
        professionalEmail: response.professionalEmail || '',
        professionalPhone: response.professionalPhone || '',
        website: response.website || '',
        isAvailable: response.isAvailable,
        maxCompanies: response.maxCompanies || undefined,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      await accountantService.updateProfile(formData);
      showSuccess('Profil mis à jour avec succès');
      loadProfile();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSpecialization = () => {
    if (newSpecialization.trim() && !formData.specialization?.includes(newSpecialization.trim())) {
      setFormData({
        ...formData,
        specialization: [...(formData.specialization || []), newSpecialization.trim()],
      });
      setNewSpecialization('');
    }
  };

  const handleRemoveSpecialization = (spec: string) => {
    setFormData({
      ...formData,
      specialization: formData.specialization?.filter((s) => s !== spec) || [],
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Mon Profil Expert Comptable</h1>
          <p className="text-text-secondary mt-1">
            Gérez votre profil public visible par les entreprises
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Enregistrement...
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" />
              Enregistrer
            </>
          )}
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations professionnelles */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Building2 size={20} />
              Informations Professionnelles
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nom du Cabinet
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Ex: Cabinet Comptable ABC"
                  className="input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Numéro d'enregistrement
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="Ex: REG-12345"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Années d'expérience
                  </label>
                  <input
                    type="number"
                    value={formData.experienceYears || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experienceYears: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="Ex: 10"
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Spécialisations
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialization()}
                    placeholder="Ajouter une spécialisation (ex: TVA, Audit)"
                    className="input flex-1"
                  />
                  <button onClick={handleAddSpecialization} className="btn-secondary">
                    Ajouter
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specialization?.map((spec) => (
                    <span
                      key={spec}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
                    >
                      {spec}
                      <button
                        onClick={() => handleRemoveSpecialization(spec)}
                        className="text-primary hover:text-primary-dark"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Localisation */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Localisation
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Pays</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Ex: RDC"
                  className="input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Province</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Ex: Kinshasa"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Ville</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ex: Kinshasa"
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Adresse</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Adresse complète"
                  className="input w-full"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Contact professionnel */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Mail size={20} />
              Contact Professionnel
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email professionnel
                </label>
                <input
                  type="email"
                  value={formData.professionalEmail}
                  onChange={(e) => setFormData({ ...formData, professionalEmail: e.target.value })}
                  placeholder="contact@cabinet.com"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Téléphone professionnel
                </label>
                <input
                  type="tel"
                  value={formData.professionalPhone}
                  onChange={(e) => setFormData({ ...formData, professionalPhone: e.target.value })}
                  placeholder="+243 XXX XXX XXX"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Site web</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.cabinet.com"
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Disponibilité */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Users size={20} />
              Disponibilité
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="isAvailable" className="text-sm font-medium text-text-primary">
                  Accepter de nouvelles entreprises
                </label>
              </div>
              {formData.isAvailable && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Nombre maximum d'entreprises (laisser vide pour illimité)
                  </label>
                  <input
                    type="number"
                    value={formData.maxCompanies || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxCompanies: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="Ex: 10"
                    className="input w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Statistiques */}
        <div className="space-y-6">
          {profile && (
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Award size={20} />
                Statistiques
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-muted mb-1">Entreprises gérées</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {profile.activeCompaniesCount} / {profile.maxCompanies || '∞'}
                  </p>
                </div>
                {profile.rating && profile.rating > 0 && (
                  <div>
                    <p className="text-sm text-text-muted mb-1">Note moyenne</p>
                    <div className="flex items-center gap-2">
                      <Star className="text-yellow-500 fill-current" size={20} />
                      <p className="text-2xl font-bold text-text-primary">
                        {profile.rating.toFixed(1)} / 5.0
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      {profile.totalReviews} avis
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-text-muted mb-1">Total entreprises gérées</p>
                  <p className="text-xl font-semibold text-text-primary">
                    {profile.totalCompaniesManaged}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Aide */}
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Conseil</h3>
            <p className="text-xs text-blue-700">
              Remplissez votre profil pour être plus visible dans les recherches des entreprises.
              Plus votre profil est complet, plus vous avez de chances d'être contacté.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountantProfilePage;

