import { useEffect, useState } from 'react';
import webPushService, { PushNotificationSettings, PushSubscription } from '../../services/webPush.service';
import { useToastContext } from '../../contexts/ToastContext';
import { Bell, BellOff, Smartphone, Trash2, TestTube } from 'lucide-react';

export default function PushNotificationsPage() {
  const { showSuccess, showError } = useToastContext();
  const [settings, setSettings] = useState<PushNotificationSettings | null>(null);
  const [subscriptions, setSubscriptions] = useState<PushSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setIsSupported(webPushService.isSupported());
    setPermission(webPushService.getPermissionStatus());
    if (webPushService.isSupported()) {
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, subscriptionsData] = await Promise.all([
        webPushService.getSettings(),
        webPushService.getSubscriptions(),
      ]);
      setSettings(settingsData);
      setSubscriptions(subscriptionsData);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      await webPushService.subscribe();
      showSuccess('Abonnement aux notifications réussi');
      setPermission('granted');
      loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de l\'abonnement');
    }
  };

  const handleUnsubscribe = async (subscriptionId: string) => {
    if (!confirm('Désabonner cet appareil des notifications ?')) return;
    
    try {
      await webPushService.unsubscribe(subscriptionId);
      showSuccess('Désabonnement réussi');
      loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du désabonnement');
    }
  };

  const handleUpdateSettings = async (key: keyof PushNotificationSettings, value: boolean) => {
    try {
      const updated = await webPushService.updateSettings({ [key]: value });
      setSettings(updated);
      showSuccess('Paramètres mis à jour');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleTest = async () => {
    try {
      await webPushService.testNotification();
      showSuccess('Notification de test envoyée');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du test');
    }
  };

  if (!isSupported) {
    return (
      <div className="p-6">
        <div className="card p-6 text-center">
          <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Notifications push non supportées</h2>
          <p className="text-text-secondary">
            Votre navigateur ne supporte pas les notifications push web.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="card p-6">
          <p className="text-center text-text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications Push</h1>
        <p className="text-text-secondary text-sm mt-1">
          Recevez des notifications même quand l'application est fermée
        </p>
      </div>

      {/* Statut permission */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Statut des notifications</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {permission === 'granted' && '✅ Notifications activées'}
              {permission === 'denied' && '❌ Notifications bloquées'}
              {permission === 'default' && '⚠️ Notifications non configurées'}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              {permission === 'granted' && 'Vous recevez les notifications push'}
              {permission === 'denied' && 'Vous avez bloqué les notifications dans votre navigateur'}
              {permission === 'default' && 'Cliquez sur "Activer" pour recevoir les notifications'}
            </p>
          </div>
          {permission !== 'granted' && (
            <button onClick={handleSubscribe} className="btn-primary flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Activer
            </button>
          )}
          {permission === 'granted' && (
            <button onClick={handleTest} className="btn-secondary flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Tester
            </button>
          )}
        </div>
      </div>

      {/* Paramètres */}
      {settings && permission === 'granted' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Paramètres de notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Notifications activées</p>
                <p className="text-sm text-text-secondary">Activer/désactiver toutes les notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleUpdateSettings('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Nouvelle facture créée</p>
                <p className="text-sm text-text-secondary">Notification lors de la création d'une facture</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.invoiceCreated}
                  onChange={(e) => handleUpdateSettings('invoiceCreated', e.target.checked)}
                  disabled={!settings.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Facture payée</p>
                <p className="text-sm text-text-secondary">Notification quand une facture est payée</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.invoicePaid}
                  onChange={(e) => handleUpdateSettings('invoicePaid', e.target.checked)}
                  disabled={!settings.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Paiement reçu</p>
                <p className="text-sm text-text-secondary">Notification lors de la réception d'un paiement</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.paymentReceived}
                  onChange={(e) => handleUpdateSettings('paymentReceived', e.target.checked)}
                  disabled={!settings.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Dépense approuvée</p>
                <p className="text-sm text-text-secondary">Notification quand une dépense est approuvée</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.expenseApproved}
                  onChange={(e) => handleUpdateSettings('expenseApproved', e.target.checked)}
                  disabled={!settings.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Stock faible</p>
                <p className="text-sm text-text-secondary">Alerte quand un produit atteint le stock minimum</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.lowStock}
                  onChange={(e) => handleUpdateSettings('lowStock', e.target.checked)}
                  disabled={!settings.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Alertes système</p>
                <p className="text-sm text-text-secondary">Notifications importantes du système</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.systemAlerts}
                  onChange={(e) => handleUpdateSettings('systemAlerts', e.target.checked)}
                  disabled={!settings.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Appareils abonnés */}
      {subscriptions.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Appareils abonnés</h2>
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">{sub.deviceName || 'Appareil'}</p>
                    <p className="text-sm text-text-secondary">
                      {sub.browser} • {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('fr-FR') : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnsubscribe(sub.id)}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Désabonner"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
