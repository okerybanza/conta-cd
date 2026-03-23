import prisma from '../config/database';
import { eventBus } from '../events/event-bus';
import { reconstructEvent } from '../events/event-registry';
import logger from '../utils/logger';

export interface ReplayFilters {
    companyId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    entityType?: string;
    entityId?: string;
}

export class EventReplayService {
    /**
     * Replay events based on filters
     * @returns Number of events successfully replayed
     */
    async replayEvents(filters: ReplayFilters): Promise<number> {
        logger.info('Starting event replay', { filters });

        const where: any = {};
        if (filters.companyId) where.company_id = filters.companyId;
        if (filters.type) where.type = filters.type;
        if (filters.entityType) where.entity_type = filters.entityType;
        if (filters.entityId) where.entity_id = filters.entityId;

        if (filters.startDate || filters.endDate) {
            where.occurred_at = {};
            if (filters.startDate) where.occurred_at.gte = filters.startDate;
            if (filters.endDate) where.occurred_at.lte = filters.endDate;
        }

        const events = await prisma.domain_events.findMany({
            where,
            orderBy: { occurred_at: 'asc' },
        });

        logger.info(`Found ${events.length} events to replay`);

        let successCount = 0;
        for (const row of events) {
            try {
                const event = reconstructEvent(
                    row.type,
                    row.metadata as any,
                    row.data as any
                );

                if (event) {
                    // Use republish to avoid creating a new record in domain_events
                    await eventBus.republish(event);
                    successCount++;
                } else {
                    logger.warn(`Skipping event replay: No constructor found for type ${row.type}`, {
                        eventId: row.id
                    });
                }
            } catch (error: any) {
                logger.error(`Failed to replay event ${row.id}`, {
                    error: error.message,
                    type: row.type
                });
                // We continue with other events even if one fails
            }
        }

        logger.info(`Event replay finished. Successfully replayed ${successCount}/${events.length} events.`);
        return successCount;
    }
}

export default new EventReplayService();
