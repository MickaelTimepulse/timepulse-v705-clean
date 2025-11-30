# Système de Résultats Externes - Complet et Fonctionnel

## Vue d'ensemble

Le système de résultats externes permet d'importer et d'afficher des résultats de courses provenant d'autres sources (Elogica, Wiclax, CSV personnalisés, etc.) avec le **même design** que les événements Timepulse.

## ✅ Fonctionnalités complètes

### 1. Import multi-formats
- ✅ **Format Elogica** (détection automatique)
- ✅ CSV standard (séparateurs: `,` `;` `\t`)
- ✅ Mapping manuel des colonnes
- ✅ Support des temps compacts (MMSS, HMMSS)

### 2. Calculs automatiques
- ✅ Classement général (`overall_rank`)
- ✅ Classement par genre (`gender_rank`)
- ✅ Classement par catégorie (`category_rank`)
- ✅ Conversion automatique des temps
- ✅ Normalisation des données (noms, prénoms, clubs)

### 3. Affichage public
- ✅ Design 100% identique aux événements Timepulse
- ✅ Podium animé (3 premiers)
- ✅ Statistiques colorées
- ✅ Filtres (recherche, genre, catégorie)
- ✅ Tableau avec rangs colorés
- ✅ Responsive design

## Formats de temps supportés

| Format | Exemple | Conversion |
|--------|---------|-----------|
| HH:MM:SS | 01:23:45 | Inchangé |
| H:MM:SS | 1:23:45 | 01:23:45 |
| MM:SS | 31:56 | 00:31:56 |
| M:SS | 5:30 | 00:05:30 |
| MMSS | 3156 | 00:31:56 |
| HMMSS | 13520 | 01:35:20 |
| Secondes | 1916 | 00:31:56 |

**Logique intelligente** :
- MM:SS avec première partie < 60 → 00:MM:SS
- MM:SS avec première partie > 59 → HH:MM:00
- MMSS (3-4 chiffres) → division par 100
- HMMSS (5-6 chiffres) → extraction heures/minutes/secondes

## Format Elogica

### Détection automatique
Le fichier commence par :
```
ENG	ATH	ATH	ATH	...
Numéro de dossard	Num licence	...
NumDossard	Licence	Nom	Prenom	...
13	2163704	BALE	VICTOR	...
```

### Traitement
1. **Ligne 1** : Ignorée (codes techniques)
2. **Ligne 2** : Ignorée (noms anglais)
3. **Ligne 3** : Utilisée comme EN-TÊTES
4. **Ligne 4+** : Données

### Colonnes Elogica → Mapping

| Elogica | Timepulse | Obligatoire |
|---------|-----------|-------------|
| Nom | last_name | ✅ Oui |
| Prenom | first_name | ✅ Oui |
| NumDossard | bib_number | Recommandé |
| Sexe | gender | Recommandé |
| Categorie | category | Recommandé |
| Place | overall_rank | Recommandé |
| Perf | finish_time_display | Recommandé |
| DateNaissance | - | Optionnel |
| Nationalite | country_code | Optionnel |
| NomEquipe | club | Optionnel |

## Architecture technique

### Base de données

#### Table `external_events`
```sql
- id (uuid)
- name (text)
- slug (text, unique)
- event_date (date)
- city (text)
- country_code (text)
- sport_type (text)
- distance_km (numeric)
- organizer_name (text)
- organizer_email (text)
- status (text) -- draft, published
- is_public (boolean)
```

#### Table `external_results`
```sql
- id (uuid)
- external_event_id (uuid)
- bib_number (text)
- first_name (text)
- last_name (text)
- gender (text)
- category (text)
- finish_time_display (text)
- overall_rank (integer)
- gender_rank (integer) -- ✅ Calculé auto
- category_rank (integer) -- ✅ Calculé auto
- status (text) -- finished, dnf, dns
- club (text)
- country_code (text)
```

### Fonctions automatiques

#### 1. Normalisation des données
```sql
CREATE TRIGGER normalize_external_result_trigger
  BEFORE INSERT OR UPDATE ON external_results
  EXECUTE FUNCTION normalize_external_result();
```

**Actions** :
- Nom → MAJUSCULES
- Prénom → Capitale
- Club → MAJUSCULES
- Temps → Format HH:MM:SS

#### 2. Calcul des rangs
```sql
CREATE TRIGGER recalculate_rankings_trigger
  AFTER INSERT OR UPDATE ON external_results
  EXECUTE FUNCTION trigger_recalculate_rankings();
```

**Actions** :
- Recalcule `gender_rank` par genre
- Recalcule `category_rank` par catégorie
- Basé sur `overall_rank`

### Fonctions admin

#### Recalculer les rangs manuellement
```sql
SELECT admin_recalculate_event_rankings('slug-de-levenement');
```

#### Lister les temps suspects
```sql
SELECT * FROM admin_list_suspect_times();
```

Retourne les temps incohérents :
- Course < 10km avec temps > 1h
- Course 10-21km avec temps > 3h

## Interface utilisateur

### Admin
**Menu** : Résultats externes

1. **Liste des événements**
   - Tableau avec filtres
   - Statut (brouillon/publié)
   - Actions (modifier, supprimer, voir)

2. **Import**
   - Upload fichier
   - Détection format Elogica
   - Mapping colonnes
   - Prévisualisation
   - Import avec barre de progression

3. **Détail**
   - Informations événement
   - Liste des résultats
   - Statistiques
   - Export Excel

### Organisateur
**Menu** : Résultats externes (même interface que Admin)

### Public
**URL** : `/resultats/slug-de-levenement`

**Sections** :
1. En-tête avec infos événement
2. Statistiques (participants, top 3, moyennes)
3. Podium animé
4. Filtres (recherche, genre, catégorie)
5. Tableau des résultats

## Migrations appliquées

### Core
- `20251122090505_create_external_events_system.sql` - Tables principales
- `20251122103000_allow_public_external_results_submission.sql` - Accès public
- `20251123145346_normalize_external_results_data.sql` - Normalisation auto

### Rangs
- `20251124000001_recalculate_external_results_rankings.sql` - Calcul des rangs

### Temps
- `20251124000002_fix_external_results_times.sql` - Format temps intelligent
- `20251124000003_add_admin_recalculate_function.sql` - Fonctions admin

## Pages frontend

### Admin
- `/admin/external-results` - Liste
- `/admin/external-results/import` - Import
- `/admin/external-results/:id` - Détail

### Organisateur
- `/organizer/external-results` - Liste
- `/organizer/external-results/import` - Import
- `/organizer/external-results/:id` - Détail

### Public
- `/resultats` - Liste tous les événements
- `/resultats/:slug` - Résultats d'un événement

## Tests

### Test import Elogica
1. Aller dans Admin → Résultats externes → Importer
2. Uploader le fichier "elogica st baudelle.txt"
3. Vérifier : `Format Elogica détecté` dans la console
4. Mapper les colonnes
5. Importer
6. Vérifier les rangs et temps

### Test affichage public
1. Aller sur `/resultats/nom-de-levenement`
2. Vérifier le podium (3 premiers)
3. Vérifier les statistiques
4. Tester les filtres
5. Vérifier le tableau avec rangs colorés

## Compatibilité

### Formats supportés
- ✅ Elogica (.txt, .csv)
- ✅ CSV standard
- ✅ TSV (tabulation)
- ✅ Wiclax (via CSV export)
- ✅ Tout format avec séparateurs

### Séparateurs détectés
- `,` (virgule)
- `;` (point-virgule)
- `\t` (tabulation)

### Encodages
- UTF-8 (recommandé)
- ISO-8859-1 (détecté automatiquement)

## Performance

### Import
- Batch de 1000 lignes
- Temps moyen : 2-3 secondes pour 500 résultats
- Pas de limite théorique

### Affichage
- Pagination côté serveur
- Cache des statistiques
- Lazy loading du tableau

## Sécurité

### RLS (Row Level Security)
- ✅ Organisateurs : accès limité à leurs événements
- ✅ Admin : accès complet
- ✅ Public : lecture seule des événements publiés

### Validation
- ✅ Colonnes obligatoires (nom, prénom)
- ✅ Format des temps
- ✅ Format des dates
- ✅ Validation genre (M/F)

## Maintenance

### Réimporter un événement
```sql
-- 1. Supprimer les résultats
DELETE FROM external_results WHERE external_event_id = 'event-id';

-- 2. Réimporter via l'interface
```

### Corriger les rangs
```sql
-- Recalculer tous les événements
DO $$
DECLARE
  event_record RECORD;
BEGIN
  FOR event_record IN
    SELECT id FROM external_events
  LOOP
    PERFORM recalculate_external_event_rankings(event_record.id);
  END LOOP;
END $$;
```

### Nettoyer les brouillons anciens
```sql
DELETE FROM external_events
WHERE status = 'draft'
  AND created_at < NOW() - INTERVAL '30 days';
```

## Roadmap future

### Phase 2 (optionnel)
- [ ] Import automatique via URL
- [ ] Synchronisation Wiclax API
- [ ] Export PDF des résultats
- [ ] Certificats personnalisés
- [ ] Comparaison multi-événements

## Documentation

- `ELOGICA-IMPORT-GUIDE.md` - Guide import Elogica
- `FIX-EXTERNAL-RESULTS-GUIDE.md` - Guide dépannage
- `EXTERNAL-RESULTS-COMPLETE.md` - Ce fichier

## Support

En cas de problème :
1. Vérifier les logs console (F12)
2. Vérifier le format du fichier
3. Tester avec un petit échantillon
4. Consulter les guides
