# 🚀 Guide de Déploiement Automatique - Timepulse

## 📋 Options de déploiement

### ✅ Option 1 : Déploiement Ultra-Rapide (recommandé)
```bash
npm run deploy
```
Ou double-cliquez sur : **`deploy-quick.bat`**

### 🔧 Option 2 : Déploiement Complet avec Git
Double-cliquez sur : **`deploy-auto.bat`**

---

## 🎯 Les 3 fichiers automatisés

### 1️⃣ `deploy-quick.bat` - Déploiement instantané
- Déploie directement sur Vercel
- Le plus rapide
- Vercel build automatiquement

### 2️⃣ `deploy-auto.bat` - Déploiement complet
- Build local
- Commit Git
- Push GitHub (optionnel)
- Déploiement Vercel

### 3️⃣ `setup-git-vercel.bat` - Configuration initiale
À lancer **UNE SEULE FOIS** pour :
- Initialiser Git
- Connecter à GitHub
- Lier à Vercel

---

## 🔥 Configuration GitHub Auto-Deploy (optionnel)

### Avantages
✅ Chaque `git push` déclenche un déploiement automatique
✅ Preview automatique pour les branches
✅ Rollback facile
✅ Historique complet

### Configuration

1. **Créez un repo GitHub**
```
https://github.com/new
Nom: timepulse-registration
```

2. **Lancez la configuration**
```bash
setup-git-vercel.bat
```

3. **Vercel détectera automatiquement**
Allez sur https://vercel.com/timepulse/timepulseregistration/settings/git
et connectez votre repo GitHub.

---

## ⚡ Workflow quotidien

### Sans GitHub (simple)
```bash
# Faites vos modifications
npm run deploy
```

### Avec GitHub (pro)
```bash
# Faites vos modifications
git add .
git commit -m "Description des changements"
git push
# Vercel déploie automatiquement !
```

---

## 🔐 Variables d'environnement

Les variables sont déjà configurées sur Vercel. Pour les modifier :

```bash
npx vercel env pull     # Récupérer
npx vercel env add      # Ajouter
```

Ou via le dashboard :
https://vercel.com/timepulse/timepulseregistration/settings/environment-variables

---

## 🌐 URLs importantes

- **Site en production** : https://timepulsev2.com
- **Dashboard Vercel** : https://vercel.com/timepulse/timepulseregistration
- **Analytics** : https://vercel.com/timepulse/timepulseregistration/analytics
- **Logs** : https://vercel.com/timepulse/timepulseregistration/logs

---

## 🐛 Dépannage

### Le déploiement échoue
```bash
npm run build          # Testez le build local
npx vercel logs        # Consultez les logs
```

### Variables manquantes
```bash
npx vercel env ls      # Liste des variables
npx vercel env add VITE_SUPABASE_URL production
```

### Domaine ne fonctionne pas
Vérifiez : https://vercel.com/timepulse/timepulseregistration/settings/domains

---

## 📊 Commandes utiles

```bash
npm run deploy              # Déploiement production
npm run deploy:preview      # Déploiement preview
npx vercel logs             # Voir les logs
npx vercel ls               # Liste des déploiements
npx vercel inspect [URL]    # Inspecter un déploiement
npx vercel rollback [URL]   # Rollback
```

---

## 🎉 C'est tout !

Désormais, un simple **`npm run deploy`** suffit pour mettre à jour votre site en production ! 🚀
