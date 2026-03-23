/**
 * DOC-10 : Vue d'action
 * 
 * Principe : Séparation stricte Lecture / Action
 * - Les boutons d'action sont rares, visibles, explicites
 * - Aucune action critique en un clic
 * - Les actions critiques nécessitent une confirmation intelligente
 */

import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useState } from 'react';

interface ActionViewProps {
  children: React.ReactNode;
  title?: string;
  actionType?: 'create' | 'edit' | 'validate' | 'cancel' | 'close' | 'delete';
  onAction?: () => void | Promise<void>;
  requiresConfirmation?: boolean;
  confirmationProps?: {
    title: string;
    message: string;
    impact?: string;
    isIrreversible?: boolean;
    consequences?: string[];
    requireJustification?: boolean;
  };
  className?: string;
}

export function ActionView({
  children,
  title,
  actionType = 'edit',
  onAction,
  requiresConfirmation = true,
  confirmationProps,
  className = '',
}: ActionViewProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const actionConfig = {
    create: {
      label: 'Créer',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    edit: {
      label: 'Modifier',
      icon: CheckCircle2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
    validate: {
      label: 'Valider',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    cancel: {
      label: 'Annuler',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700',
    },
    close: {
      label: 'Clôturer',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
    },
    delete: {
      label: 'Supprimer',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700',
    },
  };

  const config = actionConfig[actionType];
  const Icon = config.icon;

  const handleAction = async () => {
    if (requiresConfirmation && confirmationProps) {
      setShowConfirm(true);
    } else if (onAction) {
      setLoading(true);
      try {
        await onAction();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirm = async (justification?: string) => {
    setShowConfirm(false);
    if (onAction) {
      setLoading(true);
      try {
        await onAction();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.color}`} />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <span className={`px-2 py-1 ${config.bgColor} ${config.color} text-xs font-medium rounded`}>
            {config.label}
          </span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {children}
      </div>

      {onAction && (
        <div className="flex justify-end gap-3">
          <button
            onClick={handleAction}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${config.buttonColor}`}
          >
            {loading ? 'Traitement...' : config.label}
          </button>
        </div>
      )}

      {confirmationProps && (
        <ConfirmDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
          title={confirmationProps.title}
          message={confirmationProps.message}
          impact={confirmationProps.impact}
          isIrreversible={confirmationProps.isIrreversible}
          consequences={confirmationProps.consequences}
          requireJustification={confirmationProps.requireJustification}
          loading={loading}
          variant={actionType === 'delete' || actionType === 'cancel' ? 'danger' : 'warning'}
        />
      )}
    </div>
  );
}
