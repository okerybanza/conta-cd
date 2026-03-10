# 📋 Attribution des Ports - Conta.cd

**Date de création**: 2026-01-15  
**Dernière mise à jour**: 2026-01-15  
**Responsable**: Infrastructure

---

## 🎯 Principe d'Attribution

Les ports sont attribués de manière **logique, fixe et documentée** pour éviter les conflits et faciliter la maintenance.

### Règles d'Attribution

1. **Ports système (0-1023)**: Réservés aux services système
2. **Ports services standards (1024-49151)**: Attribués par catégorie
3. **Ports dynamiques (49152-65535)**: Réservés pour les connexions éphémères

---

## 📊 Ports Réservés par les Services Système

| Port | Service | Description | Statut |
|------|---------|-------------|--------|
| 22 | SSH | Accès sécurisé au serveur | ✅ Réservé |
| 25 | SMTP | Envoi d'emails (non utilisé) | ✅ Réservé |
| 53 | DNS | Résolution de noms | ✅ Réservé |
| 80 | HTTP | Nginx - Redirection vers HTTPS | ✅ Réservé |
| 110 | POP3 | Réception emails (non utilisé) | ✅ Réservé |
| 143 | IMAP | Réception emails (non utilisé) | ✅ Réservé |
| 443 | HTTPS | Nginx - Trafic sécurisé | ✅ Réservé |
| 465 | SMTPS | SMTP sécurisé (mail.kazurihost.com) | ✅ Réservé |
| 587 | SMTP | SMTP avec STARTTLS | ✅ Réservé |
| 993 | IMAPS | IMAP sécurisé | ✅ Réservé |
| 995 | POP3S | POP3 sécurisé | ✅ Réservé |

---

## 🗄️ Ports des Bases de Données et Services

| Port | Service | Description | Statut |
|------|---------|-------------|--------|
| 5432 | PostgreSQL | Base de données principale | ✅ Réservé |
| 6379 | Redis | Cache et queues (optionnel) | ✅ Réservé |
| 27017 | MongoDB | Non utilisé | ⚪ Disponible |

---

## 🚀 Ports Attribués - Application Conta.cd

### Plage d'Attribution: 3000-3099 (Applications Node.js)

| Port | Service | Description | Configuration | Statut |
|------|---------|-------------|---------------|--------|
| 3000 | Frontend (Vite) | Serveur de développement frontend | `frontend/vite.config.ts` | ✅ **ATTRIBUÉ** |
| 3001 | Backend API | API REST principale | `backend/.env` + `ecosystem.config.js` | ✅ **ATTRIBUÉ** |
| 3002 | Backend API (Alternatif) | Port de secours si 3001 occupé | Scripts de migration | ⚠️ **RÉSERVÉ** |

### Plage d'Attribution: 8000-8099 (Services Web Alternatifs)

| Port | Service | Description | Configuration | Statut |
|------|---------|-------------|---------------|--------|
| 8000-8099 | Réservé | Pour futurs services web | - | ⚪ **DISPONIBLE** |

### Plage d'Attribution: 9000-9099 (Services d'Administration)

| Port | Service | Description | Configuration | Statut |
|------|---------|-------------|---------------|--------|
| 9090 | Cockpit | Interface d'administration système | Systemd | ✅ **RÉSERVÉ** |

---

## 📝 Historique des Attributions

| Date | Port | Service | Action | Raison |
|------|-------|---------|--------|--------|
| 2026-01-15 | 3000 | Frontend Vite | ✅ Attribué | Serveur de développement frontend |
| 2026-01-15 | 3001 | Backend API | ✅ Attribué | API REST principale Conta.cd |
| 2026-01-15 | 3002 | Backend API | ⚠️ Réservé | Port de secours documenté |
| 2026-01-15 | 3001 | Backend API | ✅ Fixé | Port fixé dans .env et ecosystem.config.js |

---

## 🔍 Vérification des Ports

### Commandes Utiles

```bash
# Voir tous les ports en écoute
ss -tlnp | grep LISTEN

# Vérifier un port spécifique
ss -tlnp | grep :3001

# Vérifier les processus PM2
pm2 list

# Vérifier les services systemd
systemctl list-units --type=service --state=running
```

### Script de Vérification

Un script existe pour vérifier l'état des ports :
```bash
/home/conta/conta.cd/scripts/check-ports.sh
```

---

## ⚠️ Règles Importantes

1. **NE JAMAIS attribuer un port sans documentation**
2. **Vérifier la disponibilité avant attribution**
3. **Mettre à jour ce document à chaque nouvelle attribution**
4. **Utiliser des plages logiques par type de service**
5. **Respecter les ports standards (PostgreSQL, Redis, etc.)**

---

## 🎨 Schéma d'Architecture Réseau

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS (443) / HTTP (80)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                    │
│                    Ports: 80, 443                           │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │                              │
    ┌──────────▼──────────┐      ┌───────────▼──────────┐
    │  Frontend (Vite)    │      │   Backend API        │
    │  Port: 3000          │      │   Port: 3001         │
    │  (Dev uniquement)    │      │   (Production)      │
    └──────────────────────┘      └───────────┬──────────┘
                                               │
                          ┌────────────────────┴────────────────────┐
                          │                                         │
                  ┌───────▼────────┐                      ┌─────────▼────────┐
                  │  PostgreSQL   │                      │     Redis        │
                  │  Port: 5432   │                      │   Port: 6379     │
                  └────────────────┘                      └──────────────────┘
```

---

## 📌 Prochaines Attributions Possibles

Si de nouveaux services sont nécessaires, utiliser les plages suivantes :

- **Workers/Jobs**: 4000-4099
- **Services internes**: 5000-5099
- **Services de monitoring**: 6000-6099
- **Services de développement**: 7000-7099

---

**⚠️ IMPORTANT**: Toute nouvelle attribution de port DOIT être documentée dans ce fichier avant d'être utilisée.
