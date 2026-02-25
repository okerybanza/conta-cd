export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeout: number;
    successThreshold: number;
}
export declare class CircuitBreaker {
    private readonly name;
    private readonly options;
    private state;
    private failures;
    private successes;
    private lastError;
    private nextAttempt;
    constructor(name: string, options?: CircuitBreakerOptions);
    execute<T>(fn: () => Promise<T>, fallback: (error: Error | null) => Promise<T>): Promise<T>;
    private updateState;
    private onSuccess;
    private onFailure;
    getState(): CircuitState;
}
//# sourceMappingURL=circuit-breaker.d.ts.map