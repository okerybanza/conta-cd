/**
 * DOC-10 : Affichage des conséquences temporelles et impact audit
 * 
 * L'UX affiche :
 * - les conséquences temporelles
 * - la période concernée
 * - l'impact dans l'audit
 * 
 * L'utilisateur comprend : "Ce que je fais maintenant aura un effet plus tard."
 */

import { Calendar, FileText, AlertCircle, Clock } from 'lucide-react';

interface TemporalConsequencesProps {
  period?: {
    name: string;
    startDate: string;
    endDate: string;
    isClosed: boolean;
    isLocked: boolean;
  };
  auditImpact?: {
    action: string;
    willBeRecorded: boolean;
    requiresJustification: boolean;
  };
  consequences?: string[];
  className?: string;
}

export function TemporalConsequences({
  period,
  auditImpact,
  consequences = [],
  className = '',
}: TemporalConsequencesProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Période concernée */}
      {period && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">Période concernée</p>
              <p className="text-sm text-blue-800">{period.name}</p>
              <p className="text-xs text-blue-700 mt-1">
                {new Date(period.startDate).toLocaleDateString('fr-FR')} - {new Date(period.endDate).toLocaleDateString('fr-FR')}
              </p>
              {period.isClosed && (
                <p className="text-xs text-red-700 mt-1 font-medium">
                  ⚠️ Cette période est clôturée. Cette action nécessitera une réouverture exceptionnelle.
                </p>
              )}
              {period.isLocked && (
                <p className="text-xs text-orange-700 mt-1 font-medium">
                  ⚠️ Cette période est verrouillée. Cette action nécessitera un déverrouillage.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Impact audit */}
      {auditImpact && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-900 mb-1">Impact dans l'audit (DOC-08)</p>
              <p className="text-sm text-purple-800">
                Cette action sera enregistrée dans le journal d'audit avec :
              </p>
              <ul className="list-disc list-inside text-xs text-purple-700 mt-1 space-y-0.5">
                <li>Action : {auditImpact.action}</li>
                <li>Date et heure : {new Date().toLocaleString('fr-FR')}</li>
                <li>Utilisateur : {auditImpact.willBeRecorded ? 'Oui' : 'Non'}</li>
                {auditImpact.requiresJustification && (
                  <li className="font-medium text-purple-900">
                    ⚠️ Justification obligatoire (DOC-08)
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Conséquences temporelles */}
      {consequences.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">Conséquences temporelles</p>
              <p className="text-xs text-yellow-800 mb-2">
                Cette action aura des effets sur les périodes suivantes :
              </p>
              <ul className="list-disc list-inside text-xs text-yellow-700 space-y-0.5">
                {consequences.map((consequence, index) => (
                  <li key={index}>{consequence}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Message général */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-700">
            <strong>Rappel DOC-10 :</strong> Ce que vous faites maintenant aura un effet plus tard. 
            Toutes les actions critiques sont tracées dans l'audit et peuvent avoir des conséquences 
            sur les périodes comptables futures.
          </p>
        </div>
      </div>
    </div>
  );
}
