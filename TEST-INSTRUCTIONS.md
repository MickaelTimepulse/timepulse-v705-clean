# Instructions de test pour les corrections

## Problèmes corrigés

### 1. Bouton "Actualiser les licences FFA" manquant
**Cause** : La prop `event` était correctement passée mais la condition utilisait `event?.ffa_affiliated` qui pouvait échouer silencieusement.

**Correction** : Changé la condition en `event && event.ffa_affiliated` pour une vérification plus explicite.

### 2. Colonne T-shirt technique vide dans le CSV
**Cause** : Le code ne gérait pas correctement le tableau `choices` retourné par Supabase et manquait de logs pour diagnostiquer.

**Corrections** :
- Ajout de vérification explicite `option.choices || []`
- Ajout de logs de warning si un choix n'est pas trouvé
- Vérification que `value` existe avant de l'ajouter à `optionValues`
- Amélioration de la gestion des choix multiples

## Comment tester

### Test 1 : Vérifier le bouton FFA

1. **Vider le cache du navigateur** :
   - Windows/Linux : `Ctrl + Shift + Delete` → Cocher "Images et fichiers en cache" → Effacer
   - Mac : `Cmd + Shift + Delete`
   - OU ouvrir une fenêtre de navigation privée

2. **Accéder à la page** :
   - Aller sur : `/organizer/entries?eventId=33a4b5e0-5f76-4f7d-8ef6-8a6fecedff9b`

3. **Sélectionner une course** :
   - Dans le filtre "Toutes les épreuves", sélectionner "Relais de la mouche"

4. **Vérifier** :
   - Un bouton bleu "Actualiser les licences FFA" doit apparaître à côté du bouton "Exporter CSV"

### Test 2 : Vérifier l'export CSV avec les options

1. **Sur la même page**, cliquez sur "Exporter CSV"

2. **Ouvrir le fichier CSV** avec Excel ou LibreOffice

3. **Vérifier** :
   - La dernière colonne s'appelle "T-shirt technique"
   - Les lignes contiennent les tailles : S, M, L, XL
   - Exemple attendu :
     ```
     001 D;couraud;yannick;...;S
     001 A;Fourcherot;Mickael;...;L
     001 C;AUBREE;FRANCK;...;XL
     ```

### Test 3 : Vérifier les logs de debug (console du navigateur)

1. **Ouvrir les outils de développement** : F12

2. **Cliquer sur "Exporter CSV"**

3. **Vérifier dans la console** :
   ```
   === DEBUG CSV EXPORT ===
   Total entries avec options: 4 / 4
   Race options map: [...]
   Sorted option labels: ["T-shirt technique"]
   Sample entry options: [...]
   ```

4. **Si vous voyez des warnings** :
   - `Choice not found for...` → Les IDs de choix ne correspondent pas
   - `Option not found for...` → Les IDs d'options ne correspondent pas

## Données de test dans la base

Les inscriptions existantes :
- 001 A (Mickael) : Taille L
- 001 B (Pierre) : Taille L
- 001 C (Franck) : Taille XL
- 001 D (Yannick) : Taille S

## Si le problème persiste

1. **Vérifier dans la console** qu'il n'y a pas d'erreurs JavaScript

2. **Vérifier les logs de debug** pour voir où ça bloque

3. **Vider complètement le cache** :
   - Sur Chrome : `chrome://settings/clearBrowserData`
   - Cocher toutes les cases
   - Période : "Toutes les données"

4. **Redémarrer le serveur de développement** :
   ```bash
   # Arrêter le serveur (Ctrl+C)
   # Puis relancer
   npm run dev
   ```
