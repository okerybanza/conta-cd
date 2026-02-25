"use strict";
/**
 * Script de nettoyage automatique des comptes supprimés
 *
 * À exécuter quotidiennement via un cron job :
 * 0 2 * * * cd /path/to/backend && npm run cleanup-accounts
 *
 * Ce script anonymise les comptes supprimés après la période d'anonymisation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Charger les variables d'environnement
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const database_1 = __importDefault(require("../config/database"));
const account_deletion_service_1 = __importDefault(require("../services/account-deletion.service"));
const logger_1 = __importDefault(require("../utils/logger"));
async function cleanupAnonymizedAccounts() {
    console.log('🧹 Démarrage du nettoyage des comptes anonymisés...\n');
    try {
        const result = await account_deletion_service_1.default.cleanupAnonymizedAccounts();
        console.log(`\n📊 Résumé du nettoyage:`);
        console.log(`   📋 Total de comptes vérifiés: ${result.total}`);
        console.log(`   ✅ Comptes anonymisés: ${result.anonymized}`);
        if (result.errors > 0) {
            console.log(`   ❌ Erreurs: ${result.errors}`);
        }
        console.log(`\n✅ Nettoyage terminé\n`);
        logger_1.default.info('Account cleanup script completed', result);
    }
    catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.message);
        logger_1.default.error('Account cleanup script failed', { error: error.message });
        process.exit(1);
    }
    finally {
        await database_1.default.$disconnect();
    }
}
// Exécuter le script
cleanupAnonymizedAccounts();
//# sourceMappingURL=cleanup-anonymized-accounts.js.map