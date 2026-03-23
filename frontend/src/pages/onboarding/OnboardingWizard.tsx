import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Building2, BookOpen, FileText, ArrowRight, ArrowLeft } from 'lucide-react';

type CompanyField = 'name' | 'phone' | 'address' | 'rccm' | 'nif';
type CompanyData = Record<CompanyField, string>;

const STEPS = [
  { id: 1, title: 'Votre entreprise', icon: Building2, desc: 'Informations de base' },
  { id: 2, title: 'Plan comptable', icon: BookOpen, desc: 'Configuration SYSCOHADA' },
  { id: 3, title: 'Première facture', icon: FileText, desc: 'Testez le système' },
  { id: 4, title: 'Terminé !', icon: CheckCircle, desc: 'Vous êtes prêt' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<CompanyData>({
    name: '',
    phone: '',
    address: '',
    rccm: '',
    nif: '',
  });

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  const handleCompanySave = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(company),
      });
      setStep(2);
    } catch (e) {
      setStep(2); // continuer même si erreur
    } finally {
      setLoading(false);
    }
  };

  const handleAccountsInit = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/accounts/initialize', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {}
    setLoading(false);
    setStep(3);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a3a5c' }}>Bienvenue sur Conta.cd</div>
          <div style={{ color: '#666', marginTop: '8px' }}>Configurez votre espace en 3 étapes simples</div>
        </div>

        {/* Progress bar */}
        <div style={{ background: '#dde4f0', borderRadius: '99px', height: '6px', marginBottom: '32px' }}>
          <div style={{ background: '#1a3a5c', height: '6px', borderRadius: '99px', width: `${progress}%`, transition: 'width 0.4s' }} />
        </div>

        {/* Steps indicators */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          {STEPS.map(s => (
            <div key={s.id} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 6px',
                background: step >= s.id ? '#1a3a5c' : '#dde4f0',
                color: step >= s.id ? 'white' : '#999',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px'
              }}>{step > s.id ? '✓' : s.id}</div>
              <div style={{ fontSize: '11px', color: step >= s.id ? '#1a3a5c' : '#999', fontWeight: step === s.id ? 'bold' : 'normal' }}>{s.title}</div>
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

          {/* Étape 1 — Entreprise */}
          {step === 1 && (
            <div>
              <h2 style={{ color: '#1a3a5c', marginBottom: '24px' }}>🏢 Informations de votre entreprise</h2>
              {[
                { key: 'name' as const, label: 'Nom de l\'entreprise *', placeholder: 'Ex: SARL MonEntreprise' },
                { key: 'phone' as const, label: 'Téléphone', placeholder: '+243 xxx xxx xxx' },
                { key: 'address' as const, label: 'Adresse', placeholder: 'Kinshasa, RDC' },
                { key: 'rccm' as const, label: 'RCCM', placeholder: 'CD/KIN/RCCM/...' },
                { key: 'nif' as const, label: 'NIF', placeholder: 'Numéro d\'identification fiscale' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#333' }}>{f.label}</label>
                  <input
                    value={company[f.key]}
                    onChange={e => setCompany({ ...company, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <button
                onClick={handleCompanySave}
                disabled={!company.name || loading}
                style={{ width: '100%', padding: '12px', background: company.name ? '#1a3a5c' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: company.name ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? 'Enregistrement...' : 'Continuer'} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Étape 2 — Plan comptable */}
          {step === 2 && (
            <div>
              <h2 style={{ color: '#1a3a5c', marginBottom: '16px' }}>📚 Plan comptable SYSCOHADA</h2>
              <p style={{ color: '#555', marginBottom: '24px', lineHeight: '1.6' }}>
                Conta.cd utilise le plan comptable <strong>SYSCOHADA Révisé</strong> — la norme officielle pour la RDC et l'Afrique Centrale. 
                Nous allons initialiser automatiquement vos comptes selon cette norme.
              </p>
              <div style={{ background: '#f0f4ff', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                {['Classe 1 — Comptes de capitaux', 'Classe 2 — Comptes d\'immobilisations', 'Classe 3 — Comptes de stocks', 'Classe 4 — Comptes de tiers', 'Classe 5 — Comptes de trésorerie', 'Classe 6 — Comptes de charges', 'Classe 7 — Comptes de produits'].map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '13px', color: '#1a3a5c' }}>
                    <span style={{ color: '#27ae60' }}>✓</span> {c}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Retour
                </button>
                <button onClick={handleAccountsInit} disabled={loading} style={{ flex: 2, padding: '12px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loading ? 'Initialisation...' : 'Initialiser le plan comptable'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 — Première facture */}
          {step === 3 && (
            <div>
              <h2 style={{ color: '#1a3a5c', marginBottom: '16px' }}>📄 Créez votre première facture</h2>
              <p style={{ color: '#555', marginBottom: '24px', lineHeight: '1.6' }}>
                Vous êtes prêt ! Créez votre première facture pour découvrir toutes les fonctionnalités de Conta.cd.
              </p>
              <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧾</div>
                <div style={{ color: '#555', fontSize: '14px' }}>Numérotation automatique, calcul TVA, export PDF, envoi par email...</div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(4)} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
                  Passer cette étape
                </button>
                <button onClick={() => { setStep(4); setTimeout(() => navigate('/invoices/new'), 1000); }} style={{ flex: 2, padding: '12px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Créer une facture <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Étape 4 — Terminé */}
          {step === 4 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ color: '#1a3a5c', marginBottom: '12px' }}>Votre espace est prêt !</h2>
              <p style={{ color: '#555', marginBottom: '32px', lineHeight: '1.6' }}>
                Bienvenue dans Conta.cd. Votre espace comptable est configuré et prêt à l'emploi.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                style={{ padding: '14px 32px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Accéder au tableau de bord →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
