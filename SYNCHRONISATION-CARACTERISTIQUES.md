# 🔄 Guide de Synchronisation - Caractéristiques d'Événements

## 📋 Fichiers à copier dans ton projet local

### 1️⃣ Migration Supabase (OBLIGATOIRE)

```
supabase/migrations/20251113213448_20251113230000_create_event_characteristics.sql
```

### 2️⃣ Composants React (3 fichiers)

```
src/components/EventCharacteristicsPicker.tsx
src/components/EventCharacteristicsBadges.tsx
src/components/EventCharacteristicsFilter.tsx
```

### 3️⃣ Scripts d'application (optionnels)

```
apply-characteristics-migration.sh
apply-characteristics-migration.html
```

---

## 🚀 Méthode d'application

### Option 1 : Script Shell (Recommandé)

```bash
# Rendre le script exécutable
chmod +x apply-characteristics-migration.sh

# Exécuter
./apply-characteristics-migration.sh
```

**Prérequis :**
- Fichier `.env` avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
- Optionnel : `SUPABASE_SERVICE_ROLE_KEY` pour l'application automatique

---

### Option 2 : Supabase Dashboard (Manuel)

1. **Ouvre** Supabase Dashboard : https://app.supabase.com
2. **Va dans** SQL Editor
3. **Crée** une nouvelle requête
4. **Copie-colle** le contenu du fichier de migration
5. **Exécute** la requête (Run)

---

### Option 3 : Fichier HTML (Interface graphique)

```bash
# Lance un serveur local
npx serve .

# Ouvre dans le navigateur
http://localhost:3000/apply-characteristics-migration.html
```

---

## ✅ Vérification après application

### 1. Vérifier les tables créées

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('event_characteristic_types', 'event_characteristics');
```

### 2. Vérifier les données insérées

```sql
SELECT COUNT(*) FROM event_characteristic_types;
-- Devrait retourner : 16
```

### 3. Tester les caractéristiques

```sql
SELECT code, name, category FROM event_characteristic_types
ORDER BY category, display_order;
```

---

## 🔧 Dépannage

### Erreur : "relation already exists"

La table existe déjà, c'est OK ! La migration utilise `IF NOT EXISTS`.

### Erreur : "permission denied"

Utilise la clé `SERVICE_ROLE` au lieu de la clé `ANON`.

### Erreur : "foreign key violation"

Assure-toi que la table `events` existe (migration précédente).

---

## 📦 Déploiement

Après avoir appliqué la migration :

```bash
# Test en local
npm run dev

# Build
npm run build

# Déploiement
npm run deploy
```

---

## 🎯 Ce que cette migration ajoute

### Tables

- **event_characteristic_types** : Types de caractéristiques (16 pré-remplies)
- **event_characteristics** : Liaison entre événements et caractéristiques

### Caractéristiques disponibles

#### Certifications
- Distance officielle
- Course qualificative

#### Terrain
- Course en ligne
- Course sur circuit
- Course sur route
- Course nature
- Course en montagne

#### Style
- Course festive
- Course à élimination

#### Catégories Trail
- Trail XXS à XXL (7 catégories)

### Sécurité RLS

- ✅ Public peut voir toutes les caractéristiques actives
- ✅ Admins peuvent gérer les types de caractéristiques
- ✅ Organisateurs peuvent ajouter/supprimer les caractéristiques de leurs événements

---

## 📞 Support

En cas de problème :

1. Vérifie les logs dans la console du navigateur (F12)
2. Vérifie les erreurs SQL dans Supabase Dashboard > Logs
3. Vérifie que toutes les migrations précédentes sont appliquées
4. Contacte le support Timepulse

---

## 🔗 Liens utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Guide RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Editor](https://app.supabase.com)
