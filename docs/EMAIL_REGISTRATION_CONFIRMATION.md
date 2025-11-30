# Template Email : Confirmation d'Inscription

## 📧 Vue d'ensemble

Le template `registration_confirmation` est envoyé automatiquement après qu'un athlète s'inscrit à une épreuve. Il contient tous les détails de l'inscription, y compris une explication claire de la tarification et des frais de transaction.

## 🎯 Objectifs du template

1. **Confirmer l'inscription** avec tous les détails essentiels (dossard, date, code de gestion)
2. **Détailler la tarification** de manière transparente et pédagogique
3. **Expliquer les frais de transaction** selon les différents cas de figure
4. **Fournir les informations de contact** de l'organisateur

## 💰 Gestion des différents cas de tarification

### Cas 1 : Épreuve 100% gratuite
**Condition :** `is_free = true`

**Affichage :**
```
🎉 Cette épreuve est entièrement GRATUITE !
Aucun frais à régler
```

**Frais de transaction :** ❌ Non appliqués

---

### Cas 2 : Inscription payante (avec ou sans options)
**Condition :** `is_free = false` et `is_registration_free = false`

**Affichage :**
```
Tarif d'inscription (Licence FFA): 25,00€
Options sélectionnées: [liste des options]
Sous-total: 30,00€
Frais de service Timepulse: 0,99€
━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL PAYÉ: 30,99€
```

**Frais de transaction :** ✅ Appliqués (0,99€)

---

### Cas 3 : Inscription GRATUITE + Options PAYANTES
**Condition :** `is_free = false` et `is_registration_free = true`

**Affichage :**
```
Tarif d'inscription (Non licencié): Gratuit
Options sélectionnées:
  • T-shirt technique: 15,00€
  • Repas d'après course: 12,00€
Sous-total: 27,00€
Frais de service Timepulse: 0,99€
━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL PAYÉ: 27,99€

✨ Inscription gratuite - Vous ne payez que les options
sélectionnées + frais de service
```

**Frais de transaction :** ✅ Appliqués (0,99€)
**Message spécial :** Badge vert expliquant que seules les options sont payantes

---

## 📋 Variables disponibles

### Informations athlète
- `{{athlete_name}}` - Nom complet de l'athlète
- `{{category}}` - Catégorie d'âge (Senior H, V1 F, etc.)

### Informations événement
- `{{event_name}}` - Nom de l'événement
- `{{race_name}}` - Nom de l'épreuve
- `{{event_url}}` - URL vers la page de l'événement

### Informations inscription
- `{{bib_number}}` - Numéro de dossard attribué
- `{{registration_date}}` - Date et heure d'inscription
- `{{management_code}}` - Code pour gérer l'inscription

### Informations tarification
- `{{license_type}}` - Type de licence (FFA, Non licencié, etc.)
- `{{base_price}}` - Prix de l'inscription de base (ex: "25,00" ou "Gratuit")
- `{{subtotal}}` - Sous-total avant frais (ex: "27,00")
- `{{total}}` - Total final payé (ex: "27,99")

### Flags conditionnels
- `{{is_free}}` - true si épreuve 100% gratuite
- `{{is_registration_free}}` - true si inscription gratuite mais options payantes
- `{{has_options}}` - true si des options ont été sélectionnées

### Options
- `{{options_list}}` - HTML formaté de la liste des options avec prix

### Informations organisateur
- `{{organizer_name}}` - Nom de l'organisateur
- `{{organizer_email}}` - Email de contact
- `{{organizer_phone}}` - Téléphone (optionnel)

---

## 🎨 Structure visuelle du template

### 1. En-tête (Header)
- Fond dégradé rose/magenta
- Titre "✅ Inscription confirmée !"
- Message de remerciement

### 2. Contenu principal
- **Bloc informations** (fond gris, bordure bleue)
  - Dossard
  - Date
  - Code de gestion
  - Catégorie

- **Avertissement important** (fond rouge clair)
  - Conservation du code de gestion

### 3. Section tarification (dynamique)

#### Si gratuit :
- **Encadré vert** avec message "Épreuve GRATUITE"

#### Si payant :
- **Encadré orange** avec détail complet :
  - Tarif de base
  - Liste des options (si applicable)
  - Sous-total
  - Frais de service
  - Total en gras

- **Encadré bleu info** expliquant les frais de service

- **Badge vert** si inscription gratuite + options payantes

### 4. Contact organisateur
- Nom, email, téléphone
- Bouton CTA vers l'événement

### 5. Footer
- Copyright Timepulse
- Message automatique

---

## 🔧 Utilisation dans le code

### Exemple d'envoi d'email

```typescript
await supabase.functions.invoke('send-email', {
  body: {
    to: 'athlete@example.com',
    type: 'registration_confirmation',
    data: {
      athlete_name: 'Jean Dupont',
      event_name: 'Marathon de Paris',
      race_name: '10km',
      bib_number: '1234',
      registration_date: '15 janvier 2025 à 14h30',
      management_code: 'ABC123XYZ',
      category: 'Senior H',
      license_type: 'Licence FFA',
      base_price: '25,00',
      subtotal: '27,00',
      total: '27,99',
      is_free: false,
      is_registration_free: false,
      has_options: true,
      options_list: '<div class="option-item"><span>T-shirt</span><span>15,00€</span></div>',
      organizer_name: 'Club Athlétique',
      organizer_email: 'contact@club.fr',
      organizer_phone: '06 12 34 56 78',
      event_url: 'https://timepulse.fr/events/123'
    }
  }
});
```

### Calcul des valeurs

```typescript
// Déterminer si l'épreuve est gratuite
const basePrice = getBaseRegistrationPrice(); // en centimes
const totalPrice = calculateTotalPrice(); // en centimes

const emailData = {
  is_free: totalPrice === 0,
  is_registration_free: basePrice === 0 && totalPrice > 0,
  has_options: Object.keys(selectedOptions).length > 0,
  base_price: basePrice === 0 ? 'Gratuit' : (basePrice / 100).toFixed(2),
  subtotal: (totalPrice / 100).toFixed(2),
  total: totalPrice === 0 ? 'Gratuit' : ((totalPrice + 99) / 100).toFixed(2)
};
```

---

## ✅ Points clés

1. **Transparence totale** : Tous les frais sont détaillés ligne par ligne
2. **Pédagogie** : Explication claire des frais de service
3. **Cas spéciaux mis en avant** : Badge vert pour inscription gratuite + options
4. **Design responsive** : Adapté pour lecture sur mobile
5. **Informations essentielles** : Code de gestion mis en évidence
6. **Call-to-action** : Bouton vers la page de l'événement

---

## 🎯 Règle de base des frais de transaction

**Les frais de service Timepulse (0,99€) s'appliquent UNIQUEMENT si un paiement est effectué.**

- Épreuve gratuite sans option → ❌ Pas de frais
- Épreuve gratuite avec option payante → ✅ Frais appliqués
- Épreuve payante (avec ou sans option) → ✅ Frais appliqués

Cette règle est clairement expliquée dans l'encadré bleu du template.
