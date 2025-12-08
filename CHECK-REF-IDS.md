# VÉRIFICATION ET APPLICATION DES REF_IDS

## Problème
Les URLs utilisent actuellement des UUID longs au lieu des IDs courts (R123456).

## Solution appliquée
- Migration créée : `20251206234957_add_reference_ids.sql`
- Composant `RaceResults.tsx` mis à jour pour supporter les ref_id
- Format des IDs :
  - Races : **R123456** (lettre R + 6 chiffres)
  - Events : **E123456**
  - Organizers : **O123456**
  - Athletes : **A123456**

## ÉTAPE 1 : Vérifier si la migration est appliquée

Connectez-vous à votre base Supabase et exécutez :

```sql
-- Vérifier si la colonne ref_id existe
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'races'
AND column_name = 'ref_id';

-- Voir si des races ont déjà des ref_id
SELECT id, name, ref_id
FROM races
LIMIT 10;
```

## ÉTAPE 2 : Appliquer la migration si nécessaire

### Via Supabase Dashboard
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Menu **"SQL Editor"**
4. Copiez le contenu de `supabase/migrations/20251206234957_add_reference_ids.sql`
5. Cliquez sur **"Run"**

### Via Supabase CLI (si installé)
```bash
supabase db push
```

## ÉTAPE 3 : Vérifier que les ref_id sont générés

```sql
-- Compter les races avec ref_id
SELECT
  COUNT(*) as total_races,
  COUNT(ref_id) as races_with_ref_id
FROM races;

-- Voir quelques exemples
SELECT name, ref_id, slug
FROM races
WHERE ref_id IS NOT NULL
LIMIT 20;
```

## ÉTAPE 4 : Tester les nouvelles URLs

Après la migration, les URLs fonctionneront avec ces formats :

### Formats supportés
1. **ref_id (PRÉFÉRÉ)** : `/races/R123456/results`
2. slug : `/races/foulees-du-beluga-2025/results`
3. UUID : `/races/0ce4a635-57d6-4dad-b0f3-dc6fd334b5d6/results`

### Comportement automatique
- Si vous utilisez un slug ou UUID, le système redirigera automatiquement vers le ref_id
- Les ref_id sont plus courts et plus faciles à communiquer

## ÉTAPE 5 : Récupérer le ref_id d'une course

Pour trouver le ref_id d'une course spécifique :

```sql
SELECT
  name,
  ref_id,
  slug,
  id
FROM races
WHERE id = '0ce4a635-57d6-4dad-b0f3-dc6fd334b5d6';
```

## Exemples d'URLs après migration

Si la course "Foulées du Beluga 2025" a le ref_id **R234567** :

- Ancienne URL : `https://timepulsesports.com/races/0ce4a635-57d6-4dad-b0f3-dc6fd334b5d6/results`
- Nouvelle URL : `https://timepulsesports.com/races/R234567/results`

**Toutes ces URLs fonctionneront et redirigeront vers le ref_id.**

## Note importante

Les ref_id sont générés automatiquement pour :
- Toutes les courses existantes (via la migration)
- Toutes les nouvelles courses créées (via trigger automatique)

Vous n'avez rien à faire manuellement !
