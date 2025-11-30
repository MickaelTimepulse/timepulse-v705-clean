# 🚀 Quick Start - Timepulse Production

## ⚡ Déploiement Express (15 minutes)

### Étape 1: GitHub (2 min)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VOTRE-ORG/timepulse.git
git push -u origin main
```

### Étape 2: Vercel (5 min)
1. Aller sur https://vercel.com
2. **Import Project** → Sélectionner le repo GitHub
3. Ajouter ces 3 variables d'environnement:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   VITE_STRIPE_PUBLIC_KEY=pk_live_...
   ```
4. Cliquer **Deploy**

### Étape 3: Migrations Supabase (5 min)
1. Dashboard Supabase → SQL Editor
2. Copier-coller **TOUS les fichiers** de `supabase/migrations/` un par un
3. Exécuter dans l'ordre chronologique

### Étape 4: Edge Functions (3 min)
Dashboard Supabase → Edge Functions → Deploy:
- `send-email`
- `stripe-webhook`
- `generate-seo`

Configurer les secrets:
```
OXIMAILING_API_USER=...
OXIMAILING_API_PASSWORD=...
STRIPE_SECRET_KEY=sk_live_...
OPENAI_API_KEY=sk-...
```

## ✅ C'est En Ligne!

Votre site est accessible sur: `https://VOTRE-PROJET.vercel.app`

## 🔧 Configuration Domaine Personnalisé

Dans Vercel → Settings → Domains:
1. Ajouter `timepulse.fr`
2. Configurer DNS chez votre registrar:
   ```
   A @ 76.76.21.21
   CNAME www cname.vercel-dns.com
   ```

## 📊 Coûts Mensuels

- **Vercel**: Gratuit (Hobby) ou $20 (Pro)
- **Supabase**: $25/mois (Pro - requis pour production)
- **Stripe**: 1.4% + 0.25€ par transaction
- **Total fixe**: $25-45/mois

## 🧪 Test Rapide

1. **Créer un admin**:
   ```sql
   INSERT INTO admin_users (email, password_hash, full_name, role)
   VALUES ('admin@timepulse.fr', crypt('VotreMotDePasse', gen_salt('bf')), 'Admin', 'super_admin');
   ```

2. **Se connecter**: `https://votre-site.vercel.app/admin/login`

3. **Créer un événement test** et vérifier qu'il s'affiche

## 📚 Documentation Complète

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide détaillé
- [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md) - Checklist complète
- [README.md](./README.md) - Documentation technique

## 🆘 Problème?

**Le site ne charge pas**
→ Vérifier les variables d'environnement dans Vercel

**Erreur 500**
→ Consulter les logs: Vercel Dashboard → Deployments → Logs

**Les paiements échouent**
→ Vérifier la clé Stripe (doit commencer par `pk_live_`)

## 💰 Architecture pour Haute Charge

Votre stack actuelle peut gérer:
- ✅ **10,000+ visiteurs/jour**
- ✅ **1,000+ inscriptions/jour**
- ✅ **10,000+ emails/jour**
- ✅ **Milliers de paiements/jour**

### Si vous dépassez ces limites:
- Passer à Supabase Team ($599/mois) ou Enterprise
- Activer le CDN Vercel Pro
- Utiliser des indexes database (déjà configurés)

## 🎯 Prochaines Étapes

1. [ ] Tester tous les parcours utilisateurs
2. [ ] Configurer le monitoring (Sentry, Vercel Analytics)
3. [ ] Former les organisateurs partenaires
4. [ ] Lancer la communication

---

**Vous êtes prêt pour la production!** 🎉
