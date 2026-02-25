export interface ReplayFilters {
    companyId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    entityType?: string;
    entityId?: string;
}
export declare class EventReplayService {
    /**
     * Replay events based on filters
     * @returns Number of events successfully replayed
     */
    replayEvents(filters: ReplayFilters): Promise<number>;
}
declare const _default: EventReplayService;
export default _default;
//# sourceMappingURL=eventReplay.service.d.ts.map