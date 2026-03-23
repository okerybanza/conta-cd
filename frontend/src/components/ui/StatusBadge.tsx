/**
 * DOC-10 : Badge d'état avec autorisations/interdictions
 * Affiche clairement l'état et ce qu'il autorise/interdit
 */

import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { ElementType } from 'react';

export type StatusType =
  | 'draft'
  | 'validated'
  | 'sent'
  | 'paid'
  | 'partially_paid'
  | 'cancelled'
  | 'open'
  | 'locked'
  | 'closed'
  | 'pending'
  | 'approved'
  | 'rejected';

interface StatusBadgeProps {
  status: StatusType;
  entityType?: 'invoice' | 'period' | 'payroll' | 'stock_movement' | 'leave_request' | 'generic';
  showPermissions?: boolean; // DOC-10 : Afficher ce que l'état autorise/interdit
  className?: string;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: any;
  allows: string[]; // DOC-10 : Ce que cet état autorise
  forbids: string[]; // DOC-10 : Ce que cet état interdit
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  draft: {
    label: 'Brouillon',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: Clock,
    allows: ['Modification', 'Suppression', 'Validation'],
    forbids: [],
  },
  validated: {
    label: 'Validé',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: CheckCircle2,
    allows: ['Consultation', 'Annulation par inversion'],
    forbids: ['Modification directe', 'Suppression'],
  },
  sent: {
    label: 'Envoyé',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: CheckCircle2,
    allows: ['Consultation', 'Enregistrement paiement', 'Annulation par inversion'],
    forbids: ['Modification', 'Suppression'],
  },
  paid: {
    label: 'Payé',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
    allows: ['Consultation', 'Annulation par inversion'],
    forbids: ['Modification', 'Suppression', 'Nouveau paiement'],
  },
  partially_paid: {
    label: 'Partiellement payé',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: AlertCircle,
    allows: ['Consultation', 'Enregistrement paiement complémentaire', 'Annulation par inversion'],
    forbids: ['Modification', 'Suppression'],
  },
  cancelled: {
    label: 'Annulé',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
    allows: ['Consultation'],
    forbids: ['Modification', 'Suppression', 'Nouvelle validation'],
  },
  open: {
    label: 'Ouverte',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
    allows: ['Création écritures', 'Modification', 'Clôture'],
    forbids: [],
  },
  locked: {
    label: 'Verrouillée',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: AlertCircle,
    allows: ['Consultation'],
    forbids: ['Création écritures', 'Modification', 'Clôture'],
  },
  closed: {
    label: 'Clôturée',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
    allows: ['Consultation', 'Réouverture exceptionnelle'],
    forbids: ['Création écritures', 'Modification', 'Toute opération'],
  },
  pending: {
    label: 'En attente',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: Clock,
    allows: ['Consultation', 'Approbation', 'Rejet'],
    forbids: [],
  },
  approved: {
    label: 'Approuvé',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
    allows: ['Consultation'],
    forbids: ['Modification', 'Suppression'],
  },
  rejected: {
    label: 'Rejeté',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
    allows: ['Consultation'],
    forbids: ['Modification', 'Suppression'],
  },
};

export function StatusBadge({
  status,
  entityType = 'generic',
  showPermissions = false,
  className = ''
}: StatusBadgeProps) {
  const config = statusConfigs[status];
  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} ${config.color}`}>
        <Icon size={14} className={config.color} />
        <span className="text-xs font-medium">{config.label}</span>
      </div>

      {/* DOC-10 : Afficher ce que l'état autorise/interdit */}
      {showPermissions && (
        <div className="text-xs text-gray-600 mt-1 space-y-1">
          {config.allows.length > 0 && (
            <div className="flex items-start gap-1">
              <CheckCircle2 size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-green-700">
                <strong>Autorise :</strong> {config.allows.join(', ')}
              </span>
            </div>
          )}
          {config.forbids.length > 0 && (
            <div className="flex items-start gap-1">
              <XCircle size={12} className="text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-red-700">
                <strong>Interdit :</strong> {config.forbids.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
