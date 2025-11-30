# Guide de correction des résultats externes

## Problèmes identifiés

### 1. ✅ Rangs Genre et Catégorie non calculés
**Solution**: Migration créée automatiquement

La migration `20251124000001_recalculate_external_results_rankings.sql` :
- Recalcule automatiquement `gender_rank` et `category_rank`
- S'exécute automatiquement après chaque import
- A déjà corrigé tous les événements existants

### 2. ⚠️ Temps mal formatés (31:56 → 00:52:36)
**Cause**: L'ancienne logique considérait toujours MM:SS et ajoutait 00: devant

**Solution appliquée**:
- Migration `20251124000002_fix_external_results_times.sql`
- Nouvelle logique intelligente :
  - Si première partie < 60 → MM:SS (ajoute 00: devant)
  - Si première partie > 59 → HH:MM (ajoute :00 à la fin)
  - Exemples :
    - `31:56` → `00:31:56` ✅
    - `52:36` → `00:52:36` ✅
    - `75:30` → `01:15:30` ✅

## Actions requises

### Pour les événements déjà importés avec des temps incorrects

**Option 1 : Réimport (RECOMMANDÉ)**
```sql
-- 1. Identifier l'événement
SELECT id, name, slug FROM external_events
WHERE name LIKE '%Varades%';

-- 2. Supprimer les résultats
DELETE FROM external_results
WHERE external_event_id = 'votre-event-id-ici';

-- 3. Réimporter via l'interface admin
-- Les temps seront correctement formatés cette fois
```

**Option 2 : Correction manuelle SQL**
```sql
-- Lister les temps suspects (> 1h pour course < 10km)
SELECT
  er.id,
  er.overall_rank,
  er.first_name,
  er.last_name,
  er.finish_time_display as temps_actuel,
  ee.name,
  ee.distance_km
FROM external_results er
JOIN external_events ee ON er.external_event_id = ee.id
WHERE er.status = 'finished'
  AND ee.distance_km < 10
  AND er.finish_time_display > '01:00:00'
ORDER BY ee.name, er.overall_rank;

-- Corriger manuellement
UPDATE external_results
SET finish_time_display = '00:31:56'
WHERE id = 'result-id';
```

## Vérification

### Tester qu'un événement est bien corrigé
```sql
SELECT
  overall_rank,
  first_name,
  last_name,
  gender,
  category,
  finish_time_display,
  gender_rank,    -- Doit être calculé ✅
  category_rank   -- Doit être calculé ✅
FROM external_results
WHERE external_event_id = 'votre-event-id'
ORDER BY overall_rank
LIMIT 10;
```

### Résultat attendu
- ✅ `gender_rank` : 1, 2, 3... par genre
- ✅ `category_rank` : 1, 2, 3... par catégorie
- ✅ `finish_time_display` : Format HH:MM:SS correct

## Pour les futurs imports

**Aucune action nécessaire !**

Les deux migrations corrigent automatiquement :
1. Les rangs sont recalculés à chaque import
2. Les temps sont formatés intelligemment

## Tests

### Cas de test pour les temps
| Input CSV | Interprétation | Output attendu |
|-----------|---------------|----------------|
| 31:56     | MM:SS         | 00:31:56      |
| 52:36     | MM:SS         | 00:52:36      |
| 1:15:30   | H:MM:SS       | 01:15:30      |
| 75:30     | HH:MM         | 01:15:30      |
| 1916      | Secondes      | 00:31:56      |

### Interface publique

Vérifier sur : `/resultats/slug-de-levenement`

Doit afficher :
- ✅ Statistiques correctes (Top 3, médian, etc.)
- ✅ Podium avec les 3 premiers
- ✅ Rangs Genre et Catégorie dans le tableau
- ✅ Temps au bon format
- ✅ Design identique aux événements Timepulse

## Support

Les migrations sont dans :
- `/supabase/migrations/20251124000001_recalculate_external_results_rankings.sql`
- `/supabase/migrations/20251124000002_fix_external_results_times.sql`
- `/supabase/migrations/20251123145346_normalize_external_results_data.sql` (mise à jour)
