import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SortableTable, SortableColumn } from '../../components/shared/SortableTable';
import customerService, { Customer } from '../../services/customer.service';
import { useToastContext } from '../../contexts/ToastContext';
import { Users } from 'lucide-react';

export default function CustomersListPage() {
  const navigate = useNavigate();
  const { showError } = useToastContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.list({ page: 1, limit: 200 });
      setCustomers(response.data || []);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur de chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customer: Customer) => {
    if (customer.type === 'entreprise') {
      return customer.businessName || '-';
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '-';
  };

  const getTypeBadge = (type: string) => {
    return type === 'entreprise' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Entreprise
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        Particulier
      </span>
    );
  };

  const columns: SortableColumn<Customer>[] = [
    {
      key: 'businessName',
      label: 'Nom',
      sortable: true,
      render: (_, customer) => getCustomerName(customer),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => getTypeBadge(value),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => value || '-',
    },
    {
      key: 'phone',
      label: 'Téléphone',
      sortable: false,
      render: (value) => value || '-',
    },
    {
      key: 'city',
      label: 'Ville',
      sortable: true,
      render: (value) => value || '-',
    },
    {
      key: 'country',
      label: 'Pays',
      sortable: true,
      render: (value) => value || 'RDC',
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
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-text-secondary text-sm mt-1">Gérez vos clients</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate('/customers/new')}
        >
          Nouveau client
        </button>
      </div>

      <SortableTable
        data={customers}
        columns={columns}
        keyExtractor={(customer) => customer.id}
        onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
        emptyMessage="Aucun client trouvé"
        emptyIcon={<Users className="w-12 h-12 text-gray-300" />}
      />
    </div>
  );
}
