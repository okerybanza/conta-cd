import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { User, Briefcase, Calendar, DollarSign, FileText, Clock, ArrowLeft, Edit, AlertCircle } from 'lucide-react';
import employeeService, { Employee } from '../../services/employee.service';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-600',
  terminated: 'bg-red-100 text-red-700', on_leave: 'bg-yellow-100 text-yellow-700',
};

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [recentAttendances, setRecentAttendances] = useState<any[]>([]);
  const [recentPayrolls, setRecentPayrolls] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const [empData, attRes, payRes, docRes] = await Promise.all([
          employeeService.getById(id),
          api.get(`/hr/attendance?employeeId=${id}&limit=5&sortBy=date&sortOrder=desc`),
          api.get(`/hr/payroll?employeeId=${id}&limit=5&sortBy=createdAt&sortOrder=desc`),
          api.get(`/hr/employee-documents?employeeId=${id}&limit=5`),
        ]);
        setEmployee(empData);
        setRecentAttendances(attRes.data?.data?.attendances ?? attRes.data?.data ?? []);
        setRecentPayrolls(payRes.data?.data?.payrolls ?? payRes.data?.data ?? []);
        setDocuments(docRes.data?.data?.documents ?? docRes.data?.data ?? []);

        // Load contract and leave balances separately (may fail)
        try {
          const contractRes = await api.get(`/hr/employees/${id}/contracts/active`);
          setContract(contractRes.data?.data ?? null);
        } catch { /* no active contract */ }

        try {
          const balRes = await api.get(`/hr/leave-balances/employee/${id}`);
          setLeaveBalances(balRes.data?.data ?? []);
        } catch { /* no balances */ }

      } catch {
        setError('Employe introuvable.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (error || !employee) return (
    <div className="p-6">
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <AlertCircle size={18} /> {error || 'Employe introuvable'}
      </div>
    </div>
  );

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const statusCls = STATUS_COLORS[employee.status ?? 'active'] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/hr/employees')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <User size={22} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{fullName}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-text-secondary">#{employee.employeeNumber}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls}`}>
                  {employee.status ?? 'Actif'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => navigate(`/hr/employees/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
          <Edit size={16} /> Modifier
        </button>
      </div>

      {/* Infos personnelles */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-primary" />
          <h2 className="font-semibold text-text-primary">Informations personnelles</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Nom complet', value: fullName },
            { label: 'Matricule', value: employee.employeeNumber },
            { label: 'Poste', value: employee.position || '—' },
            { label: 'Departement', value: employee.department || '—' },
            { label: 'Email', value: employee.email || '—' },
            { label: 'Telephone', value: employee.phone || employee.mobile || '—' },
            { label: 'Date embauche', value: formatDate(employee.hireDate) },
            { label: 'Salaire de base', value: formatCurrency(employee.baseSalary || 0, employee.currency || 'CDF') },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-text-secondary mb-1">{label}</p>
              <p className="font-medium text-text-primary text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contrat actif */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase size={18} className="text-primary" />
          <h2 className="font-semibold text-text-primary">Contrat actif</h2>
        </div>
        {!contract ? (
          <p className="text-sm text-text-secondary">Aucun contrat actif</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Type', value: contract.contractType || contract.type || '—' },
              { label: 'Salaire', value: formatCurrency(contract.baseSalary || 0, contract.currency || 'CDF') },
              { label: 'Debut', value: formatDate(contract.startDate) },
              { label: 'Fin', value: contract.endDate ? formatDate(contract.endDate) : 'Indefini' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-text-secondary mb-1">{label}</p>
                <p className="font-medium text-text-primary text-sm">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Soldes conges */}
      {leaveBalances.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-primary" />
            <h2 className="font-semibold text-text-primary">Soldes de conges</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {leaveBalances.map((b: any) => (
              <div key={b.id} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-text-secondary mb-1">{b.leaveType}</p>
                <p className="text-xl font-bold text-success">{b.remainingDays}</p>
                <p className="text-xs text-text-muted">/ {b.totalDays} j</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernieres presences */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <h2 className="font-semibold text-text-primary">Dernieres presences</h2>
            </div>
            <Link to={`/hr/attendance?employeeId=${id}`} className="text-xs text-primary hover:underline">Voir tout</Link>
          </div>
          {recentAttendances.length === 0 ? (
            <p className="text-sm text-text-secondary">Aucune presence enregistree</p>
          ) : (
            <div className="space-y-2">
              {recentAttendances.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="text-text-secondary">{formatDate(a.date)}</span>
                  <span className="font-medium">{a.hoursWorked ? `${Number(a.hoursWorked).toFixed(1)}h` : '—'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dernieres paies */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-primary" />
              <h2 className="font-semibold text-text-primary">Dernieres paies</h2>
            </div>
            <Link to={`/hr/payroll?employeeId=${id}`} className="text-xs text-primary hover:underline">Voir tout</Link>
          </div>
          {recentPayrolls.length === 0 ? (
            <p className="text-sm text-text-secondary">Aucune paie enregistree</p>
          ) : (
            <div className="space-y-2">
              {recentPayrolls.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="text-text-secondary">{formatDate(p.periodStart)}</span>
                  <span className="font-bold text-success">{formatCurrency(p.netSalary, p.currency || 'CDF')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      {documents.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-primary" />
            <h2 className="font-semibold text-text-primary">Documents</h2>
          </div>
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-text-muted" />
                  <span className="text-sm font-medium text-text-primary">{doc.name || doc.documentType || '—'}</span>
                </div>
                {doc.fileUrl && (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline">Telecharger</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
