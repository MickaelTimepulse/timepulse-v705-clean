#!/bin/bash

# ============================================
# 💾 TIMEPULSE - BACKUP AUTOMATIQUE
# ============================================
# Script pour sauvegarder la base de données Supabase
# Usage: ./backup-database.sh
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      💾 BACKUP BASE DE DONNÉES         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Vérifier que .env existe
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Fichier .env non trouvé${NC}"
    exit 1
fi

source .env

# Vérifier les variables
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_URL non défini${NC}"
    exit 1
fi

PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo -e "${YELLOW}📊 Projet :${NC} $PROJECT_REF"
echo -e "${YELLOW}📁 Backup :${NC} $BACKUP_DIR"
echo ""

echo -e "${BLUE}Backup via Dashboard Supabase${NC}"
echo ""
echo "Pour un backup complet, utilise le Dashboard Supabase :"
echo ""
echo "1. https://supabase.com/dashboard/project/$PROJECT_REF/database/backups"
echo "2. Télécharger le dernier backup"
echo ""
echo "Les backups automatiques sont créés quotidiennement par Supabase."
echo ""

# Créer un fichier info pour traçabilité
cat > "${BACKUP_DIR}/info_${TIMESTAMP}.txt" << EOF
Backup Timepulse
Date: $(date '+%Y-%m-%d %H:%M:%S')
Projet: $PROJECT_REF
URL: https://supabase.com/dashboard/project/$PROJECT_REF/database/backups

Pour restaurer:
1. Dashboard Supabase → Database → Backups
2. Point-in-time Recovery (7 derniers jours)
EOF

echo -e "${GREEN}✅ Info backup créée${NC}"
echo ""
