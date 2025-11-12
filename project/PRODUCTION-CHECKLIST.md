# ✅ Checklist Mise en Production - Timepulse

## 📋 Avant le Déploiement

### 1. Comptes & Accès
- [ ] Compte GitHub créé et accès au repository
- [ ] Compte Vercel créé et lié à GitHub
- [ ] Compte Supabase Production créé (pas de mode test)
- [ ] Compte Stripe Production activé (KYC validé)
- [ ] Accès Oximailing vérifié

### 2. Configuration Supabase Production

#### 2.1 Créer le Projet
- [ ] Aller sur https://supabase.com/dashboard
- [ ] Créer un nouveau projet
- [ ] Choisir la région: **Europe West (Irlande)** pour la conformité RGPD
- [ ] Choisir le plan **Pro** ($25/mois minimum pour production)
- [ ] Sauvegarder l'URL du projet et la clé anon

#### 2.2 Appliquer les Migrations
1. Aller dans Dashboard → SQL Editor
2. Copier-coller **chaque fichier** de `supabase/migrations/` **dans l'ordre chronologique**:
   ```
   20251014201249_create_timepulse_schema.sql
   20251014205617_create_admin_users_fixed.sql
   20251014205715_add_update_password_function.sql
   ... (tous les fichiers dans l'ordre)
   20251023120000_add_production_indexes.sql
   ```
3. Exécuter chaque migration une par une
4. Vérifier qu'il n'y a pas d'erreurs

#### 2.3 Configurer le Storage
- [ ] Bucket `event-images` créé (public)
- [ ] Bucket `gpx-files` créé (public)
- [ ] Bucket `organizer-logos` créé (public)
- [ ] Bucket `entry-documents` créé (privé avec RLS)

#### 2.4 Déployer les Edge Functions
Utiliser l'outil MCP ou le Dashboard Supabase:
- [ ] `send-email` déployée
- [ ] `stripe-webhook` déployée
- [ ] `generate-seo` déployée
- [ ] `carpooling-notification` déployée
- [ ] `bib-exchange-alert` déployée
- [ ] `restore-backup` déployée

#### 2.5 Configurer les Secrets Edge Functions
Dans Dashboard → Edge Functions → Secrets:
```
OXIMAILING_API_USER=votre_user
OXIMAILING_API_PASSWORD=votre_password
OXIMAILING_DEFAULT_FROM=noreply@timepulse.fr
OXIMAILING_DEFAULT_FROM_NAME=Timepulse
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
```

### 3. Configuration Stripe Production

#### 3.1 Activer le Compte Live
- [ ] KYC complété (pièce d'identité, coordonnées bancaires)
- [ ] Compte Stripe approuvé et en mode Live
- [ ] Récupérer `pk_live_...` (clé publique)
- [ ] Récupérer `sk_live_...` (clé secrète)

#### 3.2 Configurer le Webhook
1. Aller dans Dashboard Stripe → Developers → Webhooks
2. Créer un webhook avec l'URL:
   ```
   https://VOTRE-PROJET.supabase.co/functions/v1/stripe-webhook
   ```
3. Sélectionner les événements:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copier le `Signing Secret` (commence par `whsec_...`)

### 4. Configuration Vercel

#### 4.1 Créer le Projet
- [ ] Aller sur https://vercel.com
- [ ] Import Git Repository
- [ ] Sélectionner le repo GitHub `timepulse`
- [ ] Framework Preset: **Vite** (auto-détecté)

#### 4.2 Variables d'Environnement
Dans Project Settings → Environment Variables, ajouter:

**Production**:
```
VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (clé anon Supabase)
VITE_STRIPE_PUBLIC_KEY=pk_live_... (clé LIVE Stripe)
VITE_OPENAI_API_KEY=sk-... (optionnel)
```

**Preview & Development** (optionnel - utiliser les clés test):
```
VITE_SUPABASE_URL=https://projet-test.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_OPENAI_API_KEY=sk-...
```

#### 4.3 Configurer le Domaine
- [ ] Ajouter le domaine personnalisé: `timepulse.fr` et `www.timepulse.fr`
- [ ] Configurer les DNS chez votre registrar:
  ```
  Type: A
  Name: @
  Value: 76.76.21.21

  Type: CNAME
  Name: www
  Value: cname.vercel-dns.com
  ```
- [ ] Attendre la propagation DNS (5-60 minutes)
- [ ] SSL sera automatiquement généré par Vercel

### 5. Données de Test

#### 5.1 Créer un Admin
Se connecter à Supabase et exécuter:
```sql
INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES (
  'admin@timepulse.fr',
  crypt('VotreMotDePasseSecurisé', gen_salt('bf')),
  'Admin Timepulse',
  'super_admin'
);
```

#### 5.2 Créer un Organisateur de Test
1. Aller sur `https://timepulse.fr/organizer/register`
2. Créer un compte organisateur
3. En tant qu'admin, valider le compte

#### 5.3 Créer un Événement de Test
1. Se connecter en tant qu'organisateur
2. Créer un événement de test
3. Publier l'événement
4. Vérifier qu'il apparaît sur la homepage

## 🧪 Tests de Validation Production

### Test 1: Homepage
- [ ] La homepage se charge en < 2 secondes
- [ ] Les événements publiés s'affichent
- [ ] La recherche fonctionne
- [ ] Le footer contient les bons liens

### Test 2: Inscription Organisateur
- [ ] Le formulaire d'inscription fonctionne
- [ ] L'email de confirmation est reçu
- [ ] La validation admin fonctionne
- [ ] L'organisateur peut se connecter

### Test 3: Création d'Événement
- [ ] Upload d'image fonctionne
- [ ] Upload de GPX fonctionne
- [ ] Le profil d'élévation s'affiche
- [ ] Les catégories d'âge se calculent automatiquement
- [ ] La publication fonctionne

### Test 4: Inscription Participant
- [ ] Le formulaire d'inscription publique fonctionne
- [ ] Le calcul de prix est correct
- [ ] Les options supplémentaires s'affichent
- [ ] Le paiement Stripe fonctionne (utiliser une vraie carte de test)

### Test 5: Paiement Stripe
**Cartes de test Stripe**:
```
4242 4242 4242 4242 - Succès
4000 0000 0000 9995 - Échec (carte refusée)
```
- [ ] Paiement avec succès
- [ ] Webhook reçu et traité
- [ ] Inscription confirmée dans la base
- [ ] Email de confirmation envoyé

### Test 6: Emails
- [ ] Email de bienvenue organisateur
- [ ] Email de confirmation d'inscription
- [ ] Email de réservation covoiturage
- [ ] Vérifier les logs dans `email_logs`

### Test 7: Covoiturage
- [ ] Créer une offre de covoiturage
- [ ] Réserver une place
- [ ] Annuler une réservation
- [ ] Vérifier les notifications

### Test 8: Bourse aux Dossards
- [ ] Mettre un dossard en vente
- [ ] Acheter un dossard
- [ ] Vérifier le transfert d'inscription

### Test 9: Performance
- [ ] Lighthouse Score > 90 (Performance)
- [ ] Lighthouse Score > 90 (Accessibility)
- [ ] Lighthouse Score > 90 (Best Practices)
- [ ] Lighthouse Score > 90 (SEO)

## 🔐 Sécurité Production

### Vérifications Critiques
- [ ] Aucune clé API dans le code source
- [ ] `.env` dans `.gitignore`
- [ ] RLS activé sur toutes les tables
- [ ] Toutes les Edge Functions utilisent CORS
- [ ] Webhooks Stripe vérifient la signature
- [ ] HTTPS activé (automatique Vercel)
- [ ] Headers de sécurité configurés (voir `vercel.json`)

### Test de Sécurité RLS
Tester avec un utilisateur non authentifié:
```sql
-- Se connecter avec role 'anon'
SELECT * FROM events WHERE status != 'published';
-- Devrait retourner 0 lignes

SELECT * FROM entries;
-- Devrait échouer (RLS)
```

## 📊 Monitoring Post-Déploiement

### Jour 1
- [ ] Vérifier les logs Vercel (aucune erreur 500)
- [ ] Vérifier les logs Supabase (connexions database OK)
- [ ] Vérifier Stripe Dashboard (webhooks OK)
- [ ] Vérifier les emails dans `email_logs` (100% délivrés)

### Semaine 1
- [ ] Analyser Vercel Analytics (temps de chargement)
- [ ] Vérifier les erreurs JavaScript (Sentry si configuré)
- [ ] Surveiller l'utilisation Supabase (quota database)
- [ ] Vérifier les coûts Stripe

### Mois 1
- [ ] Optimiser les requêtes lentes (Supabase Query Performance)
- [ ] Ajuster les index si nécessaire
- [ ] Analyser les taux de conversion
- [ ] Collecter les retours utilisateurs

## 🚨 Plan d'Urgence

### Si le site est inaccessible
1. Vérifier status.vercel.com
2. Vérifier status.supabase.com
3. Vérifier le domaine DNS (nslookup timepulse.fr)
4. Rollback au déploiement précédent (Vercel Dashboard)

### Si les paiements échouent
1. Vérifier Stripe Dashboard → Events
2. Vérifier les logs Edge Function `stripe-webhook`
3. Tester avec une carte de test
4. Contacter le support Stripe si nécessaire

### Si les emails ne partent pas
1. Vérifier les quotas Oximailing
2. Consulter `email_logs` dans Supabase
3. Tester manuellement via Edge Function
4. Contacter Oximailing support

## 📞 Contacts Support

- **Vercel**: support@vercel.com (Pro plan)
- **Supabase**: support@supabase.com
- **Stripe**: https://support.stripe.com
- **Oximailing**: support@oximailing.com

## ✅ Déploiement Terminé

Une fois tous les tests validés:
- [ ] Annoncer le lancement sur les réseaux sociaux
- [ ] Informer les organisateurs partenaires
- [ ] Monitorer intensivement les 48 premières heures
- [ ] Célébrer! 🎉

---

**Dernière mise à jour**: Voir Git log
**Version**: 1.0.0
**Date de mise en production**: _________________
