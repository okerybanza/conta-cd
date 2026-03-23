import { useState, useEffect } from 'react';
import { Palette, Upload, Image, RotateCcw, Save, Loader2 } from 'lucide-react';
import brandingService, { PlatformBranding } from '../../services/branding.service';
import api from '../../services/api';
import { useToastContext } from '../../contexts/ToastContext';

function AdminBrandingPage() {
  const { showSuccess, showError } = useToastContext();
  const [branding, setBranding] = useState<PlatformBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<PlatformBranding>>({});

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      setLoading(true);
      const data = await brandingService.getBranding();
      setBranding(data);
      setFormData({
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        emailLogoUrl: data.emailLogoUrl,
        pdfLogoUrl: data.pdfLogoUrl,
        primaryColor: data.primaryColor || '#0D3B66',
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        backgroundColor: data.backgroundColor || '#FFFFFF',
        primaryFont: data.primaryFont || 'Arial, sans-serif',
        secondaryFont: data.secondaryFont,
        theme: data.theme || 'light',
      });
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du chargement du branding');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon' | 'emailLogo' | 'pdfLogo') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/branding/upload/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const url = response.data.data.url;
      
      // Mettre à jour le formData avec la nouvelle URL
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logoUrl: url }));
      } else if (type === 'favicon') {
        setFormData(prev => ({ ...prev, faviconUrl: url }));
      } else if (type === 'emailLogo') {
        setFormData(prev => ({ ...prev, emailLogoUrl: url }));
      } else if (type === 'pdfLogo') {
        setFormData(prev => ({ ...prev, pdfLogoUrl: url }));
      }

      showSuccess(`${type === 'logo' ? 'Logo' : type === 'favicon' ? 'Favicon' : type === 'emailLogo' ? 'Logo email' : 'Logo PDF'} uploadé avec succès`);
    } catch (err: any) {
      showError(err.response?.data?.message || `Erreur lors de l'upload du ${type}`);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await brandingService.updateBranding(formData);
      setBranding(updated);
      brandingService.invalidateCache();
      showSuccess('Branding mis à jour avec succès');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser le branding aux valeurs par défaut ?')) {
      return;
    }

    try {
      setSaving(true);
      const reset = await brandingService.resetBranding();
      setBranding(reset);
      setFormData({
        logoUrl: reset.logoUrl,
        faviconUrl: reset.faviconUrl,
        emailLogoUrl: reset.emailLogoUrl,
        pdfLogoUrl: reset.pdfLogoUrl,
        primaryColor: reset.primaryColor || '#0D3B66',
        secondaryColor: reset.secondaryColor,
        accentColor: reset.accentColor,
        backgroundColor: reset.backgroundColor || '#FFFFFF',
        primaryFont: reset.primaryFont || 'Arial, sans-serif',
        secondaryFont: reset.secondaryFont,
        theme: reset.theme || 'light',
      });
      brandingService.invalidateCache();
      showSuccess('Branding réinitialisé aux valeurs par défaut');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la réinitialisation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Image de design - Branding Info */}
      <div className="mb-8 bg-white rounded-lg shadow-lg overflow-hidden">
        <img 
          src="/images/design/banding info.jpeg" 
          alt="Informations sur le Branding Conta" 
          className="w-full h-auto"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="w-8 h-8" />
            Configuration du Branding
          </h1>
          <p className="text-gray-600 mt-2">Gérez le branding de la plateforme Conta</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Enregistrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logos
          </h2>

          {/* Logo Principal */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Principal
            </label>
            <div className="flex items-center gap-4">
              {formData.logoUrl && (
                <img
                  src={formData.logoUrl.startsWith('http') ? formData.logoUrl : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''}${formData.logoUrl}`}
                  alt="Logo"
                  className="w-24 h-24 object-contain border rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo-color.png';
                  }}
                />
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'logo');
                  }}
                />
                <div className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {formData.logoUrl ? 'Changer' : 'Uploader'}
                </div>
              </label>
            </div>
            <input
              type="text"
              value={formData.logoUrl || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="/uploads/logos/logo-color.png"
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Logo Email */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Email
            </label>
            <div className="flex items-center gap-4">
              {formData.emailLogoUrl && (
                <img
                  src={formData.emailLogoUrl.startsWith('http') ? formData.emailLogoUrl : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''}${formData.emailLogoUrl}`}
                  alt="Logo Email"
                  className="w-24 h-24 object-contain border rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo-color.png';
                  }}
                />
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'emailLogo');
                  }}
                />
                <div className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {formData.emailLogoUrl ? 'Changer' : 'Uploader'}
                </div>
              </label>
            </div>
            <input
              type="text"
              value={formData.emailLogoUrl || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, emailLogoUrl: e.target.value }))}
              placeholder="/uploads/logos/logo-color.png"
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Logo PDF */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo PDF
            </label>
            <div className="flex items-center gap-4">
              {formData.pdfLogoUrl && (
                <img
                  src={formData.pdfLogoUrl.startsWith('http') ? formData.pdfLogoUrl : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''}${formData.pdfLogoUrl}`}
                  alt="Logo PDF"
                  className="w-24 h-24 object-contain border rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo-color.png';
                  }}
                />
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'pdfLogo');
                  }}
                />
                <div className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {formData.pdfLogoUrl ? 'Changer' : 'Uploader'}
                </div>
              </label>
            </div>
            <input
              type="text"
              value={formData.pdfLogoUrl || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, pdfLogoUrl: e.target.value }))}
              placeholder="/uploads/logos/logo-color.png"
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Favicon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favicon
            </label>
            <div className="flex items-center gap-4">
              {formData.faviconUrl && (
                <img
                  src={formData.faviconUrl.startsWith('http') ? formData.faviconUrl : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''}${formData.faviconUrl}`}
                  alt="Favicon"
                  className="w-16 h-16 object-contain border rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/favicon.ico';
                  }}
                />
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'favicon');
                  }}
                />
                <div className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {formData.faviconUrl ? 'Changer' : 'Uploader'}
                </div>
              </label>
            </div>
            <input
              type="text"
              value={formData.faviconUrl || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, faviconUrl: e.target.value }))}
              placeholder="/uploads/logos/icon-color.png"
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Couleurs et Polices */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Couleurs et Polices
          </h2>

          {/* Couleur Primaire */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur Primaire
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primaryColor || '#0D3B66'}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor || '#0D3B66'}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="#0D3B66"
              />
            </div>
          </div>

          {/* Couleur Secondaire */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur Secondaire
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.secondaryColor || '#1FAB89'}
                onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value || null }))}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondaryColor || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value || null }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="#1FAB89 (optionnel)"
              />
            </div>
          </div>

          {/* Couleur Accent */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur Accent
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.accentColor || '#FFC107'}
                onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value || null }))}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.accentColor || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value || null }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="#FFC107 (optionnel)"
              />
            </div>
          </div>

          {/* Couleur de Fond */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur de Fond
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.backgroundColor || '#FFFFFF'}
                onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.backgroundColor || '#FFFFFF'}
                onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="#FFFFFF"
              />
            </div>
          </div>

          {/* Police Primaire */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Police Primaire
            </label>
            <input
              type="text"
              value={formData.primaryFont || 'Arial, sans-serif'}
              onChange={(e) => setFormData(prev => ({ ...prev, primaryFont: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Arial, sans-serif"
            />
          </div>

          {/* Police Secondaire */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Police Secondaire
            </label>
            <input
              type="text"
              value={formData.secondaryFont || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, secondaryFont: e.target.value || null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Georgia, serif (optionnel)"
            />
          </div>

          {/* Thème */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thème
            </label>
            <select
              value={formData.theme || 'light'}
              onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' | 'auto' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
              <option value="auto">Automatique</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminBrandingPage;
