
import dashboardService from '../src/services/dashboard.service';

const companyId = 'ea25ed83-dcff-45ad-a411-6048144421b5'; // ID from create_test_user script

async function debug() {
    try {
        console.log('Fetching stats...');
        const stats = await dashboardService.getDashboardStats(companyId);
        console.log('Stats:', stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
    }
}

debug();
