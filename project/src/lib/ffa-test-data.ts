/**
 * Données de test pour l'API FFA
 * Source: Documentation officielle FFA "DOCUMENTATION_TEST_VERIF_LICENCE"
 */

/**
 * DONNÉES DE TEST FFA
 *
 * Pour les tests en MODE TEST, utilisez:
 * - CMPCOD: "000000"
 * - CMPDATE: "01/01/1900"
 */

export const FFA_TEST_CONFIG = {
  cmpcod: '000000',
  cmpdate: '01/01/1900',
} as const;

/**
 * ACTEURS DE TEST
 */
export const FFA_TEST_ATHLETES = {
  // Acteur connu, NON licencié
  NON_LICENCIE: {
    nom: 'RALL',
    prenom: 'RAOUL',
    sexe: 'M' as const,
    date_nai: '25/01/1965',
    description: 'Acteur connu dans la base FFA mais sans licence active',
  },

  // Acteur connu ET licencié
  LICENCIE: {
    nom: 'DE OLIVEIRA',
    prenom: 'JULIEN',
    sexe: 'M' as const,
    date_nai: '26/12/1988',
    numrel: '102802',
    description: 'Acteur avec licence FFA active',
  },

  // Exemple avec numéro de licence
  LICENCE_COMP: {
    nom: 'ROBERT',
    prenom: 'JONATHAN',
    sexe: 'M' as const,
    date_nai: '23/05/1991',
    numrel: '1756134',
    description: 'Licence Compétition valide',
  },

  // Exemple avec Pass J'aime Courir (TP)
  PASS_JAIME_COURIR: {
    nom: 'LEDOGAR',
    prenom: 'STEPHANE',
    sexe: 'M' as const,
    date_nai: '14/12/1972',
    numrel: 'T195377',
    description: 'Pass J\'aime Courir (Titre de Participation)',
  },

  // Exemple avec PSP
  PSP: {
    nom: 'DUPONT',
    prenom: 'JEAN',
    sexe: 'M' as const,
    date_nai: '14/12/1980',
    numrel: 'P5CVC84A8F6',
    description: 'PSP (Pass Prévention Santé)',
  },

  // Exemple avec Carte de Fidélité
  CARTE_FIDELITE: {
    nom: 'LEDOGAR',
    prenom: 'STEPHANE',
    sexe: 'M' as const,
    date_nai: '14/12/1972',
    numrel: 'CF030716',
    description: 'Carte de Fidélité',
  },
} as const;

/**
 * RÉPONSES ATTENDUES (exemples de la documentation)
 */
export const FFA_EXPECTED_RESPONSES = {
  // Cas nominal - Licence COMP valide
  LICENCE_VALIDE: 'O,O,N,N,000000,100,200,1756134,ROBERT,JONATHAN,M,23/05/1991,FRA,COMP,31/08/2017,SE,075024,PUC,PARIS UC,075024,PUC,PARIS UC,,,,075,I-F,OK,',

  // TP valide
  TP_VALIDE: 'O,O,N,O,000000,100,200,T195377,LEDOGAR,STEPHANE,M,14/12/1972,FRA,TP365,14/09/2016,,,,,,,,,,,,,OK,',

  // PSP valide
  PSP_VALIDE: 'O,O,N,O,000000,100,200,P5CVC84A8F6,DUPONT,JEAN,M,14/12/1980,FRA,PSP,14/09/2016,,,,,,,,,,,,,OK,',

  // CF valide
  CF_VALIDE: 'O,O,N,O,000000,100,200,CF030716,LEDOGAR,STEPHANE,M,14/12/1972,FRA,CF01,,,,,,,,,,,,,OK,',

  // Licence non valide
  LICENCE_NON_VALIDE: 'O,N,N,O,195303,100,200,1362109,DECHY,FREDERIC,M,01/07/1976,FRA,COMP,31/08/2015,,,,,,,,,,,,,NOK,LA RELATION (licence/TP/PSP) NE SERA PLUS VALIDE AU MOMENT DE LA COMPETITION.(PROx006)',

  // Numéro introuvable
  NUMERO_INTROUVABLE: 'N,N,N,O,000000,100,200,,,,,,,,,,,,,,,,,,,,,NOK,NUMERO DE LICENCE INTROUVABLE.(PROx003)',

  // Identité différente
  IDENTITE_DIFFERENTE: 'N,N,N,O,000000,100,200,,,,,,,,,,,,,,,,,,,,,NOK,IDENTITE DIFFERENTE: MAL ORTHOGRAPHIE OU COUPLE (RELATION/INDENTITE) FAUX.(PROx007)',

  // Homonymie
  HOMONYMIE: 'N,N,N,O,000000,100,200,,,,,,,,,,,,,,,,,,,,,NOK,REPONSE IMPOSSIBLE POUR RAISON D\'HOMONYME.(PROx009)',
} as const;

/**
 * FORMAT DES NUMÉROS DE RELATION
 */
export const FFA_RELATION_FORMATS = {
  LICENCE: {
    pattern: /^\d{6,7}$/,
    description: 'Licence : 6 à 7 chiffres',
    example: '1756134',
  },

  PASS_JAIME_COURIR: {
    pattern: /^T\d{6}$/,
    description: 'Pass J\'aime Courir : T + 6 chiffres',
    example: 'T195377',
  },

  PSP: {
    pattern: /^P[A-Z0-9]{10}$/,
    description: 'PSP : P + 10 caractères alphanumériques',
    example: 'P5CVC84A8F6',
  },

  CARTE_FIDELITE: {
    pattern: /^CF\d{6}$/,
    description: 'Carte de Fidélité : CF + 6 chiffres',
    example: 'CF030716',
  },
} as const;

/**
 * Valide un numéro de relation FFA
 */
export function validateFFARelationNumber(numrel: string): {
  valid: boolean;
  type?: string;
  description?: string;
} {
  if (!numrel) {
    return { valid: false };
  }

  for (const [type, format] of Object.entries(FFA_RELATION_FORMATS)) {
    if (format.pattern.test(numrel)) {
      return {
        valid: true,
        type,
        description: format.description,
      };
    }
  }

  return { valid: false };
}

/**
 * Guide d'utilisation du mode TEST
 */
export const FFA_TEST_GUIDE = `
# GUIDE MODE TEST FFA

## Configuration pour les tests

Pour tester l'intégration FFA sans impacter les données réelles :

1. **Code compétition (CMPCOD)** : Utilisez "000000"
2. **Date compétition (CMPDATE)** : Utilisez "01/01/1900"

## Athlètes de test disponibles

### 1. Acteur non licencié
- Nom : RALL
- Prénom : RAOUL
- Date naissance : 25/01/1965
- Résultat : Athlète connu mais sans licence

### 2. Acteur licencié
- Nom : DE OLIVEIRA
- Prénom : JULIEN
- Date naissance : 26/12/1988
- N° licence : 102802
- Résultat : Licence valide

### 3. Licence Compétition
- Nom : ROBERT
- Prénom : JONATHAN
- Date naissance : 23/05/1991
- N° licence : 1756134
- Type : COMP (Compétition)

### 4. Pass J'aime Courir
- Nom : LEDOGAR
- Prénom : STEPHANE
- Date naissance : 14/12/1972
- N° : T195377
- Type : TP365

## Codes d'erreur possibles

- **PROx003** : Numéro de licence introuvable
- **PROx004** : Numéro de TP introuvable
- **PROx005** : Numéro de CF introuvable
- **PROx006** : Relation expirée à la date de la compétition
- **PROx007** : Identité incorrecte ou couple relation/identité faux
- **PROx008** : Identité introuvable
- **PROx009** : Homonymie (plusieurs personnes correspondent)
- **PROx011** : Non autorisé (identifiants invalides)
- **PROx012** : Service bloqué (contacter la FFA)

## Contact FFA

Pour toute question : dsi@athle.fr
`;
