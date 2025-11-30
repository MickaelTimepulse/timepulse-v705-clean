# 🚀 DÉPLOIEMENT RAPIDE - 30 Novembre 2025

## ⚡ Option 1 : Script automatique (RECOMMANDÉ)

### Windows
```cmd
deploy-complete.bat
```

### Linux/Mac
```bash
./deploy-complete.sh
```

**Ce que fait le script :**
1. ✅ Vérifie le build
2. ✅ Commit et push GitHub
3. ✅ Déploie sur Vercel en production

---

## 📝 Option 2 : Commandes manuelles

### Étape 1 : Build
```bash
npm run build
```

### Étape 2 : GitHub
```bash
git add .
git commit -m "feat: Système de réservation et file d'attente + Fix frais de service"
git push origin main
```

### Étape 3 : Vercel
```bash
npm run deploy
# ou
vercel --prod
```

---

## 🗄️ Option 3 : Sauvegarde Supabase (avant déploiement)

### Sauvegarde complète
```bash
# Télécharger la structure
# Dashboard Supabase > SQL Editor > Copy
# Sauvegarder dans backup_2025_11_30.sql

# Ou via pg_dump
pg_dump -h YOUR_HOST -U postgres -d postgres > backup.sql
```

### Vérifier les migrations
```sql
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;
```

### Vérifier le job cron
```sql
SELECT * FROM cron.job;
```

---

## ✅ Checklist de déploiement

### Avant déploiement
- [x] Build réussi (`npm run build`)
- [x] Tests frontend OK
- [x] Migrations Supabase appliquées
- [x] Job cron vérifié
- [x] Documentation à jour

### Pendant déploiement
- [ ] Commit GitHub effectué
- [ ] Push réussi
- [ ] Déploiement Vercel lancé
- [ ] Domaine configuré

### Après déploiement
- [ ] Site accessible sur timepulsesports.com
- [ ] Test inscription simple
- [ ] Test ajout au panier
- [ ] Vérifier job cron en production
- [ ] Test file d'attente (si quota activé)

---

## 📊 Résumé des modifications

### Bugs corrigés
- ✅ Frais de service en double
- ✅ Libellé récapitulatif paiement

### Nouvelles fonctionnalités
- ✅ Suppression auto paniers (10 min)
- ✅ Réservation de places (quotas)
- ✅ File d'attente intelligente
- ✅ Temps d'attente estimé
- ✅ Newsletter bourse aux dossards
- ✅ Prolongation auto panier

### Base de données
- ✅ 2 nouvelles migrations
- ✅ 1 nouvelle table (race_waitlist)
- ✅ 7 nouvelles fonctions SQL
- ✅ 1 job cron actif
- ✅ RLS configurées

### Frontend
- ✅ RaceWaitlistModal.tsx créé
- ✅ CartWidget.tsx amélioré
- ✅ PublicRegistration.tsx optimisé

---

## 🎯 Commandes de vérification post-déploiement

### 1. Vérifier le site
```bash
curl -I https://timepulsesports.com
```

### 2. Vérifier le job cron (via Supabase SQL Editor)
```sql
-- Voir les jobs
SELECT * FROM cron.job;

-- Voir l'historique d'exécution
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### 3. Vérifier les compteurs
```sql
SELECT
  name,
  max_participants,
  confirmed_entries,
  reserved_spots,
  (max_participants - confirmed_entries - reserved_spots) as places_disponibles
FROM races
WHERE has_quota = true;
```

### 4. Vérifier la file d'attente
```sql
SELECT
  r.name as course,
  w.position,
  w.first_name,
  w.email,
  w.status
FROM race_waitlist w
JOIN races r ON w.race_id = r.id
WHERE w.status = 'waiting'
ORDER BY r.name, w.position;
```

---

## ⚙️ Configuration post-déploiement

### Activer les quotas sur une course
```sql
UPDATE races
SET
  has_quota = true,
  max_participants = 500
WHERE id = 'uuid-de-la-course';
```

### Désactiver les quotas
```sql
UPDATE races
SET has_quota = false
WHERE id = 'uuid-de-la-course';
```

---

## 🆘 En cas de problème

### Build échoue
```bash
# Nettoyer et rebuilder
rm -rf node_modules dist
npm install
npm run build
```

### Push GitHub échoué
```bash
# Vérifier le statut
git status

# Pull les changements distants
git pull origin main

# Résoudre les conflits si nécessaire
git add .
git commit -m "Résolution conflits"
git push origin main
```

### Vercel échoue
```bash
# Vérifier la connexion
vercel whoami

# Se reconnecter
vercel login

# Redéployer
vercel --prod --yes
```

### Job cron ne fonctionne pas
```sql
-- Vérifier que pg_cron est activé
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Si non, activer
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Recréer le job
SELECT cron.schedule(
  'cleanup-expired-carts',
  '*/1 * * * *',
  $$SELECT expire_old_carts();$$
);
```

---

## 📚 Documentation complète

- **Backup Supabase** : `SUPABASE-BACKUP-GUIDE.md`
- **Rapport complet** : `BACKUP-REPORT-2025-11-30.md`
- **Guide d'intégration** : `CART-RESERVATION-IMPLEMENTATION-GUIDE.md`

---

## 🎉 Déploiement réussi !

Une fois déployé, le site sera accessible sur :
- 🌐 https://timepulsesports.com
- 🌐 https://timepulsesports.com

**Temps estimé de déploiement** : 3-5 minutes

**Prochaines étapes :**
1. Tester en production
2. Activer les quotas sur les courses souhaitées
3. Vérifier les logs du job cron
4. Former l'équipe sur les nouvelles fonctionnalités

---

**Version** : 2.8.0
**Date** : 30 Novembre 2025
**Status** : ✅ Ready to Deploy
