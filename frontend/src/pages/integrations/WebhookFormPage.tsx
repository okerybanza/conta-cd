import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import webhookService, { WebhookEvent, CreateWebhookData } from '../../services/webhook.service';
import { useToastContext } from '../../contexts/ToastContext';
import { RefreshCw } from 'lucide-react';

export default function WebhookFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccess, showError } = useToastContext();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [retryAttempts, setRetryAttempts] = useState(3);
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([]);
  const [availableEvents, setAvailableEvents] = useState<{ event: WebhookEvent; description: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableEvents();
    if (id) loadWebhook();
  }, [id]);

  const loadAvailableEvents = async () => {
    try {
      const events = await webhookService.getAvailableEvents();
      setAvailableEvents(events);
    } catch (err: any) {
      showError('Erreur de chargement des événements');
    }
  };

  const loadWebhook = async () => {
    if (!id) return;
    try {
      const webhook = await webhookService.getById(id);
      setName(webhook.name);
      setUrl(webhook.url);
      setSecret(webhook.secret || '');
      setRetryAttempts(webhook.retryAttempts || 3);
      setSelectedEvents(webhook.events);
      if (webhook.headers) {
        setHeaders(Object.entries(webhook.headers).map(([key, value]) => ({ key, value })));
      }
    } catch (err: any) {
      showError('Erreur de chargement du webhook');
    }
  };

  const handleGenerateSecret = async () => {
    try {
      const result = await webhookService.generateSecret();
      setSecret(result.secret);
      showSuccess('Secret généré');
    } catch (err: any) {
      showError('Erreur lors de la génération du secret');
    }
  };

  const handleToggleEvent = (event: WebhookEvent) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter(e => e !== event));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedEvents.length === 0) {
      showError('Sélectionnez au moins un événement');
      return;
    }

    try {
      setLoading(true);
      
      const headersObj: Record<string, string> = {};
      headers.forEach(h => {
        if (h.key && h.value) {
          headersObj[h.key] = h.value;
        }
      });

      const payload: CreateWebhookData = {
        name,
        url,
        events: selectedEvents,
        secret: secret || undefined,
        headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
        retryAttempts,
      };

      if (isEdit && id) {
        await webhookService.update(id, payload);
        showSuccess('Webhook mis à jour');
      } else {
        await webhookService.create(payload);
        showSuccess('Webhook créé');
      }
      navigate('/integrations/webhooks');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <form className="card p-6 space-y-6 max-w-3xl" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold">
          {isEdit ? 'Modifier webhook' : 'Nouveau webhook'}
        </h1>

        {/* Informations de base */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Informations de base</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon webhook Zapier"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL *</label>
            <input
              className="input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              required
            />
            <p className="text-xs text-text-secondary mt-1">
              URL HTTPS où les événements seront envoyés
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Secret (optionnel)</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Secret pour signer les requêtes"
              />
              <button
                type="button"
                onClick={handleGenerateSecret}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Générer
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Utilisé pour signer les requêtes (header X-Webhook-Signature)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tentatives de retry</label>
            <input
              className="input"
              type="number"
              min={0}
              max={10}
              value={retryAttempts}
              onChange={(e) => setRetryAttempts(Number(e.target.value))}
            />
            <p className="text-xs text-text-secondary mt-1">
              Nombre de tentatives en cas d'échec (0-10)
            </p>
          </div>
        </div>

        {/* Événements */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Événements *</h2>
          <p className="text-sm text-text-secondary">
            Sélectionnez les événements qui déclencheront ce webhook
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableEvents.map(({ event, description }) => (
              <label
                key={event}
                className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedEvents.includes(event)}
                  onChange={() => handleToggleEvent(event)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-sm">{event}</p>
                  <p className="text-xs text-text-secondary">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Headers personnalisés */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Headers personnalisés (optionnel)</h2>
            <button
              type="button"
              onClick={handleAddHeader}
              className="btn-secondary text-sm"
            >
              Ajouter header
            </button>
          </div>
          
          {headers.length > 0 && (
            <div className="space-y-2">
              {headers.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Nom du header"
                    value={header.key}
                    onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                  />
                  <input
                    className="input flex-1"
                    placeholder="Valeur"
                    value={header.value}
                    onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHeader(index)}
                    className="btn-secondary"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/integrations/webhooks')}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
