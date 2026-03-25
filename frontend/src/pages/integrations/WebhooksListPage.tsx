import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SortableTable, SortableColumn } from '../../components/shared/SortableTable';
import webhookService, { Webhook } from '../../services/webhook.service';
import { useToastContext } from '../../contexts/ToastContext';
import { Webhook as WebhookIcon, Plus, Power, TestTube, Trash2 } from 'lucide-react';

export default function WebhooksListPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await webhookService.list({ page: 1, limit: 100 });
      setWebhooks(response.data || []);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur de chargement des webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (webhook: Webhook, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await webhookService.toggle(webhook.id, !webhook.isActive);
      showSuccess(`Webhook ${!webhook.isActive ? 'activé' : 'désactivé'}`);
      loadWebhooks();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleTest = async (webhook: Webhook, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await webhookService.test(webhook.id);
      if (result.success) {
        showSuccess(`Test réussi (${result.statusCode})`);
      } else {
        showError(`Test échoué: ${result.error}`);
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du test');
    }
  };

  const handleDelete = async (webhook: Webhook, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Supprimer le webhook "${webhook.name}" ?`)) return;
    
    try {
      await webhookService.delete(webhook.id);
      showSuccess('Webhook supprimé');
      loadWebhooks();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const columns: SortableColumn<Webhook>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
    },
    {
      key: 'url',
      label: 'URL',
      sortable: false,
      render: (value) => (
        <span className="text-sm text-gray-600 truncate max-w-xs block">{value}</span>
      ),
    },
    {
      key: 'events',
      label: 'Événements',
      sortable: false,
      render: (value: string[]) => (
        <span className="text-sm">{value.length} événement(s)</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Statut',
      sortable: true,
      render: (value) =>
        value ? (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Actif
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Inactif
          </span>
        ),
    },
    {
      key: 'lastTriggeredAt',
      label: 'Dernier déclenchement',
      sortable: true,
      render: (value) =>
        value ? new Date(value).toLocaleString('fr-FR') : 'Jamais',
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, webhook) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => handleToggle(webhook, e)}
            className="p-1 hover:bg-gray-100 rounded"
            title={webhook.isActive ? 'Désactiver' : 'Activer'}
          >
            <Power className={`w-4 h-4 ${webhook.isActive ? 'text-green-600' : 'text-gray-400'}`} />
          </button>
          <button
            onClick={(e) => handleTest(webhook, e)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Tester"
          >
            <TestTube className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={(e) => handleDelete(webhook, e)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ),
    },
  ];

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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-text-secondary text-sm mt-1">
            Intégrez Conta avec vos outils externes (Zapier, Make, etc.)
          </p>
        </div>
        <button
          type="button"
          className="btn-primary flex items-center gap-2"
          onClick={() => navigate('/integrations/webhooks/new')}
        >
          <Plus className="w-4 h-4" />
          Nouveau webhook
        </button>
      </div>

      <SortableTable
        data={webhooks}
        columns={columns}
        keyExtractor={(webhook) => webhook.id}
        onRowClick={(webhook) => navigate(`/integrations/webhooks/${webhook.id}`)}
        emptyMessage="Aucun webhook configuré"
        emptyIcon={<WebhookIcon className="w-12 h-12 text-gray-300" />}
      />
    </div>
  );
}
