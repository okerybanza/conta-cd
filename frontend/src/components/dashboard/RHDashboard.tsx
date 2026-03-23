/**
 * DOC-10 : Dashboard RH
 * Employés, contrats, préparation paie
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, DollarSign, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import employeeService from '../../services/employee.service';
import payrollService from '../../services/payroll.service';

export function RHDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeContracts, setActiveContracts] = useState(0);
  const [pendingPayrolls, setPendingPayrolls] = useState<any[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Compter les employés
      try {
        const employees = await employeeService.list();
        setTotalEmployees(employees.data?.length || 0);
        setRecentEmployees(employees.data?.slice(0, 5) || []);
      } catch (e) {
        console.error('Error loading employees:', e);
      }

      // TODO: Compter les contrats actifs
      setActiveContracts(0);

      // TODO: Charger les paies en attente
      try {
        const payrolls = await payrollService.list({ status: 'draft' });
        setPendingPayrolls(payrolls.data || []);
      } catch (e) {
        console.error('Error loading payrolls:', e);
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord - RH</h1>
        <p className="text-gray-600 mt-1">Employés, contrats, préparation paie</p>
      </div>

      {/* Paies en attente */}
      {pendingPayrolls.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-yellow-900 mb-1">
                {pendingPayrolls.length} paie(s) en préparation
              </p>
              <p className="text-sm text-yellow-800">
                Des paies nécessitent votre attention avant validation (DOC-04, DOC-06)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Employés actifs</p>
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contrats actifs</p>
              <p className="text-2xl font-bold text-gray-900">{activeContracts}</p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paies en préparation</p>
              <p className="text-2xl font-bold text-gray-900">{pendingPayrolls.length}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Employés récents */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Employés récents</h2>
          <Link to="/hr/employees" className="text-sm text-primary hover:underline">Voir tout</Link>
        </div>
        <div className="space-y-2">
          {recentEmployees.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun employé</p>
          ) : (
            recentEmployees.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                <div>
                  <p className="font-medium text-gray-900">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{emp.employeeNumber || emp.id}</p>
                </div>
                <span className="text-sm text-gray-600">{emp.status || 'Actif'}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/hr/employees/new" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
          <Users className="h-8 w-8 text-blue-600 mb-3" />
          <p className="font-medium text-gray-900">Nouvel employé</p>
          <p className="text-sm text-gray-600 mt-1">Créer un employé</p>
        </Link>
        <Link to="/hr/payroll" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
          <DollarSign className="h-8 w-8 text-green-600 mb-3" />
          <p className="font-medium text-gray-900">Préparer une paie</p>
          <p className="text-sm text-gray-600 mt-1">Créer une paie</p>
        </Link>
        <Link to="/hr/contracts" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
          <FileText className="h-8 w-8 text-purple-600 mb-3" />
          <p className="font-medium text-gray-900">Gérer les contrats</p>
          <p className="text-sm text-gray-600 mt-1">Contrats employés</p>
        </Link>
      </div>
    </div>
  );
}
