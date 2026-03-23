import { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Info } from 'lucide-react';
import { TemporalConsequences } from './TemporalConsequences';

/**
 * DOC-10 : Confirmation intelligente
 * - Rappelle l'impact
 * - Rappelle l'irréversibilité
 * - Exige une action consciente
 * - Jamais de confirmation générique
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification?: string) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  requireJustification?: boolean;
  justificationPlaceholder?: string;
  // DOC-10 : Impact et irréversibilité
  impact?: string; // Ex: "Cette action va clôturer la période et bloquer toutes les écritures"
  isIrreversible?: boolean; // Ex: true pour clôture, annulation
  consequences?: string[]; // Ex: ["Aucune écriture ne pourra être modifiée", "Les rapports seront figés"]
  // DOC-10 : Conséquences temporelles et impact audit
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
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'warning',
  loading = false,
  requireJustification = false,
  justificationPlaceholder = 'Justifiez votre action...',
  impact,
  isIrreversible = false,
  consequences = [],
  period,
  auditImpact,
}: ConfirmDialogProps) {
  const [justification, setJustification] = useState('');

  const handleConfirm = () => {
    if (requireJustification && !justification.trim()) {
      return;
    }
    onConfirm(justification);
    if (!loading) {
      setJustification('');
      onClose();
    }
  };

  const variants = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 text-white',
      icon: 'text-red-600',
    },
    warning: {
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      icon: 'text-yellow-600',
    },
    info: {
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: 'text-blue-600',
    },
  };

  const variantStyles = variants[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md" showCloseButton={false}>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <AlertTriangle className={`h-6 w-6 flex-shrink-0 mt-0.5 ${variantStyles.icon}`} />
          <div className="flex-1 space-y-3">
            <p className="text-gray-700">{message}</p>

            {/* DOC-10 : Rappel de l'impact */}
            {impact && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Impact de cette action :</p>
                    <p className="text-sm text-blue-800">{impact}</p>
                  </div>
                </div>
              </div>
            )}

            {/* DOC-10 : Rappel de l'irréversibilité */}
            {isIrreversible && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900 mb-1">⚠️ Action irréversible</p>
                    <p className="text-sm text-red-800">
                      Cette action ne peut pas être annulée. Assurez-vous que c'est bien ce que vous souhaitez faire.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DOC-10 : Conséquences détaillées */}
            {consequences.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-900 mb-2">Conséquences :</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                  {consequences.map((consequence, index) => (
                    <li key={index}>{consequence}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* DOC-10 : Conséquences temporelles et impact audit */}
            {(period || auditImpact || consequences.length > 0) && (
              <div className="mt-4">
                <TemporalConsequences
                  period={period}
                  auditImpact={auditImpact}
                  consequences={consequences}
                />
              </div>
            )}

            {requireJustification && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Justification obligatoire <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={3}
                  placeholder={justificationPlaceholder}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cette justification sera enregistrée dans l'audit (DOC-08)
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (requireJustification && !justification.trim())}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${variantStyles.button}`}
          >
            {loading ? 'Traitement...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

