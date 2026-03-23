# Tests - Conta Backend

## Structure des tests

Les tests sont organisés par type :

- **Services** : Tests unitaires des services métier
- **Integration** : Tests d'intégration entre plusieurs services

## Exécution des tests

```bash
# Exécuter tous les tests
npm test

# Exécuter avec couverture
npm test -- --coverage

# Exécuter un fichier spécifique
npm test -- package.service.test.ts

# Exécuter en mode watch
npm test -- --watch
```

## Configuration

Les tests utilisent Jest avec ts-jest pour le support TypeScript.

La configuration se trouve dans `jest.config.js`.

## Base de données de test

⚠️ **Important** : Les tests utilisent la même base de données que le développement. 
Assurez-vous d'avoir une base de données de test séparée en production.

Pour utiliser une base de données de test, modifiez la variable d'environnement `DATABASE_URL` dans un fichier `.env.test`.

## Tests disponibles

### Services Packages
- `package.service.test.ts` : Tests du service Package
- `subscription.service.test.ts` : Tests du service Subscription
- `usage.service.test.ts` : Tests du service Usage
- `quota.service.test.ts` : Tests du service Quota

### Services Dépenses
- `expense.service.test.ts` : Tests du service Expense

### Tests d'intégration
- `quota-integration.test.ts` : Tests d'intégration des quotas avec création de ressources

## Notes

- Les tests créent des données de test qui sont nettoyées après chaque suite de tests
- Certains tests nécessitent des packages existants dans la base de données
- Les tests vérifient à la fois les cas de succès et les cas d'erreur

