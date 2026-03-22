/**
 * SPRINT 2 - TASK 2.2 (ACCT-014): Segregation of Duties Service
 *
 * Enforces the "4-eyes" principle where a user cannot perform multiple
 * conflicting actions in a financial workflow (e.g., Create vs Approve).
 */
export declare class SegregationOfDutiesService {
    /**
     * Validates if the user is allowed to perform a "validation/approval" action on an entity.
     *
     * @param companyId Company context
     * @param userId The ID of the user attempting the action
     * @param entityType 'invoice' | 'payment' | 'journal_entry'
     * @param entityId The ID of the specific record
     * @throws CustomError if self-approval is detected
     */
    validateNotSelfApproving(companyId: string, userId: string, entityType: 'invoice' | 'payment' | 'journal_entry' | 'expense' | 'payroll', entityId: string): Promise<void>;
}
declare const _default: SegregationOfDutiesService;
export default _default;
//# sourceMappingURL=segregationOfDuties.service.d.ts.map