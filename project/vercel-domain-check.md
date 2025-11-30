# 🔍 DIAGNOSTIC : timepulsev2.com ne fonctionne pas

## ✅ Ce qui fonctionne
- **project-snowy-beta.vercel.app** → OK

## ❌ Ce qui ne fonctionne pas
- **timepulsev2.com** → Erreur

## 🎯 CAUSES POSSIBLES

### 1. Le domaine pointe vers un ancien déploiement
### 2. Le domaine n'a pas les variables d'environnement
### 3. Cache DNS ou CDN pas encore propagé

---

## 🛠️ SOLUTION : Vérifier la configuration du domaine

### Étape 1 : Vérifier le domaine sur Vercel

1. Allez sur : https://vercel.com/timepulse/project
2. Cliquez sur **Settings** → **Domains**
3. Regardez si `timepulsev2.com` est bien listé

### Étape 2 : Vérifier la branche de production

Le domaine personnalisé doit pointer vers la branche **Production**

1. Dans **Domains**, trouvez `timepulsev2.com`
2. Vérifiez qu'il est assigné à **Production Branch**
3. Si ce n'est pas le cas :
   - Cliquez sur les 3 points `...` à côté du domaine
   - **Edit** → Sélectionnez **Production Branch**

### Étape 3 : Forcer un nouveau déploiement

Dans votre terminal :

```bash
npx vercel --prod --yes --force
```

Le flag `--force` force un nouveau build complet.

### Étape 4 : Vider le cache (si nécessaire)

Sur Vercel :
1. Allez dans **Deployments**
2. Trouvez le dernier déploiement
3. Cliquez sur les 3 points `...`
4. **Redeploy**

### Étape 5 : Attendre la propagation DNS

Si vous venez de changer la configuration :
- Propagation DNS : 5-30 minutes
- Cache CDN Vercel : 1-5 minutes

---

## 🧪 TEST RAPIDE

Testez en navigation privée pour éviter le cache navigateur :
- https://timepulsev2.com

---

## 📞 Si ça ne fonctionne toujours pas

Donnez-moi l'erreur exacte que vous voyez sur timepulsev2.com
