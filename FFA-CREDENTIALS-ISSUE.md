# ⚠️ Problème avec les identifiants FFA

## 🔍 Diagnostic

Le club FFA ne se remplit pas automatiquement car **les identifiants FFA configurés ne sont PAS autorisés** à utiliser le webservice de chronométrage de la FFA.

### Détails de l'erreur

Lors du test de la licence **929636**, l'API FFA a retourné :

```
Message: NOK
Détail: VOUS N'ETES PAS AUTORISE A UTILISER CE SERVICE.(PROx011)
```

### Identifiants actuels

```
UID: MICFOU
Code erreur: PROx011 (Non autorisé)
```

## 📋 Que signifie cette erreur ?

**PROx011** = Les identifiants SIFFA ne sont pas autorisés à utiliser le webservice de chronométrage de la FFA.

Cela peut arriver si :
1. Les identifiants ne sont pas activés pour le service de chronométrage
2. Le compte SIFFA n'a pas les droits d'accès au webservice
3. Les identifiants sont incorrects

## ✅ Solutions

### Solution 1 : Contacter la FFA (Recommandé)

Contactez le service DSI de la FFA pour activer l'accès au webservice :
- **Email** : dsi@athle.fr
- **Objet** : Activation du webservice de chronométrage pour MICFOU
- **Message** :
  ```
  Bonjour,

  Je souhaite activer l'accès au webservice de chronométrage (STCHRONO_V2)
  pour mon compte SIFFA.

  UID: MICFOU
  Nom de l'organisme: [VOTRE NOM]

  Merci d'avance.
  ```

### Solution 2 : Vérifier les identifiants

Si vous avez d'autres identifiants FFA avec accès au webservice, vous pouvez les configurer dans l'interface admin :

1. Connectez-vous en tant qu'administrateur
2. Allez dans **Paramètres** > **Intégrations FFA**
3. Mettez à jour l'UID et le mot de passe

### Solution 3 : Saisie manuelle temporaire

En attendant la résolution :
- Les participants peuvent saisir manuellement leur club FFA
- Le PSP reste obligatoire pour les non-licenciés sur les courses FFA

## 🔧 Corrections apportées

J'ai mis à jour l'edge function `ffa-verify-athlete` pour mieux gérer cette erreur :

**Avant** :
```
✓ Licence vérifiée - Club: Non trouvé
```

**Après** (une fois déployée) :
```
❌ Identifiants FFA non autorisés pour ce service
Les identifiants SIFFA configurés ne sont pas autorisés à utiliser
le webservice de chronométrage. Contactez la FFA (dsi@athle.fr) pour
activer l'accès ou vérifiez vos identifiants.
```

## 📝 Déploiement de la correction

Pour déployer la fonction corrigée, exécutez :

```bash
npx supabase functions deploy ffa-verify-athlete --no-verify-jwt
```

Ou utilisez le dashboard Supabase :
1. Allez dans **Edge Functions**
2. Sélectionnez `ffa-verify-athlete`
3. Cliquez sur **Deploy new version**
4. Copiez le contenu de `supabase/functions/ffa-verify-athlete/index.ts`

## 🎯 Test après correction

Une fois les identifiants FFA valides configurés, vous pourrez tester avec :

```bash
node test-ffa-929636.mjs
```

Le résultat attendu devrait afficher :
```
✅ Connexion réussie !
🏢 Informations club:
   Numéro club: XXXXX
   Nom abrégé: [Nom du club]
   Nom complet: [Nom complet du club]
   Club final: [Nom du club]
```

## 📞 Contacts

- **FFA - Service DSI** : dsi@athle.fr
- **FFA - Standard** : 01 53 80 70 00

---

**Date du diagnostic** : 13 décembre 2025
**Statut** : En attente d'activation des identifiants FFA
