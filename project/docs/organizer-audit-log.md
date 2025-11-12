# Module Organisateur - Système d'Audit Log

## OBJECTIF

Tracer toutes les actions importantes effectuées sur la plateforme pour :
- Assurer la traçabilité complète
- Résoudre les litiges
- Analyser les comportements
- Garantir la conformité (RGPD, comptabilité)
- Détecter les anomalies

---

## SCHÉMA DE LA TABLE

```sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,              -- Type d'entité modifiée
  entity_id uuid NOT NULL,                -- ID de l'entité
  action text NOT NULL,                   -- Action effectuée
  actor_type text NOT NULL,               -- Qui a fait l'action
  actor_id uuid NOT NULL,                 -- ID de l'acteur
  actor_email text,                       -- Email pour lisibilité
  changes jsonb,                          -- Détails des changements
  ip_address inet,                        -- IP de l'acteur
  user_agent text,                        -- Navigateur/client
  created_at timestamptz DEFAULT now()    -- Quand
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

---

## TYPES D'ENTITÉS (entity_type)

| Entity Type | Description |
|-------------|-------------|
| `organizer` | Compte organisateur |
| `event` | Événement |
| `race` | Épreuve |
| `pricing_period` | Période tarifaire |
| `race_pricing` | Tarif |
| `invitation` | Invitation |
| `promo_code` | Code promo |
| `bib_number_config` | Config dossards |
| `registration` | Inscription |
| `payment` | Paiement |

---

## TYPES D'ACTIONS (action)

| Action | Description |
|--------|-------------|
| `created` | Création d'une entité |
| `updated` | Modification d'une entité |
| `deleted` | Suppression d'une entité |
| `published` | Publication (événement) |
| `opened` | Ouverture inscriptions |
| `closed` | Fermeture inscriptions |
| `used` | Utilisation (invitation, code promo) |
| `revoked` | Révocation (invitation) |
| `assigned` | Attribution (dossard) |
| `locked` | Verrouillage (dossards) |
| `cancelled` | Annulation (inscription) |
| `refunded` | Remboursement |
| `confirmed` | Confirmation (inscription, paiement) |
| `exported` | Export de données |

---

## TYPES D'ACTEURS (actor_type)

| Actor Type | Description |
|------------|-------------|
| `organizer` | Organisateur d'événement |
| `admin` | Admin Timepulse |
| `system` | Action automatique système |
| `participant` | Participant (inscription) |

---

## FORMAT DU CHAMP `changes`

Le champ `changes` contient un objet JSON avec les détails des modifications.

### Pour un UPDATE:
```json
{
  "before": {
    "max_participants": 800,
    "status": "open"
  },
  "after": {
    "max_participants": 1000,
    "status": "open"
  }
}
```

### Pour un CREATE:
```json
{
  "name": "Trail des Écrins 2025",
  "start_date": "2025-06-15",
  "status": "draft"
}
```

### Pour un DELETE:
```json
{
  "deleted_entity": {
    "name": "Épreuve supprimée",
    "id": "uuid-race"
  }
}
```

### Pour des actions spécifiques:
```json
{
  "invitation_code": "INV-TRAIL2025-A7B9C3",
  "used_by_email": "participant@example.com",
  "registration_id": "uuid-registration"
}
```

---

## EXEMPLES D'ÉVÉNEMENTS ORGANISATEUR

### 1. Création d'un événement

```json
{
  "entity_type": "event",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "created",
  "actor_type": "organizer",
  "actor_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "actor_email": "contact@trailecrins.fr",
  "changes": {
    "name": "Trail des Écrins 2025",
    "slug": "trail-ecrins-2025",
    "start_date": "2025-06-15",
    "end_date": "2025-06-15",
    "location_city": "Briançon",
    "status": "draft",
    "max_participants": 2000
  },
  "ip_address": "82.127.34.56",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-01-15T10:30:00Z"
}
```

---

### 2. Publication d'un événement

```json
{
  "entity_type": "event",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "published",
  "actor_type": "organizer",
  "actor_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "actor_email": "contact@trailecrins.fr",
  "changes": {
    "before": {
      "status": "draft"
    },
    "after": {
      "status": "published"
    }
  },
  "ip_address": "82.127.34.56",
  "created_at": "2025-01-20T14:00:00Z"
}
```

---

### 3. Création d'une épreuve

```json
{
  "entity_type": "race",
  "entity_id": "a3c8f0e2-1234-5678-9abc-def012345678",
  "action": "created",
  "actor_type": "organizer",
  "actor_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "actor_email": "contact@trailecrins.fr",
  "changes": {
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Trail 25 km",
    "slug": "trail-25km",
    "distance_km": 25.0,
    "elevation_gain_m": 1200,
    "race_date": "2025-06-15",
    "race_time": "10:00:00",
    "max_participants": 800,
    "status": "draft"
  },
  "ip_address": "82.127.34.56",
  "created_at": "2025-01-20T14:15:00Z"
}
```

---

### 4. Modification d'une jauge

```json
{
  "entity_type": "race",
  "entity_id": "a3c8f0e2-1234-5678-9abc-def012345678",
  "action": "updated",
  "actor_type": "organizer",
  "actor_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "actor_email": "contact@trailecrins.fr",
  "changes": {
    "before": {
      "max_participants": 800
    },
    "after": {
      "max_participants": 1000
    },
    "reason": "Augmentation de la capacité suite à forte demande"
  },
  "ip_address": "82.127.34.56",
  "created_at": "2025-02-10T11:20:00Z"
}
```

---

### 5. Création d'une période tarifaire

```json
{
  "entity_type": "pricing_period",
  "entity_id": "b2d9e1f3-5678-1234-abcd-ef0123456789",
  "action": "created",
  "actor_type": "organizer",
  "actor_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "actor_email": "contact@trailecrins.fr",
  "changes": {
    "race_id": "a3c8f0e2-1234-5678-9abc-def012345678",
    "name": "Early Bird",
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2025-03-31T23:59:59Z",
    "display_order": 1
  },
  "ip_address": "82.127.34.56",
  "created_at": "2025-01-20T14:30:00Z"
}
```

---

### 6. Création d'un tarif

```json
{
  "entity_type": "race_pricing",
  "entity_id": "c3e0f2g4-6789-2345-bcde-f01234567890",
  "action": "created",
  "actor_type": "organizer",
  "actor_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "actor_email": "contact@trailecrins.fr",
  "changes": {
    "race_id": "a3c8f0e2-1234-5678-9abc-def012345678",
    "pricing_period_id": "b2d9e1f3-5678-1234-abcd-ef0123456789",
    "license_type_code": "FFA",
    "price_cents": 1500,
    "max_registrations": 200
  },
  "ip_address": "82.127.34.56",
  "created_at": "2025-01-20T14:32:00Z"
}
```

---

### 7. Création d'une invitation

```json
{
  "entity_type": "invitation",
  "entity_id": "d4f1g3h5-7890-3456-cdef-012345678901",
  "action": "created",
  "actor_type": "organizer",
  "actor_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "actor_email": "contact@trailecrins.fr",
  "changes": {
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "race_id": "a3c8f0e2-1234-5678-9abc-def012345678",
    "invited_email": "partenaire@example.com",
    "invited_name": "Jean Dupont",
    "invitation_code": "INV-TRAIL2025-A7B9C3",
    "invitation_type": "partner",
    "valid_until": "2025-06-14T23:59:59Z"
  },
  "ip_address": "82.127.34.56",
  "created_at": "2025-02-05T09:15:00Z"
}
```

---

### 8. Utilisation d'une invitation

```json
{
  "entity_type": "invitation",
  "entity_id": "d4f1g3h5-7890-3456-cdef-012345678901",
  "action": "used",
  "actor_type": "participant",
  "actor_id": "e5g2h4i6-8901-4567-def0-123456789012",
  "actor_email": "partenaire@example.com",
  "changes": {
    "invitation_code": "INV-TRAIL2025-A7B9C3",
    "registration_id": "f6h3i5j7-9012-5678-ef01-234567890123",
    "before_status": "sent",
    "after_status": "used"
  },
  "ip_address": "91.168.12.45",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-02-10T15:30:00Z"
}
```

---

### 9. Révocation d'une invitation

```json
{
  "entity_type": "invitation",
  "entity_id": "d4f1g3h5-7890-3456-cdef-012345678901",
  "action": "revoked",
  "actor_type": "organizer",
  "actor_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "actor_email": "contact@trailecrins.fr",
  "changes": {
    "invitation_code": "INV-TRAIL2025-X9Y8Z7",
    "reason": "Partenariat annulé",
    "before_status": "sent",
    "after_status": "revoked"
  },
  "ip_address": "82.127.34.56",
  "created_at": "2025-03-01T16:45:00Z"
}
```

---

### 10. Création d'un code promo

```json
{
  "entity_type": "promo_code",
  "entity_id": "g7i4j6k8-0123-6789-f012-345678901234",
  "action": "created",
  "actor_type": "organizer",
  "actor_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "actor_email": "contact@trailecrins.fr",
  "changes": {
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "EARLY2025",
    "description": "Réduction Early Bird",
    "discount_type": "percentage",
    "discount_value": 15,
    "usage_type": "unlimited",
    "valid_from": "2025-01-01T00:00:00Z",
    "valid_until": "2025-03-31T23:59:59Z"
  },
  "ip_address": "82.127.34.56",
  "created_at": "2025-01-20T10:00:00Z"
}
```

---

### 11. Utilisation d'un code promo

```json
{
  "entity_type": "promo_code",
  "entity_id": "g7i4j6k8-0123-6789-f012-345678901234",
  "action": "used",
  "actor_type": "participant",
  "actor_id": "h8j5k7l9-1234-7890-0123-456789012345",
  "actor_email": "participant@example.com",
  "changes": {
    "code": "EARLY2025",
    "registration_id": "i9k6l8m0-2345-8901-1234-567890123456",
    "discount_applied_cents": 300,
    "original_price_cents": 2000,
    "final_price_cents": 1700,
    "current_uses_before": 144,
    "current_uses_after": 145
  },
  "ip_address": "93.172.88.12",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-02-15T13:22:00Z"
}
```

---

### 12. Configuration des dossards

```json
{
  "entity_type": "bib_number_config",
  "entity_id": "j0l7m9n1-3456-9012-2345-678901234567",
  "action": "created",
  "actor_type": "organizer",
  "actor_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "actor_email": "contact@trailecrins.fr",
  "changes": {
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "auto_assign": true,
    "range_start": 1,
    "range_end": 5000,
    "assignment_strategy": "by_gender",
    "male_range_start": 1,
    "male_range_end": 3000,
    "female_range_start": 3001,
    "female_range_end": 5000,
    "lock_date": "2025-06-10T00:00:00Z"
  },
  "ip_address": "82.127.34.56",
  "created_at": "2025-03-01T10:00:00Z"
}
```

---

### 13. Attribution d'un dossard

```json
{
  "entity_type": "registration",
  "entity_id": "k1m8n0o2-4567-0123-3456-789012345678",
  "action": "assigned",
  "actor_type": "system",
  "actor_id": "00000000-0000-0000-0000-000000000000",
  "actor_email": "system@timepulse.fr",
  "changes": {
    "registration_id": "k1m8n0o2-4567-0123-3456-789012345678",
    "participant_name": "Marie Martin",
    "participant_gender": "female",
    "bib_number": 3045,
    "assignment_strategy": "by_gender"
  },
  "ip_address": null,
  "created_at": "2025-03-05T08:30:00Z"
}
```

---

### 14. Modification manuelle d'un dossard

```json
{
  "entity_type": "registration",
  "entity_id": "k1m8n0o2-4567-0123-3456-789012345678",
  "action": "updated",
  "actor_type": "organizer",
  "actor_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "actor_email": "contact@trailecrins.fr",
  "changes": {
    "registration_id": "k1m8n0o2-4567-0123-3456-789012345678",
    "participant_name": "Marie Martin",
    "before": {
      "bib_number": 3045
    },
    "after": {
      "bib_number": 3100
    },
    "reason": "Échange avec un autre participant"
  },
  "ip_address": "82.127.34.56",
  "created_at": "2025-03-08T14:20:00Z"
}
```

---

### 15. Verrouillage des dossards (Admin Timepulse)

```json
{
  "entity_type": "bib_number_config",
  "entity_id": "j0l7m9n1-3456-9012-2345-678901234567",
  "action": "locked",
  "actor_type": "admin",
  "actor_id": "l2n9o1p3-5678-1234-4567-890123456789",
  "actor_email": "admin@timepulse.fr",
  "changes": {
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_name": "Trail des Écrins 2025",
    "locked_at": "2025-06-10T00:00:00Z",
    "locked_by": "l2n9o1p3-5678-1234-4567-890123456789",
    "reason": "Verrouillage automatique selon date configurée"
  },
  "ip_address": "10.0.1.50",
  "created_at": "2025-06-10T00:00:01Z"
}
```

---

### 16. Export de données

```json
{
  "entity_type": "event",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "exported",
  "actor_type": "organizer",
  "actor_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "actor_email": "contact@trailecrins.fr",
  "changes": {
    "export_type": "registrations",
    "format": "csv",
    "race_id": "a3c8f0e2-1234-5678-9abc-def012345678",
    "race_name": "Trail 25 km",
    "records_count": 180,
    "filters": {
      "status": "confirmed"
    }
  },
  "ip_address": "82.127.34.56",
  "created_at": "2025-03-15T16:00:00Z"
}
```

---

## FONCTION D'AUDIT GÉNÉRIQUE

```typescript
interface AuditLogParams {
  entity_type: string;
  entity_id: string;
  action: string;
  actor_type: 'organizer' | 'admin' | 'system' | 'participant';
  actor_id: string;
  actor_email?: string;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
}

async function createAuditLog(params: AuditLogParams) {
  await db.auditLogs.create({
    data: {
      id: uuid(),
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      action: params.action,
      actor_type: params.actor_type,
      actor_id: params.actor_id,
      actor_email: params.actor_email,
      changes: params.changes,
      ip_address: params.ip_address,
      user_agent: params.user_agent,
      created_at: new Date()
    }
  });
}
```

---

## INTÉGRATION DANS LES ENDPOINTS

### Exemple: Création d'un événement

```typescript
async function createEvent(organizerId: string, data: EventCreateInput) {
  const event = await db.events.create({
    data: {
      organizer_id: organizerId,
      ...data
    }
  });

  // Log audit
  await createAuditLog({
    entity_type: 'event',
    entity_id: event.id,
    action: 'created',
    actor_type: 'organizer',
    actor_id: organizerId,
    actor_email: getCurrentUserEmail(),
    changes: data,
    ip_address: getRequestIp(),
    user_agent: getUserAgent()
  });

  return event;
}
```

### Exemple: Modification d'un tarif

```typescript
async function updateRacePricing(pricingId: string, updates: Partial<RacePricing>) {
  const before = await db.racePricing.findUnique({
    where: { id: pricingId }
  });

  const after = await db.racePricing.update({
    where: { id: pricingId },
    data: updates
  });

  // Log audit
  await createAuditLog({
    entity_type: 'race_pricing',
    entity_id: pricingId,
    action: 'updated',
    actor_type: 'organizer',
    actor_id: getCurrentOrganizerId(),
    actor_email: getCurrentUserEmail(),
    changes: {
      before: {
        price_cents: before.price_cents,
        max_registrations: before.max_registrations
      },
      after: {
        price_cents: after.price_cents,
        max_registrations: after.max_registrations
      }
    },
    ip_address: getRequestIp(),
    user_agent: getUserAgent()
  });

  return after;
}
```

---

## CONSULTATION DES LOGS

### Vue organisateur

L'organisateur peut consulter tous les logs liés à ses événements :

```typescript
async function getEventAuditLogs(eventId: string, filters: {
  entity_type?: string;
  action?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
}) {
  const logs = await db.auditLogs.findMany({
    where: {
      OR: [
        { entity_type: 'event', entity_id: eventId },
        {
          entity_type: 'race',
          entity_id: {
            in: await getRaceIdsByEvent(eventId)
          }
        },
        // Autres entités liées...
      ],
      ...(filters.entity_type && { entity_type: filters.entity_type }),
      ...(filters.action && { action: filters.action }),
      ...(filters.start_date && { created_at: { gte: filters.start_date } }),
      ...(filters.end_date && { created_at: { lte: filters.end_date } })
    },
    orderBy: { created_at: 'desc' },
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit
  });

  return logs;
}
```

---

## RÉTENTION ET ARCHIVAGE

### Politique recommandée:

1. **Logs actifs (< 1 an):**
   - Stockés dans la table principale
   - Requêtes rapides
   - Accessibles en temps réel

2. **Logs archivés (1-3 ans):**
   - Déplacés vers table d'archive
   - Consultation sur demande
   - Compression possible

3. **Logs historiques (> 3 ans):**
   - Export vers stockage froid (S3, etc.)
   - Conservation légale uniquement
   - Consultation exceptionnelle

### Script d'archivage automatique:

```sql
-- Archiver les logs de plus d'un an
INSERT INTO audit_logs_archive
SELECT * FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year';
```

---

## SÉCURITÉ ET CONFORMITÉ

### Règles strictes:

1. **Immutabilité:** Les logs ne peuvent JAMAIS être modifiés ou supprimés (sauf archivage automatisé)
2. **Intégrité:** Checksum/signature pour vérifier l'intégrité
3. **Accès restreint:** Seuls les super admins peuvent voir tous les logs
4. **Anonymisation:** Pas de données sensibles (mots de passe, cartes bancaires)
5. **RGPD:** Possibilité de pseudonymiser les logs lors des demandes d'effacement

---

## ALERTES BASÉES SUR LES LOGS

### Événements à surveiller:

1. **Modifications suspectes:**
   - Changement de jauge juste avant fermeture
   - Modification massive de dossards
   - Création de nombreux codes promo en peu de temps

2. **Activité anormale:**
   - Connexions depuis IP inhabituelles
   - Actions en dehors des heures normales
   - Suppression en masse

3. **Conformité:**
   - Tentative de modification après verrouillage
   - Accès non autorisé à des données

### Système d'alerte:

```typescript
async function detectAnomalies() {
  // Exemple: Détection de modifications de dossards après verrouillage
  const suspiciousLogs = await db.auditLogs.findMany({
    where: {
      entity_type: 'registration',
      action: 'updated',
      actor_type: 'organizer',
      changes: {
        path: ['bib_number'],
        not: undefined
      },
      created_at: {
        gte: await getEventLockDate()
      }
    }
  });

  if (suspiciousLogs.length > 0) {
    await sendAlertToTimepulse({
      type: 'suspicious_bib_modification',
      logs: suspiciousLogs
    });
  }
}
```

---

## RAPPORTS D'AUDIT

### Rapport mensuel organisateur:

```typescript
async function generateMonthlyReport(organizerId: string, month: Date) {
  const logs = await getOrganizerLogs(organizerId, month);

  const report = {
    period: month,
    total_actions: logs.length,
    by_entity_type: groupBy(logs, 'entity_type'),
    by_action: groupBy(logs, 'action'),
    events_created: logs.filter(l => l.entity_type === 'event' && l.action === 'created').length,
    registrations_confirmed: logs.filter(l => l.entity_type === 'registration' && l.action === 'confirmed').length,
    // ... autres métriques
  };

  return report;
}
```

---

## RÉCAPITULATIF

Le système d'audit log de Timepulse offre :

✅ **Traçabilité complète** de toutes les actions
✅ **Transparence** pour les organisateurs
✅ **Sécurité** et détection d'anomalies
✅ **Conformité** RGPD et légale
✅ **Résolution** rapide des litiges
✅ **Analyse** des comportements utilisateurs
