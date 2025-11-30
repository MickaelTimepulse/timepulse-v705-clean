# 📦 Guide de Sauvegarde Timepulse

Ce guide détaille toutes les solutions de backup disponibles pour votre projet.

---

## 🎯 Solutions de Backup Disponibles

### 1. **Backup Supabase (Base de données)**

#### A. Backups automatiques Supabase
- **Accès** : [Dashboard Supabase](https://supabase.com/dashboard) → Votre projet → Settings → Database → Backups
- **Fréquence** : Quotidienne (plan gratuit = 7 jours, plan Pro = 30 jours)
- **Restauration** : Via le dashboard Supabase

#### B. Script de backup manuel (API)
```bash
# Installer les dépendances
npm install

# Backup d'une table spécifique
npx tsx backup-supabase-api.ts email_logs

# Backup complet (toutes les tables + migrations)
npx tsx backup-supabase-api.ts all

# Backup des migrations uniquement
npx tsx backup-supabase-api.ts migrations
```

**Fichiers générés** : `backups/backup_[table]_[date].json`

---

### 2. **Backup du Code Source (Git)**

#### Configuration recommandée

```bash
# Initialiser Git (si pas déjà fait)
git init

# Ajouter un remote (GitHub/GitLab)
git remote add origin https://github.com/votre-username/timepulse.git

# Premier commit
git add .
git commit -m "Initial commit - Timepulse project"
git push -u origin main
```

#### Commits automatiques quotidiens (optionnel)

Créer un cron job :
```bash
crontab -e

# Ajouter cette ligne pour un commit quotidien à minuit
0 0 * * * cd /chemin/vers/projet && git add . && git commit -m "Auto backup $(date)" && git push
```

---

### 3. **Backup Complet Manuel (avant migrations critiques)**

#### Script complet
```bash
# Créer un backup complet
npm run backup:full
```

Ce script :
- ✅ Exporte toutes les tables en JSON
- ✅ Copie toutes les migrations SQL
- ✅ Crée une archive datée dans `backups/`

---

### 4. **Export SQL des Migrations**

Toutes vos migrations sont déjà sauvegardées dans :
```
supabase/migrations/
  ├── 20251014201249_create_timepulse_schema.sql
  ├── 20251014205617_create_admin_users_fixed.sql
  ├── ... (toutes vos migrations)
```

Pour créer une copie de sécurité :
```bash
# Copier le dossier des migrations
cp -r supabase/migrations backups/migrations_$(date +%Y_%m_%d)
```

---

## 🔧 Mise en Place Recommandée

### Étape 1 : Ajouter les scripts au package.json

```json
{
  "scripts": {
    "backup": "tsx backup-supabase-api.ts",
    "backup:full": "tsx backup-supabase-api.ts all",
    "backup:migrations": "tsx backup-supabase-api.ts migrations"
  }
}
```

### Étape 2 : Routine de backup

**Avant chaque migration critique** :
```bash
npm run backup:full
git add . && git commit -m "Backup avant migration" && git push
```

**Backup hebdomadaire** (à planifier) :
```bash
npm run backup:full
```

---

## 📥 Restauration

### Restaurer une table depuis JSON
```typescript
// restore.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const data = JSON.parse(fs.readFileSync('backups/backup_email_logs_2025_10_23.json', 'utf-8'));

async function restore() {
  const { error } = await supabase.from('email_logs').insert(data);
  if (error) console.error('Erreur:', error);
  else console.log('✅ Données restaurées');
}

restore();
```

### Restaurer depuis Supabase Dashboard
1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet
3. Settings → Database → Backups
4. Cliquer sur "Restore" à côté du backup souhaité

---

## 🚨 Checklist Pré-Migration

Avant toute migration critique :

- [ ] `npm run backup:full`
- [ ] `git add . && git commit -m "Backup avant migration"`
- [ ] `git push` (si configuré)
- [ ] Vérifier que les fichiers sont dans `backups/`
- [ ] Noter l'heure du dernier backup Supabase

---

## 💡 Bonnes Pratiques

1. **Git commits réguliers** : Commitez après chaque fonctionnalité importante
2. **Backup manuel avant migrations** : Toujours faire `npm run backup:full`
3. **Conservation des backups** : Garder au moins 3 backups complets
4. **Test de restauration** : Testez la restauration sur une copie de projet
5. **Documentation** : Notez les changements majeurs dans les commits

---

## 🆘 En Cas de Problème

### Récupération rapide
```bash
# Lister les backups disponibles
ls -lh backups/

# Restaurer les migrations
cp -r backups/migrations_YYYY_MM_DD/* supabase/migrations/

# Restaurer les données (voir section Restauration ci-dessus)
```

### Contact Supabase Support
- Email : support@supabase.io
- Dashboard → Support

---

## 📝 Notes

- Les backups JSON sont dans `backups/`
- Les migrations SQL sont dans `supabase/migrations/`
- Pensez à ajouter `backups/` à `.gitignore` si les fichiers sont trop volumineux
- Pour les exports Supabase natifs : utilisez le dashboard officiel

---

**Date de création** : 2025-10-23
**Dernière mise à jour** : 2025-10-23
