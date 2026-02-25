"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventReplayService = void 0;
const database_1 = __importDefault(require("../config/database"));
const event_bus_1 = require("../events/event-bus");
const event_registry_1 = require("../events/event-registry");
const logger_1 = __importDefault(require("../utils/logger"));
class EventReplayService {
    /**
     * Replay events based on filters
     * @returns Number of events successfully replayed
     */
    async replayEvents(filters) {
        logger_1.default.info('Starting event replay', { filters });
        const where = {};
        if (filters.companyId)
            where.company_id = filters.companyId;
        if (filters.type)
            where.type = filters.type;
        if (filters.entityType)
            where.entity_type = filters.entityType;
        if (filters.entityId)
            where.entity_id = filters.entityId;
        if (filters.startDate || filters.endDate) {
            where.occurred_at = {};
            if (filters.startDate)
                where.occurred_at.gte = filters.startDate;
            if (filters.endDate)
                where.occurred_at.lte = filters.endDate;
        }
        const events = await database_1.default.domain_events.findMany({
            where,
            orderBy: { occurred_at: 'asc' },
        });
        logger_1.default.info(`Found ${events.length} events to replay`);
        let successCount = 0;
        for (const row of events) {
            try {
                const event = (0, event_registry_1.reconstructEvent)(row.type, row.metadata, row.data);
                if (event) {
                    // Use republish to avoid creating a new record in domain_events
                    await event_bus_1.eventBus.republish(event);
                    successCount++;
                }
                else {
                    logger_1.default.warn(`Skipping event replay: No constructor found for type ${row.type}`, {
                        eventId: row.id
                    });
                }
            }
            catch (error) {
                logger_1.default.error(`Failed to replay event ${row.id}`, {
                    error: error.message,
                    type: row.type
                });
                // We continue with other events even if one fails
            }
        }
        logger_1.default.info(`Event replay finished. Successfully replayed ${successCount}/${events.length} events.`);
        return successCount;
    }
}
exports.EventReplayService = EventReplayService;
exports.default = new EventReplayService();
//# sourceMappingURL=eventReplay.service.js.map