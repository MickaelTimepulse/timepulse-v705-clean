# 🏃 Timepulse - Plateforme d'Inscriptions Sportives

Plateforme complète de gestion d'événements sportifs, inscriptions en ligne et chronométrage pour les organisateurs d'événements sportifs en France.

## 🎯 Fonctionnalités

### Pour les Organisateurs
- ✅ Création et gestion d'événements multi-courses
- ✅ Configuration des tarifs et périodes de prix
- ✅ Gestion des catégories d'âge automatiques (FFA, ITRA, etc.)
- ✅ Upload de traces GPX avec profil d'élévation
- ✅ Gestion des dossards et attribution automatique
- ✅ Module d'inscriptions manuelles
- ✅ Export des listes d'inscrits
- ✅ Suivi en temps réel des inscriptions

### Pour les Participants
- ✅ Inscription en ligne sécurisée
- ✅ Paiement par carte bancaire (Stripe)
- ✅ Recherche d'événements par sport, date, localisation
- ✅ Covoiturage entre participants
- ✅ Bourse aux dossards (échange/revente)
- ✅ Liste des inscrits publique

### Pour les Administrateurs
- ✅ Gestion des organisateurs et validation
- ✅ Configuration des commissions Timepulse
- ✅ Gestion du contenu CMS (pages de services)
- ✅ Monitoring des emails et paiements
- ✅ Système de backup automatique

## 🏗️ Stack Technique

### Frontend
- **React 18** avec TypeScript
- **Vite** pour le build ultra-rapide
- **Tailwind CSS** pour le design
- **React Router** pour la navigation
- **Lucide React** pour les icônes

### Backend & Infrastructure
- **Supabase** (PostgreSQL, Auth, Storage, Edge Functions)
- **Stripe** pour les paiements
- **Oximailing** pour les emails transactionnels
- **OpenAI** pour la génération de contenu SEO (optionnel)

### Déploiement Recommandé
- **Vercel** pour le frontend (CDN global)
- **Supabase Cloud** pour le backend
- **GitHub** pour le versioning

## 📦 Installation Locale

### Prérequis
- Node.js 18+ et npm
- Un compte Supabase (gratuit)
- Un compte Stripe (mode test gratuit)

### Étapes

1. **Cloner le projet**
```bash
git clone https://github.com/VOTRE-ORG/timepulse.git
cd timepulse
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos clés
```

4. **Lancer le serveur de développement**
```bash
npm run dev
```

→ Ouvrir http://localhost:5173

## 🔧 Configuration

### Variables d'Environnement

Créer un fichier `.env` à la racine:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# OpenAI (optionnel)
VITE_OPENAI_API_KEY=sk-...
```

### Base de Données

Les migrations Supabase sont dans `/supabase/migrations/`.

Pour appliquer:
```bash
# Via Supabase Dashboard
# Settings → Database → Run SQL

# Ou via CLI (si installé)
supabase db push
```

### Edge Functions

Déployer via l'outil MCP Supabase (intégré dans Bolt.new):
- `send-email` - Envoi d'emails via Oximailing
- `stripe-webhook` - Webhook Stripe pour confirmer les paiements
- `generate-seo` - Génération de contenu SEO avec IA
- `carpooling-notification` - Notifications covoiturage
- `bib-exchange-alert` - Alertes bourse aux dossards

## 🚀 Déploiement Production

Voir le guide complet: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

### Résumé Rapide

1. **Pusher sur GitHub**
```bash
git push origin main
```

2. **Connecter à Vercel**
- Aller sur vercel.com
- Import Git Repository
- Ajouter les variables d'environnement

3. **Déployer**
→ Automatique à chaque push!

### Coûts Estimés

- **0-1000 inscriptions/mois**: ~$25/mois (Supabase Pro)
- **1000-10000 inscriptions/mois**: ~$620/mois
- **+10000 inscriptions/mois**: ~$3000+/mois

## 📊 Structure du Projet

```
timepulse/
├── src/
│   ├── components/       # Composants React réutilisables
│   │   ├── Admin/       # Interface admin
│   │   ├── Home/        # Page d'accueil
│   │   └── Layout/      # Header, Footer
│   ├── contexts/        # React Context (Auth)
│   ├── lib/             # Utilitaires et services
│   │   ├── supabase.ts
│   │   ├── auth.ts
│   │   ├── email-service.ts
│   │   └── ...
│   ├── pages/           # Pages principales
│   │   ├── Home.tsx
│   │   ├── EventDetail.tsx
│   │   ├── OrganizerDashboard.tsx
│   │   └── AdminDashboard.tsx
│   └── main.tsx         # Point d'entrée
├── supabase/
│   ├── migrations/      # Schéma de base de données
│   └── functions/       # Edge Functions
├── docs/                # Documentation technique
├── public/              # Assets statiques
└── DEPLOYMENT.md        # Guide de déploiement
```

## 🔐 Sécurité

### Row Level Security (RLS)

Toutes les tables Supabase utilisent RLS:
- Les organisateurs ne voient que leurs événements
- Les athlètes ne voient que leurs inscriptions
- Les admins ont accès complet
- Les données publiques sont accessibles à tous (liste des inscrits, événements publiés)

### Gestion des Secrets

- ✅ Clés API jamais dans le code source
- ✅ Variables d'environnement sécurisées
- ✅ `.env` dans `.gitignore`
- ✅ Webhooks Stripe avec vérification de signature

## 🧪 Tests

### Build de Production
```bash
npm run build
```

### Vérification des Types
```bash
npm run typecheck
```

### Linter
```bash
npm run lint
```

## 📈 Monitoring Production

### Métriques Clés

- **Performance**: Temps de chargement < 2s
- **Disponibilité**: Uptime > 99.9%
- **Conversion**: Taux d'inscription > 80%
- **Paiements**: Taux de succès > 95%

### Outils

- **Vercel Analytics** (inclus) - Performance frontend
- **Supabase Dashboard** - Métriques database
- **Stripe Dashboard** - Transactions et paiements
- **Email Logs** - Table `email_logs` dans Supabase

## 🆘 Support & Dépannage

### Problèmes Courants

**Le site ne charge pas en local**
```bash
# Vérifier les variables d'environnement
cat .env

# Vérifier que Supabase est accessible
curl https://VOTRE-PROJET.supabase.co/rest/v1/
```

**Les paiements échouent**
- Vérifier que la clé Stripe est correcte (`pk_test_...` ou `pk_live_...`)
- Vérifier que le webhook Stripe est configuré
- Consulter les logs dans Stripe Dashboard

**Les emails ne partent pas**
- Vérifier la configuration Oximailing dans les Edge Functions
- Consulter la table `email_logs` dans Supabase
- Vérifier les quotas Oximailing

### Logs

```bash
# Logs Vercel (production)
# Dashboard → Deployments → Functions → Logs

# Logs Supabase Edge Functions
# Dashboard → Edge Functions → Fonction → Logs
```

## 📞 Contact

- **Site web**: https://timepulse.fr
- **Support organisateurs**: contact@timepulse.fr

## 📄 Licence

Propriétaire - Timepulse © 2009-2025

---

**Développé avec ❤️ pour la communauté sportive française**
