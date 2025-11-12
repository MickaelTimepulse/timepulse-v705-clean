# Guide de test - Connexion FFA

## ✅ Identifiants configurés

Vos identifiants FFA ont été enregistrés dans la base de données :

```
UID: FOURCHEROT
Mot de passe: Lucas13@!
```

---

## 🧪 3 méthodes de test disponibles

### Méthode 1 : Via l'Edge Function (RECOMMANDÉ)

Cette méthode contourne les problèmes CORS et HTTP/HTTPS.

**URL de la fonction Edge :**
```
https://[votre-projet].supabase.co/functions/v1/test-ffa-connection
```

**Test avec curl :**
```bash
curl -X POST \
  https://[votre-projet].supabase.co/functions/v1/test-ffa-connection \
  -H "Content-Type: application/json" \
  -d '{"uid":"FOURCHEROT","mdp":"Lucas13@!"}'
```

**Test avec JavaScript (dans votre app) :**
```javascript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-ffa-connection`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uid: 'FOURCHEROT',
      mdp: 'Lucas13@!'
    })
  }
);

const result = await response.json();
console.log(result);
```

### Méthode 2 : Fichier HTML de test

Ouvrez le fichier `test-ffa-connection.html` dans votre navigateur.

**Avantages :**
- Interface visuelle
- Possibilité de tester différents athlètes
- Affichage détaillé des résultats

**Note importante :**
⚠️ Cette méthode peut ne pas fonctionner à cause de CORS (politique de sécurité du navigateur).

### Méthode 3 : Via l'interface Admin

1. Connectez-vous sur `/admin/login`
2. Allez dans **Paramètres → FFA**
3. Cliquez sur **"Tester la connexion"**

---

## 📊 Réponses possibles

### ✅ Connexion réussie

```json
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
      "relation_valide": true,
      "mute": false,
      "pps_requis": false
    },
    "msg_retour": "OK"
  }
}
```

**Signification :**
- ✅ Vos identifiants SIFFA sont **valides**
- ✅ Vous êtes **autorisé** à utiliser l'API FFA
- ✅ L'athlète de test a été trouvé et vérifié

### ❌ Identifiants invalides (PROx011)

```json
{
  "connected": false,
  "message": "Échec de connexion: NOK, VOUS N'ETES PAS AUTORISE A UTILISER CE SERVICE.(PROx011)",
  "details": {
    "uid": "FOURCHEROT",
    "msg_retour": "NOK, VOUS N'ETES PAS AUTORISE A UTILISER CE SERVICE.(PROx011)",
    "hint": "Identifiants SIFFA invalides. Vérifiez votre UID et mot de passe."
  }
}
```

**Que faire ?**
1. Vérifier l'orthographe du UID : `FOURCHEROT`
2. Vérifier le mot de passe : `Lucas13@!` (attention à la casse)
3. Contacter la FFA (dsi@athle.fr) pour confirmer vos identifiants

### 🔒 Service bloqué (PROx012)

```json
{
  "connected": false,
  "message": "Échec de connexion: NOK, LE SERVICE EST BLOQUE, CONTACTEZ LA FFA.(PROx012)",
  "details": {
    "hint": "Service bloqué par la FFA. Contactez dsi@athle.fr"
  }
}
```

**Que faire ?**
Contacter immédiatement la FFA : **dsi@athle.fr**

---

## 🔧 Résolution des problèmes

### Problème : CORS error

**Symptôme :**
```
Access to fetch at 'http://webservicesffa.athle.fr/...' from origin 'http://localhost' has been blocked by CORS policy
```

**Solution :**
✅ Utilisez la **Méthode 1** (Edge Function) qui contourne ce problème.

### Problème : Mixed Content (HTTP/HTTPS)

**Symptôme :**
```
Mixed Content: The page was loaded over HTTPS, but requested an insecure resource 'http://...'
```

**Explication :**
Le webservice FFA utilise HTTP (pas HTTPS), ce qui pose un problème de sécurité pour les navigateurs modernes.

**Solution :**
✅ Utilisez la **Méthode 1** (Edge Function) qui fait la requête côté serveur.

### Problème : "Not authorized for competition"

**Symptôme :**
La connexion fonctionne en mode TEST (CMPCOD=000000) mais échoue pour une vraie compétition.

**Explication :**
Votre société de chronométrage n'est pas déclarée pour cette compétition dans CALORG/SIFFA.

**Solution :**
1. L'organisateur doit vous déclarer dans CALORG
2. Ou vous pouvez vous déclarer vous-même dans SIFFA (onglet "Performances")

---

## 📞 Support FFA

### Contact
- **Email :** dsi@athle.fr
- **Sujet :** "Problème d'accès au webservice STCHRONO_V2"

### Informations à fournir
- Votre UID : `FOURCHEROT`
- Votre société : Timepulse
- Type de problème : (authentification, autorisation, etc.)
- Message d'erreur exact (ex: PROx011)

---

## 🧑‍💻 Test rapide en ligne de commande

Si vous avez accès au serveur :

```bash
# Récupérer l'URL de votre projet Supabase
SUPABASE_URL="https://votre-projet.supabase.co"

# Tester la connexion
curl -X POST \
  "$SUPABASE_URL/functions/v1/test-ffa-connection" \
  -H "Content-Type: application/json" \
  -d '{"uid":"FOURCHEROT","mdp":"Lucas13@!"}'
```

**Réponse attendue si tout fonctionne :**
```json
{"connected":true,"message":"Connexion FFA réussie !","details":{...}}
```

---

## 📝 Prochaines étapes

Une fois la connexion validée :

1. ✅ Les identifiants sont déjà enregistrés dans `settings`
2. ✅ L'Edge Function est déployée
3. ✅ Le service FFA est prêt à être utilisé

### Pour utiliser l'API en production :

1. **Configurer vos événements**
   - Cocher "Affilié FFA"
   - Saisir le code CALORG (fourni par la FFA)

2. **Lors des inscriptions**
   - Si l'athlète fournit un n° de licence/TP/PPS
   - L'API FFA sera appelée automatiquement
   - Vérification de la validité en temps réel

3. **Monitoring**
   - Tous les appels sont loggés dans `audit_logs`
   - Action : `FFA_VERIFICATION`

---

## ✨ Résumé

| Élément | Statut |
|---------|--------|
| Identifiants enregistrés | ✅ |
| Edge Function déployée | ✅ |
| Fichier de test HTML | ✅ |
| Documentation | ✅ |
| Prêt pour la production | ⏳ (après validation du test) |

**Action à faire maintenant :**
Testez avec la **Méthode 1** (Edge Function) pour valider vos identifiants !
