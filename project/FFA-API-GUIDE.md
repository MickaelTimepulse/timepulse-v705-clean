# Guide d'intégration API FFA (Fédération Française d'Athlétisme)

## Vue d'ensemble

L'API FFA permet de vérifier en temps réel la validité des licences, Pass J'aime Courir (TP), PPS et Cartes de Fidélité lors des inscriptions aux courses.

## 🔑 Prérequis

### 1. Référencement dans le SIFFA

**OBLIGATOIRE** : Vous devez être référencé dans le SI-FFA en tant que :
- Acteur licencié du club organisateur, OU
- Acteur de la société de chronométrie/inscription en ligne

### 2. Affectation à la compétition

Votre société doit être **affectée à la compétition** dans CALORG ou SIFFA, sinon l'accès au webservice sera refusé.

### 3. Identifiants

Vous recevrez de la FFA :
- **UID** : Identifiant utilisateur SIFFA
- **MDP** : Mot de passe SIFFA

> 📧 **Contact FFA** : dsi@athle.fr

---

## 📡 URL de l'API

### Mode TEST/PROD (même URL)
```
http://webservicesffa.athle.fr/St_Chrono/STCHRONO.asmx
```

**Endpoint SOAP** : `STCHRONO_V2`

---

## 🧪 Mode TEST

Pour tester sans impacter les données réelles :

### Paramètres spéciaux

```typescript
CMPCOD = "000000"    // Code compétition de test
CMPDATE = "01/01/1900"  // Date de test
```

### Athlètes de test disponibles

#### 1. Acteur NON licencié
```
Nom: RALL
Prénom: RAOUL
Date naissance: 25/01/1965
```

#### 2. Acteur licencié
```
Nom: DE OLIVEIRA
Prénom: JULIEN
Date naissance: 26/12/1988
N° licence: 102802
```

#### 3. Licence Compétition
```
Nom: ROBERT
Prénom: JONATHAN
Date naissance: 23/05/1991
N° licence: 1756134
Type: COMP
```

#### 4. Pass J'aime Courir
```
Nom: LEDOGAR
Prénom: STEPHANE
Date naissance: 14/12/1972
N° TP: T195377
```

---

## 📥 Format d'entrée (Request)

### Paramètres

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| **E_UID** | string | ✅ | Identifiant SIFFA |
| **E_MDP** | string | ✅ | Mot de passe SIFFA |
| **E_NUMREL** | string | ❌ | N° de relation (licence/TP/PPS/CF) |
| **E_NOM** | string | ✅ | Nom (MAJUSCULES, sans accents) |
| **E_PRENOM** | string | ✅ | Prénom (MAJUSCULES, sans accents) |
| **E_SEXE** | M/F | ✅ | Sexe |
| **E_DATE_NAI** | string | ✅ | Date naissance (DD/MM/YYYY ou YYYY) |
| **E_CNIL_WEB** | O/N | ❌ | Affichage résultats (O=Oui, N=Non) |
| **E_CMPCOD** | string | ✅ | Code SIFFA compétition |
| **E_CMPDATE** | string | ✅ | Date compétition (DD/MM/YYYY) |
| **E_ID_ACT_EXT** | string | ❌ | ID acteur dans votre BDD |
| **E_ID_CMP_EXT** | string | ❌ | ID compétition dans votre BDD |

### Formats des numéros de relation

| Type | Format | Exemple |
|------|--------|---------|
| **Licence** | 6-7 chiffres | `1756134` |
| **Pass J'aime Courir** | T + 6 chiffres | `T195377` |
| **PPS** | P + 10 alphanum | `P5CVC84A8F6` |
| **Carte Fidélité** | CF + 6 chiffres | `CF030716` |

---

## 📤 Format de sortie (Response)

### Structure CSV (28 champs séparés par des virgules)

```
INFOFLG,RELFLG,MUTFLG,PPSFLG,CMPCOD,ID_ACT_EXT,ID_CMP_EXT,NUMREL,
NOM,PRENOM,SEXE,DATE_NAI,NATCOD,RELCOD,DFINREL,CATCOD,
STRCODNUM_CLU,STRNOMABR_CLU,STRNOM_CLU,STRCODNUM_CLUM,
STRNOMABR_CLUM,STRNOM_CLUM,STRCODNUM_CLUE,STRNOMABR_CLUE,
STRNOM_CLUE,STRNOMABR_DEP,STRNOMABR_LIG,MSG_RETOUR
```

### Flags principaux

| Flag | Valeurs | Signification |
|------|---------|---------------|
| **INFOFLG** | O/N | Informations exactes ? |
| **RELFLG** | O/N | Relation valide ? |
| **MUTFLG** | O/N | Athlète muté ? |
| **PPSFLG** | O/N | PPS requis ? |

### Exemple de réponse valide

```csv
O,O,N,N,000000,100,200,1756134,ROBERT,JONATHAN,M,23/05/1991,FRA,COMP,31/08/2017,SE,075024,PUC,PARIS UC,075024,PUC,PARIS UC,,,,075,I-F,OK,
```

**Interprétation** :
- ✅ Informations exactes (INFOFLG=O)
- ✅ Licence valide (RELFLG=O)
- ✅ Non muté (MUTFLG=N)
- ✅ PPS non requis (PPSFLG=N)
- Type licence : COMP
- Club : PARIS UC (075024)
- Catégorie : SE (Senior)

---

## ⚠️ Codes d'erreur

| Code | Message |
|------|---------|
| **PROx001** | Erreur sur le format de date |
| **PROx002** | Informations fournies non-suffisantes |
| **PROx003** | Numéro de licence introuvable |
| **PROx004** | Numéro de TP introuvable |
| **PROx005** | Numéro de CF introuvable |
| **PROx006** | ⚠️ Relation non valide à la date de la compétition |
| **PROx007** | Identité différente : orthographe ou couple faux |
| **PROx008** | Identité introuvable |
| **PROx009** | Homonymie détectée |
| **PROx010** | Cas non pris en charge |
| **PROx011** | 🔒 Non autorisé (identifiants invalides) |
| **PROx012** | 🔒 Service bloqué (contacter la FFA) |
| **PROx013** | Erreur format date compétition |
| **PROx014** | Date compétition incohérente avec SIFFA |
| **PROx015** | Numéro de PPS introuvable |

---

## 🔄 Logique de vérification

### 1. Avec numéro de relation fourni

Le numéro de relation (licence/TP/PPS/CF) est **prioritaire**. Si introuvable → erreur immédiate.

### 2. Sans numéro de relation

L'API cherche l'acteur par son identité (nom, prénom, sexe, date de naissance).

**Ordre de préférence** : Licence > TP > PPS > CF
**Préférence 2** : Relation valide > Relation expirée

### 3. Cas particuliers

- **Homonymie** : Si plusieurs personnes correspondent exactement → erreur PROx009
- **Orthographe** : Noms/prénoms en MAJUSCULES, sans accents
- **Noms composés** : Avec tiret (ex: JEAN-CLAUDE)
- **Particules** : Avec espace ou tiret (ex: DE OLIVEIRA)

---

## 📊 Types de licences FFA

| Code | Type | Compétition | Certificat médical |
|------|------|-------------|-------------------|
| **COMP** | Compétition | ✅ | ❌ (dans la licence) |
| **ENTR** | Entreprise | ✅ | ❌ |
| **LOISR** | Loisir Running | ✅ | ❌ |
| **LOISS** | Loisir Santé | ❌ | ✅ |
| **DECO** | Découverte | ❌ | ✅ |
| **ENCA** | Encadrement | ❌ | ✅ |
| **TP365** | Pass J'aime Courir | ✅ | ✅ (tamponné) |
| **CF01** | Carte Fidélité | ❌ | ✅ |

---

## 💻 Utilisation dans Timepulse

### 1. Configuration des identifiants

Dans l'interface Admin → Paramètres → FFA :
```
UID: [Votre identifiant SIFFA]
MDP: [Votre mot de passe SIFFA]
```

### 2. Test de connexion

Utilisez le bouton "Tester la connexion FFA" pour vérifier :
- ✅ Identifiants valides
- ✅ Accès au webservice autorisé
- ✅ API disponible

### 3. Configuration des événements

Pour chaque événement affilié FFA :
1. Cochez "Affilié FFA"
2. Saisissez le **Code CALORG** (fourni par la FFA)
3. Les vérifications seront automatiques lors des inscriptions

### 4. Vérification lors des inscriptions

Lors d'une inscription, si l'athlète fournit :
- Un numéro de licence/TP/PPS/CF, OU
- Son identité complète (nom, prénom, sexe, date de naissance)

L'API FFA sera appelée automatiquement pour vérifier :
- ✅ Validité de la relation
- ⚠️ Nécessité d'un certificat médical (PPS)
- ℹ️ Informations club et catégorie

---

## 🔐 Sécurité

### Données sensibles

- Les identifiants FFA (UID/MDP) sont stockés **chiffrés** dans la base de données
- Jamais exposés côté client
- Utilisés uniquement côté serveur

### Logs

Toutes les vérifications FFA sont enregistrées dans `audit_logs` avec :
- Identité vérifiée (anonymisée)
- Résultat de la vérification
- Code d'erreur éventuel
- Timestamp

---

## 📞 Support

### Contact Timepulse
- Email : support@timepulse.fr

### Contact FFA
- Email : dsi@athle.fr
- Pour les demandes d'identifiants SIFFA
- Pour les problèmes d'accès au webservice

---

## 📚 Documentation officielle

Fichiers fournis par la FFA :
- `API_VERIFICATION_LICENCE.pdf` - Documentation technique complète
- `DOCUMENTATION_TEST_VERIF_LICENCE.pdf` - URL et données de test

Date de dernière mise à jour : Novembre 2025
