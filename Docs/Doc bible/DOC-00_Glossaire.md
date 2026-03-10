# DOC-00 — Glossaire Conta
> **Document fondateur — à lire avant tous les autres DOC.**
> Chaque terme utilisé dans les DOC-01 à DOC-11 est défini ici.
> En cas de doute sur un mot, c'est ici qu'on cherche — pas dans le code.

---

## A

### Agrégat
Entité métier centrale dont l'état ne peut être modifié que par des événements métier.
Exemples dans Conta : une Facture, un Mouvement de Stock, une Paie.
**Règle :** on ne modifie jamais un agrégat directement (UPDATE SQL interdit).
Voir DOC-02.

### Annulation
Action de mettre fin à un document métier (facture, mouvement, paie).
**Jamais une suppression physique.**
Toujours réalisée par un événement d'inversion lié à l'original.
Voir DOC-07, DOC-03.

### Audit / Audit Trail
Registre immuable de toutes les actions sensibles effectuées dans le système.
Répond aux questions : Qui ? Quand ? Sur quoi ? Avant/Après quoi ?
Implémenté dans : `audit_logs` (table DB) + `auditTrail.service.ts`.
Voir DOC-08.

---

## B

### Balance (solde comptable)
Résultat calculé d'un compte comptable à un instant donné.
**Jamais une valeur stockée directement.**
Calculée à partir des écritures comptables validées.

### BCC
Banque Centrale du Congo. Fournit les taux de change CDF/USD en temps réel.
Intégré dans `currencyExchange.service.ts` via API publique.

### BullMQ
Système de queues de travail asynchrone basé sur Redis.
Utilisé pour : emails, notifications, jobs planifiés, traitements lourds.

---

## C

### Cabinet (d'expertise comptable)
Entité logique représentant la structure professionnelle d'un expert-comptable.
Un cabinet peut regrouper plusieurs utilisateurs (collaborateurs).
Un cabinet peut gérer plusieurs entreprises clientes.
Voir DOC-05.

### CDF
Franc Congolais. Devise officielle de la RDC.
Devise principale par défaut pour les entreprises RDC dans Conta.

### Clôture (d'une période)
Action explicite et irréversible qui fige une période comptable.
Après clôture : aucune écriture, aucun mouvement, aucune modification possible dans cette période.
Voir DOC-09.

### Commit (transaction)
Validation atomique d'un ensemble d'opérations en base de données.
Dans Conta : un flux métier critique (facture + stock + compta) doit être validé en un seul commit.
Si une opération échoue → rollback total.
Voir DOC-02.

### Comptabilité en partie double
Principe fondamental : chaque écriture comptable débite un compte et en crédite un autre.
Le total des débits = le total des crédits. Toujours.
Implémenté dans le module Journal Comptable.

### Contrat (employé)
Document RH définissant les conditions d'emploi d'un employé.
Un employé peut avoir plusieurs contrats successifs, jamais deux actifs simultanément.
Voir DOC-04.

### Controller
Couche technique qui reçoit les requêtes HTTP, valide les inputs, et délègue au Service.
**Un controller ne contient jamais de logique métier.**

---

## D

### Datarissage
**Terme propre à Conta.**
Processus d'initialisation obligatoire d'une entreprise dans le système.
C'est l'acte de naissance comptable, organisationnel et opérationnel de l'entreprise.
Certains choix faits au datarissage sont verrouillés définitivement.
Champ DB : `companies.datarissage_completed` (booléen).
Voir DOC-01.

### Délégation
Mécanisme par lequel une entreprise accorde des droits limités à un expert-comptable.
Toujours : explicite, limitée par module, révocable instantanément.
Voir DOC-05.

### Devise principale
Devise dans laquelle l'entreprise tient sa comptabilité officielle.
Configurée au datarissage. Verrouillée après validation.
≠ devise de transaction (on peut facturer en USD même si devise principale = CDF).

### Domain Event (événement de domaine)
Message interne émis quand une action métier significative se produit.
Exemples : `InvoiceValidated`, `StockMovementCreated`, `PayrollValidated`.
Immuable, horodaté, identifié.
Implémenté dans `events/domain-event.ts` + `events/event-bus.ts`.
Voir DOC-02.

### DRAFT
Premier état d'un document métier (facture, mouvement, paie).
L'objet est modifiable, non engageant, non comptable.
Voir DOC-07.

---

## E

### Écriture comptable
Enregistrement d'une opération financière dans le journal comptable.
Structure minimale : compte débité, compte crédité, montant, date, période, justification.
Immuable une fois validée.
Voir DOC-07.

### Employé
Entité RH représentant une personne physique liée à l'entreprise.
**≠ Utilisateur** (un employé n'a pas forcément de compte applicatif).
Voir DOC-04.

### Entrepôt (Warehouse)
Emplacement physique ou logique de stockage de marchandises.
Dans Conta : mode multi-entrepôts configurable au datarissage.
Voir DOC-03.

### Event Bus
Mécanisme interne de publication/consommation d'événements entre modules.
Pas de dépendance externe (pas de Kafka) — implémentation légère.
Implémenté dans `events/event-bus.ts`.
Voir DOC-02.

### Expert-Comptable
Profil utilisateur Conta représentant un professionnel comptable externe.
Accède à plusieurs entreprises clientes depuis un seul login.
Droits strictement délégués, limités, traçables et révocables.
Voir DOC-05.

---

## F

### Facture
Document commercial émis par une entreprise à son client.
Cycle de vie strict : DRAFT → VALIDÉE → PAYÉE ou ANNULÉE.
Jamais supprimée. Jamais modifiée après validation.
Voir DOC-07.

### FIFO (First In, First Out)
Méthode de valorisation du stock : les premières marchandises entrées sont les premières sorties.
Choix configuré au datarissage. Irréversible.
Voir DOC-03.

### Fiscal (période, export, conformité)
Ce qui est relatif aux obligations légales et comptables envers l'État.
Dans Conta : TVA, export fiscal SYSCOHADA, périodes comptables.

---

## G

### Garde-fou
Mécanisme technique ou métier qui empêche une action interdite.
Exemples : blocage d'écriture sur période clôturée, interdiction de stock négatif.
Voir DOC-02, DOC-09.

---

## H

### Handler (event handler)
Fonction qui réagit à un Domain Event et produit des effets de bord.
Exemples : `StockMovementCreated` → mise à jour vue stock, écriture comptable.
Implémenté dans `events/handlers/`.

---

## I

### Inversion
Mécanisme de correction d'une erreur dans un système ERP.
On ne supprime jamais l'erreur. On crée un nouvel événement qui l'annule.
La somme erreur + inversion = zéro.
C'est la norme comptable internationale.
Voir DOC-02, DOC-07.

### INSS
Institut National de Sécurité Sociale (RDC).
Cotisation patronale et salariale obligatoire en RDC.
Non encore implémenté dans le module paie. À traiter en Phase 3.

### IPR
Impôt Professionnel sur les Revenus (RDC).
Retenue à la source sur les salaires.
Non encore implémenté dans le module paie. À traiter en Phase 3.

---

## J

### Journal comptable
Registre chronologique de toutes les écritures comptables.
Organisé par journaux (ventes, achats, banque, opérations diverses).
Immuable : on y ajoute des entrées, on n'en retire jamais.

### JTI (JWT ID)
Identifiant unique d'un token JWT, stocké en Redis.
Permet la révocation individuelle d'un token sans invalider tous les tokens.

---

## L

### Lot (batch)
Groupe d'unités d'un même produit avec des attributs communs (date d'expiration, numéro de lot).
Utilisé pour la traçabilité avancée du stock.
Voir DOC-03.

---

## M

### MaxiCash
Système de paiement mobile africain (RDC).
Champs DB présents dans Conta. Service backend non encore implémenté.
À traiter en Phase 3.

### Middleware
Couche logicielle qui intercepte les requêtes avant qu'elles atteignent le controller.
Exemples dans Conta : `auth.middleware`, `datarissage.middleware`, `conta-permissions.middleware`.

### Mouvement de stock
Événement enregistrant une entrée, sortie, transfert ou ajustement de marchandises.
Structure : type + produit + entrepôt + quantité + référence métier.
Immuable une fois validé.
Voir DOC-03.

### Moyenne pondérée (valorisation)
Méthode de valorisation du stock : coût moyen calculé sur toutes les unités disponibles.
Alternative au FIFO. Choix configuré au datarissage. Irréversible.
Voir DOC-03.

---

## O

### ONEM
Office National de l'Emploi (RDC).
Contribution employeur obligatoire.
Non encore implémenté. À traiter en Phase 3.

### Owner
Rôle système du propriétaire d'une entreprise dans Conta.
Ne peut pas être supprimé. Peut être transféré via processus contrôlé.
Valide le datarissage. Délègue les rôles.
Voir DOC-06.

---

## P

### Paie
Résultat calculé de la rémunération d'un employé pour une période.
Construite à partir du contrat actif + temps validé + événements RH.
Jamais saisie directement.
Immuable après validation.
Voir DOC-04.

### Période (comptable)
Intervalle de temps métier (généralement mensuel) qui structure les opérations.
Statuts : OUVERTE ou CLÔTURÉE.
Une période clôturée est intouchable.
Voir DOC-09.

### Permissions
Autorisations explicites d'exécuter des actions métier précises.
Dans Conta : système RBAC (Role-Based Access Control).
Implémenté dans `conta-permissions.middleware` (partiellement).
Voir DOC-06.

### Plan comptable
Liste structurée de tous les comptes comptables utilisés par une entreprise.
Dans Conta : basé sur SYSCOHADA (norme Afrique Centrale).
Voir module Accounts.

### Prisma
ORM (Object-Relational Mapper) utilisé dans Conta pour interagir avec PostgreSQL.
Le fichier `schema.prisma` est la source de vérité de la structure DB.
Toute modification DB passe par une migration Prisma.

---

## R

### RBAC (Role-Based Access Control)
Système de contrôle d'accès basé sur les rôles.
Dans Conta : chaque rôle a un ensemble de permissions métier précises.
Voir DOC-06.

### Réconciliation / Rapprochement bancaire
Processus de vérification de la correspondance entre les mouvements bancaires
et les écritures comptables.
Module implémenté dans Conta.

### Rollback
Annulation de toutes les opérations d'une transaction en cas d'échec.
Dans Conta : si un flux critique échoue à mi-chemin → tout est annulé.
Voir DOC-02.

### Rôle
Ensemble cohérent de permissions lié à une fonction métier.
Rôles Conta : `owner`, `admin`, `manager`, `accountant`, `rh`, `employee`, `conta_user`.
Voir DOC-06.

---

## S

### SaaS (Software as a Service)
Modèle de distribution logicielle où l'application est hébergée et accessible via internet.
Conta est un SaaS multi-tenant.

### Ségrégation des fonctions (SOD)
Règle qui interdit à une même personne de créer ET valider le même objet métier.
Implémentée dans `segregationOfDuties.service.ts`.
Voir DOC-06.

### Service
Couche technique qui contient la logique métier.
Unique point d'écriture autorisé sur les données.
Un service peut appeler d'autres services ou émettre des événements.

### Soft delete
Suppression logique d'un enregistrement (champ `deleted_at` renseigné).
L'enregistrement reste en base, invisible dans l'interface.
**Jamais de suppression physique (hard delete) sur les données financières.**

### Stock courant
Quantité disponible d'un produit dans un entrepôt à un instant donné.
**Toujours une valeur calculée** (vue DB), jamais stockée directement.
Calculée : SUM(IN) - SUM(OUT) sur les mouvements validés.
Voir DOC-03.

### SYSCOHADA
Système Comptable OHADA. Norme comptable officielle de 17 pays d'Afrique.
Conta utilise le plan comptable SYSCOHADA comme base.

---

## T

### Template (facture / email)
Modèle de mise en page pour la génération de PDF ou d'emails.
Conta dispose de 24 templates de factures et 16 templates d'emails.
Technologie : Handlebars + Puppeteer.

### Transaction atomique
Ensemble d'opérations DB qui réussissent toutes ensemble ou échouent toutes.
Principe "tout ou rien".
Dans Conta : obligatoire pour tout flux touchant plusieurs modules.
Voir DOC-02.

### TVA
Taxe sur la Valeur Ajoutée. Impôt indirect collecté par les entreprises.
Module TVA de Conta gère les taux, la collecte et les déclarations.

---

## U

### Utilisateur
Entité système représentant une personne qui se connecte à Conta.
**≠ Employé** (un utilisateur n'est pas forcément un employé).
Possède un rôle, appartient à une entreprise (ou à un cabinet).

---

## V

### Validation (d'un document)
Action qui fait passer un document de DRAFT à VALIDÉ.
Déclenche des événements métier (stock, compta, notifications).
Irréversible directement — correction uniquement par inversion.
Voir DOC-07.

### Valorisation (du stock)
Calcul de la valeur financière du stock.
Méthodes disponibles : FIFO ou Moyenne pondérée.
Choix fait au datarissage, irréversible.
Voir DOC-03.

### VisaPay
Système de paiement mobile africain intégré dans Conta.
Avantage concurrentiel fort pour le marché RDC.
Intégré via client HTTP custom dans `visapay.service.ts`.

---

## W

### Webhook
Endpoint HTTP qui reçoit des notifications d'un service externe.
Dans Conta : webhooks PayPal (paiements) et WhatsApp (messages entrants).
⚠️ Webhook PayPal non sécurisé actuellement (issue S3).
⚠️ Webhook WhatsApp entrant non implémenté (TODO T7).

---

*Fin du DOC-00 — Glossaire Conta — Version 1.0 — Mars 2026*
*Ce document doit être mis à jour à chaque ajout de terme métier nouveau.*
