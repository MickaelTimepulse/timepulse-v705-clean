# Guide de Déploiement Automatique des Edge Functions

Ce guide explique comment déployer automatiquement vos Edge Functions Supabase sans intervention manuelle.

## 📋 Prérequis

Vous devez obtenir un **Access Token** depuis votre compte Supabase.

### Étape 1 : Obtenir votre Access Token

1. Allez sur https://supabase.com/dashboard/account/tokens
2. Cliquez sur **"Generate new token"**
3. Donnez un nom au token (ex: "Deploy Edge Functions")
4. Sélectionnez les permissions nécessaires (au minimum : **Functions: Write**)
5. Cliquez sur **"Generate token"**
6. **Copiez le token immédiatement** (il ne sera plus visible après)

Le token ressemble à : `sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Étape 2 : Configurer le Token

Exportez le token dans votre terminal :

```bash
export SUPABASE_ACCESS_TOKEN=sbp_votre_token_ici
```

**Astuce** : Pour ne pas avoir à le faire à chaque fois, ajoutez cette ligne à votre fichier `~/.bashrc` ou `~/.zshrc`.

## 🚀 Déployer une Edge Function

### Méthode 1 : Via npm script (recommandé)

```bash
npm run deploy:function ffa-verify-athlete
```

### Méthode 2 : Via node directement

```bash
node deploy-edge-function.js ffa-verify-athlete
```

### Méthode 3 : Via le script shell

```bash
./deploy-edge-functions.sh ffa-verify-athlete
```

## 📦 Exemples de Déploiement

### Déployer la fonction de vérification FFA

```bash
export SUPABASE_ACCESS_TOKEN=sbp_votre_token
npm run deploy:function ffa-verify-athlete
```

### Déployer la fonction d'envoi d'email

```bash
npm run deploy:function send-email
```

### Déployer la fonction de paiement Lyra

```bash
npm run deploy:function create-lyra-payment
```

## ✅ Vérification

Après le déploiement, vous verrez :

```
🚀 Déploiement de la fonction: ffa-verify-athlete
📁 Depuis: /path/to/supabase/functions/ffa-verify-athlete

📤 Envoi vers Supabase Management API...
✅ Fonction déployée avec succès !

🔗 Testez-la sur: https://fgstscztsighabpzzzix.supabase.co/functions/v1/ffa-verify-athlete
📊 Logs: https://supabase.com/dashboard/project/fgstscztsighabpzzzix/functions/ffa-verify-athlete/logs
```

## 🐛 Dépannage

### Erreur : SUPABASE_ACCESS_TOKEN non défini

```bash
❌ SUPABASE_ACCESS_TOKEN non défini
```

**Solution** : Exportez votre token :
```bash
export SUPABASE_ACCESS_TOKEN=sbp_votre_token
```

### Erreur : La fonction n'existe pas

```bash
❌ La fonction ffa-verify-athlete n'existe pas dans supabase/functions/
```

**Solution** : Vérifiez que le dossier existe :
```bash
ls supabase/functions/
```

### Erreur 401 : Unauthorized

```bash
❌ Erreur lors du déploiement (401)
```

**Solution** : Votre token est invalide ou expiré. Générez-en un nouveau.

### Erreur 403 : Forbidden

```bash
❌ Erreur lors du déploiement (403)
```

**Solution** : Votre token n'a pas les permissions nécessaires. Regénérez un token avec les permissions **Functions: Write**.

## 📝 Notes

- Les Edge Functions sont déployées avec `verify_jwt: false` par défaut
- Le déploiement écrase la version existante de la fonction
- Les logs sont disponibles immédiatement après le déploiement sur le Dashboard Supabase
- Vous pouvez déployer autant de fois que nécessaire

## 🔐 Sécurité

- **NE COMMITEZ JAMAIS** votre Access Token dans Git
- Le token est personnel et donne accès à votre compte Supabase
- Révoquez les tokens inutilisés depuis https://supabase.com/dashboard/account/tokens
