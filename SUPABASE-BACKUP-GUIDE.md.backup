# 🗄️ Guide de Sauvegarde Supabase

## 📋 Sauvegarde complète avant déploiement

### 1. **Sauvegarde des migrations**

Toutes les migrations sont déjà dans le dossier `supabase/migrations/`.

**Vérifier le nombre de migrations :**
```bash
ls -1 supabase/migrations/*.sql | wc -l
```

**Dernières migrations appliquées :**
```sql
-- Via l'interface Supabase
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;
```

### 2. **Sauvegarde des données (SQL)**

Connectez-vous à votre tableau de bord Supabase :
`https://supabase.com/dashboard/project/YOUR_PROJECT_ID`

#### Option A : Via l'interface Supabase

1. Allez dans **SQL Editor**
2. Cliquez sur **New query**
3. Exécutez :

```sql
-- Liste de toutes les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

4. Pour chaque table importante, exportez les données :
   - Allez dans **Table Editor**
   - Sélectionnez la table
   - Cliquez sur **Export** (bouton en haut à droite)
   - Choisissez le format CSV

#### Option B : Via pg_dump (recommandé)

```bash
# Structure complète (schema only)
pg_dump -h YOUR_DB_HOST \
  -U postgres \
  -d postgres \
  --schema-only \
  --no-owner \
  --no-privileges \
  > supabase_schema_backup_2025_11_30.sql

# Données complètes (data only)
pg_dump -h YOUR_DB_HOST \
  -U postgres \
  -d postgres \
  --data-only \
  --no-owner \
  --no-privileges \
  > supabase_data_backup_2025_11_30.sql

# Tout (structure + données)
pg_dump -h YOUR_DB_HOST \
  -U postgres \
  -d postgres \
  --no-owner \
  --no-privileges \
  > supabase_full_backup_2025_11_30.sql
```

**Variables :**
- `YOUR_DB_HOST` : Trouvez-le dans Settings > Database > Host
- Mot de passe : Dans Settings > Database > Password

### 3. **Sauvegarde des Storage buckets**

#### Liste des buckets actuels :
```sql
SELECT name, public, created_at
FROM storage.buckets
ORDER BY created_at;
```

**Buckets Timepulse :**
- `event-images`
- `organizer-logos`
- `gpx-files`
- `entry-documents`
- `email-assets`
- `partner-logos`

#### Télécharger tous les fichiers d'un bucket

Via le tableau de bord Supabase :
1. Allez dans **Storage**
2. Sélectionnez le bucket
3. Téléchargez les fichiers importants

Ou via CLI :
```bash
# Installer supabase CLI si nécessaire
npm install -g supabase

# Télécharger un bucket
supabase storage download \
  --bucket event-images \
  --destination ./backups/event-images/
```

### 4. **Sauvegarde des Edge Functions**

Toutes les edge functions sont déjà dans `supabase/functions/`.

**Liste des functions déployées :**
```bash
# Via l'interface Supabase
# Dashboard > Edge Functions
```

**Fichiers locaux :**
```
supabase/functions/
├── _shared/
├── bib-exchange-alert/
├── carpooling-cancellation/
├── carpooling-notification/
├── create-lyra-payment/
├── create-payment-intent/
├── ffa-verify-athlete/
├── generate-seo/
├── lyra-ipn-webhook/
├── lyra-refund/
├── oximailing-api/
├── restore-backup/
├── send-email/
├── send-sms/
├── stripe-webhook/
└── test-ffa-connection-v2/
```

### 5. **Sauvegarde des variables d'environnement**

**Variables Supabase (Dashboard) :**
```bash
# Depuis Settings > API
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Variables secrètes (Edge Functions) :**
```bash
# Dashboard > Edge Functions > Settings
# Vérifier que toutes les variables sont documentées
```

**Sauvegarde dans `.env.example` :**
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Lyra (Paiement)
LYRA_API_KEY=your-lyra-key
LYRA_PUBLIC_KEY=your-lyra-public-key

# FFA (Fédération)
FFA_API_URL=https://bases.athle.fr
FFA_USERNAME=your-ffa-username
FFA_PASSWORD=your-ffa-password

# Email (Oximailing)
OXIMAILING_API_KEY=your-oximailing-key

# SMS
SMS_API_KEY=your-sms-key
```

### 6. **Vérification des sauvegardes**

#### Checklist complète

- [ ] **Migrations** : `supabase/migrations/*.sql` (291 fichiers)
- [ ] **Edge Functions** : `supabase/functions/*/` (15 functions)
- [ ] **Schema SQL** : Export complet de la structure
- [ ] **Données** : Export des tables critiques
- [ ] **Storage** : Téléchargement des buckets importants
- [ ] **Variables d'env** : `.env.example` à jour
- [ ] **Documentation** : Guides MD à jour

#### Tester la restauration

```sql
-- 1. Créer un projet de test Supabase
-- 2. Appliquer toutes les migrations
SELECT * FROM supabase_migrations.schema_migrations;

-- 3. Vérifier les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- 4. Vérifier les fonctions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- 5. Vérifier les jobs cron
SELECT * FROM cron.job;
```

---

## 🔄 Restauration en cas de problème

### Restaurer la structure

```bash
psql -h YOUR_DB_HOST \
  -U postgres \
  -d postgres \
  < supabase_schema_backup_2025_11_30.sql
```

### Restaurer les données

```bash
psql -h YOUR_DB_HOST \
  -U postgres \
  -d postgres \
  < supabase_data_backup_2025_11_30.sql
```

### Réappliquer les migrations

```bash
# Via Supabase Dashboard
# SQL Editor > Coller le contenu de chaque migration
# Exécuter dans l'ordre chronologique
```

---

## 📊 État actuel de la base de données

### Tables principales
```
✅ profiles
✅ admin_users
✅ organizers
✅ events
✅ races
✅ race_categories
✅ race_options
✅ race_pricing
✅ license_types
✅ entries
✅ carts
✅ cart_items
✅ race_waitlist (NOUVEAU)
✅ payment_transactions
✅ bib_exchange_offers
✅ carpooling_offers
✅ volunteers
✅ external_events
✅ external_results
✅ email_logs
✅ email_templates
```

### Fonctions critiques
```
✅ check_race_availability()
✅ reserve_cart_spots()
✅ release_cart_spots()
✅ add_to_waitlist()
✅ notify_next_in_waitlist()
✅ calculate_wait_time()
✅ expire_old_carts()
✅ register_group_athletes()
✅ admin_get_all_entries()
✅ admin_get_all_users()
```

### Jobs cron
```
✅ cleanup-expired-carts : */1 * * * * (toutes les minutes)
```

### Extensions
```
✅ uuid-ossp
✅ pg_trgm
✅ unaccent
✅ pgcrypto
✅ pg_cron (NOUVEAU)
✅ pg_stat_statements
```

---

## 🚨 Points d'attention

### Avant le déploiement
1. ✅ Vérifier que toutes les migrations sont appliquées
2. ✅ Tester les fonctions SQL principales
3. ✅ Vérifier que pg_cron est actif
4. ✅ Sauvegarder les variables d'environnement

### Après le déploiement
1. Vérifier le job cron : `SELECT * FROM cron.job;`
2. Tester l'ajout au panier avec quota
3. Vérifier les compteurs (reserved_spots, confirmed_entries)
4. Tester la file d'attente

---

## 📞 Restauration d'urgence

### Si tout s'effondre

1. **Créer un nouveau projet Supabase**
2. **Restaurer depuis le backup complet** :
   ```bash
   psql < supabase_full_backup_2025_11_30.sql
   ```
3. **Réappliquer les migrations** dans l'ordre
4. **Vérifier les extensions** : `CREATE EXTENSION IF NOT EXISTS pg_cron;`
5. **Recréer le job cron**
6. **Redéployer les edge functions**
7. **Remettre les variables d'environnement**

### Contact support Supabase

- Dashboard : https://supabase.com/dashboard/support
- Discord : https://discord.supabase.com
- Email : support@supabase.io

---

**Date de ce guide** : 30 Novembre 2025
**Version DB** : 2.8.0
**Migrations** : 291
**Status** : ✅ Production Ready
