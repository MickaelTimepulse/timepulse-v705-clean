#!/bin/bash

# ============================================
# 🚀 TIMEPULSE - DÉPLOIEMENT AUTOMATIQUE
# ============================================
# Script pour déployer automatiquement sur Vercel
# Usage: ./deploy.sh "Message de commit"
# ============================================

set -e  # Arrêter si erreur

# Couleurs pour affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 DÉPLOIEMENT AUTOMATIQUE TIMEPULSE ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur : package.json non trouvé${NC}"
    echo "Assure-toi d'être dans le dossier du projet Timepulse"
    exit 1
fi

# Message de commit
COMMIT_MESSAGE="${1:-Update: $(date '+%Y-%m-%d %H:%M:%S')}"

echo -e "${YELLOW}📝 Message de commit :${NC} $COMMIT_MESSAGE"
echo ""

# Étape 1 : Vérifier que le build fonctionne
echo -e "${BLUE}[1/5]${NC} ${YELLOW}🔨 Test du build...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build réussi${NC}"
else
    echo -e "${RED}❌ Build échoué${NC}"
    echo ""
    echo "Lance manuellement pour voir l'erreur :"
    echo "  npm run build"
    exit 1
fi
echo ""

# Étape 2 : Vérifier Git
echo -e "${BLUE}[2/5]${NC} ${YELLOW}📦 Vérification de Git...${NC}"
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git non initialisé, initialisation...${NC}"
    git init
    git branch -M main
    echo -e "${GREEN}✅ Git initialisé${NC}"
else
    echo -e "${GREEN}✅ Git déjà configuré${NC}"
fi
echo ""

# Étape 3 : Vérifier remote GitHub
echo -e "${BLUE}[3/5]${NC} ${YELLOW}🔗 Vérification du repo GitHub...${NC}"
if ! git remote | grep -q "origin"; then
    echo -e "${RED}❌ Pas de remote GitHub configuré${NC}"
    echo ""
    echo -e "${YELLOW}Configuration nécessaire :${NC}"
    echo "1. Crée un repo sur GitHub : https://github.com/new"
    echo "2. Lance cette commande avec l'URL de ton repo :"
    echo ""
    echo -e "${GREEN}   git remote add origin https://github.com/TON-COMPTE/timepulse-platform.git${NC}"
    echo ""
    echo "3. Relance ce script"
    exit 1
else
    REMOTE_URL=$(git remote get-url origin)
    echo -e "${GREEN}✅ Remote configuré :${NC} $REMOTE_URL"
fi
echo ""

# Étape 4 : Commit et push
echo -e "${BLUE}[4/5]${NC} ${YELLOW}📤 Envoi vers GitHub...${NC}"

# Ajouter tous les fichiers
git add .

# Vérifier s'il y a des changements
if git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  Aucun changement à commiter${NC}"
else
    # Commit
    git commit -m "$COMMIT_MESSAGE"
    echo -e "${GREEN}✅ Commit créé${NC}"
fi

# Push vers GitHub
echo "   Pushing..."
if git push origin main 2>&1; then
    echo -e "${GREEN}✅ Code envoyé sur GitHub${NC}"
else
    echo -e "${RED}❌ Erreur lors du push${NC}"
    echo ""
    echo "Si c'est le premier push, lance :"
    echo "  git push -u origin main"
    exit 1
fi
echo ""

# Étape 5 : Vercel
echo -e "${BLUE}[5/5]${NC} ${YELLOW}🌐 Déploiement Vercel...${NC}"
echo ""
echo -e "${GREEN}✅ Code poussé sur GitHub !${NC}"
echo ""
echo -e "${BLUE}Vercel va déployer automatiquement dans ~2 minutes${NC}"
echo ""
echo "📊 Suis le déploiement ici :"
echo "   https://vercel.com/dashboard"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ DÉPLOIEMENT LANCÉ           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "🔗 Ton site sera mis à jour dans quelques minutes"
echo ""
