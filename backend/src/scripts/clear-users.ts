import prisma from '../config/database';

async function clearUserData() {
    console.log('🗑️  Clearing user data to allow email reuse...\n');

    try {
        // Delete users (this will cascade to related data)
        const deleteResult = await prisma.users.deleteMany({
            where: {
                role: { not: 'superadmin' } // Keep superadmin accounts
            }
        });

        console.log(`✅ Deleted ${deleteResult.count} user account(s)`);
        console.log('');
        console.log('You can now register with any email address again!');
        console.log('');

    } catch (error: any) {
        console.error('❌ Error clearing user data:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

clearUserData();
