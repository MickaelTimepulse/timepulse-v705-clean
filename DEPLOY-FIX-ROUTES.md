# FIX DES ROUTES VERCEL - DÉPLOIEMENT URGENT

## Problème
Les routes SPA (Single Page Application) ne fonctionnent pas sur Vercel.
Exemple : `/races/foulees-du-beluga-2025/results` retourne 404

## Solution appliquée
Mise à jour de `vercel.json` avec une configuration routes + rewrites optimale.

## ÉTAPES DE DÉPLOIEMENT

### Depuis votre environnement local ou Bolt.new

1. **Commit et push sur GitHub :**
```bash
git add vercel.json
git commit -m "fix: routes SPA pour Vercel"
git push origin main
```

2. **Redéploiement automatique Vercel :**
Vercel détectera le nouveau commit et redéploiera automatiquement.

### Alternative : Redéploiement manuel depuis Vercel Dashboard

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet "timepulsesports"
3. Onglet "Deployments"
4. Cliquez sur "Redeploy" sur le dernier déploiement
5. Attendez 2-3 minutes

## Test après déploiement

Une fois déployé, testez ces URLs :

- https://timepulsesports.com/races/foulees-du-beluga-2025/results ✅
- https://timepulsesports.com/races/0ce4a635-57d6-4dad-b0f3-dc6fd334b5d6/results ✅
- https://timepulsesports.com/ ✅

## Changements techniques

### Ancien vercel.json (ne fonctionnait pas)
```json
"rewrites": [
  {
    "source": "/((?!.*\\.).*)",
    "destination": "/index.html"
  }
]
```

### Nouveau vercel.json (fonctionne)
```json
"routes": [
  {
    "src": "/[^.]+",
    "dest": "/",
    "status": 200
  }
],
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

Cette configuration garantit que toutes les routes (sauf les fichiers statiques avec extension) sont redirigées vers index.html, permettant à React Router de gérer le routing côté client.
