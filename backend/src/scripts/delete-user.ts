import prisma from '../config/database';

async function deleteUser() {
    const email = 'erick.banza@hologram.cd';

    console.log(`🗑️  Deleting user account: ${email}...`);

    try {
        // Delete the user (cascades will handle related data)
        const result = await prisma.users.deleteMany({
            where: { email }
        });

        if (result.count > 0) {
            console.log(`✅ Successfully deleted ${result.count} account(s) with email: ${email}`);
            console.log('You can now register with this email again!');
        } else {
            console.log(`⚠️  No account found with email: ${email}`);
        }

    } catch (error: any) {
        console.error('❌ Error deleting user:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

deleteUser();
