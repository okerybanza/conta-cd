"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitState = void 0;
const logger_1 = __importDefault(require("./logger"));
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreaker {
    name;
    options;
    state = CircuitState.CLOSED;
    failures = 0;
    successes = 0;
    lastError = null;
    nextAttempt = 0;
    constructor(name, options = {
        failureThreshold: 3,
        resetTimeout: 30000, // 30 seconds
        successThreshold: 2,
    }) {
        this.name = name;
        this.options = options;
    }
    async execute(fn, fallback) {
        this.updateState();
        if (this.state === CircuitState.OPEN) {
            logger_1.default.warn(`Circuit Breaker [${this.name}] is OPEN. Executing fallback.`, {
                nextAttempt: new Date(this.nextAttempt).toISOString(),
            });
            return fallback(this.lastError);
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure(error);
            return fallback(error);
        }
    }
    updateState() {
        if (this.state === CircuitState.OPEN && Date.now() >= this.nextAttempt) {
            this.state = CircuitState.HALF_OPEN;
            this.successes = 0;
            logger_1.default.info(`Circuit Breaker [${this.name}] transitioning to HALF_OPEN`);
        }
    }
    onSuccess() {
        this.failures = 0;
        this.lastError = null;
        if (this.state === CircuitState.HALF_OPEN) {
            this.successes++;
            if (this.successes >= this.options.successThreshold) {
                this.state = CircuitState.CLOSED;
                logger_1.default.info(`Circuit Breaker [${this.name}] transitioned to CLOSED`);
            }
        }
        else {
            this.state = CircuitState.CLOSED;
        }
    }
    onFailure(error) {
        this.failures++;
        this.lastError = error;
        if (this.state === CircuitState.HALF_OPEN || this.failures >= this.options.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + this.options.resetTimeout;
            logger_1.default.error(`Circuit Breaker [${this.name}] transitioned to OPEN`, {
                error: error.message,
                nextAttempt: new Date(this.nextAttempt).toISOString(),
            });
        }
    }
    getState() {
        return this.state;
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=circuit-breaker.js.map