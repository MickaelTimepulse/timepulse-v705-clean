# ⚡ Quick Test - 5 Minutes

Guide express pour tester rapidement Timepulse en local.

---

## 🎯 Installation Express

### 1️⃣ Télécharger & Installer (2 min)

```bash
# Télécharger le projet depuis Bolt.new
# Bouton "Download Project" en haut à droite

# Extraire et aller dans le dossier
cd ~/Downloads/timepulse
unzip timepulse.zip
cd timepulse

# Installer
npm install
```

### 2️⃣ Configurer (1 min)

```bash
# Copier template
cp .env.example .env

# Éditer .env (VS Code, nano, vim...)
code .env
```

Ajouter vos clés Supabase:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxx
```

💡 **Obtenir les clés**: Supabase Dashboard > Settings > API

### 3️⃣ Lancer (30 sec)

```bash
npm run dev
```

Ouvrir: **http://localhost:5173**

---

## ✅ Test Rapide (3 min)

### Test 1: Homepage
- ✅ Page charge
- ✅ Design s'affiche correctement
- ✅ Pas d'erreur console (F12)

### Test 2: Inscription Organisateur
1. Cliquer "Espace Organisateur"
2. Créer un compte
3. Se connecter
4. ✅ Dashboard s'affiche

### Test 3: Créer Événement
1. "Nouvel Événement"
2. Remplir nom, date, lieu
3. Ajouter une course (10km)
4. Publier
5. ✅ Événement créé

### Test 4: Import Résultats

Créer `test.csv`:
```csv
Dossard,Nom,Prénom,Sexe,Catégorie,Temps
1,MARTIN,Jean,M,SEM,01:25:30
2,DUBOIS,Sophie,F,SEF,01:28:15
```

1. Dans l'événement > Résultats
2. Upload test.csv
3. ✅ Preview s'affiche
4. Importer
5. ✅ Résultats importés

### Test 5: Statistiques
1. Dashboard > Stats
2. ✅ KPIs s'affichent
3. ✅ Graphiques visibles

---

## 🐛 Si Problème

### Erreur "Supabase URL not configured"
```bash
# Vérifier .env
cat .env | grep SUPABASE

# Redémarrer
npm run dev
```

### Erreur "Table does not exist"
**Les migrations ne sont pas appliquées.**

1. Aller sur https://supabase.com/dashboard
2. SQL Editor > New Query
3. Copier/coller contenu de `supabase/migrations/20251014201249_create_timepulse_schema.sql`
4. Run
5. Répéter pour TOUS les fichiers dans l'ordre

### Port 5173 occupé
```bash
# Utiliser autre port
npm run dev -- --port 3000
```

---

## 🎉 Ça Marche?

**OUI** → Suivre TEST-LOCAL-GUIDE.md pour tests complets

**NON** → Voir LOCAL-DEVELOPMENT.md ou demander sur GitHub

---

## 📊 Tests Avancés

### Build Production
```bash
npm run build
```
✅ Devrait créer `dist/` (~200KB)

### Vérifier Types
```bash
npm run typecheck
```
✅ Devrait afficher "0 errors"

### Test Performance
```bash
# Dans le navigateur
# F12 > Lighthouse
# Run > Performance
```
✅ Score > 90

---

## 🚀 Étape Suivante

**Tests OK?** → Déployer en production

Suivre: **QUICK-START.md**

Temps: 15 minutes
Résultat: Site en ligne sur Vercel

---

**Besoin d'aide?**
- 📖 TEST-LOCAL-GUIDE.md (guide détaillé)
- 📖 LOCAL-DEVELOPMENT.md (setup complet)
- 📖 FEATURES-COMPLETE.md (toutes les features)
