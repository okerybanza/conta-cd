import logger from './logger';

export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
    failureThreshold: number; // Number of failures before opening the circuit
    resetTimeout: number; // Time in ms before attempting to reset (Half-Open)
    successThreshold: number; // Number of successes needed in Half-Open to Close the circuit
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failures = 0;
    private successes = 0;
    private lastError: Error | null = null;
    private nextAttempt: number = 0;

    constructor(
        private readonly name: string,
        private readonly options: CircuitBreakerOptions = {
            failureThreshold: 3,
            resetTimeout: 30000, // 30 seconds
            successThreshold: 2,
        }
    ) { }

    async execute<T>(fn: () => Promise<T>, fallback: (error: Error | null) => Promise<T>): Promise<T> {
        this.updateState();

        if (this.state === CircuitState.OPEN) {
            logger.warn(`Circuit Breaker [${this.name}] is OPEN. Executing fallback.`, {
                nextAttempt: new Date(this.nextAttempt).toISOString(),
            });
            return fallback(this.lastError);
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error: any) {
            this.onFailure(error);
            return fallback(error);
        }
    }

    private updateState() {
        if (this.state === CircuitState.OPEN && Date.now() >= this.nextAttempt) {
            this.state = CircuitState.HALF_OPEN;
            this.successes = 0;
            logger.info(`Circuit Breaker [${this.name}] transitioning to HALF_OPEN`);
        }
    }

    private onSuccess() {
        this.failures = 0;
        this.lastError = null;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successes++;
            if (this.successes >= this.options.successThreshold) {
                this.state = CircuitState.CLOSED;
                logger.info(`Circuit Breaker [${this.name}] transitioned to CLOSED`);
            }
        } else {
            this.state = CircuitState.CLOSED;
        }
    }

    private onFailure(error: Error) {
        this.failures++;
        this.lastError = error;

        if (this.state === CircuitState.HALF_OPEN || this.failures >= this.options.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + this.options.resetTimeout;
            logger.error(`Circuit Breaker [${this.name}] transitioned to OPEN`, {
                error: error.message,
                nextAttempt: new Date(this.nextAttempt).toISOString(),
            });
        }
    }

    getState(): CircuitState {
        return this.state;
    }
}
