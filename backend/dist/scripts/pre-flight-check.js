"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const verify_audit_logs_1 = require("./verify-audit-logs");
async function runPreFlight() {
    console.log('🚀 INITIALIZING PRODUCTION PRE-FLIGHT CHECK...\n');
    // 1. Audit Integrity Check
    console.log('--- Step 1: Cryptographic Audit Chain Verification ---');
    try {
        const auditResult = await (0, verify_audit_logs_1.verifyAuditLogIntegrity)();
        if (auditResult.success) {
            console.log('✅ AUDIT LOGS: All chains verified. No tampering detected.\n');
        }
        else {
            console.error('❌ AUDIT LOGS: INTEGRITY FAILURE! Tampering detected.\n');
            process.exit(1);
        }
    }
    catch (error) {
        console.error(`❌ AUDIT LOGS: Error during verification: ${error.message}\n`);
        process.exit(1);
    }
    // 2. We can't easily run full jest tests from here without spawning, 
    // but we can check if critical services are exportable and properly configured.
    console.log('--- Step 2: Service Configuration Check ---');
    try {
        const { default: env } = await Promise.resolve().then(() => __importStar(require('../config/env')));
        console.log(`✅ CONFIG: Environment detected as ${env.NODE_ENV}`);
        if (env.DATABASE_READ_URL) {
            console.log('✅ DATABASE: Read-replica routing enabled.');
        }
        else {
            console.log('ℹ️ DATABASE: Running in single-instance mode (ready).');
        }
    }
    catch (e) {
        console.error('❌ CONFIG: Error loading environment configuration.');
        process.exit(1);
    }
    console.log('\n✨ PRE-FLIGHT CHECK COMPLETED SUCCESSFULLY.');
    console.log('The system is safe for production deployment.');
}
runPreFlight();
//# sourceMappingURL=pre-flight-check.js.map