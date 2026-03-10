
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log('Fields in audit_logs:', Object.keys((prisma as any)._activeProvider === 'postgresql' ? {} : {}));
// More direct check
console.log('Model audit_logs fields:', (prisma as any)._runtimeDataModel.models.audit_logs.fields.map((f: any) => f.name));
process.exit(0);
