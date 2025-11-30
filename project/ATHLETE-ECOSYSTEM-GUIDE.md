# 🏃 Guide Écosystème Athlète Timepulse

## 📋 Vue d'ensemble

L'écosystème athlète Timepulse est maintenant **entièrement opérationnel** avec :
- ✅ Base de données unifiée de **270 000+ athlètes**
- ✅ Matching automatique via (nom, prénom, date de naissance)
- ✅ **Indice Timepulse™** calculé automatiquement
- ✅ **Système de badges** avec 25+ badges
- ✅ Profils athlètes publics/privés
- ✅ Historique multi-disciplines complet
- ✅ Gestion admin complète

---

## 🗄️ Structure de la base de données

### Tables principales

#### 1. `athletes` (Base unifiée)
Tous les athlètes de la plateforme avec :
- Clés uniques : `(first_name, last_name, birthdate)`
- `slug` : URL personnalisée (ex: `jean-dupont-1985`)
- `user_id` : Lien avec compte utilisateur (optionnel)
- `is_public` : Profil public ou privé
- `timepulse_index` : Indice de performance (0-100)

#### 2. `athlete_profiles`
Informations publiques :
- Bio, photo de profil
- Réseaux sociaux (Instagram, Facebook, Strava)
- Préférences d'affichage
- Statistiques (nombre de courses, km totaux)

#### 3. `athlete_records`
Records personnels par distance :
- Meilleur temps sur 5km, 10km, marathon, etc.
- Lien avec le résultat et la course

#### 4. `training_logs`
Carnet d'entraînement :
- Date, type d'activité, distance, durée
- Notes, ressenti
- Données GPS (optionnel)

#### 5. `athlete_photos`
Galerie photos :
- Photos par course
- Photo de profil
- Système de likes

#### 6. `athlete_badges`
Badges obtenus :
- 25+ badges disponibles
- Attribution automatique
- Mise en avant sur le profil

#### 7. `timepulse_index_history`
Historique de l'indice :
- Évolution dans le temps
- Détail des composantes

#### 8. `race_types`
Typologie des courses :
- Running : 5km, 10km, semi, marathon
- Trail : court, moyen, long, ultra
- Triathlon : XS, S, M, L, XL
- Autres : swimrun, duathlon, aquathlon

---

## 🔧 Fonctions SQL disponibles

### Gestion des athlètes

#### `upsert_athlete()`
Crée ou retrouve un athlète par identité
```sql
SELECT upsert_athlete(
  'Jean',           -- prénom
  'Dupont',         -- nom
  '1985-03-15',     -- date de naissance
  'M',              -- sexe
  'jean@email.com', -- email (optionnel)
  'FRA'             -- nationalité (optionnel)
);
```

#### `match_athlete_by_identity()`
Trouve un athlète existant
```sql
SELECT match_athlete_by_identity('Jean', 'Dupont', '1985-03-15');
```

#### `generate_athlete_slug()`
Génère un slug unique
```sql
SELECT generate_athlete_slug('Jean', 'Dupont', '1985-03-15');
-- Retourne : jean-dupont-1985
```

### Liaison results ↔ athletes

#### `link_results_via_entries()`
Lie les résultats via les inscriptions
```sql
SELECT link_results_via_entries();
-- Retourne : nombre de résultats liés
```

#### `link_all_results_to_athletes()`
Lie tous les résultats par batch
```sql
SELECT * FROM link_all_results_to_athletes(1000);
-- Retourne : (total_processed, total_linked)
```

### Indice Timepulse

#### `calculate_timepulse_index()`
Calcule l'indice d'un athlète
```sql
SELECT calculate_timepulse_index('athlete-uuid');
-- Retourne : indice (0-100)
```

#### `recalculate_all_indices()`
Recalcule tous les indices
```sql
SELECT * FROM recalculate_all_indices(1000);
-- Traitement par batch de 1000
```

#### `get_timepulse_leaderboard()`
Classement global
```sql
SELECT * FROM get_timepulse_leaderboard(
  100,   -- limit
  0,     -- offset
  NULL,  -- sport filter
  NULL   -- gender filter
);
```

### Badges

#### `award_badge()`
Attribuer un badge
```sql
SELECT award_badge(
  'athlete-uuid',
  'marathoner',     -- slug du badge
  'result-uuid',    -- optionnel
  'race-uuid'       -- optionnel
);
```

#### `check_athlete_badges()`
Vérifier tous les badges d'un athlète
```sql
SELECT check_athlete_badges('athlete-uuid');
```

### Gestion des doublons

#### `find_duplicate_athletes()`
Trouver les doublons
```sql
SELECT * FROM find_duplicate_athletes();
```

#### `merge_athletes()`
Fusionner 2 athlètes
```sql
SELECT merge_athletes(
  'uuid-a-garder',
  'uuid-a-supprimer'
);
```

### Admin

#### `admin_get_athletes()`
Liste paginée avec filtres
```sql
SELECT * FROM admin_get_athletes(
  50,              -- limit
  0,               -- offset
  'Dupont',        -- recherche
  'M',             -- genre
  NULL,            -- has_user_account
  NULL,            -- is_public
  'last_name'      -- tri
);
```

#### `admin_get_athlete_details()`
Détail complet d'un athlète
```sql
SELECT admin_get_athlete_details('athlete-uuid');
```

#### `admin_update_athlete()`
Modifier un athlète
```sql
SELECT admin_update_athlete(
  'athlete-uuid',
  'Jean',          -- nouveau prénom
  'Dupont',        -- nouveau nom
  '1985-03-15',    -- nouvelle date
  'M',             -- nouveau genre
  'new@email.com', -- nouvel email
  true,            -- is_public
  'FRA',           -- nationalité
  'Paris',         -- ville
  'CA Paris'       -- club
);
```

#### `admin_delete_athlete()`
Supprimer un athlète
```sql
SELECT admin_delete_athlete(
  'athlete-uuid',
  'Doublon détecté' -- raison
);
```

---

## 📥 Import des données

### 1. Import des 270 000 athlètes

**Format CSV attendu :**
```csv
prenom,nom,date_naissance,sexe,email,nationalite,ville,code_postal,club
Jean,Dupont,1985-03-15,M,jean.dupont@email.com,FRA,Paris,75001,CA Paris
Marie,Martin,1990-07-22,F,marie.martin@email.com,FRA,Lyon,69001,Lyon Athlétisme
```

**Commande :**
```bash
node import-athletes.js athletes.csv
```

**Options :**
```bash
# Test sans insertion
node import-athletes.js athletes.csv --dry-run

# Batch personnalisé
node import-athletes.js athletes.csv --batch-size=500
```

**Colonnes supportées :**
- `prenom`, `first_name`, `Prenom`, `FirstName`
- `nom`, `last_name`, `Nom`, `LastName`
- `date_naissance`, `birthdate`, `DateNaissance`, `Birthdate`
- `sexe`, `gender`, `Sexe`, `Gender`
- `email`, `Email`
- `nationalite`, `nationality`, `Nationalite`
- `ville`, `city`, `Ville`
- `code_postal`, `postal_code`, `CodePostal`
- `club`, `Club`, `license_club`

### 2. Liaison des résultats

**Option A : Via inscriptions (recommandé)**
```sql
-- Lie automatiquement via entry_id
SELECT link_results_via_entries();
```

**Option B : Traitement batch complet**
```sql
-- Lie tous les résultats possibles
SELECT * FROM link_all_results_to_athletes(1000);
```

**Option C : Script Node.js**
```bash
node link-results-to-athletes.js --batch-size=1000
```

### 3. Recalcul des indices

**Une fois les résultats liés :**
```sql
-- Recalculer tous les indices (peut prendre du temps !)
SELECT * FROM recalculate_all_indices(1000);
```

---

## 🎯 Indice Timepulse™

### Formule
```
Index = (Performance × 40%) + (Progression × 25%) + (Régularité × 20%) + (Polyvalence × 10%) + (Podiums × 5%)
```

### Composantes (échelle 0-100)

#### 1. Performance (40%)
- Basé sur le meilleur temps 10km
- Référence : 35 min = 100 pts, 60 min = 0 pts
- Formule linéaire

#### 2. Progression (25%)
- Compare temps moyens : 3 derniers mois vs 3 mois précédents
- Amélioration de 10% = 100 pts
- Stagnation = 50 pts
- Régression de 10% = 0 pts

#### 3. Régularité (20%)
- Basé sur nombre de courses/an
- 0-5 courses = 20 pts
- 6-10 courses = 50 pts
- 11-20 courses = 80 pts
- 20+ courses = 100 pts

#### 4. Polyvalence (10%)
- Nombre de disciplines pratiquées
- 1 discipline = 30 pts
- 2 disciplines = 60 pts
- 3+ disciplines = 100 pts

#### 5. Podiums (5%)
- Basé sur classements top 3
- 0 podium = 0 pts
- 1-3 podiums = 40 pts
- 4-10 podiums = 70 pts
- 10+ podiums = 100 pts

### Déclencheurs automatiques
- Recalcul après chaque nouveau résultat
- Historique conservé dans `timepulse_index_history`

---

## 🏅 Système de badges

### Catégories

#### Distance (6 badges)
- Semi-Marathonien (50 pts)
- Marathonien (100 pts)
- Ultra Runner (200 pts)
- Triathlète Ironman (300 pts)

#### Vitesse (4 badges)
- Sub-20 (5km) - 60 pts
- Sub-40 (10km) - 80 pts
- Sub-1h30 (Semi) - 120 pts
- Sub-3h (Marathon) - 250 pts

#### Régularité (3 badges)
- Régulier 10 (10 courses/an) - 50 pts
- Régulier 20 (20 courses/an) - 100 pts
- Centurion (100 courses) - 200 pts

#### Progression (3 badges)
- Record Personnel -5% - 40 pts
- Record Personnel -10% - 80 pts
- En Forme (3 PR en 6 mois) - 90 pts

#### Podium (3 badges)
- Premier Podium - 100 pts
- Champion (1ère place) - 150 pts
- Podium x10 - 200 pts

#### Participation (2 badges)
- Fidèle Timepulse (10 events) - 60 pts
- Ambassadeur Timepulse (50 events) - 150 pts

#### Achievements (3 badges)
- Première Course - 10 pts
- Polyvalent (3 disciplines) - 80 pts
- Explorateur (5 départements) - 70 pts

### Attribution automatique
- Vérification après chaque nouveau résultat
- Triggers SQL automatiques
- Fonction `check_athlete_badges()` pour recalcul

---

## 🔐 Sécurité (RLS)

### Niveaux d'accès

#### Public (non authentifié)
- ✅ Voir profils publics (`is_public = true`)
- ✅ Voir records des profils publics
- ✅ Voir badges publics
- ✅ Voir photos publiques
- ✅ Voir training logs publics

#### Athlète authentifié
- ✅ Gérer son propre profil
- ✅ Modifier ses préférences
- ✅ Gérer ses photos
- ✅ Créer des training logs
- ✅ Mettre en avant ses badges

#### Admin
- ✅ Accès complet à tous les athlètes
- ✅ Modification de n'importe quel profil
- ✅ Suppression d'athlètes
- ✅ Fusion de doublons
- ✅ Statistiques globales

---

## 📊 Performances

### Optimisations pour 270 000+ athlètes

#### Index créés
- `idx_athletes_identity` : (LOWER(last_name), LOWER(first_name), birthdate)
- `idx_athletes_user_id` : (user_id)
- `idx_athletes_slug` : (slug) UNIQUE
- `idx_athletes_search` : GIN full-text sur nom/prénom
- `idx_athletes_timepulse_index` : (timepulse_index DESC)
- `idx_results_athlete_id` : (athlete_id)
- `idx_results_athlete_race` : (athlete_id, race_id)

#### Traitement par batch
- Import : 1000 athlètes / batch
- Liaison résultats : 1000 / batch
- Recalcul indices : 1000 / batch

#### Caching recommandé
- Leaderboard : cache 5 min
- Profils publics : cache 15 min
- Statistiques : cache 1h

---

## 🚀 Prochaines étapes

### 1. Import des données
```bash
# 1. Importer les 270 000 athlètes
node import-athletes.js athletes.csv

# 2. Lier les résultats
SELECT link_results_via_entries();

# 3. Recalculer les indices
SELECT * FROM recalculate_all_indices(1000);
```

### 2. Interface front-end
- Page profil athlète public (`/athlete/:slug`)
- Dashboard athlète authentifié (`/my-profile`)
- Leaderboard Timepulse (`/leaderboard`)
- Page badges (`/badges`)
- Admin athlètes (`/admin/athletes`)

### 3. Fonctionnalités avancées
- Partage sur réseaux sociaux
- Comparaison avec amis
- Challenges entre athlètes
- Notifications nouveaux badges
- Export PDF des performances

---

## 💡 Cas d'usage

### Trouver un athlète
```sql
-- Par nom/prénom/date
SELECT * FROM athletes
WHERE LOWER(last_name) = 'dupont'
  AND LOWER(first_name) = 'jean'
  AND birthdate = '1985-03-15';

-- Par slug
SELECT * FROM athletes WHERE slug = 'jean-dupont-1985';

-- Recherche full-text
SELECT * FROM admin_search_athletes('jean dupont', 20);
```

### Voir l'historique d'un athlète
```sql
SELECT
  r.*,
  e.name as event_name,
  ra.name as race_name
FROM results r
JOIN races ra ON r.race_id = ra.id
JOIN events e ON ra.event_id = e.id
WHERE r.athlete_id = 'athlete-uuid'
  AND r.status = 'finished'
ORDER BY e.start_date DESC;
```

### Leaderboard par discipline
```sql
SELECT * FROM get_timepulse_leaderboard(
  100,       -- limit
  0,         -- offset
  'running', -- sport filter
  'M'        -- gender filter
);
```

### Statistiques athlète
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'finished') as total_races,
  COUNT(*) FILTER (WHERE overall_rank <= 3) as podiums,
  COUNT(*) FILTER (WHERE overall_rank = 1) as wins,
  MIN(finish_time) as best_time,
  AVG(finish_time) as avg_time
FROM results
WHERE athlete_id = 'athlete-uuid'
  AND status = 'finished';
```

---

## ⚠️ Points d'attention

### Doublons
- Vérifier régulièrement avec `find_duplicate_athletes()`
- Fusionner avec `merge_athletes()` si nécessaire

### Matching résultats
- Privilégier le matching via `entry_id`
- Le matching nom/prénom seul est risqué sans date de naissance

### Performance
- Ne pas recalculer tous les indices trop souvent
- Utiliser les triggers automatiques pour les nouveaux résultats

### Données personnelles (RGPD)
- Les profils sont privés par défaut (`is_public = false`)
- Les athlètes contrôlent leur visibilité
- Les admins peuvent tout voir mais doivent respecter le RGPD

---

## 📞 Support

Pour toute question sur l'écosystème athlète :
1. Consulter ce guide
2. Vérifier les migrations dans `supabase/migrations/`
3. Utiliser les fonctions SQL documentées
4. Consulter les logs d'audit

**Base de données prête pour 270 000+ athlètes ! 🚀**
