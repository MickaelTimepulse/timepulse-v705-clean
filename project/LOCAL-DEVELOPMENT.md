# 💻 Guide Développement Local - Timepulse

## 🎯 Pourquoi Développer en Local?

- ✅ Pas de dépendance à Bolt.new
- ✅ Preview instantané sans bug
- ✅ Hot reload ultra-rapide
- ✅ Debugger avec Chrome DevTools
- ✅ Utiliser votre IDE favori (VS Code, Cursor, WebStorm)

## 📦 Installation Initiale

### Prérequis
- Node.js 18+ ([télécharger](https://nodejs.org))
- Git ([télécharger](https://git-scm.com))
- Un éditeur (VS Code recommandé)
- Un compte Supabase (gratuit pour dev)

### Étape 1: Récupérer le Code

**Depuis Bolt.new:**
1. Cliquer sur "Download Project" ou "Export"
2. Extraire le ZIP dans un dossier

**Ou depuis GitHub (si déjà pushé):**
```bash
git clone https://github.com/VOTRE-ORG/timepulse.git
cd timepulse
```

### Étape 2: Installer les Dépendances

```bash
npm install
```

Temps: ~2 minutes

### Étape 3: Configurer l'Environnement

```bash
# Copier le template
cp .env.example .env

# Éditer avec vos clés
nano .env  # ou code .env
```

Contenu de `.env`:
```env
VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_STRIPE_PUBLIC_KEY=pk_test_...  # Mode TEST en dev
VITE_OPENAI_API_KEY=sk-...  # Optionnel
```

**⚠️ Utilisez les clés TEST en développement!**

### Étape 4: Lancer le Serveur de Dev

```bash
npm run dev
```

→ Ouvrir http://localhost:5173

**Hot reload activé:** Toute modification du code recharge instantanément!

## 🗄️ Base de Données Locale (Optionnel)

### Option A: Utiliser Supabase Cloud (SIMPLE)

Utilisez votre projet Supabase de production ou créez un projet "dev":
- Pas besoin d'installer Postgres localement
- Base de données accessible partout
- Migrations appliquées via Dashboard

### Option B: Supabase Local (AVANCÉ)

**Installer Supabase CLI:**
```bash
# macOS
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

**Initialiser Supabase local:**
```bash
supabase init
supabase start
```

Cela lance:
- PostgreSQL local sur port 54322
- Supabase Studio sur http://localhost:54323
- Edge Functions runtime

**Appliquer les migrations:**
```bash
# Copier vos migrations
cp supabase/migrations/*.sql supabase/migrations/

# Appliquer
supabase db reset
```

**Configurer .env pour local:**
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbG... (fournie par supabase start)
```

## 🛠️ Workflow de Développement

### 1. Créer une Feature

```bash
# Créer une branche
git checkout -b feature/nom-de-la-feature

# Coder...
# Le serveur recharge automatiquement à chaque sauvegarde
```

### 2. Tester

```bash
# Vérifier les types
npm run typecheck

# Build de production
npm run build

# Tester le build
npm run preview
```

### 3. Commit

```bash
git add .
git commit -m "feat: description de la feature"
git push origin feature/nom-de-la-feature
```

### 4. Déployer

**Automatique via Vercel:**
- Chaque push sur `main` → déploiement automatique
- Chaque PR → preview deployment automatique

## 🔧 Extensions VS Code Recommandées

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "supabase.supabase-vscode",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

Installer:
1. Ouvrir VS Code
2. Extensions (Cmd+Shift+X)
3. Chercher chaque extension
4. Cliquer Install

## 🐛 Debugging

### Chrome DevTools

1. Ouvrir http://localhost:5173
2. F12 → Console/Network/Sources
3. Mettre des breakpoints dans l'onglet Sources

### VS Code Debugger

Créer `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

Puis F5 pour débugger avec breakpoints.

## 📊 Outils de Développement

### Visualiser la Base de Données

**Supabase Studio:**
- Cloud: https://app.supabase.com → Votre projet → Table Editor
- Local: http://localhost:54323

**Alternatives:**
- [TablePlus](https://tableplus.com) (GUI Postgres)
- [DBeaver](https://dbeaver.io) (gratuit, open-source)

### Tester les Edge Functions en Local

```bash
# Lancer une fonction
supabase functions serve send-email

# Appeler avec curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"to":"test@example.com","subject":"Test"}'
```

### Tester Stripe en Local

1. Installer Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```

3. Utiliser les cartes de test:
   ```
   4242 4242 4242 4242 - Succès
   4000 0000 0000 9995 - Échec
   ```

## 🔄 Synchroniser avec Bolt.new

**Workflow recommandé:**

1. **Développer localement** les grosses features
2. **Tester** en local
3. **Commit + Push** sur GitHub
4. **Ouvrir Bolt.new** → il détecte les changements Git
5. **Continuer** les petites modifs sur Bolt si besoin

**Ou inversement:**
1. Demander des modifs sur Bolt.new
2. Download le projet
3. Tester en local
4. Push sur Git

## 🚀 Commandes Utiles

```bash
# Développement
npm run dev              # Lancer le serveur dev
npm run build            # Build production
npm run preview          # Tester le build
npm run typecheck        # Vérifier les types
npm run lint             # Linter le code

# Base de données (si Supabase CLI)
supabase start           # Démarrer Supabase local
supabase stop            # Arrêter
supabase db reset        # Reset + migrations
supabase db diff         # Voir les changements

# Git
git status               # Voir les changements
git add .                # Ajouter tous les fichiers
git commit -m "..."      # Commit
git push                 # Push vers GitHub
```

## 🎓 Ressources

- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Stripe Docs**: https://stripe.com/docs

## 🆘 Problèmes Courants

### Port 5173 déjà utilisé
```bash
# Tuer le processus
lsof -ti:5173 | xargs kill -9

# Ou changer le port dans vite.config.ts
export default defineConfig({
  server: { port: 3000 }
})
```

### node_modules corrompus
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreurs TypeScript bizarres
```bash
# Redémarrer le serveur TypeScript dans VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Supabase local ne démarre pas
```bash
# Vérifier Docker
docker ps

# Redémarrer
supabase stop
supabase start
```

---

## ✅ Vous êtes prêt!

**Workflow optimal:**
- 🏠 **Développement quotidien**: En local (rapide, stable)
- ⚡ **Prototypage rapide**: Sur Bolt.new (avec moi)
- 🚀 **Déploiement**: Automatique via Vercel

Questions? Demandez!
