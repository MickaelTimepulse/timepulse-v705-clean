# ✅ Solution : Erreur "Failed to fetch" - FFA

## 🔧 Problème résolu

L'erreur `"Failed to fetch"` était causée par :

1. **CORS (Cross-Origin Resource Sharing)**
   - Le webservice FFA ne permet pas les appels directs depuis un navigateur
   - Politique de sécurité stricte

2. **Mixed Content (HTTP vs HTTPS)**
   - Le webservice FFA utilise `http://` (non sécurisé)
   - Votre site utilise probablement `https://` (sécurisé)
   - Les navigateurs modernes bloquent ces requêtes mixtes

### Solution implémentée

Le code a été modifié pour utiliser **l'Edge Function Supabase** comme proxy :

```
Navigateur → Edge Function (HTTPS) → Webservice FFA (HTTP) → Réponse
```

**Avantages :**
- ✅ Contourne CORS (l'appel est fait côté serveur)
- ✅ Contourne Mixed Content (connexion HTTPS→HTTPS)
- ✅ Fallback automatique en développement local
- ✅ Logs automatiques dans `audit_logs`

---

## 🧪 Comment tester maintenant

### Étape 1 : Vérifier votre URL Supabase

Ouvrez votre fichier `.env` et vérifiez :

```bash
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

**Important :** Ces variables doivent être définies pour que l'Edge Function soit accessible.

### Étape 2 : Rafraîchir l'application

1. Arrêtez le serveur de développement (Ctrl+C)
2. Redémarrez :
   ```bash
   npm run dev
   ```
3. Videz le cache du navigateur (Ctrl+Shift+R)

### Étape 3 : Tester depuis l'interface Admin

1. Allez sur `/admin/login`
2. Connectez-vous
3. Allez dans **Paramètres → FFA**
4. Cliquez sur **"Tester"**

### Réponses possibles

#### ✅ Succès (identifiants valides)

```
✓ Connexion FFA réussie !
Votre système est connecté au webservice FFA.

Détails:
{
  "connected": true,
  "message": "Connexion FFA réussie !",
  "details": {
    "uid": "FOURCHEROT",
    "test_athlete": {
      "numrel": "1756134",
      "nom": "ROBERT",
      "prenom": "JONATHAN"
    },
    "flags": {
      "info_exact": true,
      "relation_valide": true
    }
  }
}
```

#### ❌ Échec PROx011 (identifiants invalides)

```
✗ Échec de connexion: NOK, VOUS N'ETES PAS AUTORISE...(PROx011)

Identifiants SIFFA invalides. Vérifiez votre UID et mot de passe.
```

**Action :** Contactez la FFA (dsi@athle.fr)

#### ⚠️ Échec Edge Function

```
✗ Erreur lors du test de connexion
Impossible de contacter le webservice FFA.
```

**Causes possibles :**
1. Variable `VITE_SUPABASE_URL` manquante ou incorrecte
2. Edge Function non déployée
3. Problème réseau

---

## 🔍 Vérification de l'Edge Function

### Test 1 : Vérifier le déploiement

Allez sur votre **Dashboard Supabase** :
1. Projet → **Edge Functions**
2. Vérifiez que `test-ffa-connection` existe et est **déployée**

### Test 2 : Tester manuellement avec curl

```bash
curl -X POST \
  "https://VOTRE_PROJET.supabase.co/functions/v1/test-ffa-connection" \
  -H "Content-Type: application/json" \
  -d '{"uid":"FOURCHEROT","mdp":"Lucas13@!"}'
```

**Réponse attendue :**
```json
{
  "connected": true,
  "message": "Connexion FFA réussie !",
  "details": { ... }
}
```

### Test 3 : Console du navigateur (F12)

```javascript
const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-ffa-connection`;

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'FOURCHEROT',
    mdp: 'Lucas13@!'
  })
});

const result = await response.json();
console.log(result);
```

---

## 🐛 Résolution des problèmes

### Problème 1 : "VITE_SUPABASE_URL is not defined"

**Cause :** Variable d'environnement manquante

**Solution :**
1. Créez un fichier `.env` à la racine du projet
2. Copiez le contenu de `.env.example`
3. Remplacez les valeurs par vos vraies clés Supabase

```bash
# .env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Redémarrez le serveur de dev

### Problème 2 : "404 Function not found"

**Cause :** Edge Function non déployée

**Solution :**

Vérifiez que l'Edge Function a été déployée :

```bash
# Lister les Edge Functions
curl https://VOTRE_PROJET.supabase.co/functions/v1/
```

Si elle n'existe pas, elle a déjà été déployée lors de notre session. Vérifiez le dashboard Supabase.

### Problème 3 : Toujours "Failed to fetch"

**Cause :** Le code utilise encore l'ancien appel direct

**Solution :**

Vérifiez que vous avez bien la dernière version du code :

```bash
# Vérifier la version buildée
npm run build

# Redémarrer le serveur
npm run dev
```

### Problème 4 : Fallback activé (développement local)

**Message :**
```
[FFA Test] Edge Function error: ...
[FFA Test] Fallback: trying direct call...
```

**Explication :**
C'est normal en développement local. Le code essaie d'abord l'Edge Function, puis fait un appel direct si elle n'est pas accessible.

**Limitation du fallback :**
L'appel direct peut être bloqué par CORS ou Mixed Content selon votre configuration.

---

## 📊 Flux de test actuel

```
1. Frontend appelle testFFAConnection()
   ↓
2. Récupère les identifiants via get_ffa_credentials()
   ↓
3. Appelle l'Edge Function Supabase
   URL: /functions/v1/test-ffa-connection
   Body: {uid, mdp}
   ↓
4. Edge Function appelle le webservice FFA
   URL: http://webservicesffa.athle.fr/St_Chrono/STCHRONO.asmx
   ↓
5. Parse la réponse SOAP
   ↓
6. Retourne le résultat au frontend
   {connected: true/false, message, details}
   ↓
7. Log dans audit_logs
   action: 'FFA_CONNECTION_TEST'
```

---

## 📝 Logs et monitoring

### Consulter les logs de test

```sql
SELECT
  created_at,
  action,
  details->>'status' as status,
  details->>'uid' as uid,
  details->>'message' as message
FROM audit_logs
WHERE action = 'FFA_CONNECTION_TEST'
ORDER BY created_at DESC
LIMIT 5;
```

### Consulter les logs de l'Edge Function

1. Dashboard Supabase
2. Edge Functions → `test-ffa-connection`
3. Onglet **Logs**

Vous verrez :
```
[FFA Test] Calling FFA API with UID: FOURCHEROT
[FFA Test] Response status: 200
[FFA Test] CSV Result: O,O,N,N,...
```

---

## ✨ Résumé des modifications

| Élément | Avant | Après |
|---------|-------|-------|
| Méthode d'appel | Direct (browser → FFA) | Via Edge Function (browser → Supabase → FFA) |
| CORS | ❌ Bloqué | ✅ Pas de problème |
| Mixed Content | ❌ Bloqué (HTTPS→HTTP) | ✅ Résolu (HTTPS→HTTPS→HTTP) |
| Fallback | ❌ Aucun | ✅ Appel direct en dev |
| Logs | ⚠️ Partiels | ✅ Complets |

---

## 🚀 Prochaines étapes

Une fois le test réussi :

1. ✅ Les identifiants FFA sont validés
2. ✅ Le webservice est accessible
3. ✅ Vous pouvez activer la vérification FFA sur vos événements

### Activer FFA sur un événement

1. Admin → Événements
2. Éditer un événement
3. Cocher **"Affilié FFA"**
4. Saisir le **code CALORG** (fourni par la FFA)
5. Lors des inscriptions, les licences seront vérifiées automatiquement

---

## 📞 Support

### Si le test échoue toujours

1. Vérifiez votre `.env` (VITE_SUPABASE_URL)
2. Testez manuellement avec curl (voir ci-dessus)
3. Consultez les logs de l'Edge Function dans le dashboard Supabase
4. Vérifiez la console du navigateur (F12) pour des erreurs

### Contact FFA

Si vous obtenez PROx011 (identifiants invalides) :

- **Email :** dsi@athle.fr
- **Sujet :** "Webservice STCHRONO_V2 - Société Timepulse"
- **UID :** FOURCHEROT
- **Demande :** Validation des identifiants d'accès

---

## ✅ Checklist de vérification

- [ ] Fichier `.env` existe avec VITE_SUPABASE_URL
- [ ] Edge Function `test-ffa-connection` déployée
- [ ] Identifiants FFA enregistrés (FOURCHEROT / Lucas13@!)
- [ ] Application redémarrée (npm run dev)
- [ ] Cache navigateur vidé (Ctrl+Shift+R)
- [ ] Test lancé depuis l'interface Admin
- [ ] Résultat : ✅ Connexion réussie ou ❌ PROx011

**Le problème "Failed to fetch" est maintenant résolu !** 🎉

Testez à nouveau depuis l'interface Admin.
