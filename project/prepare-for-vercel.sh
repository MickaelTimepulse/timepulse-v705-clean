#!/bin/bash

echo "============================================"
echo "🚀 PRÉPARATION POUR DÉPLOIEMENT VERCEL"
echo "============================================"
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur : package.json non trouvé"
    echo "Assure-toi d'être dans le dossier du projet Timepulse"
    exit 1
fi

echo "✅ Dossier projet trouvé"
echo ""

# Créer .gitignore si nécessaire
if [ ! -f ".gitignore" ]; then
    echo "📝 Création de .gitignore..."
    cat > .gitignore << 'GITIGNORE'
# Dependencies
node_modules
.pnpm-debug.log*

# Build outputs
dist
dist-ssr
*.local

# Environment variables
.env
.env.local
.env.production.local

# Editor directories
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Cache
.turbo
.vercel
.cache

# Backup files
*.sql
*.tar.gz
backup_*.sql
GITIGNORE
    echo "✅ .gitignore créé"
else
    echo "✅ .gitignore existe déjà"
fi
echo ""

# Vérifier que le build fonctionne
echo "🔨 Test du build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build réussi !"
else
    echo "❌ Build échoué - corrige les erreurs avant de continuer"
    exit 1
fi
echo ""

# Initialiser Git
echo "📦 Initialisation de Git..."
if [ -d ".git" ]; then
    echo "⚠️  Git déjà initialisé"
else
    git init
    git add .
    git commit -m "Timepulse - Version complète avec monitoring et rate limiting"
    echo "✅ Git initialisé et premier commit créé"
fi
echo ""

echo "============================================"
echo "✅ PRÉPARATION TERMINÉE !"
echo "============================================"
echo ""
echo "📋 PROCHAINES ÉTAPES :"
echo ""
echo "1️⃣  Créer un repo GitHub :"
echo "   → Va sur https://github.com/new"
echo "   → Nom suggéré : timepulse-platform"
echo "   → Visibilité : Privé (recommandé)"
echo "   → Ne coche RIEN (pas de README, pas de .gitignore)"
echo ""
echo "2️⃣  Lier ce projet au repo GitHub :"
echo "   git remote add origin https://github.com/TON-COMPTE/timepulse-platform.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3️⃣  Déployer sur Vercel :"
echo "   → Va sur https://vercel.com/new"
echo "   → Importer ton repo GitHub"
echo "   → Ajouter les variables d'environnement :"
echo "     VITE_SUPABASE_URL=https://fgstscztsighabpzzzix.supabase.co"
echo "     VITE_SUPABASE_ANON_KEY=eyJhbG..."
echo "   → Cliquer 'Deploy'"
echo ""
echo "============================================"
