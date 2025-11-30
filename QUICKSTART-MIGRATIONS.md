# 🚀 Démarrage rapide - Application des migrations

## 🎯 Situation actuelle

Votre base de données de **production** n'a pas les tables de base. Vous devez appliquer les migrations.

## ⚡ Solution rapide (15 minutes)

### Étape 1 : Ouvrir SQL Editor

1. Allez sur : https://supabase.com/dashboard/project/fgstscztsighabpzzzix/sql/new

### Étape 2 : Appliquer la migration de base

Copiez **tout** le contenu du fichier suivant et collez-le dans SQL Editor, puis cliquez sur **"Run"** :

📄 **`supabase/migrations/20251014201249_create_timepulse_schema.sql`**

Cette migration crée toutes les tables principales : events, races, organizers, registrations, etc.

### Étape 3 : Appliquer les migrations critiques

Appliquez ensuite ces migrations **dans l'ordre** (une par une) :

1. **`20251014205617_create_admin_users_fixed.sql`** - Table admin_users
2. **`20251017055730_create_entries_module_v2.sql`** - Module inscriptions
3. **`20251113213448_20251113230000_create_event_characteristics.sql`** - Caractéristiques événements
4. **`20251119055900_fix_pgcrypto_and_reset_password.sql`** - Extension pgcrypto
5. **`20251119100000_add_admin_rls_policies_for_supabase_auth.sql`** - Politiques RLS admin

### Étape 4 : Vérifier que tout fonctionne

Testez votre application :
- ✅ Connexion admin
- ✅ Création d'événement
- ✅ Modification d'événement
- ✅ Ajout de caractéristiques

## 📝 Notes importantes

### Si vous voyez "already exists"
C'est normal si vous avez déjà appliqué certaines migrations. Continuez avec la suivante.

### Si vous voyez "permission denied"
Vérifiez que vous êtes bien connecté en tant qu'administrateur dans Supabase Dashboard.

### Si une migration échoue
1. Notez l'erreur exacte
2. Passez à la migration suivante
3. Revenez plus tard sur celle qui a échoué

## 🔍 Vérification finale

Exécutez cette requête pour voir toutes vos tables :

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Vous devriez voir au moins 20-30 tables.

## ✅ C'est fait !

Une fois les migrations appliquées, votre application devrait fonctionner correctement :
- Badge admin visible
- Modification d'événements possible
- Caractéristiques d'événements fonctionnelles
- Permissions admin correctement appliquées

## 🆘 Problème ?

Si vous rencontrez une erreur, envoyez-moi :
1. Le nom du fichier de migration
2. Le message d'erreur exact
3. Le numéro de ligne si disponible
