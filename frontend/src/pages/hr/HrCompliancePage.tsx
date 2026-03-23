import { useEffect, useState } from 'react';
import hrComplianceService, {
  HrComplianceIssue,
  HrComplianceSummary,
  HrComplianceSeverity,
} from '../../services/hrCompliance.service';

function severityLabel(severity: HrComplianceSeverity) {
  switch (severity) {
    case 'error':
      return 'Critique';
    case 'warning':
      return 'Alerte';
    default:
      return 'Info';
  }
}

function severityColor(severity: HrComplianceSeverity) {
  switch (severity) {
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'warning':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

export default function HrCompliancePage() {
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<HrComplianceSummary | null>(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hrComplianceService.getRdcReport({
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
      });
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Charger automatiquement le rapport par défaut (3 derniers mois)
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasIssues = (summary?.issues?.length || 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Conformité RH – Législation RDC</h1>
        <p className="mt-1 text-sm text-gray-600">
          Analyse automatique de la paie, du temps de travail et des congés par rapport aux bonnes
          pratiques et aux minima légaux indicatifs.
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Début de période
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fin de période
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            />
          </div>
          <div className="flex-1" />
          <button
            onClick={loadReport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? 'Analyse en cours...' : 'Analyser'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Résultat de l&apos;analyse</h2>
            {summary && (
              <p className="text-xs text-gray-500">
                Période du{' '}
                {new Date(summary.periodStart).toLocaleDateString('fr-FR')}{' '}
                au{' '}
                {new Date(summary.periodEnd).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
          {summary && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                hasIssues ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {hasIssues
                ? `${summary.issues.length} point(s) de vigilance détecté(s)`
                : 'Aucun problème majeur détecté'}
            </span>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {summary && summary.issues.length === 0 && (
            <div className="p-4 text-sm text-gray-600">
              Aucun écart significatif trouvé sur la période analysée.
            </div>
          )}

          {summary &&
            summary.issues.map((issue: HrComplianceIssue, index: number) => (
              <div key={index} className="p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severityColor(
                        issue.severity
                      )}`}
                    >
                      {severityLabel(issue.severity)}
                    </span>
                    <span className="text-xs font-mono text-gray-500">{issue.code}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex gap-2">
                    {issue.employeeId && <span>Employé: {issue.employeeId}</span>}
                    {issue.payrollId && <span>Paie: {issue.payrollId}</span>}
                    {issue.attendanceId && <span>Pointage: {issue.attendanceId}</span>}
                    {issue.leaveRequestId && <span>Demande congé: {issue.leaveRequestId}</span>}
                  </div>
                </div>
                <div className="text-sm text-gray-800">{issue.message}</div>
                {issue.details && (
                  <pre className="mt-1 text-xs text-gray-500 bg-gray-50 rounded-md p-2 overflow-x-auto">
                    {JSON.stringify(issue.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}


