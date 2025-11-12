# 🔄 Guide de Restauration Timepulse

Guide complet pour restaurer votre projet Timepulse depuis un backup.

---

## 🎯 Quand Restaurer ?

- Après une migration qui a échoué
- Perte de données accidentelle
- Corruption de la base de données
- Retour à une version antérieure
- Migration d'environnement (dev → prod)

---

## 📋 Table des Matières

1. [Restauration Rapide](#restauration-rapide)
2. [Restauration Complète](#restauration-complète)
3. [Restauration d'une Table Unique](#restauration-dune-table-unique)
4. [Restauration depuis Export Complet](#restauration-depuis-export-complet)
5. [Restauration Supabase Native](#restauration-supabase-native)
6. [Dépannage](#dépannage)

---

## 🚀 Restauration Rapide

### Scénario : Vous avez fait un backup pré-migration qui a échoué

```bash
# 1. Identifier le backup
ls -lt backups/

# 2. Utiliser le script de restauration
./restore-backup.sh backups/pre-migration-[nom]-[timestamp]
```

---

## 🔧 Restauration Complète

### Étape 1 : Préparer l'environnement

```bash
# Arrêter l'application si elle tourne
# (pas nécessaire dans Bolt, mais important en production)

# Vérifier que vous avez les backups
ls -lh backups/
```

### Étape 2 : Restaurer la base de données

#### Option A : Via Script TypeScript (recommandé)

```bash
# Créer le script de restauration
npx tsx restore-database.ts
```

Créez le fichier `restore-database.ts` :

```typescript
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function restoreTable(tableName: string, backupFile: string) {
  console.log(`🔄 Restauration de ${tableName}...`);

  const data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

  // Supprimer les données existantes (ATTENTION : destructif)
  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tout

  if (deleteError) {
    console.error(`❌ Erreur lors de la suppression de ${tableName}:`, deleteError);
    return;
  }

  // Insérer les données du backup
  const { error: insertError } = await supabase
    .from(tableName)
    .insert(data);

  if (insertError) {
    console.error(`❌ Erreur lors de l'insertion dans ${tableName}:`, insertError);
    return;
  }

  console.log(`✅ ${tableName} restaurée (${data.length} lignes)`);
}

// Utilisation
const backupDate = process.argv[2] || '2025_10_23';
await restoreTable('email_logs', `backups/backup_email_logs_${backupDate}.json`);
```

#### Option B : Via Supabase Dashboard

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet
3. Table Editor → Sélectionner la table
4. Import Data → Charger le fichier JSON

### Étape 3 : Restaurer les migrations

```bash
# Si vous devez revenir à une version antérieure des migrations
# ATTENTION : Ceci peut être destructif

# 1. Sauvegarder les migrations actuelles
cp -r supabase/migrations supabase/migrations.backup

# 2. Restaurer depuis le backup
cp -r backups/pre-migration-[nom]/migrations/* supabase/migrations/

# 3. Vérifier le contenu
ls -l supabase/migrations/
```

### Étape 4 : Restaurer le code source

```bash
# Si vous avez fait un snapshot du code
cd backups/pre-migration-[nom]/
tar -xzf code-snapshot.tar.gz -C /chemin/vers/restauration/
```

Ou via Git :

```bash
# Revenir au commit pré-migration
git log --oneline | grep "Pre-migration backup"
git checkout [commit-hash]

# Créer une nouvelle branche pour tester
git checkout -b recovery-test
```

---

## 📦 Restauration d'une Table Unique

Parfois vous n'avez besoin de restaurer qu'une seule table.

### Script de restauration d'une table

```bash
# restore-single-table.sh
#!/bin/bash

TABLE_NAME=$1
BACKUP_FILE=$2

if [ -z "$TABLE_NAME" ] || [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore-single-table.sh table_name backup_file.json"
    exit 1
fi

echo "⚠️  ATTENTION : Cette opération va remplacer toutes les données de $TABLE_NAME"
read -p "Continuer? (oui/non) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
    echo "❌ Opération annulée"
    exit 1
fi

echo "🔄 Restauration de $TABLE_NAME depuis $BACKUP_FILE..."

npx tsx -e "
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const data = JSON.parse(fs.readFileSync('$BACKUP_FILE', 'utf-8'));

(async () => {
  await supabase.from('$TABLE_NAME').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error } = await supabase.from('$TABLE_NAME').insert(data);
  if (error) console.error('Erreur:', error);
  else console.log('✅ Restauration terminée:', data.length, 'lignes');
})();
"

echo "✅ Restauration de $TABLE_NAME terminée"
```

Utilisation :

```bash
chmod +x restore-single-table.sh
./restore-single-table.sh email_logs backups/backup_email_logs_2025_10_23.json
```

---

## 📥 Restauration depuis Export Complet

Si vous avez utilisé `export-complete.sh` :

### Étape 1 : Extraire l'archive

```bash
cd exports/
tar -xzf timepulse-export-[timestamp].tar.gz
cd timepulse-export-[timestamp]/
```

### Étape 2 : Installer les dépendances

```bash
npm install
```

### Étape 3 : Configurer l'environnement

```bash
cp .env.example .env
# Éditer .env avec vos credentials Supabase
```

### Étape 4 : Restaurer la base de données

```bash
# Pour chaque table dans database/
for file in database/*.json; do
    table=$(basename "$file" .json | sed 's/backup_//' | sed 's/_[0-9]*$//')
    echo "Restauration de $table..."
    # Utiliser le script de restauration
done
```

### Étape 5 : Appliquer les migrations

```bash
# Copier les migrations vers Supabase
# Puis les appliquer via le dashboard ou CLI
```

---

## 🔄 Restauration Supabase Native

Supabase offre des backups automatiques.

### Via Dashboard

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet
3. Settings → Database → Backups
4. Choisir le backup à restaurer
5. Cliquer sur "Restore"

**Attention** : Ceci va remplacer TOUTE votre base de données.

### Point-in-Time Recovery (Plan Pro uniquement)

Si vous avez le plan Pro, vous pouvez restaurer à un moment précis :

1. Dashboard → Settings → Database → Point-in-Time Recovery
2. Sélectionner la date et l'heure exacte
3. Confirmer la restauration

---

## 🛠️ Dépannage

### Problème : "Table doesn't exist"

```bash
# Vérifier que les migrations sont appliquées
# Via Supabase Dashboard → SQL Editor :
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### Problème : "Foreign key constraint violation"

Les données doivent être restaurées dans l'ordre des dépendances :

```bash
# Ordre recommandé :
1. organizers
2. events
3. races
4. athletes
5. registrations
6. entries
7. Autres tables
```

### Problème : "Duplicate key value"

```bash
# Nettoyer la table avant restauration
# Via SQL Editor :
TRUNCATE table_name CASCADE;
```

### Problème : "Permission denied"

Vérifiez que vous utilisez le bon niveau d'accès :
- ANON_KEY : pour les opérations normales
- SERVICE_ROLE_KEY : pour les opérations admin (restauration complète)

---

## ✅ Checklist Post-Restauration

Après une restauration, vérifiez :

- [ ] Toutes les tables ont été restaurées
- [ ] Le nombre de lignes correspond au backup
- [ ] Les relations entre tables fonctionnent
- [ ] L'application démarre sans erreur
- [ ] Les fonctionnalités critiques fonctionnent
- [ ] Les RLS policies sont actives
- [ ] Les Edge Functions fonctionnent
- [ ] Les fichiers de storage sont accessibles

---

## 📞 Support

En cas de problème grave :

1. **Supabase Support** : support@supabase.io
2. **Documentation Supabase** : https://supabase.com/docs
3. **Consulter les logs** : Dashboard → Logs

---

## 🔐 Sécurité

- Ne partagez jamais vos backups publiquement
- Stockez les backups chiffrés en production
- Testez régulièrement la restauration
- Gardez plusieurs générations de backups
- Documentez les restaurations effectuées

---

**Dernière mise à jour** : 2025-10-23
