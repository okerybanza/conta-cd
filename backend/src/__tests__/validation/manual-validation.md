# Guide de Validation Manuelle

Ce document décrit les étapes pour valider manuellement les fonctionnalités du système de packages et dépenses.

## Prérequis

1. Base de données configurée et migrée
2. Packages seedés (Essentiel, Professionnel, Entreprise)
3. Serveur backend démarré
4. Frontend démarré (optionnel pour tests API)

## 1. Validation du Système Packages

### 1.1 Liste des Packages

**Endpoint** : `GET /api/v1/packages`

**Test** :
```bash
curl http://localhost:3000/api/v1/packages
```

**Résultat attendu** :
- Retourne 3 packages (Essentiel, Professionnel, Entreprise)
- Tous les packages ont `isActive: true`
- Packages triés par `displayOrder`

### 1.2 Détails d'un Package

**Endpoint** : `GET /api/v1/packages/:id`

**Test** :
```bash
# Récupérer l'ID d'un package depuis la liste
curl http://localhost:3000/api/v1/packages/{packageId}
```

**Résultat attendu** :
- Retourne les détails du package
- Contient `limits` et `features`
- Prix en CDF

### 1.3 Création d'un Abonnement

**Endpoint** : `POST /api/v1/subscription`

**Test** :
```bash
# Se connecter d'abord pour obtenir le token
curl -X POST http://localhost:3000/api/v1/subscription \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "{packageId}",
    "billingCycle": "monthly",
    "trialDays": 14
  }'
```

**Résultat attendu** :
- Abonnement créé avec statut "trial"
- `trialEndsAt` défini à 14 jours
- `endDate` calculé selon le cycle de facturation

### 1.4 Vérification de l'Abonnement Actif

**Endpoint** : `GET /api/v1/subscription`

**Test** :
```bash
curl http://localhost:3000/api/v1/subscription \
  -H "Authorization: Bearer {token}"
```

**Résultat attendu** :
- Retourne l'abonnement actif
- Inclut les détails du package

## 2. Validation des Quotas

### 2.1 Création de Clients (avec limite)

**Endpoint** : `POST /api/v1/customers`

**Test** :
1. Créer des clients jusqu'à atteindre la limite du package
2. Vérifier que le compteur d'usage s'incrémente
3. Tenter de créer un client au-delà de la limite

**Résultat attendu** :
- Les clients sont créés jusqu'à la limite
- Erreur `QUOTA_EXCEEDED` quand la limite est atteinte
- Message d'erreur suggère d'upgrader le plan

### 2.2 Création de Produits (avec limite)

**Endpoint** : `POST /api/v1/products`

**Test** : Similaire aux clients

**Résultat attendu** : Similaire aux clients

### 2.3 Vérification des Fonctionnalités

**Test** :
1. Tenter d'accéder à `/api/v1/expenses` avec un package sans fonctionnalité "expenses"
2. Vérifier que l'erreur `FEATURE_NOT_AVAILABLE` est retournée

**Résultat attendu** :
- Erreur 403 avec code `FEATURE_NOT_AVAILABLE`
- Message suggère d'upgrader le plan

## 3. Validation du Module Dépenses

### 3.1 Création d'une Dépense

**Endpoint** : `POST /api/v1/expenses`

**Test** :
```bash
curl -X POST http://localhost:3000/api/v1/expenses \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "expenseDate": "2025-01-15",
    "amountHt": 10000,
    "taxRate": 16,
    "amountTtc": 11600,
    "paymentMethod": "cash",
    "status": "draft"
  }'
```

**Résultat attendu** :
- Dépense créée avec numéro unique (format DEP-XXXXXX)
- Totaux calculés automatiquement
- Compteur d'usage incrémenté

### 3.2 Liste des Dépenses

**Endpoint** : `GET /api/v1/expenses`

**Test** :
```bash
curl http://localhost:3000/api/v1/expenses?page=1&limit=20 \
  -H "Authorization: Bearer {token}"
```

**Résultat attendu** :
- Liste paginée des dépenses
- Filtres fonctionnels (date, statut, fournisseur, catégorie)

### 3.3 Création d'un Fournisseur

**Endpoint** : `POST /api/v1/expenses/suppliers`

**Test** :
```bash
curl -X POST http://localhost:3000/api/v1/expenses/suppliers \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fournisseur Test",
    "email": "supplier@example.com",
    "phone": "+243900000000"
  }'
```

**Résultat attendu** :
- Fournisseur créé
- Compteur d'usage incrémenté
- Vérification de la limite de fournisseurs

### 3.4 Création d'une Catégorie

**Endpoint** : `POST /api/v1/expenses/categories`

**Test** : Similaire aux fournisseurs

**Résultat attendu** : Catégorie créée

## 4. Validation de l'Intégration Dashboard

### 4.1 Dashboard avec Dépenses

**Endpoint** : `GET /api/v1/dashboard/stats`

**Test** :
```bash
curl http://localhost:3000/api/v1/dashboard/stats \
  -H "Authorization: Bearer {token}"
```

**Résultat attendu** :
- Statistiques incluent les dépenses
- Graphique des dépenses par mois fonctionnel

### 4.2 Rapport de Cash Flow

**Endpoint** : `GET /api/v1/reports/cash-flow`

**Test** :
```bash
curl "http://localhost:3000/api/v1/reports/cash-flow?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer {token}"
```

**Résultat attendu** :
- Rapport inclut les dépenses
- Calcul correct du cash flow (revenus - dépenses)

## 5. Scénarios de Test Complets

### Scénario 1 : Package Essentiel

1. Créer une entreprise
2. S'abonner au package Essentiel
3. Créer 5 clients (limite)
4. Tenter de créer un 6ème client → Erreur
5. Créer des produits jusqu'à la limite
6. Tenter d'accéder aux dépenses → Erreur (fonctionnalité non disponible)

### Scénario 2 : Package Professionnel

1. Créer une entreprise
2. S'abonner au package Professionnel
3. Créer des dépenses
4. Créer des fournisseurs
5. Vérifier que toutes les fonctionnalités sont accessibles

### Scénario 3 : Upgrade de Package

1. Créer une entreprise avec package Essentiel
2. Atteindre la limite de clients
3. Upgrader vers Professionnel
4. Vérifier que les nouvelles limites s'appliquent immédiatement
5. Créer plus de clients

### Scénario 4 : Période d'Essai

1. Créer un abonnement avec période d'essai de 14 jours
2. Vérifier que `status` est "trial"
3. Vérifier que `trialEndsAt` est défini
4. Utiliser toutes les fonctionnalités pendant la période d'essai

## 6. Validation Frontend

### 6.1 Navigation

1. Vérifier que le lien "Dépenses" apparaît dans la sidebar
2. Cliquer sur "Dépenses" → Redirige vers `/expenses`
3. Vérifier que la page liste s'affiche correctement

### 6.2 Création de Dépense

1. Cliquer sur "Nouvelle dépense"
2. Remplir le formulaire
3. Vérifier le calcul automatique des totaux
4. Sauvegarder
5. Vérifier que la dépense apparaît dans la liste

### 6.3 Gestion des Erreurs

1. Tenter d'accéder aux dépenses sans package approprié
2. Vérifier que le message d'erreur s'affiche
3. Vérifier que le lien vers les packages est proposé

## 7. Checklist de Validation

- [ ] Packages listés correctement
- [ ] Abonnements créés et gérés
- [ ] Quotas appliqués correctement
- [ ] Fonctionnalités vérifiées
- [ ] Dépenses créées et listées
- [ ] Fournisseurs créés et gérés
- [ ] Catégories créées et gérées
- [ ] Dashboard inclut les dépenses
- [ ] Rapports incluent les dépenses
- [ ] Frontend fonctionnel
- [ ] Messages d'erreur appropriés
- [ ] Compteurs d'usage corrects

## Notes

- Utiliser Postman ou un client API similaire pour faciliter les tests
- Logger les requêtes pour déboguer
- Vérifier les logs backend pour les erreurs
- Tester avec différents packages pour valider les limites

