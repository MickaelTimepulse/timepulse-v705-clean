#!/bin/bash

# ============================================
# 🎯 TIMEPULSE - CONFIGURATION INITIALE
# ============================================
# Script pour configurer l'automatisation
# Usage: ./setup-auto-deploy.sh
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🎯 CONFIGURATION AUTOMATISATION      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur : package.json non trouvé${NC}"
    exit 1
fi

echo -e "${BOLD}Ce script va configurer l'automatisation Git + Vercel${NC}"
echo ""
echo "Prérequis nécessaires :"
echo "  ✓ Compte GitHub"
echo "  ✓ Compte Vercel"
echo "  ✓ Git installé"
echo ""
read -p "Prêt à continuer ? (o/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo "Abandon."
    exit 0
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ÉTAPE 1 : CONFIGURATION GIT          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Git config
if ! git config user.name > /dev/null 2>&1; then
    echo "Configuration Git nécessaire"
    read -p "Ton nom (ex: Jean Dupont) : " GIT_NAME
    read -p "Ton email : " GIT_EMAIL

    git config --global user.name "$GIT_NAME"
    git config --global user.email "$GIT_EMAIL"
    echo -e "${GREEN}✅ Git configuré${NC}"
else
    GIT_NAME=$(git config user.name)
    echo -e "${GREEN}✅ Git déjà configuré ($GIT_NAME)${NC}"
fi

echo ""

# Init Git
if [ ! -d ".git" ]; then
    echo "Initialisation du dépôt Git..."
    git init
    git branch -M main
    echo -e "${GREEN}✅ Dépôt Git initialisé${NC}"
else
    echo -e "${GREEN}✅ Dépôt Git existant${NC}"
fi

echo ""

# .gitignore
if [ ! -f ".gitignore" ]; then
    echo "Création de .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules
.pnpm-debug.log*

# Build
dist
dist-ssr
*.local

# Environment
.env
.env.local
.env.production.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store

# Logs
logs
*.log

# Cache
.turbo
.vercel
.cache

# Backups
backups/
*.sql
*.tar.gz
EOF
    echo -e "${GREEN}✅ .gitignore créé${NC}"
else
    echo -e "${GREEN}✅ .gitignore existe${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ÉTAPE 2 : REPOSITORY GITHUB          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

if git remote | grep -q "origin"; then
    REMOTE_URL=$(git remote get-url origin)
    echo -e "${GREEN}✅ Remote GitHub déjà configuré${NC}"
    echo "   URL : $REMOTE_URL"
else
    echo "Configuration du repository GitHub..."
    echo ""
    echo -e "${YELLOW}ACTION REQUISE :${NC}"
    echo "1. Va sur https://github.com/new"
    echo "2. Nom suggéré : ${BOLD}timepulse-platform${NC}"
    echo "3. Visibilité : Privé"
    echo "4. Ne coche RIEN (pas de README, .gitignore, etc.)"
    echo "5. Clique 'Create repository'"
    echo ""
    echo -e "${YELLOW}Ensuite, copie l'URL du repo (ex: https://github.com/ton-compte/timepulse-platform.git)${NC}"
    echo ""
    read -p "URL du repo GitHub : " GITHUB_URL

    git remote add origin "$GITHUB_URL"
    echo -e "${GREEN}✅ Remote ajouté${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ÉTAPE 3 : PREMIER COMMIT             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

git add .

if git diff --cached --quiet; then
    echo -e "${YELLOW}Aucun changement à commiter${NC}"
else
    git commit -m "🚀 Configuration initiale automatisation Timepulse"
    echo -e "${GREEN}✅ Commit créé${NC}"
fi

echo ""
echo "Envoi du code sur GitHub..."
git push -u origin main 2>&1 || {
    echo ""
    echo -e "${YELLOW}⚠️  Si c'est le premier push, il faut peut-être t'authentifier${NC}"
    echo ""
    read -p "Appuie sur Entrée une fois l'authentification faite..."
    git push -u origin main
}

echo -e "${GREEN}✅ Code poussé sur GitHub${NC}"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ÉTAPE 4 : CONFIGURATION VERCEL       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}ACTION REQUISE :${NC}"
echo ""
echo "1. Va sur ${BOLD}https://vercel.com/new${NC}"
echo ""
echo "2. Clique ${BOLD}'Import Git Repository'${NC}"
echo ""
echo "3. Sélectionne ton repo ${BOLD}'timepulse-platform'${NC}"
echo ""
echo "4. ${BOLD}IMPORTANT${NC} : Avant de cliquer Deploy, ajoute ces variables :"
echo ""
echo "   ${BOLD}Environment Variables :${NC}"
echo ""
echo "   • VITE_SUPABASE_URL"
echo "     $(grep VITE_SUPABASE_URL .env | cut -d= -f2)"
echo ""
echo "   • VITE_SUPABASE_ANON_KEY"
echo "     $(grep VITE_SUPABASE_ANON_KEY .env | cut -d= -f2)"
echo ""
echo "   ${YELLOW}⚠️  Coche les 3 environnements : Production, Preview, Development${NC}"
echo ""
echo "5. Clique ${BOLD}'Deploy'${NC}"
echo ""
echo "6. Attends ~2 minutes"
echo ""

read -p "Appuie sur Entrée une fois le déploiement terminé..."
echo ""

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ CONFIGURATION TERMINÉE !          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BOLD}🎉 L'automatisation est maintenant configurée !${NC}"
echo ""
echo "📝 Utilisation :"
echo ""
echo "   ${BOLD}./deploy.sh \"Mon message\"${NC}"
echo "   → Déploie automatiquement sur GitHub + Vercel"
echo ""
echo "   ${BOLD}./backup-database.sh${NC}"
echo "   → Affiche les infos pour backup Supabase"
echo ""
echo "🔗 Prochaines étapes :"
echo ""
echo "   1. Note ton URL Vercel (ex: timepulse-xxx.vercel.app)"
echo "   2. Teste l'URL /admin/login"
echo "   3. Crée des comptes admin dans Supabase"
echo ""
echo "💡 À chaque modification du code :"
echo "   → Lance ${BOLD}./deploy.sh${NC}"
echo "   → Vercel déploie automatiquement en 2 minutes"
echo ""
