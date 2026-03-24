import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import employeeService, { Employee } from '../../services/employee.service';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setEmployee(await employeeService.getById(id));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="card p-6">Chargement...</div>;
  if (!employee) return <div className="card p-6">Employe introuvable</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Link to="/hr/employees" className="btn-secondary btn-sm">Retour</Link>
        <button className="btn-primary btn-sm" onClick={() => navigate(`/hr/employees/${employee.id}/edit`)}>
          Modifier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><p className="text-xs text-text-secondary mb-1">Employe</p><p>{employee.firstName} {employee.lastName}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Numero</p><p>{employee.employeeNumber}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Poste</p><p>{employee.position || '-'}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Departement</p><p>{employee.department || '-'}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Email</p><p>{employee.email || '-'}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Telephone</p><p>{employee.phone || employee.mobile || '-'}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Date embauche</p><p>{formatDate(employee.hireDate)}</p></div>
        <div className="card"><p className="text-xs text-text-secondary mb-1">Salaire de base</p><p>{formatCurrency(employee.baseSalary || 0, employee.currency || 'CDF')}</p></div>
      </div>
    </div>
  );
}
