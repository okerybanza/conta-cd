
import prisma from '../src/config/database';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

async function createTestUser() {
    try {
        console.log('Creating test user...');

        // Check if company exists or create one
        let company = await prisma.companies.findFirst({
            where: { name: 'Test Company' }
        });

        if (!company) {
            company = await prisma.companies.create({
                data: {
                    id: randomUUID(),
                    name: 'Test Company',
                    email: 'test@company.com',
                    phone: '123456789',
                    account_type: 'ENTREPRENEUR',
                    is_system_company: false,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
            console.log('Created company:', company.id);
        } else {
            console.log('Using existing company:', company.id);
        }

        // Check if user exists
        let user = await prisma.users.findUnique({
            where: { email: 'contact@techsolutions.cd' }
        });

        if (!user) {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            user = await prisma.users.create({
                data: {
                    id: randomUUID(),
                    email: 'contact@techsolutions.cd',
                    password_hash: hashedPassword,
                    first_name: 'Test',
                    last_name: 'User',
                    role: 'admin',
                    company_id: company.id,
                    email_verified: true,
                    is_conta_user: false,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
            console.log('Created user:', user.email);
        } else {
            // Update password just in case
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            await prisma.users.update({
                where: { id: user.id },
                data: { password_hash: hashedPassword }
            });
            console.log('Updated user password:', user.email);
        }

        // Check subscription
        const subscription = await prisma.subscriptions.findUnique({
            where: { company_id: company.id }
        });

        if (!subscription) {
            // Get a package
            const pkg = await prisma.packages.findFirst();
            if (pkg) {
                await prisma.subscriptions.create({
                    data: {
                        id: randomUUID(),
                        company_id: company.id,
                        package_id: pkg.id,
                        status: 'active',
                        billing_cycle: 'monthly',
                        start_date: new Date(),
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                });
                console.log('Created subscription');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser();
