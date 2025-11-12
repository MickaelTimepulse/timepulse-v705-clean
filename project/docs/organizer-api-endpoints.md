# Module Organisateur - Endpoints API

## ARCHITECTURE API

Pour ce module, nous recommandons une architecture **REST** avec des endpoints clairement définis par domaine métier.

---

## 1. ÉVÉNEMENTS

### POST /api/organizer/events
Créer un nouvel événement.

**Request Body:**
```json
{
  "name": "Trail des Écrins 2025",
  "slug": "trail-ecrins-2025",
  "description": "Description complète de l'événement...",
  "short_description": "Trail exceptionnel dans les Écrins",
  "location_name": "Briançon",
  "location_address": "Place de la Mairie",
  "location_city": "Briançon",
  "location_postal_code": "05100",
  "location_country": "France",
  "start_date": "2025-06-15",
  "end_date": "2025-06-15",
  "contact_email": "contact@trailecrins.fr",
  "contact_phone": "04 92 23 45 67",
  "max_participants": 2000,
  "registration_open_date": "2025-01-01T00:00:00Z",
  "registration_close_date": "2025-06-14T23:59:59Z",
  "public_registration": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-event",
    "name": "Trail des Écrins 2025",
    "slug": "trail-ecrins-2025",
    "status": "draft",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### GET /api/organizer/events
Récupérer tous les événements de l'organisateur.

**Query Parameters:**
- `status` (optional): `draft`, `published`, `open`, `closed`, `cancelled`
- `page` (optional): Numéro de page
- `limit` (optional): Nombre d'éléments par page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-event",
      "name": "Trail des Écrins 2025",
      "slug": "trail-ecrins-2025",
      "status": "open",
      "start_date": "2025-06-15",
      "location_city": "Briançon",
      "registrations_count": 450,
      "max_participants": 2000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12
  }
}
```

---

### GET /api/organizer/events/:eventId
Récupérer les détails complets d'un événement.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-event",
    "name": "Trail des Écrins 2025",
    "slug": "trail-ecrins-2025",
    "description": "...",
    "status": "open",
    "races_count": 3,
    "registrations_count": 450,
    "revenue": 67500,
    "stats": {
      "confirmed": 420,
      "pending": 30,
      "cancelled": 10
    }
  }
}
```

---

### PATCH /api/organizer/events/:eventId
Mettre à jour un événement existant.

**Request Body:**
```json
{
  "status": "published",
  "max_participants": 2500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-event",
    "status": "published",
    "updated_at": "2025-01-15T14:20:00Z"
  }
}
```

---

### POST /api/organizer/events/:eventId/clone
Cloner un événement existant.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-new-event",
    "name": "Trail des Écrins 2026",
    "cloned_from": "uuid-event"
  }
}
```

---

## 2. ÉPREUVES

### POST /api/organizer/events/:eventId/races
Créer une nouvelle épreuve.

**Request Body:**
```json
{
  "name": "Trail 25 km",
  "slug": "trail-25km",
  "description": "Parcours technique avec 1200m D+",
  "distance_km": 25.0,
  "elevation_gain_m": 1200,
  "race_date": "2025-06-15",
  "race_time": "10:00:00",
  "max_participants": 800,
  "min_age": 18,
  "requires_medical_certificate": true
}
```

---

### GET /api/organizer/races/:raceId
Récupérer les détails d'une épreuve.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-race",
    "name": "Trail 25 km",
    "status": "open",
    "registrations_count": 320,
    "max_participants": 800,
    "availability": 480,
    "pricing_periods": [
      {
        "id": "uuid-period",
        "name": "Early Bird",
        "active": false
      },
      {
        "id": "uuid-period-2",
        "name": "Tarif Normal",
        "active": true
      }
    ]
  }
}
```

---

### PATCH /api/organizer/races/:raceId
Mettre à jour une épreuve.

---

### DELETE /api/organizer/races/:raceId
Supprimer une épreuve (uniquement si aucune inscription).

---

## 3. TARIFS

### POST /api/organizer/races/:raceId/pricing
Créer une grille tarifaire complète.

**Request Body:**
```json
{
  "periods": [
    {
      "name": "Early Bird",
      "start_date": "2025-01-01T00:00:00Z",
      "end_date": "2025-03-31T23:59:59Z",
      "pricing": [
        {
          "license_type_code": "FFA",
          "price_cents": 1500,
          "max_registrations": 200
        },
        {
          "license_type_code": "NON_LIC",
          "price_cents": 2000,
          "max_registrations": 100,
          "license_valid_until": "2025-05-01"
        }
      ]
    },
    {
      "name": "Tarif Normal",
      "start_date": "2025-04-01T00:00:00Z",
      "end_date": "2025-06-14T23:59:59Z",
      "pricing": [
        {
          "license_type_code": "FFA",
          "price_cents": 2000
        },
        {
          "license_type_code": "NON_LIC",
          "price_cents": 2500
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tarification créée avec succès",
  "data": {
    "periods_created": 2,
    "pricing_entries_created": 4
  }
}
```

---

### GET /api/organizer/races/:raceId/pricing
Récupérer toute la grille tarifaire d'une épreuve.

---

### PATCH /api/organizer/pricing/:pricingId
Mettre à jour un tarif spécifique.

**Request Body:**
```json
{
  "price_cents": 1800,
  "max_registrations": 250
}
```

---

## 4. INVITATIONS

### POST /api/organizer/events/:eventId/invitations
Créer une ou plusieurs invitations.

**Request Body:**
```json
{
  "invitations": [
    {
      "invited_email": "partenaire@example.com",
      "invited_name": "Jean Dupont",
      "invitation_type": "partner",
      "race_id": "uuid-race",
      "valid_until": "2025-06-14T23:59:59Z",
      "notes": "Partenaire principal"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-invitation",
      "invitation_code": "INV-TRAIL2025-A7B9C3",
      "invited_email": "partenaire@example.com",
      "invitation_link": "https://timepulse.fr/register/INV-TRAIL2025-A7B9C3"
    }
  ]
}
```

---

### GET /api/organizer/events/:eventId/invitations
Récupérer toutes les invitations d'un événement.

**Query Parameters:**
- `status`: `sent`, `used`, `expired`, `revoked`
- `type`: `partner`, `volunteer`, `vip`, `press`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-invitation",
      "invitation_code": "INV-TRAIL2025-A7B9C3",
      "invited_name": "Jean Dupont",
      "invited_email": "partenaire@example.com",
      "status": "used",
      "used_at": "2025-02-10T15:30:00Z"
    }
  ]
}
```

---

### PATCH /api/organizer/invitations/:invitationId/revoke
Révoquer une invitation.

**Response:**
```json
{
  "success": true,
  "message": "Invitation révoquée"
}
```

---

## 5. CODES PROMOTIONNELS

### POST /api/organizer/events/:eventId/promo-codes
Créer un code promotionnel.

**Request Body:**
```json
{
  "code": "EARLY2025",
  "description": "Réduction Early Bird",
  "discount_type": "percentage",
  "discount_value": 15,
  "usage_type": "unlimited",
  "valid_from": "2025-01-01T00:00:00Z",
  "valid_until": "2025-03-31T23:59:59Z",
  "race_id": null,
  "license_type_id": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-promo",
    "code": "EARLY2025",
    "active": true
  }
}
```

---

### GET /api/organizer/events/:eventId/promo-codes
Récupérer tous les codes promotionnels.

---

### PATCH /api/organizer/promo-codes/:promoCodeId
Mettre à jour un code.

---

### POST /api/organizer/promo-codes/:promoCodeId/deactivate
Désactiver un code promotionnel.

---

### GET /api/organizer/promo-codes/:promoCodeId/stats
Statistiques d'utilisation d'un code.

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "EARLY2025",
    "current_uses": 145,
    "max_uses": null,
    "total_discount_cents": 43500,
    "usage_by_race": [
      {
        "race_name": "10 km",
        "uses": 89
      },
      {
        "race_name": "Trail 25 km",
        "uses": 56
      }
    ]
  }
}
```

---

## 6. DOSSARDS

### POST /api/organizer/events/:eventId/bib-config
Configurer la numérotation des dossards.

**Request Body:**
```json
{
  "auto_assign": true,
  "range_start": 1,
  "range_end": 5000,
  "assignment_strategy": "by_gender",
  "male_range_start": 1,
  "male_range_end": 3000,
  "female_range_start": 3001,
  "female_range_end": 5000,
  "lock_date": "2025-06-10T00:00:00Z"
}
```

---

### POST /api/organizer/events/:eventId/assign-bibs
Lancer l'attribution automatique des dossards.

**Response:**
```json
{
  "success": true,
  "message": "Attribution des dossards effectuée",
  "data": {
    "assigned_count": 450,
    "failed_count": 0
  }
}
```

---

### PATCH /api/organizer/registrations/:registrationId/bib
Modifier manuellement un numéro de dossard.

**Request Body:**
```json
{
  "bib_number": 1234
}
```

**Validation:**
- Vérifie que la date de verrouillage n'est pas dépassée
- Vérifie que le numéro n'est pas déjà attribué

---

### POST /api/admin/events/:eventId/lock-bibs
**Admin uniquement** - Verrouiller l'édition des dossards.

**Response:**
```json
{
  "success": true,
  "message": "Numérotation verrouillée",
  "locked_at": "2025-06-10T00:00:00Z"
}
```

---

## 7. INSCRIPTIONS

### GET /api/organizer/events/:eventId/registrations
Récupérer toutes les inscriptions d'un événement.

**Query Parameters:**
- `race_id`: Filtrer par épreuve
- `status`: `pending`, `confirmed`, `cancelled`, `waitlist`
- `search`: Recherche par nom/email
- `page`, `limit`: Pagination

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-registration",
      "participant_first_name": "Marie",
      "participant_last_name": "Martin",
      "participant_email": "marie.martin@example.com",
      "race_name": "Trail 25 km",
      "bib_number": 1234,
      "registration_status": "confirmed",
      "payment_status": "paid",
      "amount_paid_cents": 2000,
      "registered_at": "2025-02-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 450
  }
}
```

---

### GET /api/organizer/registrations/:registrationId
Détail d'une inscription.

---

### GET /api/organizer/events/:eventId/registrations/export
Exporter les inscriptions en CSV/Excel.

**Query Parameters:**
- `format`: `csv`, `xlsx`
- `race_id`: Optionnel

**Response:** Fichier téléchargeable

---

## 8. STATISTIQUES

### GET /api/organizer/events/:eventId/stats
Statistiques en temps réel d'un événement.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_registrations": 450,
    "confirmed": 420,
    "pending": 30,
    "cancelled": 10,
    "total_revenue_cents": 67500,
    "by_race": [
      {
        "race_name": "10 km",
        "registrations": 200,
        "max_participants": 500,
        "fill_rate": 40
      }
    ],
    "by_license": [
      {
        "license_name": "FFA",
        "count": 280
      },
      {
        "license_name": "Non licencié",
        "count": 140
      }
    ],
    "registrations_timeline": [
      {
        "date": "2025-01-15",
        "count": 45
      }
    ]
  }
}
```

---

## 9. AUDIT LOGS

### GET /api/organizer/events/:eventId/audit-logs
Récupérer l'historique des actions.

**Query Parameters:**
- `entity_type`: `event`, `race`, `pricing`, `invitation`, `promo_code`, `bib_config`
- `action`: `created`, `updated`, `deleted`
- `start_date`, `end_date`: Période

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-log",
      "entity_type": "race",
      "entity_id": "uuid-race",
      "action": "updated",
      "actor_email": "org@example.com",
      "changes": {
        "max_participants": {
          "old": 800,
          "new": 1000
        }
      },
      "created_at": "2025-02-10T14:30:00Z"
    }
  ]
}
```

---

## VALIDATION ET ERREURS

### Codes d'erreur standards:
- `400` - Bad Request (validation échouée)
- `401` - Unauthorized (non authentifié)
- `403` - Forbidden (pas le propriétaire)
- `404` - Not Found
- `409` - Conflict (contrainte métier violée)
- `422` - Unprocessable Entity (règles métier)
- `500` - Internal Server Error

### Format d'erreur:
```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Le nombre maximum de participants est atteint",
    "details": {
      "current": 800,
      "max": 800
    }
  }
}
```
