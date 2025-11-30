# 🚀 Guide de Déploiement Production - Timepulse

## Architecture Recommandée

### Infrastructure Complète
```
┌─────────────────────────────────────────────────┐
│  UTILISATEURS (athlètes, organisateurs)         │
│  Milliers de connexions simultanées             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  VERCEL (CDN Global)                            │
│  - Frontend React/Vite                          │
│  - Edge caching                                 │
│  - SSL automatique                              │
│  - Déploiement automatique depuis Git           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  SUPABASE (Backend complet)                     │
│  ├─ PostgreSQL (données)                        │
│  ├─ Storage (GPX, images, documents)            │
│  ├─ Auth (organisateurs, admin)                 │
│  ├─ Edge Functions (webhooks, emails)           │
│  └─ Realtime (inscriptions live)                │
└────────────────┬────────────────────────────────┘
                 │
         ┌───────┴────────┐
         ▼                ▼
┌──────────────┐  ┌──────────────────┐
│  STRIPE      │  │  OXIMAILING      │
│  (Paiements) │  │  (Emails)        │
└──────────────┘  └──────────────────┘
```

## 📊 Estimation des Coûts Mensuels

### Startup Phase (0-1000 inscriptions/mois)
- **Vercel**: Gratuit (Hobby)
- **Supabase**: $25/mois (Pro)
- **Stripe**: 1.4% + 0.25€ par transaction
- **Oximailing**: Selon votre abonnement actuel
- **Total fixe**: ~$25-50/mois

### Phase Croissance (1000-10000 inscriptions/mois)
- **Vercel**: $20/mois (Pro)
- **Supabase**: $599/mois (Team) ou $2799/mois (Enterprise)
- **Stripe**: Commission sur volume
- **CDN**: Inclus
- **Total fixe**: ~$620-2820/mois

### Scale (>10000 inscriptions/mois)
- Architecture distribuée
- Multi-région
- Budget: $3000-10000/mois

## 🚀 Déploiement sur Vercel

### Étape 1: Préparer le Repository Git

```bash
# Initialiser Git si pas déjà fait
git init
git add .
git commit -m "Initial commit - Timepulse platform"

# Créer un repo GitHub
# Puis pusher
git remote add origin https://github.com/VOTRE-ORG/timepulse.git
git branch -M main
git push -u origin main
```

### Étape 2: Connecter à Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer "Add New Project"
3. Importer votre repo GitHub
4. Vercel détecte automatiquement Vite

### Étape 3: Variables d'Environnement

Dans Vercel Dashboard → Settings → Environment Variables, ajouter:

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_ici
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

**⚠️ CRITIQUE**: Utiliser les clés PRODUCTION (pas test):
- Stripe: `pk_live_...` (pas `pk_test_...`)
- Supabase: URL de production

### Étape 4: Configuration Build

Vercel auto-détecte mais vérifier:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Étape 5: Déployer

```bash
# Pusher pour déployer
git push origin main
```

→ Vercel build et déploie automatiquement en ~2 minutes

## 🔧 Optimisations Performance

### 1. Code Splitting (déjà configuré avec Vite)
```typescript
// Lazy loading des pages lourdes
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));
```

### 2. Caching Strategy
```typescript
// Dans vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'stripe': ['@stripe/stripe-js']
        }
      }
    }
  }
});
```

### 3. Database Indexing
```sql
-- Ajouter ces index pour les recherches fréquentes
CREATE INDEX idx_entries_race_id ON entries(race_id);
CREATE INDEX idx_entries_bib_number ON entries(bib_number);
CREATE INDEX idx_athletes_search ON athletes USING gin(
  to_tsvector('french', first_name || ' ' || last_name)
);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_events_status ON events(status) WHERE status = 'published';
```

### 4. Edge Functions Optimization
```typescript
// Mettre en cache les réponses fréquentes
const CACHE_DURATION = 60; // secondes

Deno.serve(async (req) => {
  const response = new Response(data, {
    headers: {
      'Cache-Control': `public, max-age=${CACHE_DURATION}`,
      'Content-Type': 'application/json'
    }
  });
  return response;
});
```

## 📈 Monitoring Production

### Outils Recommandés

1. **Vercel Analytics** (inclus)
   - Temps de chargement
   - Core Web Vitals
   - Traffic géographique

2. **Supabase Dashboard** (inclus)
   - Connexions database
   - Taux d'erreur API
   - Usage storage

3. **Stripe Dashboard** (inclus)
   - Transactions
   - Échecs de paiement
   - Disputes

4. **Sentry** (optionnel - gratuit jusqu'à 5k events/mois)
   ```bash
   npm install @sentry/react
   ```

### Alertes Critiques à Configurer

- ❌ Taux d'erreur > 5%
- ⚡ Temps réponse > 3s
- 💳 Échecs paiement > 10%
- 📧 Échecs emails > 5%
- 💾 Database CPU > 80%

## 🔒 Sécurité Production

### Checklist

- [x] RLS activé sur toutes les tables Supabase
- [x] Variables d'environnement sécurisées (pas dans Git)
- [x] HTTPS obligatoire (automatique Vercel)
- [x] Stripe Webhooks avec signature vérifiée
- [x] Rate limiting sur API (à configurer Supabase)
- [ ] WAF (Web Application Firewall) - Vercel Pro
- [ ] DDoS protection - Cloudflare (optionnel)

### Rate Limiting Supabase

```sql
-- Limiter les requêtes anonymes
CREATE POLICY "Rate limit anonymous" ON entries
  FOR SELECT TO anon
  USING (
    (SELECT COUNT(*) FROM entries WHERE created_at > NOW() - INTERVAL '1 minute') < 100
  );
```

## 🧪 Tests Avant Production

### 1. Load Testing
```bash
# Installer k6
brew install k6  # ou apt-get install k6

# Tester avec 1000 utilisateurs virtuels
k6 run --vus 1000 --duration 30s loadtest.js
```

### 2. Lighthouse CI
```bash
npm install -g @lhci/cli
lhci autorun --collect.url=https://votre-site.vercel.app
```

### 3. Test Payments
- Utiliser les cartes de test Stripe
- Vérifier les webhooks en production

## 📞 Support Production

### En cas de problème

1. **Vercel down?** → status.vercel.com
2. **Supabase down?** → status.supabase.com
3. **Stripe down?** → status.stripe.com

### Backup & Recovery

```bash
# Backup automatique Supabase
# Dashboard → Settings → Database → Point-in-time Recovery (PITR)
# Permet de restaurer à n'importe quel moment dans les 7 derniers jours
```

## 🎯 Migration depuis Bolt.new

### Récupérer le code

Si Bolt.new a un bouton "Download" → télécharger le ZIP

Sinon, tout est déjà dans ce projet!

### Pusher sur GitHub

```bash
# Si pas encore de repo Git
git init
git add .
git commit -m "Migration from Bolt.new to production"

# Créer repo sur GitHub, puis:
git remote add origin https://github.com/VOTRE-ORG/timepulse.git
git push -u origin main
```

### Déployer

→ Suivre "Étape 2: Connecter à Vercel" ci-dessus

## 📊 Métriques de Succès

### KPIs à Suivre

- **Performance**: Temps de chargement < 2s (Vercel Analytics)
- **Disponibilité**: Uptime > 99.9% (Vercel automatique)
- **Conversion**: Taux d'inscription complétée > 80%
- **Paiements**: Taux de succès > 95%
- **Emails**: Taux de délivrabilité > 98%

### Dashboard Recommandé

Créer un Google Sheet ou Notion avec:
- Inscriptions par jour/semaine/mois
- Revenus Stripe
- Coûts infrastructure
- Marge nette

## 🚨 Plan d'Urgence

### Si le site est down

1. ✅ Vérifier Vercel status
2. ✅ Vérifier Supabase status
3. ✅ Check les logs Vercel (Dashboard → Deployments → Logs)
4. ✅ Rollback au déploiement précédent si besoin (1 clic Vercel)

### Si les paiements échouent

1. ✅ Vérifier Stripe Dashboard → Events
2. ✅ Vérifier webhook signature est valide
3. ✅ Check logs Edge Function `stripe-webhook`

### Si les emails ne partent pas

1. ✅ Vérifier quotas Oximailing
2. ✅ Check logs Edge Function `send-email`
3. ✅ Vérifier table `email_logs` dans Supabase

---

## ✅ Ready to Deploy?

Une fois que vous avez:
- [x] Un compte GitHub
- [x] Un compte Vercel
- [x] Vos clés Supabase production
- [x] Vos clés Stripe production

→ **Temps de déploiement: ~15 minutes** ⚡

Besoin d'aide pour une étape spécifique? Demandez!
