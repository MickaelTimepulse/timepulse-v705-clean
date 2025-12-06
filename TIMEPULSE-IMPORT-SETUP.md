# Configuration de l'Import Timepulse.fr

## ⚠️ Erreur 401 Unauthorized - Configuration requise

L'erreur `401 Unauthorized` signifie que les variables d'environnement ne sont pas configurées dans Supabase.

## 🔑 Configuration des secrets Supabase

### Option 1 : Via le Dashboard Supabase (Recommandé)

1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet : **fgstscztsighabpzzzix**
3. Aller dans **Settings** (⚙️) → **Edge Functions**
4. Cliquer sur **Add secret** ou **Environment variables**
5. Ajouter les variables suivantes :

```
TIMEPULSE_API_URL=https://www.timepulse.fr/api/organisation/
TIMEPULSE_API_TOKEN=TIMePULSe-10@11!
```

6. Sauvegarder

### Option 2 : Via Supabase CLI

Si vous avez la CLI Supabase installée :

```bash
supabase secrets set TIMEPULSE_API_URL=https://www.timepulse.fr/api/organisation/
supabase secrets set TIMEPULSE_API_TOKEN=TIMePULSe-10@11!
```

## 🔍 Vérification du token

**Important** : Vérifiez que le token est bien correct dans la page de test de l'API :
- URL : `https://www.timepulse.fr/_ADMIN-timepulse-7438/tools/api-timepulse.php`
- Copiez exactement le token affiché (sans espaces avant/après)

## ⚠️ Points à vérifier

1. **URL de l'API** : Vérifiez que l'URL est exactement celle indiquée dans la documentation
   - Avec ou sans `/` final ?
   - `api/organisation` ou `api/organisation/` ?

2. **Token** : Le token ne doit contenir aucun espace invisible
   - Token actuel : `TIMePULSe-10@11!`
   - Vérifier qu'il n'y a pas d'espace avant ou après

3. **Format de la requête** : Selon la documentation, l'API attend :
   ```json
   {
     "jsonrpc": "2.0",
     "method": "listEvenements",
     "params": {},
     "id": 1
   }
   ```

## 🧪 Test après configuration

1. Retourner sur `/admin/timepulse-import`
2. Cliquer sur **"Tester la connexion API"**
3. Vous devriez voir : "✅ Connexion réussie à l'API Timepulse.fr (X événements trouvés)"

## 📞 En cas de problème

Si l'erreur persiste après configuration :

1. **Vérifier les logs** dans Supabase Dashboard → Edge Functions → Logs
2. **Vérifier le token** directement dans l'interface de test de l'API
3. **Contacter le support Timepulse** pour vérifier que le token est actif

---

## 🚀 Une fois configuré

Vous pourrez :
1. Saisir un ID d'épreuve Timepulse.fr
2. Prévisualiser les inscriptions
3. Sélectionner l'événement/épreuve de destination
4. Importer automatiquement les inscriptions payées
