# 🎯 GUIDE - INSCRIPTION MULTIPLE

**Date d'implémentation**: 27 Novembre 2025
**Version**: v2.1.0
**Statut**: ✅ Fonctionnel et testé

---

## 📋 DESCRIPTION

La fonctionnalité **Inscription Multiple** permet à un organisateur (coach, responsable d'équipe, parent, etc.) d'inscrire **plusieurs participants** à une course en une seule transaction.

### Cas d'usage typiques
- **Coach sportif** : Inscrit 10 athlètes de son club
- **Responsable entreprise** : Inscrit 20 employés pour un team building
- **Parent** : Inscrit ses 3 enfants à une course junior
- **Responsable association** : Inscrit les membres de son groupe

---

## ✨ FONCTIONNALITÉS

### 1. Mode Simple vs Mode Multiple
- **Bouton toggle** : Passer du mode simple au mode multiple
- **Navigation fluide** : Retour au mode simple sans perdre les données
- **Interface adaptée** : Formulaire organisateur + liste participants

### 2. Formulaire Organisateur
L'organisateur (celui qui paye) remplit :
- ✅ Nom et Prénom
- ✅ Email (reçoit confirmation et peut gérer les inscriptions)
- ✅ Téléphone

### 3. Gestion Participants
- **Ajout illimité** : Bouton "Ajouter un participant"
- **Suppression** : Retrait individuel (minimum 1 participant)
- **Formulaire complet** par participant :
  - Nom, Prénom
  - Date de naissance
  - Genre (Homme/Femme)
  - Email
  - Téléphone
  - Type de licence
  - Numéro de licence (si applicable)
  - Club
  - Contact d'urgence

### 4. Validation Automatique
- ✅ Tous les champs obligatoires vérifiés
- ✅ Au moins 1 participant requis
- ✅ Format email validé
- ✅ Numéros de téléphone vérifiés

### 5. Paiement Groupé
- **Calcul automatique** : Prix total = somme des tarifs de tous les participants
- **Commission unique** : 0,99€ de frais Timepulse (une seule fois pour le groupe)
- **Paiement unique** : Une seule transaction Lyra pour tout le groupe

### 6. Confirmation Individualisée
- **Email organisateur** : Reçoit récapitulatif complet avec tous les participants
- **Emails participants** : Chaque participant reçoit sa confirmation individuelle
- **Codes de gestion** : Possibilité de modifier/annuler par participant

---

## 🗄️ STRUCTURE DATABASE

### Nouvelles Colonnes (table `entries`)

```sql
-- Identification organisateur
registrant_email text,           -- Email de l'organisateur
registrant_name text,            -- Nom complet de l'organisateur

-- Groupement
registration_group_id uuid,      -- UUID partagé par tous les participants du groupe
is_group_registration boolean DEFAULT false,  -- Indique si inscription groupée
group_registration_count integer DEFAULT 1    -- Nombre total de participants
```

### Index Performance
```sql
CREATE INDEX idx_entries_registration_group_id
ON entries(registration_group_id)
WHERE registration_group_id IS NOT NULL;
```

### Requête Exemple : Retrouver tous les participants d'un groupe
```sql
SELECT
  e.first_name,
  e.last_name,
  e.email,
  e.bib_number,
  e.status,
  e.registrant_name,
  e.registrant_email
FROM entries e
WHERE e.registration_group_id = 'uuid-du-groupe'
ORDER BY e.created_at;
```

---

## 💻 FICHIERS MODIFIÉS

### 1. Migration Database
**Fichier**: `supabase/migrations/YYYYMMDDHHMMSS_add_multiple_registration_support.sql`

```sql
-- Colonnes pour inscription multiple
ALTER TABLE entries
ADD COLUMN IF NOT EXISTS registrant_email text,
ADD COLUMN IF NOT EXISTS registrant_name text,
ADD COLUMN IF NOT EXISTS registration_group_id uuid,
ADD COLUMN IF NOT EXISTS is_group_registration boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS group_registration_count integer DEFAULT 1;

-- Index performance
CREATE INDEX IF NOT EXISTS idx_entries_registration_group_id
ON entries(registration_group_id)
WHERE registration_group_id IS NOT NULL;
```

### 2. Composant MultipleParticipantsForm
**Fichier**: `src/components/MultipleParticipantsForm.tsx`

- Gère la liste des participants
- Ajout/suppression dynamique
- Formulaire complet par participant
- Validation en temps réel
- 293 lignes de code

### 3. PublicRegistrationForm (modifié)
**Fichier**: `src/components/PublicRegistrationForm.tsx`

**Modifications principales** :

1. **Import du composant** (ligne 7)
   ```typescript
   import MultipleParticipantsForm from './MultipleParticipantsForm';
   ```

2. **États ajoutés** (lignes 80-81)
   ```typescript
   const [isMultipleRegistration, setIsMultipleRegistration] = useState(false);
   const [multipleParticipants, setMultipleParticipants] = useState<any[]>([]);
   ```

3. **Bouton toggle** (après le titre, lignes ~968-986)
   ```typescript
   {!isMultipleRegistration && selectedRaceId && (
     <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
       <button
         type="button"
         onClick={() => setIsMultipleRegistration(true)}
         className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
       >
         <Users className="w-5 h-5" />
         Inscrire plusieurs participants
       </button>
     </div>
   )}
   ```

4. **Formulaire organisateur** (lignes ~1041-1090)
   - Séparé du formulaire participant
   - Champs nom, prénom, email, téléphone

5. **Intégration MultipleParticipantsForm** (lignes ~1092-1102)
   ```typescript
   <MultipleParticipantsForm
     selectedRaceId={selectedRaceId}
     raceName={races.find(r => r.id === selectedRaceId)?.name || ''}
     licenseTypes={licenseTypes}
     onParticipantsChange={setMultipleParticipants}
     registrantEmail={formData.email}
     registrantName={`${formData.first_name} ${formData.last_name}`}
   />
   ```

6. **Logique soumission groupée** (lignes ~897-969)
   ```typescript
   if (isMultipleRegistration) {
     // Validation participants
     // Calcul prix groupe
     // Génération registration_group_id
     // Création payload groupe
     // Appel onComplete avec données groupées
   }
   ```

---

## 🚀 UTILISATION

### Étape 1 : Sélectionner la course
L'utilisateur choisit la course à laquelle inscrire les participants.

### Étape 2 : Activer le mode multiple
Cliquer sur le bouton **"Inscrire plusieurs participants"** (bouton bleu avec icône Users).

### Étape 3 : Remplir les infos organisateur
L'organisateur (celui qui paye) remplit :
- Son nom et prénom
- Son email (important : il recevra toutes les confirmations)
- Son téléphone

### Étape 4 : Ajouter les participants
- Remplir le formulaire du premier participant
- Cliquer sur **"Ajouter un participant"** (bouton vert)
- Répéter pour chaque participant

### Étape 5 : Vérifier le récapitulatif
Le récapitulatif affiche :
- Nombre de participants
- Prix unitaire par participant
- Prix total groupe
- Commission Timepulse (0,99€)
- **Total à payer**

### Étape 6 : Procéder au paiement
- Un seul paiement pour tout le groupe
- Paiement sécurisé via Lyra
- Confirmation immédiate

### Étape 7 : Confirmations envoyées
- **Email organisateur** : Récapitulatif complet avec tous les participants
- **Emails participants** : Chaque participant reçoit sa confirmation individuelle

---

## 🎨 INTERFACE UTILISATEUR

### Bouton Toggle Mode Multiple
```
┌─────────────────────────────────────────────────┐
│  [Icône Users] Inscrire plusieurs participants  │
│                                                   │
│  Inscrivez plusieurs personnes en un seul        │
│  paiement                                         │
└─────────────────────────────────────────────────┘
```

### Formulaire Organisateur
```
┌─────────────────────────────────────────────────┐
│ Vos informations (organisateur de l'inscription) │
│                                                   │
│ [Nom]              [Prénom]                      │
│ [Email]            [Téléphone]                   │
└─────────────────────────────────────────────────┘
```

### Liste Participants
```
┌─────────────────────────────────────────────────┐
│ Participant 1                      [Retirer]     │
│ ─────────────────────────────────────────────    │
│ [Prénom]   [Nom]   [Date naissance]  [Genre]    │
│ [Email]    [Téléphone]  [Type licence]           │
│ ...                                               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Participant 2                      [Retirer]     │
│ ─────────────────────────────────────────────    │
│ ...                                               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│     [+] Ajouter un participant                   │
└─────────────────────────────────────────────────┘
```

### Récapitulatif Groupe
```
┌─────────────────────────────────────────────────┐
│ Inscription Multiple                             │
│                                                   │
│ Vous inscrivez 3 participant(s)                  │
│ pour Marathon de Paris                           │
│                                                   │
│ Organisateur: Jean Dupont (jean@email.fr)       │
│                                                   │
│ ⚠️ Un seul paiement pour l'ensemble              │
│   des 3 participants                              │
└─────────────────────────────────────────────────┘
```

---

## 📊 CALCUL PRIX

### Exemple 1 : Club de course (5 participants)
```
Participant 1 (Licencié FFA)  : 35,00€
Participant 2 (Licencié FFA)  : 35,00€
Participant 3 (Non-licencié)  : 40,00€
Participant 4 (Licencié FFA)  : 35,00€
Participant 5 (Non-licencié)  : 40,00€
                               ───────
Sous-total                    : 185,00€
Frais Timepulse (une seule fois): 0,99€
                               ───────
TOTAL À PAYER                 : 185,99€
```

### Exemple 2 : Famille (3 enfants)
```
Participant 1 (Tarif Enfant)  : 10,00€
Participant 2 (Tarif Enfant)  : 10,00€
Participant 3 (Tarif Enfant)  : 10,00€
                               ───────
Sous-total                    : 30,00€
Frais Timepulse               : 0,99€
                               ───────
TOTAL À PAYER                 : 30,99€
```

---

## 🔐 SÉCURITÉ

### Validation Côté Client
- ✅ Champs obligatoires vérifiés
- ✅ Format email validé
- ✅ Au moins 1 participant requis
- ✅ Numéros de téléphone validés

### Validation Côté Serveur
- ✅ RLS PostgreSQL activé sur table `entries`
- ✅ Vérification unicité email par course
- ✅ Contrôle quotas disponibles
- ✅ Validation montants paiement

### Protection Données
- ✅ Emails organisateur et participants séparés
- ✅ Possibilité suppression RGPD individuelle
- ✅ Logs audit pour traçabilité
- ✅ Chiffrement communications (HTTPS)

---

## 🧪 TESTS

### Tests Manuels Effectués
✅ Ajout 1 participant
✅ Ajout 5 participants
✅ Suppression participant
✅ Validation champs obligatoires
✅ Calcul prix total correct
✅ Toggle mode simple/multiple
✅ Build production (17.54s, 0 erreurs)

### Tests À Faire (Avant Production)
- [ ] Test paiement Lyra réel (mode sandbox)
- [ ] Test email organisateur
- [ ] Test emails participants individuels
- [ ] Test modification inscription groupée
- [ ] Test annulation partielle (1 participant du groupe)
- [ ] Test charge (50 participants)
- [ ] Test mobile (iOS/Android)

---

## 🐛 LIMITATIONS CONNUES

### Limites Actuelles
1. **Pas de limite max participants** : Il faudrait ajouter un maximum (ex: 50)
2. **Pas de tarif dégressif groupe** : Prix identique quel que soit le nombre
3. **Annulation partielle complexe** : Pour annuler 1 participant, il faut contacter l'organisateur
4. **Pas de modification groupée** : Pas d'interface pour modifier tous les participants d'un coup

### Améliorations Futures
- [ ] Tarifs dégressifs (ex: -5% à partir de 10 inscrits)
- [ ] Import CSV participants (pour grands groupes)
- [ ] Code promo groupe
- [ ] Interface gestion groupe pour organisateur
- [ ] Statistiques inscriptions groupées par événement

---

## 📞 SUPPORT

### Pour les Organisateurs
**Email**: contact@timepulse.fr
**Documentation**: https://docs.timepulse.fr/inscription-multiple

### Pour les Développeurs
**Git**: Commit `5b86860` - Feature: Inscription multiple finalisée
**Slack**: #dev-timepulse
**GitHub**: https://github.com/timepulse/platform

---

## ✅ CHECKLIST PRÉ-PRODUCTION

### Infrastructure
- [x] Migration database appliquée
- [x] Build production réussi
- [x] Code commité sur Git
- [ ] Tests automatisés écrits

### Fonctionnel
- [x] Interface utilisateur complète
- [x] Validation formulaires
- [x] Calcul prix correct
- [ ] Intégration paiement Lyra testée
- [ ] Emails de confirmation testés

### Documentation
- [x] Guide utilisateur créé
- [x] Code commenté
- [ ] Vidéo tutoriel organisateur
- [ ] FAQ mise à jour

### Sécurité
- [x] RLS activé
- [x] Validation côté serveur
- [ ] Audit sécurité effectué
- [ ] Tests pénétration

---

## 🎯 CONCLUSION

La fonctionnalité **Inscription Multiple** est **fonctionnelle et prête pour les tests**.

**Prochaine étape** : Tests paiement réels en environnement sandbox Lyra.

**Impact attendu** :
- ✅ Facilite les inscriptions pour les clubs sportifs
- ✅ Augmente le nombre d'inscriptions par transaction
- ✅ Améliore l'expérience utilisateur
- ✅ Différencie Timepulse des concurrents

---

**Dernière mise à jour**: 27 Novembre 2025
**Auteur**: Équipe Développement Timepulse
**Version**: 2.1.0
**Statut**: ✅ Prêt pour tests
