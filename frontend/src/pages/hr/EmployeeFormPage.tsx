import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import employeeService, { CreateEmployeeData } from '../../services/employee.service';
import { useToastContext } from '../../contexts/ToastContext';

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<CreateEmployeeData>({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    hireDate: new Date().toISOString().split('T')[0],
    status: 'active',
    baseSalary: 0,
    currency: 'CDF',
    salaryFrequency: 'monthly',
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const emp = await employeeService.getById(id);
        setForm({
          employeeNumber: emp.employeeNumber || '',
          firstName: emp.firstName || '',
          lastName: emp.lastName || '',
          email: emp.email || '',
          phone: emp.phone || emp.mobile || '',
          position: emp.position || '',
          department: emp.department || '',
          hireDate: emp.hireDate?.split('T')[0] || '',
          status: emp.status || 'active',
          baseSalary: Number(emp.baseSalary || 0),
          currency: emp.currency || 'CDF',
          salaryFrequency: emp.salaryFrequency || 'monthly',
        });
      } catch (err: any) {
        showError(err.response?.data?.message || 'Erreur de chargement employe');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, showError]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeNumber || !form.firstName || !form.lastName) {
      showError('Numero employe, prenom et nom sont obligatoires.');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await employeeService.update(id, form);
        showSuccess('Employe modifie avec succes.');
      } else {
        await employeeService.create(form);
        showSuccess('Employe cree avec succes.');
      }
      navigate('/hr/employees');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'employe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card p-6 space-y-4 max-w-3xl" onSubmit={submit}>
      <h1 className="text-xl font-semibold">{isEdit ? 'Modifier employe' : 'Nouvel employe'}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input className="input" placeholder="Numero employe" value={form.employeeNumber} onChange={(e) => setForm((p) => ({ ...p, employeeNumber: e.target.value }))} required />
        <input className="input" placeholder="Prenom" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} required />
        <input className="input" placeholder="Nom" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input className="input" type="email" placeholder="Email" value={form.email || ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        <input className="input" placeholder="Telephone" value={form.phone || ''} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        <input className="input" type="date" value={form.hireDate} onChange={(e) => setForm((p) => ({ ...p, hireDate: e.target.value }))} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input className="input" placeholder="Poste" value={form.position || ''} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} />
        <input className="input" placeholder="Departement" value={form.department || ''} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} />
        <select className="input" value={form.status || 'active'} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="terminated">Termine</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input className="input" type="number" min={0} step="0.01" placeholder="Salaire de base" value={form.baseSalary} onChange={(e) => setForm((p) => ({ ...p, baseSalary: Number(e.target.value || 0) }))} required />
        <select className="input" value={form.currency || 'CDF'} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}>
          <option value="CDF">CDF</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
        <select className="input" value={form.salaryFrequency || 'monthly'} onChange={(e) => setForm((p) => ({ ...p, salaryFrequency: e.target.value }))}>
          <option value="monthly">Mensuel</option>
          <option value="biweekly">Bi-mensuel</option>
          <option value="weekly">Hebdomadaire</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button type="button" className="btn-secondary" onClick={() => navigate('/hr/employees')} disabled={loading}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  );
}
