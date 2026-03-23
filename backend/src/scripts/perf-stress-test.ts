import axios from 'axios';
import logger from '../utils/logger';

async function runStressTest() {
    const API_URL = 'http://localhost:3001/api/v1/auth/login'; // Example endpoint
    const CONCURRENT_REQUESTS = 20;
    const TOTAL_ROUNDS = 5;

    console.log(`--- Starting Stress Test: ${CONCURRENT_REQUESTS} concurrent requests x ${TOTAL_ROUNDS} rounds ---`);

    let totalSuccess = 0;
    let totalError = 0;
    const start = Date.now();

    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
        console.log(`Round ${round}...`);
        const requests = Array(CONCURRENT_REQUESTS).fill(0).map(async (_, i) => {
            try {
                // We use a non-existent user to test the logic without logging in
                await axios.post(API_URL, {
                    email: `stress-test-${round}-${i}@test.com`,
                    password: 'Password123'
                }, { timeout: 5000 });
                totalSuccess++;
            } catch (error: any) {
                if (error.response?.status === 429) {
                    // console.log('✅ Rate Limit (429) hit as expected');
                }
                totalError++;
            }
        });

        await Promise.all(requests);
    }

    const duration = Date.now() - start;
    console.log('\n--- Stress Test Results ---');
    console.log(`Total Requests: ${CONCURRENT_REQUESTS * TOTAL_ROUNDS}`);
    console.log(`Success/Handled: ${totalSuccess}`);
    console.log(`Errors/Blocked: ${totalError}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Avg Latency: ${Math.round(duration / (CONCURRENT_REQUESTS * TOTAL_ROUNDS))}ms`);
    
    console.log('\nNote: Rate limiting and circuit breakers should be visible in server logs if thresholds were reached.');
}

runStressTest().catch(console.error);
