# 🧪 Guide de Test Local - Timepulse

## 🎯 Objectif
Tester Timepulse en local avant déploiement production pour valider toutes les fonctionnalités.

---

## ⚡ OPTION 1: Test Express (15 minutes)

### Prérequis
- Node.js 18+ installé
- Git installé
- Un éditeur de code (VS Code recommandé)

### Étapes

#### 1. Télécharger le Projet
```bash
# Depuis Bolt.new, cliquer sur "Download Project"
# Ou cloner depuis votre repo Git
cd ~/Downloads
unzip timepulse.zip
cd timepulse
```

#### 2. Installer les Dépendances
```bash
npm install
```
⏱️ Durée: ~2 minutes

#### 3. Configurer les Variables d'Environnement
```bash
cp .env.example .env
```

Éditer `.env` avec vos clés Supabase:
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon

# Optionnel pour tests complets
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_FFA_API_KEY=votre_cle_ffa
VITE_FFTRI_API_KEY=votre_cle_fftri
```

**Note**: Sans les clés API (FFA, FFTri, Oxisms), les services fonctionnent en **mode mock** automatiquement.

#### 4. Appliquer les Migrations Database

**Via Supabase Dashboard**:
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Menu "SQL Editor"
4. Copier/coller CHAQUE fichier de `supabase/migrations/` dans l'ordre
5. Exécuter chaque migration

**Migrations à appliquer dans l'ordre**:
```
20251014201249_create_timepulse_schema.sql
20251014205617_create_admin_users_fixed.sql
20251014205715_add_update_password_function.sql
20251014210000_create_organizer_module.sql
... (tous les fichiers dans l'ordre chronologique)
20251023152000_add_sms_integration.sql
```

⏱️ Durée: ~10 minutes

#### 5. Lancer le Serveur de Dev
```bash
npm run dev
```

Votre app sera accessible sur: **http://localhost:5173**

⏱️ Durée: Instantané

---

## 🔬 OPTION 2: Test Complet avec Database Locale (45 minutes)

### Prérequis Supplémentaires
- Docker Desktop installé
- Supabase CLI installé

### Étapes

#### 1. Installer Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

#### 2. Initialiser Supabase Local
```bash
cd timepulse
supabase init
```

#### 3. Démarrer Supabase Local
```bash
supabase start
```

Cette commande va:
- Télécharger les images Docker
- Démarrer PostgreSQL local
- Démarrer Studio (interface web)
- Démarrer Edge Functions runtime

⏱️ Durée: ~5 minutes (première fois)

Vous recevrez des URLs:
```
API URL: http://localhost:54321
Studio URL: http://localhost:54323
Anon key: eyJhbGc...
```

#### 4. Appliquer les Migrations Localement
```bash
# Copier toutes les migrations depuis le projet
cp supabase/migrations/*.sql supabase/migrations/

# Appliquer
supabase db reset
```

#### 5. Configurer .env pour Local
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGc... (copier depuis output supabase start)
```

#### 6. Lancer l'App
```bash
npm run dev
```

---

## ✅ CHECKLIST DE TEST

### 🏠 Homepage
- [ ] La page d'accueil charge correctement
- [ ] Le hero s'affiche avec animations
- [ ] Les événements à venir s'affichent
- [ ] Les features sont visibles
- [ ] Le footer contient les bonnes infos

### 👤 Authentification Organisateur
- [ ] Créer un compte organisateur
- [ ] Se connecter
- [ ] Accéder au dashboard
- [ ] Se déconnecter

### 📅 Gestion Événements
- [ ] Créer un nouvel événement
- [ ] Upload image événement
- [ ] Ajouter une course
- [ ] Configurer les prix
- [ ] Publier l'événement

### 💳 Inscriptions
- [ ] Formulaire inscription public s'affiche
- [ ] Remplir tous les champs
- [ ] Valider le formulaire
- [ ] (Si Stripe configuré) Paiement test
- [ ] Recevoir confirmation

### 📊 Module Résultats
- [ ] Créer fichier CSV test:
```csv
Dossard,Nom,Prénom,Sexe,Catégorie,Temps
1,MARTIN,Jean,M,SEM,01:25:30
2,DUBOIS,Sophie,F,SEF,01:28:15
3,DURAND,Pierre,M,V1M,01:32:45
```
- [ ] Uploader via ResultsImporter
- [ ] Vérifier preview
- [ ] Import réussi
- [ ] Consulter page résultats publique
- [ ] Tester recherche/filtres
- [ ] Exporter CSV

### 📈 Statistiques
- [ ] Accéder dashboard stats
- [ ] Vérifier KPIs (inscrits, revenus)
- [ ] Graphique par jour s'affiche
- [ ] Répartition par course
- [ ] Répartition par genre
- [ ] Filtrer par période (7j/30j)

### 📥 Exports Excel
Test dans la console navigateur:
```javascript
// Ouvrir console (F12)
import { exportToCSV } from './src/lib/excel-export.js';

const testEntries = [{
  bibNumber: 1,
  firstName: 'Jean',
  lastName: 'Martin',
  gender: 'M',
  birthDate: '1990-01-15',
  nationality: 'FRA',
  email: 'jean@example.com',
  phone: '0612345678',
  category: 'SEM',
  raceName: 'Marathon',
  price: 45.00,
  status: 'confirmed',
  registrationDate: new Date().toISOString()
}];

exportToCSV(testEntries, 'test.csv');
```
- [ ] Export CSV standard
- [ ] Export Elogica
- [ ] Export Emails
- [ ] Ouvrir dans Excel, vérifier encodage

### 🏃 Intégration FFA (Mode Mock)
```javascript
// Console navigateur
import { verifyFFALicense } from './src/lib/ffa-api.js';

const result = await verifyFFALicense('1234567890');
console.log(result);
// Devrait retourner données mock avec valid: true
```
- [ ] Mode mock fonctionne
- [ ] Données cohérentes retournées

### 🏊 Intégration FFTri (Mode Mock)
```javascript
import { verifyFFTriLicense } from './src/lib/fftri-api.js';

const result = await verifyFFTriLicense('T123456');
console.log(result);
// Devrait retourner niveau FIS, club, etc.
```
- [ ] Mode mock fonctionne
- [ ] Niveau FIS valide
- [ ] Vérification suspension

### 📱 SMS (Mode Mock)
Test via Supabase Dashboard > SQL Editor:
```sql
-- Créer un log SMS test
INSERT INTO sms_logs (phone_number, message, status)
VALUES ('+33612345678', 'Test SMS Timepulse', 'sent');

-- Vérifier
SELECT * FROM sms_logs;
```
- [ ] Log SMS créé
- [ ] Statuts corrects

### 🚗 Covoiturage
- [ ] Créer offre covoiturage
- [ ] Réserver place
- [ ] Code gestion reçu par email
- [ ] Annuler réservation

### 🎟️ Échange Dossards
- [ ] Mettre dossard en vente
- [ ] Rechercher dossards disponibles
- [ ] Acheter un dossard
- [ ] Vérifier transfert

---

## 🐛 TESTS DE RÉGRESSION

### Performance
```bash
# Build production
npm run build

# Vérifier taille
ls -lh dist/assets/

# Devrait être ~200KB total
```

### TypeScript
```bash
# Vérifier types
npm run typecheck

# Devrait afficher: "Found 0 errors"
```

### Linting
```bash
npm run lint
```

---

## 🔍 DEBUGGING

### Erreurs Courantes

#### 1. "Cannot find module @supabase/supabase-js"
```bash
npm install
```

#### 2. "Supabase URL not configured"
Vérifier que `.env` contient:
```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

Redémarrer le serveur:
```bash
# Ctrl+C puis
npm run dev
```

#### 3. "Table does not exist"
Les migrations ne sont pas appliquées.
Aller dans Supabase Dashboard > SQL Editor et appliquer toutes les migrations.

#### 4. "RLS policy violation"
- Vérifier que vous êtes bien authentifié
- Les policies RLS sont restrictives par défaut
- Certaines actions nécessitent un rôle admin/organisateur

#### 5. Build échoue
```bash
# Nettoyer cache
rm -rf node_modules dist
npm install
npm run build
```

### Logs Utiles

**Logs Supabase**:
```bash
# Si Supabase local
supabase logs
```

**Logs PostgreSQL**:
Dans Supabase Dashboard > Logs

**Console Navigateur**:
- F12 > Console
- Voir les erreurs JavaScript
- Voir les appels réseau (Network tab)

---

## 📊 DONNÉES DE TEST

### Créer un Admin
```sql
-- Via Supabase Dashboard > SQL Editor
INSERT INTO admin_users (id, email, full_name, role)
VALUES (
  auth.uid(), -- Votre user ID après signup
  'admin@timepulse.fr',
  'Admin Timepulse',
  'super_admin'
);
```

### Créer un Organisateur
```sql
-- 1. Créer l'organisateur
INSERT INTO organizers (name, email, phone)
VALUES ('Test Chrono', 'test@chrono.fr', '0612345678')
RETURNING id;

-- 2. Lier à votre user (copier l'id retourné ci-dessus)
INSERT INTO organizer_users (organizer_id, user_id, role)
VALUES ('id-copié-ici', auth.uid(), 'owner');
```

### Créer un Événement Test
```sql
INSERT INTO events (
  name,
  description,
  location,
  start_date,
  organizer_id,
  status
)
VALUES (
  'Marathon Test',
  'Événement de test',
  'Paris, France',
  '2025-06-15',
  'organizer-id-ici',
  'published'
)
RETURNING id;
```

### Créer une Course Test
```sql
INSERT INTO races (
  event_id,
  name,
  distance,
  elevation_gain,
  max_participants,
  start_time
)
VALUES (
  'event-id-ici',
  '10km',
  10,
  150,
  500,
  '2025-06-15 09:00:00'
);
```

---

## 🎥 SCÉNARIOS DE TEST

### Scénario 1: Parcours Organisateur Complet
1. S'inscrire comme organisateur
2. Créer un événement
3. Ajouter 2 courses
4. Configurer tarifs
5. Publier événement
6. Consulter page publique
7. Importer résultats (CSV test)
8. Consulter stats

**Temps estimé**: 15 minutes

### Scénario 2: Parcours Participant
1. Consulter événements disponibles
2. Cliquer sur un événement
3. Choisir une course
4. Remplir formulaire inscription
5. (Mock) Payer
6. Recevoir confirmation
7. Consulter ses inscriptions

**Temps estimé**: 10 minutes

### Scénario 3: Import Résultats
1. Créer un fichier CSV avec 50 résultats
2. Se connecter comme organisateur
3. Aller dans l'événement
4. Import résultats
5. Vérifier preview
6. Confirmer import
7. Vérifier page résultats publique
8. Tester filtres et recherche
9. Exporter résultats

**Temps estimé**: 15 minutes

---

## 📱 TESTS MOBILE

### iOS Safari
- Ouvrir http://localhost:5173 dans Safari iOS
- Tester toutes les fonctionnalités
- Vérifier responsive design
- Tester formulaires
- Vérifier upload images

### Android Chrome
- Ouvrir http://localhost:5173 dans Chrome Android
- Mêmes tests qu'iOS
- Vérifier comportement back button
- Tester notifications (si activées)

### Outils de Test
```bash
# Simuler mobile dans navigateur
# Ouvrir DevTools (F12)
# Toggle Device Toolbar (Ctrl+Shift+M)
# Choisir iPhone 14 Pro, Pixel 7, etc.
```

---

## ⚡ TESTS DE PERFORMANCE

### Lighthouse
```bash
# Installer Lighthouse CLI
npm install -g lighthouse

# Build production
npm run build

# Servir en local
npx serve -s dist -p 3000

# Run Lighthouse
lighthouse http://localhost:3000 --view
```

**Cibles**:
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

### Tests de Charge
```bash
# Installer Artillery
npm install -g artillery

# Créer test.yml
cat > test.yml << EOF
config:
  target: 'http://localhost:5173'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
    - get:
        url: "/"
    - get:
        url: "/events"
EOF

# Exécuter
artillery run test.yml
```

---

## 🎯 CRITÈRES DE VALIDATION

### Must-Have (Bloquants)
- [ ] Homepage charge en <2s
- [ ] Authentification fonctionne
- [ ] Création événement fonctionne
- [ ] Inscription publique fonctionne
- [ ] Import résultats fonctionne
- [ ] Stats s'affichent correctement
- [ ] Export Excel fonctionne
- [ ] Aucune erreur console critique
- [ ] Build production réussi
- [ ] TypeCheck passe (0 errors)

### Should-Have (Importants)
- [ ] Paiement Stripe (mode test)
- [ ] Emails Oximailing
- [ ] SMS Oxisms (mock)
- [ ] Covoiturage
- [ ] Échange dossards
- [ ] Mobile responsive
- [ ] Performance >80 Lighthouse

### Nice-to-Have (Bonus)
- [ ] API FFA réelle
- [ ] API FFTri réelle
- [ ] Certificats PDF
- [ ] Newsletter
- [ ] Tests unitaires
- [ ] Tests E2E

---

## 🚀 APRÈS LES TESTS

### Si Tout Fonctionne ✅
1. Commiter les derniers changements
2. Suivre QUICK-START.md pour déploiement Vercel
3. Appliquer migrations sur Supabase production
4. Configurer les vraies clés API
5. Tester en production
6. Annoncer le lancement!

### Si Bugs Trouvés 🐛
1. Noter tous les bugs dans un fichier BUGS.md
2. Prioriser (bloquant/important/mineur)
3. Corriger les bloquants
4. Re-tester
5. Itérer jusqu'à stabilité

---

## 📞 SUPPORT

Besoin d'aide pendant les tests?
- 📧 dev@timepulse.fr
- 📚 Lire LOCAL-DEVELOPMENT.md
- 🐛 Créer une issue GitHub
- 💬 Demander à Bolt (moi!)

---

**Bon courage pour les tests!** 🧪🚀
