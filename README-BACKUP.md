# 📦 Système de Sauvegarde Timepulse - Guide Rapide

## 🎯 Démarrage Rapide

### Backup Avant Migration Critique
```bash
./pre-migration-backup.sh "nom_de_votre_migration"
```

### Backup Complet Rapide
```bash
npm run backup:full
```

### Export Complet du Projet
```bash
./export-complete.sh
```

---

## 📚 Documentation Complète

- **[BACKUP_GUIDE.md](BACKUP_GUIDE.md)** - Guide complet de sauvegarde
- **[RESTORATION_GUIDE.md](RESTORATION_GUIDE.md)** - Guide de restauration

---

## 🛠️ Scripts Disponibles

### Scripts NPM

```bash
# Backup d'une table spécifique
npm run backup email_logs

# Backup complet (toutes tables + migrations)
npm run backup:full

# Backup des migrations uniquement
npm run backup:migrations
```

### Scripts Shell

```bash
# Backup pré-migration (recommandé avant changements critiques)
./pre-migration-backup.sh "ajout_nouvelle_colonne"

# Export complet pour archivage externe
./export-complete.sh

# Restauration depuis un backup
./restore-backup.sh backups/pre-migration-xxx-xxx

# Commits automatiques quotidiens (à configurer dans crontab)
./auto-commit.sh
```

---

## 🔄 Workflow Recommandé

### 1. Développement Normal
```bash
# Commits réguliers
git add .
git commit -m "Ajout fonctionnalité X"
```

### 2. Avant Migration Critique
```bash
# Backup complet automatique
./pre-migration-backup.sh "migration_ajout_paiements"

# Appliquer la migration
# ...

# Si problème : restaurer
./restore-backup.sh backups/pre-migration-migration_ajout_paiements-20251023_120000
```

### 3. Export Hebdomadaire
```bash
# Chaque lundi à minuit (exemple crontab)
0 0 * * 1 cd /chemin/vers/projet && ./export-complete.sh

# L'archive sera dans exports/timepulse-export-[date].tar.gz
```

---

## 📁 Structure des Backups

```
project/
├── backups/                          # Backups automatiques
│   ├── backup_*.json                # Données des tables
│   ├── migrations_*/                # Copies des migrations
│   └── pre-migration-*/             # Backups pré-migration complets
│
├── exports/                         # Exports complets
│   └── timepulse-export-*.tar.gz   # Archives prêtes à télécharger
│
└── supabase/migrations/            # Migrations SQL versionnées
```

---

## ⚠️ Checklist Sécurité

Avant toute opération critique :

- [ ] Faire `./pre-migration-backup.sh "description"`
- [ ] Vérifier que le backup est complet
- [ ] Tester sur une copie si possible
- [ ] Garder le terminal du backup ouvert
- [ ] Noter l'heure du backup Supabase natif

---

## 🆘 Restauration Rapide

```bash
# 1. Lister les backups disponibles
ls -lt backups/

# 2. Restaurer
./restore-backup.sh backups/pre-migration-[nom]-[timestamp]

# 3. Vérifier
npm run dev
```

---

## 🔧 Configuration Git Automatique

### Commits Automatiques Quotidiens

```bash
# Éditer crontab
crontab -e

# Ajouter cette ligne (backup quotidien à minuit)
0 0 * * * cd /chemin/absolu/vers/projet && ./auto-commit.sh >> logs/auto-backup.log 2>&1
```

### Hook Post-Commit (déjà configuré)

À chaque commit Git, un backup des migrations est automatiquement créé.

---

## 📊 Backups Supabase Natifs

En parallèle de ces scripts, Supabase effectue des backups automatiques :

- **Plan gratuit** : Quotidiens (conservés 7 jours)
- **Plan Pro** : Quotidiens (conservés 30 jours) + PITR

Accès : [Supabase Dashboard](https://supabase.com/dashboard) → Settings → Database → Backups

---

## 💡 Bonnes Pratiques

1. **Git commits fréquents** après chaque fonctionnalité
2. **Backup pré-migration** pour tout changement de schéma
3. **Export mensuel** pour archivage externe
4. **Test de restauration** trimestriel
5. **Conservation** des 3 derniers exports complets

---

## 🔗 Liens Utiles

- Documentation Supabase Backups : https://supabase.com/docs/guides/platform/backups
- Documentation Git : https://git-scm.com/doc

---

**Date de création** : 2025-10-23
**Projet** : Timepulse - Plateforme de chronométrage et inscriptions sportives
