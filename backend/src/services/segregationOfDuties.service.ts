import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';

/**
 * SPRINT 2 - TASK 2.2 (ACCT-014): Segregation of Duties Service
 * 
 * Enforces the "4-eyes" principle where a user cannot perform multiple 
 * conflicting actions in a financial workflow (e.g., Create vs Approve).
 */
export class SegregationOfDutiesService {
    /**
     * Validates if the user is allowed to perform a "validation/approval" action on an entity.
     * 
     * @param companyId Company context
     * @param userId The ID of the user attempting the action
     * @param entityType 'invoice' | 'payment' | 'journal_entry'
     * @param entityId The ID of the specific record
     * @throws CustomError if self-approval is detected
     */
    async validateNotSelfApproving(
        companyId: string,
        userId: string,
        entityType: 'invoice' | 'payment' | 'journal_entry',
        entityId: string
    ): Promise<void> {
        logger.debug('Validating Segregation of Duties', { companyId, userId, entityType, entityId });

        let record: any;

        try {
            switch (entityType) {
                case 'invoice':
                    record = await prisma.invoices.findUnique({
                        where: { id: entityId },
                        select: { created_by: true },
                    });
                    break;
                case 'payment':
                    record = await prisma.payments.findUnique({
                        where: { id: entityId },
                        select: { created_by: true },
                    });
                    break;
                case 'journal_entry':
                    record = await prisma.journal_entries.findUnique({
                        where: { id: entityId },
                        select: { created_by: true },
                    });
                    break;
            }

            if (!record) {
                throw new CustomError(`${entityType} not found`, 404, 'ENTITY_NOT_FOUND');
            }

            // ACCT-014: Check for small company exception
            // If the company only has one active user, we must allow self-approval
            // to avoid blocking the workflow entirely.
            const userCount = await prisma.users.count({
                where: {
                    company_id: companyId,
                    deleted_at: null
                }
            });

            if (userCount <= 1) {
                logger.info('Small company exception applied for SoD', {
                    companyId,
                    userId,
                    userCount
                });
                return;
            }

            // ACCT-014: If the person approving/validating is the one who created it
            if (record.created_by === userId) {
                logger.warn('Self-approval attempt blocked (SoD violation)', {
                    userId,
                    entityType,
                    entityId,
                    companyId
                });

                throw new CustomError(
                    `Segregation of Duties Violation: You cannot approve or validate a ${entityType} that you created. A different user must perform this action.`,
                    403,
                    'SOD_VIOLATION'
                );
            }

            logger.info('Segregation of Duties validation passed', { userId, entityType, entityId });
        } catch (error: any) {
            if (error instanceof CustomError) throw error;

            logger.error('Error in SegregationOfDutiesService', { error: error.message });
            throw new CustomError('Failed to validate Segregation of Duties', 500);
        }
    }
}

export default new SegregationOfDutiesService();
