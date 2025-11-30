# 🚀 Instructions de Déploiement Timepulse

## ✅ Prérequis
- Node.js installé
- Compte Vercel actif
- Repository Git (optionnel mais recommandé)

---

## 🎯 Méthode 1 : Déploiement via GitHub (RECOMMANDÉ)

### Avantages
✅ Déploiement automatique à chaque commit
✅ Historique des versions
✅ Rollback facile
✅ Preview automatique des branches

### Étapes

1. **Créez un repository GitHub** (si pas déjà fait)
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Timepulse v2"
   git branch -M main
   git remote add origin https://github.com/VOTRE-USERNAME/timepulse-v2.git
   git push -u origin main
   ```

2. **Connectez à Vercel**
   - Allez sur https://vercel.com/dashboard
   - Cliquez sur "Add New..." → "Project"
   - Sélectionnez "Import Git Repository"
   - Choisissez votre repository GitHub
   - Configurez :
     - **Framework Preset** : Vite
     - **Build Command** : `npm run build`
     - **Output Directory** : `dist`
   - Ajoutez les variables d'environnement depuis `.env`
   - Cliquez sur "Deploy"

3. **Déploiements futurs**
   ```bash
   git add .
   git commit -m "Votre message"
   git push
   ```
   → Vercel déploie automatiquement ! 🎉

---

## 🎯 Méthode 2 : Déploiement CLI depuis votre PC

### Étapes

1. **Installez Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Connectez-vous**
   ```bash
   vercel login
   ```
   → Suivez les instructions dans le navigateur

3. **Premier déploiement**
   ```bash
   vercel
   ```
   → Répondez aux questions :
   - Set up and deploy? **Y**
   - Which scope? Choisissez votre compte
   - Link to existing project? **N**
   - What's your project's name? **timepulse-v2**
   - In which directory is your code located? **.**

4. **Configurez les variables d'environnement**
   ```bash
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   # Répétez pour chaque variable dans .env
   ```

5. **Déploiement en production**
   ```bash
   vercel --prod
   ```

---

## 🎯 Méthode 3 : Déploiement ZIP manuel

### Étapes

1. **Buildez localement**
   ```bash
   npm install
   npm run build
   ```

2. **Allez sur Vercel Dashboard**
   - https://vercel.com/dashboard
   - Cliquez sur "Add New..." → "Project"
   - Glissez-déposez le dossier `dist/`

---

## 🌐 Configuration du domaine timepulsev2.com

### Si le domaine est géré par Vercel

1. Allez dans **Project Settings** → **Domains**
2. Ajoutez `timepulsev2.com`
3. Vercel vous donnera les nameservers à configurer

### Si le domaine est sur NSOne

Contactez le support Vercel :
> "J'ai acheté timepulsev2.com via Bolt/Vercel mais je n'ai pas accès à NSOne. Pouvez-vous reconfigurer le domaine ?"

---

## 📝 Variables d'environnement à configurer

Dans Vercel Dashboard → Project → Settings → Environment Variables :

```
VITE_SUPABASE_URL=https://fgstscztsighabpzzzix.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_OPENAI_API_KEY=sk-proj-uxTZXjwXWkmV_I70RFBS0qzcNUrX3b6w...
VITE_LYRA_PUBLIC_KEY=72475805:testpublickey_DEMOPUBLICKEY95me92597fd28tGD4r5
LYRA_SHOP_ID=72475805
LYRA_API_KEY=testpassword_h4TOkZ9JmG7wGdAOChJt2sRtPGxpMvHqhnqfujeUM7bgV
LYRA_MODE=TEST
LYRA_API_URL=https://api.lyra.com/api-payment/V4
```

---

## ✅ Vérification

Après déploiement, testez :
- Page d'accueil : https://timepulsev2.com
- Connexion admin : https://timepulsev2.com/admin/login
- API Supabase : Vérifiez les logs dans Supabase Dashboard

---

## 🆘 Support

- Documentation Vercel : https://vercel.com/docs
- Support Vercel : https://vercel.com/support
- Timepulse : contact@timepulse.fr
