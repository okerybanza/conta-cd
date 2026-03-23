import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting manual migration for fiscal period locks...');

    const sqlPath = path.join(__dirname, '../../../database/prisma/migrations/20260125_fiscal_period_locks/migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL by statements if necessary, but $executeRawUnsafe can handle multiple in some cases
    // To be safe, we split by common separators if needed, or just execute the whole block
    try {
        await prisma.$executeRawUnsafe(sql);
        console.log('✅ Migration applied successfully (Function and Triggers created)');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
