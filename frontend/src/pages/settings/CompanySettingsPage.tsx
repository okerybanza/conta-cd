import { useState, useEffect, useRef } from 'react';
import { Building2, Upload, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

export default function CompanySettingsPage() {
  const { company, updateCompany } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', country: '',
    nif: '', rccm: '', def: '',
    currency: 'CDF', timezone: 'Africa/Kinshasa',
    invoicePrefix: 'FAC', quotationPrefix: 'DEV', creditNotePrefix: 'AV',
    defaultTemplateId: '',
    logoUrl: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings/company');
        const d = res.data?.data ?? res.data;
        setForm({
          name: d.name ?? '',
          email: d.email ?? '',
          phone: d.phone ?? '',
          address: d.address ?? '',
          city: d.city ?? '',
          country: d.country ?? 'RDC',
          nif: d.nif ?? '',
          rccm: d.rccm ?? '',
          def: d.def ?? '',
          currency: d.currency ?? 'CDF',
          timezone: d.timezone ?? 'Africa/Kinshasa',
          invoicePrefix: d.invoicePrefix ?? d.invoice_prefix ?? 'FAC',
          quotationPrefix: d.quotationPrefix ?? d.quotation_prefix ?? 'DEV',
          creditNotePrefix: d.creditNotePrefix ?? d.credit_note_prefix ?? 'AV',
          defaultTemplateId: d.defaultTemplateId ?? d.default_template_id ?? '',
          logoUrl: d.logoUrl ?? d.logo_url ?? '',
        });
      } catch { setError('Erreur de chargement des parametres.'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      setSaving(true);
      const res = await api.put('/settings/company', form);
      const updated = res.data?.data ?? res.data;
      updateCompany(updated);
      setSuccess('Parametres enregistres avec succes.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement.');
    } finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('logo', file);
      const res = await api.post('/settings/company/logo/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const logoUrl = res.data?.data?.logoUrl ?? res.data?.logoUrl ?? '';
      setForm(f => ({ ...f, logoUrl }));
      updateCompany({ logoUrl });
      setSuccess('Logo mis a jour.');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Erreur lors de l\'upload du logo.'); }
    finally { setUploading(false); }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg"><Building2 size={22} className="text-blue-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parametres entreprise</h1>
          <p className="text-sm text-gray-500 mt-0.5">Informations et configuration de votre entreprise</p>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle size={16} />{error}</div>}
      {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"><CheckCircle2 size={16} />{success}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Logo</h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 size={28} className="text-gray-300" />
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50">
                <Upload size={15} /> {uploading ? 'Upload...' : 'Changer le logo'}
              </button>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG — max 2MB</p>
            </div>
          </div>
        </div>

        {/* Informations generales */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Informations generales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Nom entreprise *', key: 'name', required: true },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Telephone', key: 'phone' },
              { label: 'Ville', key: 'city' },
              { label: 'Adresse', key: 'address' },
              { label: 'Pays', key: 'country' },
            ].map(({ label, key, type, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type ?? 'text'} value={(form as any)[key]} required={required}
                  onChange={e => set(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Identifiants fiscaux */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Identifiants fiscaux</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'NIF', key: 'nif' },
              { label: 'RCCM', key: 'rccm' },
              { label: 'DEF', key: 'def' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="text" value={(form as any)[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise principale</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                <option value="CDF">CDF — Franc Congolais</option>
                <option value="USD">USD — Dollar americain</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuseau horaire</label>
              <select value={form.timezone} onChange={e => set('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                <option value="Africa/Kinshasa">Africa/Kinshasa (UTC+1)</option>
                <option value="Africa/Lubumbashi">Africa/Lubumbashi (UTC+2)</option>
                <option value="Africa/Brazzaville">Africa/Brazzaville (UTC+1)</option>
                <option value="Africa/Douala">Africa/Douala (UTC+1)</option>
                <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prefixes documents */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Prefixes documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Factures', key: 'invoicePrefix', placeholder: 'FAC' },
              { label: 'Devis', key: 'quotationPrefix', placeholder: 'DEV' },
              { label: 'Avoirs', key: 'creditNotePrefix', placeholder: 'AV' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="text" value={(form as any)[key]} placeholder={placeholder}
                  onChange={e => set(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
            <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
