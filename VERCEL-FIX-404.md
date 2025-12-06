# 🔧 Fix Erreur 404 Vercel - Duplication d'Onglet

## 🐛 Problème
Quand vous dupliquez un onglet sur timepulsesports.com, vous obtenez :
```
404 : NOT_FOUND
Code: NOT_FOUND
ID: cdg1:cdg1::9xq9c-1764748797127-8d76f4d69bae
```

## 🎯 Cause
Vercel ne trouve pas les routes React Router et retourne une 404 au lieu de servir `index.html`.

## ✅ Solution Appliquée

### 1. **Mise à jour `vercel.json`**

Le fichier a été amélioré avec :
- Déclaration du framework Vite
- Routes avec gestion filesystem
- Rewrites pour toutes les routes React
- Headers de sécurité

### 2. **Mise à jour `vite.config.ts`**

Ajout de :
- `base: '/'` pour les chemins absolus
- Configuration du build avec terser
- Paramètres de prévisualisation

### 3. **Vérification `public/_redirects`**

Le fichier existe déjà et contient :
```
/*    /index.html   200
```

## 🚀 Déploiement

### Option A : Via Vercel CLI (Recommandé)

```bash
# 1. Installer Vercel CLI si pas déjà fait
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Build local
npm run build

# 4. Déployer
vercel --prod
```

### Option B : Via Git Push

```bash
# 1. Commit les changements
git add vercel.json vite.config.ts
git commit -m "Fix: Routes Vercel pour duplication onglet"

# 2. Push vers GitHub
git push origin main

# 3. Vercel redéploiera automatiquement
```

## 🔍 Vérification Post-Déploiement

### Test 1 : Routes React
1. Ouvrir https://timepulsesports.com/admin
2. Dupliquer l'onglet (Cmd+Shift+D ou Ctrl+Shift+D)
3. ✅ La page doit se charger sans erreur 404

### Test 2 : Refresh Direct
1. Aller sur https://timepulsesports.com/events
2. Appuyer sur F5 ou Ctrl+R
3. ✅ La page doit se recharger correctement

### Test 3 : URLs Profondes
1. Ouvrir https://timepulsesports.com/organizer/dashboard
2. Fermer l'onglet
3. Rouvrir le lien
4. ✅ La page doit se charger

## 📋 Checklist Vercel Dashboard

Si le problème persiste, vérifier dans Vercel Dashboard :

### 1. Settings → General
- ✅ Framework Preset: **Vite**
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`
- ✅ Install Command: `npm install`

### 2. Settings → Domains
- ✅ timepulsesports.com configuré
- ✅ DNS correctement pointé

### 3. Deployments
- ✅ Dernier déploiement réussi
- ✅ Pas d'erreurs de build

### 4. Function Logs (si erreurs persistent)
- Vérifier s'il y a des erreurs 404
- Regarder les routes qui échouent

## 🔧 Configuration Vercel Alternative

Si le problème persiste après déploiement, essayez cette configuration dans Vercel Dashboard :

### Rewrites (Settings → Rewrites)
Ajouter manuellement :
```
Source: /(.*)
Destination: /index.html
```

### Headers (Settings → Headers)
Ajouter :
```
Source: /index.html
Cache-Control: public, max-age=0, must-revalidate
```

## 🆘 Dépannage Avancé

### Problème : 404 persiste après déploiement

**Solution 1 : Clear Build Cache**
```bash
vercel --force --prod
```

**Solution 2 : Nouveau déploiement propre**
```bash
# Supprimer le dossier dist local
rm -rf dist

# Rebuild
npm run build

# Redéployer
vercel --prod
```

**Solution 3 : Vérifier les logs Vercel**
```bash
vercel logs https://timepulsesports.com
```

### Problème : Certaines routes fonctionnent, d'autres non

Vérifier que toutes les routes React sont bien définies dans `src/App.tsx` :

```tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/events" element={<Events />} />
  <Route path="/admin/*" element={<AdminRoutes />} />
  {/* etc. */}
</Routes>
```

### Problème : Assets 404

Si les images ou CSS ne chargent pas, vérifier :
1. Que les assets sont dans `public/` ou `src/assets/`
2. Que le build inclut bien le dossier assets
3. Les chemins sont absolus (`/image.png` pas `image.png`)

## 📊 Logs d'Erreur à Surveiller

Dans Vercel Dashboard → Deployments → [Dernier déploiement] → Function Logs :

**Bon signe :**
```
GET /admin/events → 200 (index.html served)
GET /assets/index-xxx.js → 200
GET /assets/index-xxx.css → 200
```

**Mauvais signe :**
```
GET /admin/events → 404 NOT_FOUND
```

## ✅ Résultat Attendu

Après le déploiement, vous devriez pouvoir :
- ✅ Dupliquer n'importe quel onglet sans erreur
- ✅ Recharger n'importe quelle page (F5)
- ✅ Partager des liens directs vers des sous-pages
- ✅ Naviguer en arrière/avant sans problème
- ✅ Les assets se chargent correctement

## 🔗 Ressources

- [Vercel Routing Documentation](https://vercel.com/docs/routing)
- [Vite Configuration](https://vitejs.dev/config/)
- [React Router on Vercel](https://vercel.com/guides/deploying-react-with-vercel)

## 📞 Si Rien Ne Fonctionne

Contact Vercel Support avec :
1. URL du site : timepulsesports.com
2. ID d'erreur : cdg1:cdg1::9xq9c-1764748797127-8d76f4d69bae
3. Configuration `vercel.json` actuelle
4. Logs de déploiement

---

**Date de création** : 3 Décembre 2025
**Problème** : 404 sur duplication onglet
**Statut** : Configuration corrigée, en attente de déploiement
