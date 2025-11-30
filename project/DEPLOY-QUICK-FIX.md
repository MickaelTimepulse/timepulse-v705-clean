# Guide Rapide : Obtenir le Bon Token Supabase

## ❌ Erreur rencontrée

```
403: Your account does not have the necessary privileges to access this endpoint
```

## ✅ Solution

Le token actuel n'a pas les bonnes permissions. Voici comment créer un token avec les permissions complètes :

### Étape 1 : Allez sur la page des tokens

https://supabase.com/dashboard/account/tokens

### Étape 2 : Créez un nouveau token

1. Cliquez sur **"Generate new token"**
2. Donnez un nom : **"Deploy Functions"**
3. **IMPORTANT** : Sélectionnez les permissions suivantes :
   - ✅ **All access** (recommandé pour simplifier)

   OU sélectionnez manuellement :
   - ✅ **Edge Functions** : Read + Write
   - ✅ **Projects** : Read

### Étape 3 : Copiez le token

Le token ressemble à : `sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**⚠️ IMPORTANT** : Copiez-le immédiatement, il ne sera plus visible après !

### Étape 4 : Utilisez le token

```bash
export SUPABASE_ACCESS_TOKEN=sbp_votre_nouveau_token
npm run deploy:function ffa-verify-athlete
```

## 🎯 Résultat attendu

```
🚀 Déploiement de la fonction: ffa-verify-athlete
📁 Depuis: /tmp/cc-agent/58635631/project/supabase/functions/ffa-verify-athlete

📤 Envoi vers Supabase Management API...
✅ Fonction déployée avec succès !

🔗 Testez-la sur: https://fgstscztsighabpzzzix.supabase.co/functions/v1/ffa-verify-athlete
📊 Logs: https://supabase.com/dashboard/project/fgstscztsighabpzzzix/functions/ffa-verify-athlete/logs
```

## 🔐 Alternative : Service Role Key

Si vous ne parvenez pas à créer un token avec les bonnes permissions, vous pouvez utiliser la méthode CLI :

### Option 1 : Via Supabase CLI (authentification interactive)

```bash
supabase login
supabase functions deploy ffa-verify-athlete --project-ref fgstscztsighabpzzzix --no-verify-jwt
```

### Option 2 : Déploiement manuel (copier-coller)

Si rien ne fonctionne, vous pouvez toujours :

1. Allez sur https://supabase.com/dashboard/project/fgstscztsighabpzzzix/functions
2. Créez ou sélectionnez la fonction `ffa-verify-athlete`
3. Copiez le contenu de `supabase/functions/ffa-verify-athlete/index.ts`
4. Collez-le dans l'éditeur Supabase
5. Décochez **"Enforce JWT verification"**
6. Cliquez sur **Deploy**

## 📝 Vérification

Après déploiement, testez la fonction :

```bash
curl https://fgstscztsighabpzzzix.supabase.co/functions/v1/ffa-verify-athlete \
  -H "Content-Type: application/json" \
  -d '{"licenseNumber":"123456","firstName":"Jean","lastName":"Dupont","birthDate":"1990-01-01"}'
```

Vous devriez obtenir une réponse JSON avec le statut de vérification FFA.
