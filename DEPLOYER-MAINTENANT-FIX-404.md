# 🚀 DEPLOIEMENT URGENT - FIX ERREUR 404

## Le problème
Les liens publics affichent une erreur 404 sur `timepulsesports.com` car la configuration Vercel n'est pas à jour.

## ✅ Corrections effectuées
1. ✅ Configuration `vercel.json` mise à jour avec les routes explicites
2. ✅ Image `dossardsite.png` rechargée (992 KB)
3. ✅ Build effectué avec succès
4. ✅ Fichier `_redirects` présent

## 🎯 ACTIONS À FAIRE MAINTENANT

### Option 1 : Déployer via Vercel CLI (Recommandé)

```bash
# Se connecter à Vercel
vercel login

# Déployer en production
npm run deploy
```

### Option 2 : Déployer via Vercel Dashboard

1. Aller sur https://vercel.com
2. Sélectionner votre projet
3. Cliquer sur "Redeploy" sur le dernier déploiement
4. Cocher "Use existing Build Cache" = **NON** (important !)
5. Cliquer sur "Redeploy"

### Option 3 : Push vers GitHub (si connecté à Git)

```bash
git add .
git commit -m "Fix: Configuration Vercel pour routing SPA"
git push
```

Vercel redéployera automatiquement si le projet est lié à Git.

## 🔍 Vérifier après déploiement

Une fois déployé, testez ce lien :
```
https://timepulsesports.com/events/les-foulees-du-beluga-2025/races/0ce4a635-57d6-4dad-b0f3-dc6fd334b5d6/entries
```

Il devrait maintenant fonctionner ! ✅

## 🧹 Vider le cache (si problème persiste)

Si l'erreur 404 persiste après déploiement :

1. **Vider le cache Vercel :**
   - Dashboard Vercel → Settings → Clear Cache

2. **Vider le cache du navigateur :**
   - Ctrl + Shift + R (Chrome/Firefox)
   - Cmd + Shift + R (Mac)

3. **Tester en navigation privée**

## 📋 Ce qui a changé

### vercel.json
Ajout de routes explicites pour gérer le routing SPA correctement :
- Routes pour les assets statiques
- Route catch-all vers `/index.html`
- Headers de sécurité maintenus

### public/_redirects
Fichier présent pour Netlify/autres plateformes :
```
/*    /index.html   200
```

## ⚠️ Important

Le domaine `timepulsesports.com` doit pointer vers le bon projet Vercel.
Vérifiez dans les paramètres du domaine sur Vercel que tout est correct.
