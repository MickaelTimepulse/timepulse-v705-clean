# Guide d'import Elogica

## Format Elogica détecté automatiquement

Le système détecte automatiquement le format Elogica lorsque le fichier CSV/TSV commence par `ENG	ATH	...`

### Structure du fichier Elogica

```
Ligne 1: ENG	ATH	ATH	ATH	... (codes techniques)
Ligne 2: Numéro de dossard	Num licence	... (noms anglais)
Ligne 3: NumDossard	Licence	Nom	Prenom	... (noms français - EN-TÊTES)
Ligne 4+: Données des athlètes
```

## Colonnes reconnues automatiquement

Le système utilise la **ligne 3** (noms français) comme en-têtes :

| Colonne Elogica | Mapping suggéré |
|----------------|-----------------|
| NumDossard | Dossard |
| Nom | Nom |
| Prenom | Prénom |
| Sexe | Sexe (M/F) |
| Categorie | Catégorie |
| Place | Classement général |
| Perf | Temps (format MMSS) |
| DateNaissance | Date de naissance |
| Nationalite | Nationalité |
| NomEquipe | Club |

## Format des temps

Le système supporte automatiquement le **format compact Elogica** :

| Format | Exemple | Résultat |
|--------|---------|----------|
| MMSS | 3156 | 00:31:56 |
| MMSS | 3257 | 00:32:57 |
| MMSS | 5236 | 00:52:36 |
| HMMSS | 13520 | 01:35:20 |
| HHMMSS | 103545 | 10:35:45 |

**Note** : Si minutes > 59, conversion automatique en heures
- Exemple : `7530` (75min 30sec) → `01:15:30`

## Étapes d'import

### 1. Accès
- **Admin** : Menu "Résultats externes" → "Importer des résultats"
- **Organisateur** : Menu "Résultats externes" → "Ajouter un événement"

### 2. Upload du fichier
1. Cliquez sur "Choisir un fichier"
2. Sélectionnez votre fichier Elogica (.txt ou .csv)
3. Le système détecte automatiquement le format

**Message console** : `Format Elogica détecté`

### 3. Informations de l'événement
Remplissez :
- Nom de l'événement
- Date
- Ville
- Distance (km)
- Type de sport
- Organisateur (si admin)

### 4. Mapping des colonnes

Le système affiche les **en-têtes français** de la ligne 3 :
- NumDossard
- Nom
- Prenom
- Sexe
- Categorie
- Place
- Perf
- etc.

**Colonnes obligatoires** :
- ✅ Nom
- ✅ Prénom

**Colonnes recommandées** :
- Dossard (NumDossard)
- Sexe (Sexe)
- Catégorie (Categorie)
- Classement (Place)
- Temps (Perf)

### 5. Import
1. Vérifiez le mapping
2. Cliquez sur "Importer les résultats"
3. Les temps sont automatiquement convertis
4. Les rangs sont automatiquement calculés

## Vérifications automatiques

Après import, le système :
1. ✅ Convertit les temps MMSS → HH:MM:SS
2. ✅ Calcule `gender_rank` (1er H, 2ème H, etc.)
3. ✅ Calcule `category_rank` (1er SE, 2ème SE, etc.)
4. ✅ Normalise les noms (NOM en majuscules, Prénom avec capitale)
5. ✅ Génère un slug unique pour l'URL

## Exemple de résultat

### Données source (Elogica)
```
13	2163704	BALE	VICTOR	FRA	30/10/2002	M	SE	O	...	10000		1	3156	...
```

### Résultat importé
```
Dossard: 13
Nom: BALE
Prénom: Victor
Sexe: M
Catégorie: SE
Classement général: 1
Temps: 00:31:56
Rang Genre: 1
Rang Catégorie: 1
```

## Accès public

Une fois importé, l'événement est accessible sur :
```
https://votre-domaine.com/resultats/slug-de-levenement
```

Le design est **identique** aux événements Timepulse :
- Podium animé
- Statistiques
- Filtres par genre et catégorie
- Tableau avec rangs colorés

## Dépannage

### Le format n'est pas détecté
Vérifiez que la première ligne commence par `ENG` suivi d'une tabulation

### Les temps ne sont pas corrects
Les temps doivent être au format MMSS (ex: 3156 pour 31:56)

### Les rangs ne s'affichent pas
Les rangs sont calculés automatiquement après l'import. Rafraîchissez la page.

### Colonnes manquantes dans le mapping
Assurez-vous que le fichier contient bien 3 lignes d'en-tête avant les données.

## Support technique

Pour tout problème :
1. Vérifiez la console du navigateur (F12)
2. Consultez les logs : `Import: X colonnes, Y lignes de données`
3. Vérifiez le format du fichier source
