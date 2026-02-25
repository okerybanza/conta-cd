/**
 * Handlers pour les événements RH (DOC-04)
 *
 * Principe : La RH émet des événements comptables, ne modifie jamais directement les soldes
 */
import { PayrollValidated, EmployeeContractCreated, EmployeeContractTerminated } from '../domain-event';
/**
 * Handler : Validation d'une paie
 * Génère les écritures comptables correspondantes
 */
export declare function handlePayrollValidated(event: PayrollValidated): Promise<void>;
/**
 * Handler : Création d'un contrat employé
 */
export declare function handleEmployeeContractCreated(event: EmployeeContractCreated): Promise<void>;
/**
 * Handler : Résiliation d'un contrat
 */
export declare function handleEmployeeContractTerminated(event: EmployeeContractTerminated): Promise<void>;
//# sourceMappingURL=hr.handlers.d.ts.map