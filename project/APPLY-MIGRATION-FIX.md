# 🔧 Correction de l'erreur "duplicate key value violates unique constraint"

## Problème
Lorsqu'un utilisateur essaie de s'inscrire plusieurs fois à différentes courses, l'erreur suivante se produit :
```
duplicate key value violates unique constraint "idx_athletes_identity"
```

## Solution
Une migration a été créée pour corriger ce problème en utilisant un UPSERT au lieu d'un INSERT.

## 📋 Étapes pour appliquer la correction

### Option 1 : Via l'interface Supabase (recommandé)

1. **Connectez-vous à Supabase** : https://supabase.com/dashboard
2. **Sélectionnez votre projet**
3. **Allez dans SQL Editor**
4. **Copiez-collez le contenu du fichier** :
   ```
   supabase/migrations/20251105220000_fix_athlete_duplicate_constraint.sql
   ```
5. **Cliquez sur "Run"**

### Option 2 : Via le CLI Supabase

```bash
# Assurez-vous d'être dans le dossier du projet
cd /tmp/cc-agent/58635631/project

# Appliquez la migration
supabase db push --db-url "votre_connection_string"
```

## ✅ Vérification

Après avoir appliqué la migration, testez à nouveau l'inscription. L'erreur ne devrait plus se produire et les informations de l'athlète seront mises à jour si nécessaire.

## 🔍 Ce qui a changé

**Avant** :
```sql
INSERT INTO athletes (...) VALUES (...)
RETURNING id INTO v_athlete_id;
```

**Après** :
```sql
INSERT INTO athletes (...) VALUES (...)
ON CONFLICT ON CONSTRAINT idx_athletes_identity
DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  -- ... autres champs mis à jour
RETURNING id INTO v_athlete_id;
```

Désormais, si un athlète avec le même nom, prénom et date de naissance existe déjà :
- ✅ Ses informations sont mises à jour (email, téléphone, licence, etc.)
- ✅ L'ID existant est retourné
- ✅ L'inscription peut continuer normalement
