#!/bin/bash

# ============================================================================
# Script de déploiement Vercel avec fix 404
# ============================================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement TimePulse v705 vers Vercel"
echo "=========================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon dossier
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé${NC}"
    echo "Assurez-vous d'être dans le dossier racine du projet"
    exit 1
fi

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI n'est pas installé${NC}"
    echo "Installation de Vercel CLI..."
    npm install -g vercel
fi

# Étape 1 : Nettoyage
echo -e "\n${YELLOW}🧹 Étape 1/5 : Nettoyage${NC}"
echo "Suppression des anciens builds..."
rm -rf dist
rm -rf .vercel
rm -rf node_modules/.vite
echo -e "${GREEN}✓ Nettoyage terminé${NC}"

# Étape 2 : Installation des dépendances
echo -e "\n${YELLOW}📦 Étape 2/5 : Installation des dépendances${NC}"
npm ci --quiet
echo -e "${GREEN}✓ Dépendances installées${NC}"

# Étape 3 : Build
echo -e "\n${YELLOW}🔨 Étape 3/5 : Build du projet${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erreur: Le build a échoué${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build réussi${NC}"

# Étape 4 : Vérifier les fichiers critiques
echo -e "\n${YELLOW}🔍 Étape 4/5 : Vérification des fichiers${NC}"

# Vérifier vercel.json
if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ Erreur: vercel.json manquant${NC}"
    exit 1
fi

# Vérifier _redirects
if [ ! -f "public/_redirects" ]; then
    echo -e "${YELLOW}⚠️  Création de public/_redirects${NC}"
    mkdir -p public
    echo "/*    /index.html   200" > public/_redirects
fi

# Vérifier index.html dans dist
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Erreur: dist/index.html manquant${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Tous les fichiers sont présents${NC}"

# Étape 5 : Déploiement
echo -e "\n${YELLOW}🚀 Étape 5/5 : Déploiement vers Vercel${NC}"
echo ""
echo "Options de déploiement :"
echo "  1) Production (timepulsesports.com)"
echo "  2) Preview (URL temporaire pour test)"
echo ""
read -p "Choisissez (1 ou 2) : " choice

case $choice in
    1)
        echo -e "\n${GREEN}🌐 Déploiement en PRODUCTION${NC}"
        vercel --prod --yes
        ;;
    2)
        echo -e "\n${GREEN}🔍 Déploiement en PREVIEW${NC}"
        vercel --yes
        ;;
    *)
        echo -e "${RED}❌ Choix invalide${NC}"
        exit 1
        ;;
esac

# Récupération de l'URL
echo -e "\n${GREEN}✅ Déploiement terminé !${NC}"
echo ""
echo "🔗 Vérifications à faire :"
echo "  1. Ouvrir le site"
echo "  2. Naviguer vers /admin ou /events"
echo "  3. Dupliquer l'onglet (Cmd/Ctrl + Shift + D)"
echo "  4. Vérifier qu'il n'y a pas d'erreur 404"
echo ""
echo "📊 Pour voir les logs :"
echo "  vercel logs https://timepulsesports.com"
echo ""
echo "🎉 Déploiement réussi !"
