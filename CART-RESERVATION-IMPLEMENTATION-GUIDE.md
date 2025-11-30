# 🎯 Guide d'implémentation : Système de réservation et file d'attente

## ✅ Ce qui a été fait

### 1. **Base de données (Migration complète)**

✅ Créé la migration `create_cart_reservation_and_waitlist_system_v2`

**Colonnes ajoutées sur `races` :**
- `reserved_spots` : Nombre de places réservées dans les paniers actifs
- `confirmed_entries` : Nombre d'inscriptions confirmées (payées)
- `has_quota` : Indique si la course a un quota maximum

**Table `race_waitlist` créée :**
- File d'attente avec position
- Temps d'attente estimé
- Option newsletter bourse aux dossards
- Statuts : waiting, notified, expired, registered

**Colonnes ajoutées sur `race_options` :**
- `reserved_quantity` : Quantité réservée dans les paniers
- `confirmed_quantity` : Quantité confirmée (payée)

**Fonctions SQL créées :**
- `check_race_availability()` : Vérifie la disponibilité d'une course
- `reserve_cart_spots()` : Réserve des places lors de l'ajout au panier
- `release_cart_spots()` : Libère des places lors de l'expiration du panier
- `add_to_waitlist()` : Ajoute un participant à la file d'attente
- `notify_next_in_waitlist()` : Notifie les premiers de la file quand une place se libère
- `calculate_wait_time()` : Calcule le temps d'attente estimé

**Triggers créés :**
- Mise à jour automatique des compteurs lors du paiement
- Libération automatique des places lors de l'expiration des paniers (intégré dans `expire_old_carts()`)

### 2. **Composant React**

✅ Créé `RaceWaitlistModal.tsx` - Modal complète pour la file d'attente

**Fonctionnalités :**
- Affichage des places disponibles/réservées/confirmées
- Calcul du temps d'attente estimé
- Formulaire d'inscription à la file
- Option newsletter bourse aux dossards (si activée sur l'événement)
- Confirmation avec position dans la file

### 3. **Automatisation**

✅ Job cron créé (toutes les minutes)
- Nettoie automatiquement les paniers expirés
- Libère les places réservées
- Notifie les personnes en attente

---

## 🔨 Ce qui reste à faire

### Étape 1 : Intégrer la vérification de disponibilité dans `PublicRegistrationForm`

**Fichier :** `src/components/PublicRegistrationForm.tsx`

**Où :** Dans la fonction `addToCart()`, **AVANT** l'insertion du `cart_item` (ligne ~1330)

**Code à ajouter :**

```typescript
// ===== VÉRIFIER LA DISPONIBILITÉ =====
console.log('🔍 [ADD TO CART] Vérification disponibilité course...');

const { data: availability, error: availError } = await supabase.rpc(
  'check_race_availability',
  {
    p_race_id: selectedRaceId,
    p_quantity: 1
  }
);

if (availError) {
  console.error('❌ [ADD TO CART] Erreur vérification disponibilité:', availError);
  throw availError;
}

console.log('📊 [ADD TO CART] Disponibilité:', availability);

// Si la course est complète, afficher la modal de file d'attente
if (!availability.available) {
  console.log('⚠️ [ADD TO CART] Course complète, affichage file d\'attente');
  setWaitlistModalData({
    raceId: selectedRaceId,
    raceName: races.find(r => r.id === selectedRaceId)?.name || 'Course',
    availability: availability
  });
  setShowWaitlistModal(true);
  setLoading(false);
  return;
}

console.log('✅ [ADD TO CART] Places disponibles, réservation...');

// Réserver les places pour ce panier
const { data: reservationResult, error: reserveError } = await supabase.rpc(
  'reserve_cart_spots',
  { p_cart_id: cartId }
);

if (reserveError || !reservationResult.success) {
  console.error('❌ [ADD TO CART] Erreur réservation:', reserveError || reservationResult);
  alert('La course est complète ou une erreur est survenue');
  setLoading(false);
  return;
}

console.log('✅ [ADD TO CART] Places réservées avec succès');

// ===== INSÉRER LE CART_ITEM ===== (code existant)
```

### Étape 2 : Ajouter les états nécessaires

**Fichier :** `src/components/PublicRegistrationForm.tsx`

**Où :** En haut du composant, avec les autres `useState`

```typescript
// Import du composant
import RaceWaitlistModal from './RaceWaitlistModal';

// États pour la file d'attente
const [showWaitlistModal, setShowWaitlistModal] = useState(false);
const [waitlistModalData, setWaitlistModalData] = useState<{
  raceId: string;
  raceName: string;
  availability: any;
} | null>(null);

// État pour savoir si la bourse aux dossards est activée
const [hasBibExchange, setHasBibExchange] = useState(false);
```

### Étape 3 : Charger les informations de l'événement (bourse aux dossards)

**Fichier :** `src/components/PublicRegistrationForm.tsx`

**Où :** Dans `useEffect` qui charge les données de l'événement

```typescript
// Vérifier si la bourse aux dossards est activée
const { data: eventSettings } = await supabase
  .from('events')
  .select('bib_exchange_enabled') // Cette colonne existe déjà
  .eq('id', eventId)
  .maybeSingle();

if (eventSettings) {
  setHasBibExchange(eventSettings.bib_exchange_enabled || false);
}
```

### Étape 4 : Afficher la modal de file d'attente

**Fichier :** `src/components/PublicRegistrationForm.tsx`

**Où :** À la fin du JSX (return), juste avant la dernière balise fermante

```typescript
{/* Modal file d'attente */}
{showWaitlistModal && waitlistModalData && (
  <RaceWaitlistModal
    raceId={waitlistModalData.raceId}
    eventId={eventId}
    raceName={waitlistModalData.raceName}
    availability={waitlistModalData.availability}
    onClose={() => {
      setShowWaitlistModal(false);
      setWaitlistModalData(null);
    }}
    hasBibExchange={hasBibExchange}
  />
)}
```

### Étape 5 : Afficher les places restantes sur chaque course

**Fichier :** `src/components/PublicRegistrationForm.tsx`

**Où :** Dans le rendu de chaque course (là où on affiche le nom de la course)

**Code à ajouter :** Charger la disponibilité pour chaque course et l'afficher

```typescript
// Dans useEffect, charger la disponibilité de toutes les courses
const loadRacesAvailability = async () => {
  const availabilityData: Record<string, any> = {};

  for (const race of races) {
    const { data } = await supabase.rpc('check_race_availability', {
      p_race_id: race.id,
      p_quantity: 1
    });

    if (data) {
      availabilityData[race.id] = data;
    }
  }

  setRacesAvailability(availabilityData);
};

// Puis afficher dans le JSX :
{racesAvailability[race.id] && racesAvailability[race.id].has_waitlist && (
  <span className="text-sm text-orange-600 ml-2">
    ⏳ {racesAvailability[race.id].waitlist_count} en attente
  </span>
)}

{racesAvailability[race.id] && !racesAvailability[race.id].available && (
  <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
    Complet
  </span>
)}

{racesAvailability[race.id] && racesAvailability[race.id].available && (
  <span className="text-sm text-gray-600 ml-2">
    {racesAvailability[race.id].spots_remaining} places
  </span>
)}
```

---

## 🚀 Fonctionnement du système

### Scénario 1 : Places disponibles

1. Utilisateur ajoute une inscription au panier
2. Système vérifie `check_race_availability()`
3. Si OK → Appel `reserve_cart_spots()` pour réserver la place
4. Insertion du `cart_item` dans la base
5. Les compteurs `reserved_spots` sont incrémentés
6. L'utilisateur a 10 minutes pour payer

### Scénario 2 : Course complète

1. Utilisateur tente d'ajouter une inscription
2. Système détecte que `available = false`
3. **Affichage de `RaceWaitlistModal`**
4. Utilisateur remplit le formulaire
5. Ajout à la table `race_waitlist` avec position et temps estimé
6. Email de confirmation (à implémenter)

### Scénario 3 : Place libérée

1. Un panier expire (après 10 min)
2. Job cron appelle `expire_old_carts()`
3. `release_cart_spots()` libère les places
4. `notify_next_in_waitlist()` notifie la première personne
5. Email envoyé (à implémenter)
6. La personne a 10 minutes pour s'inscrire

---

## 📝 Notes importantes

### Activer les quotas sur une course

Par défaut, les courses n'ont **pas** de quota. Pour activer :

```sql
UPDATE races
SET
  has_quota = true,
  max_participants = 500  -- Nombre maximum de participants
WHERE id = 'uuid-de-la-course';
```

### Vérifier l'état d'une course

```sql
SELECT
  name,
  max_participants,
  confirmed_entries,
  reserved_spots,
  (confirmed_entries + reserved_spots) as total_occupied,
  (max_participants - confirmed_entries - reserved_spots) as places_disponibles
FROM races
WHERE has_quota = true;
```

### Voir la file d'attente

```sql
SELECT
  r.name as course,
  w.position,
  w.first_name,
  w.last_name,
  w.email,
  w.estimated_wait_minutes,
  w.status,
  w.created_at
FROM race_waitlist w
JOIN races r ON w.race_id = r.id
WHERE w.status = 'waiting'
ORDER BY r.name, w.position;
```

---

## 🎯 TODO : Email de notification

Créer une edge function pour envoyer les emails de notification quand une place se libère.

**Fichier à créer :** `supabase/functions/notify-waitlist/index.ts`

**Appelé par :** La fonction `notify_next_in_waitlist()`

**Contenu de l'email :**
- Nom de la course
- Temps restant pour s'inscrire (10 minutes)
- Lien direct vers la page d'inscription
- Instructions claires

---

## ✅ Résumé

**Base de données** : ✅ Complète et opérationnelle
**Composant React** : ✅ Créé et prêt à l'emploi
**Intégration frontend** : ⏳ À faire (4 petites modifications dans PublicRegistrationForm)
**Job automatique** : ✅ Actif (tourne toutes les minutes)
**Email notification** : ⏳ À implémenter (edge function)

Le système est à 80% terminé. Il reste principalement l'intégration dans le formulaire et l'envoi d'emails.
