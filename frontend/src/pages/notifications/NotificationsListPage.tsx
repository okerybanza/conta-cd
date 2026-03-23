import { useState, useEffect } from 'react';
import notificationService, { Notification, NotificationFilters } from '../../services/notification.service';

function NotificationsListPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [typeFilter, setTypeFilter] = useState<'email' | 'sms' | ''>('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadNotifications();
  }, [filters]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.list(filters);
      setNotifications(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setFilters({
      ...filters,
      type: typeFilter || undefined,
      status: (statusFilter === 'pending' || statusFilter === 'delivered' || statusFilter === 'failed') ? statusFilter : undefined,
      page: 1,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      delivered: { label: 'Livré', className: 'bg-green-100 text-green-800' },
      failed: { label: 'Échec', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded text-sm ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Historique des Notifications</h1>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="input"
            >
              <option value="">Tous</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="delivered">Livré</option>
              <option value="failed">Échec</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleFilter} className="btn-primary w-full">
              Filtrer
            </button>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tableau */}
      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucune notification trouvée
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Destinataire</th>
                  <th className="text-left p-3">Sujet</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-left p-3">Livré le</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{formatDate(notification.createdAt)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-sm ${
                        notification.type === 'email'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {notification.type === 'email' ? 'Email' : 'SMS'}
                      </span>
                    </td>
                    <td className="p-3">{notification.recipient}</td>
                    <td className="p-3">
                      {notification.subject || (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3">{getStatusBadge(notification.status)}</td>
                    <td className="p-3">
                      {notification.deliveredAt
                        ? formatDate(notification.deliveredAt)
                        : notification.status === 'failed'
                        ? (
                            <span className="text-red-600 text-sm">
                              {notification.errorMessage || 'Erreur'}
                            </span>
                          )
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Page {pagination.page} sur {pagination.totalPages} ({pagination.total} notifications)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="btn-secondary disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NotificationsListPage;

