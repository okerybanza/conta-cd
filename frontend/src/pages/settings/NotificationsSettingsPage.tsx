import { useState } from 'react';
import notificationService from '../../services/notification.service';
import { TestEmailData, TestSMSData } from '../../services/notification.service';

function NotificationsSettingsPage() {
  const [emailTest, setEmailTest] = useState<TestEmailData>({
    to: '',
    subject: 'Test Email - Conta',
    message: 'Ceci est un email de test depuis Conta.',
  });
  const [smsTest, setSMSTest] = useState<TestSMSData>({
    to: '',
    message: 'Ceci est un SMS de test depuis Conta.',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await notificationService.testEmail(emailTest);
      setSuccess('Email de test envoyé avec succès !');
      setEmailTest({ to: '', subject: 'Test Email - Conta', message: 'Ceci est un email de test depuis Conta.' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi de l\'email de test');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await notificationService.testSMS(smsTest);
      setSuccess('SMS de test envoyé avec succès !');
      setSMSTest({ to: '', message: 'Ceci est un SMS de test depuis Conta.' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du SMS de test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Paramètres Notifications</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Test Email */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Email</h2>
        <form onSubmit={handleTestEmail}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Destinataire *</label>
              <input
                type="email"
                value={emailTest.to}
                onChange={(e) => setEmailTest({ ...emailTest, to: e.target.value })}
                required
                className="input"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sujet</label>
              <input
                type="text"
                value={emailTest.subject}
                onChange={(e) => setEmailTest({ ...emailTest, subject: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={emailTest.message}
                onChange={(e) => setEmailTest({ ...emailTest, message: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer Email de Test'}
            </button>
          </div>
        </form>
      </div>

      {/* Test SMS */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Test SMS</h2>
        <form onSubmit={handleTestSMS}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Numéro de téléphone *</label>
              <input
                type="tel"
                value={smsTest.to}
                onChange={(e) => setSMSTest({ ...smsTest, to: e.target.value })}
                required
                className="input"
                placeholder="+243XXXXXXXXX"
              />
              <p className="text-xs text-gray-500 mt-1">Format international requis (ex: +243900000000)</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={smsTest.message}
                onChange={(e) => setSMSTest({ ...smsTest, message: e.target.value })}
                className="input"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">{smsTest.message?.length || 0}/160 caractères</p>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer SMS de Test'}
            </button>
          </div>
        </form>
      </div>

      {/* Informations */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <div className="space-y-3 text-sm">
          <p>
            <strong>Email :</strong> Les paramètres SMTP sont configurés dans les variables d'environnement du serveur.
          </p>
          <p>
            <strong>SMS :</strong> Les paramètres Africa's Talking sont configurés dans les variables d'environnement du serveur.
          </p>
          <p className="text-gray-600">
            Contactez votre administrateur pour modifier ces paramètres.
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotificationsSettingsPage;

