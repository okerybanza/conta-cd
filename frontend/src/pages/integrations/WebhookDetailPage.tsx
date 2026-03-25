import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import webhookService, { Webhook, WebhookLog } from '../../services/webhook.service';
import { useToastContext } from '../../contexts/ToastContext';
import { Edit, Power, TestTube, Trash2, RefreshCw, ExternalLink } from 'lucide-react';

export default function WebhookDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccess, showError } = useToastContext();
  
  const [webhook, setWebhook] = useState<Webhook | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);

  useEffect(() => {
    if (id) loadData();
  }, [id, logsPage]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [webhookData, logsData] = await Promise.all([
        webhookService.getById(id),
        webhookService.getLogs(id, { page: logsPage, limit: 20 }),
      ]);
      setWebhook(webhookData);
      setLogs(logsData.data || []);
    } catch (err: any) {
      showError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!webhook || !id) return;
    try {
      await webhookService.toggle(id, !webhook.isActive);
      showSuccess(`Webhook ${!webhook.isActive ? 'activé' : 'désactivé'}`);
      loadData();
    } catch (err: any) {
      showError('Erreur lors de la modification');
    }
  };

  const handleTest = async () => {
    if (!id) return;
    try {
      const result = await webhookService.test(id);
      if (result.success) {
        showSuccess(`Test réussi (${result.statusCode})`);
        loadData();
      } else {
        showError(`Test échoué: ${result.error}`);
      }
    } catch (err: any) {
      showError('Erreur lors du test');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Supprimer ce webhook ?')) return;
    try {
      await webhookService.delete(id);
      showSuccess('Webhook supprimé');
      navigate('/integrations/webhooks');
    } catch (err: any) {
      showError('Erreur lors de la suppression');
    }
  };

  const handleRetryLog = async (logId: string) => {
    try {
      await webhookService.retryLog(logId);
      showSuccess('Webhook relancé');
      loadData();
    } catch (err: any) {
      showError('Erreur lors du retry');
    }
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Succès
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Échec
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="card p-6">
          <p className="text-center text-text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="p-6">
        <div className="card p-6 text-center">
          <p className="text-text-secondary">Webhook non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{webhook.name}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {webhook.isActive ? '✅ Actif' : '⚠️ Inactif'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggle}
            className="btn-secondary flex items-center gap-2"
          >
            <Power className="w-4 h-4" />
            {webhook.isActive ? 'Désactiver' : 'Activer'}
          </button>
          <button
            onClick={handleTest}
            className="btn-secondary flex items-center gap-2"
          >
            <TestTube className="w-4 h-4" />
            Tester
          </button>
          <button
            onClick={() => navigate(`/integrations/webhooks/${id}/edit`)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={handleDelete}
            className="btn-secondary text-red-600 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Informations */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Informations</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-text-secondary">URL</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm">{webhook.url}</p>
              <a
                href={webhook.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-text-secondary">Événements</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {webhook.events.map(event => (
                <span
                  key={event}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {event}
                </span>
              ))}
            </div>
          </div>

          {webhook.secret && (
            <div>
              <p className="text-sm text-text-secondary">Secret</p>
              <p className="font-mono text-sm">••••••••••••••••</p>
            </div>
          )}

          <div>
            <p className="text-sm text-text-secondary">Tentatives de retry</p>
            <p className="font-medium">{webhook.retryAttempts || 0}</p>
          </div>

          {webhook.lastTriggeredAt && (
            <div>
              <p className="text-sm text-text-secondary">Dernier déclenchement</p>
              <p className="font-medium">
                {new Date(webhook.lastTriggeredAt).toLocaleString('fr-FR')}
              </p>
            </div>
          )}

          {webhook.headers && Object.keys(webhook.headers).length > 0 && (
            <div>
              <p className="text-sm text-text-secondary mb-2">Headers personnalisés</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                {Object.entries(webhook.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="font-mono text-gray-600">{key}:</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Historique des déclenchements</h2>
          <button
            onClick={() => loadData()}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {logs.length === 0 ? (
          <p className="text-center text-text-secondary py-8">
            Aucun déclenchement pour le moment
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {getStatusBadge(log.success)}
                      <span className="text-sm font-medium">{log.event}</span>
                      {log.statusCode && (
                        <span className="text-sm text-gray-600">
                          HTTP {log.statusCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary">
                      {new Date(log.triggeredAt).toLocaleString('fr-FR')} • 
                      Tentative {log.attemptNumber}
                    </p>
                  </div>
                  {!log.success && (
                    <button
                      onClick={() => handleRetryLog(log.id)}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Réessayer
                    </button>
                  )}
                </div>

                {log.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                    {log.error}
                  </div>
                )}

                {log.response && (
                  <details className="mt-2">
                    <summary className="text-sm text-blue-600 cursor-pointer">
                      Voir la réponse
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
