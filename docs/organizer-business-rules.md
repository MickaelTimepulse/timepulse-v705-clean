# Module Organisateur - Règles Métiers et Validations

## 1. GESTION DES ÉVÉNEMENTS

### Règle E1: Dates cohérentes
**Description:** La date de fin doit être >= date de début

**Validation:**
```typescript
if (event.end_date < event.start_date) {
  throw new ValidationError('La date de fin doit être postérieure ou égale à la date de début');
}
```

---

### Règle E2: Dates d'inscription cohérentes
**Description:** Les inscriptions doivent ouvrir avant la date de l'événement

**Validation:**
```typescript
if (event.registration_close_date >= event.start_date) {
  throw new ValidationError('Les inscriptions doivent fermer avant le début de l\'événement');
}

if (event.registration_open_date >= event.registration_close_date) {
  throw new ValidationError('La date d\'ouverture doit être avant la date de fermeture');
}
```

---

### Règle E3: Slug unique
**Description:** Le slug doit être unique globalement

**Validation:**
```typescript
const existing = await db.events.findFirst({
  where: { slug: event.slug }
});

if (existing && existing.id !== event.id) {
  throw new ValidationError('Ce slug est déjà utilisé');
}
```

---

### Règle E4: Modification après publication
**Description:** Certains champs ne peuvent plus être modifiés après publication

**Champs verrouillés après status = 'published':**
- `slug`
- `organizer_id`
- `start_date` (peut être reporté uniquement)

**Validation:**
```typescript
if (event.status === 'published' && changes.includes('slug')) {
  throw new ValidationError('Le slug ne peut pas être modifié après publication');
}
```

---

## 2. GESTION DES ÉPREUVES

### Règle R1: Date dans la fenêtre de l'événement
**Description:** La date d'une épreuve doit être entre start_date et end_date de l'événement

**Validation:**
```typescript
if (race.race_date < event.start_date || race.race_date > event.end_date) {
  throw new ValidationError('La date de l\'épreuve doit être dans la période de l\'événement');
}
```

---

### Règle R2: Slug unique par événement
**Description:** Le slug d'une épreuve doit être unique au sein d'un événement

**Contrainte DB:**
```sql
UNIQUE(event_id, slug)
```

---

### Règle R3: Jauge minimale
**Description:** max_participants doit être >= nombre d'inscrits confirmés

**Validation:**
```typescript
const confirmedCount = await db.registrations.count({
  where: {
    race_id: race.id,
    registration_status: 'confirmed'
  }
});

if (newMaxParticipants < confirmedCount) {
  throw new ValidationError(
    `Impossible de réduire la jauge : ${confirmedCount} participants déjà confirmés`
  );
}
```

---

### Règle R4: Épreuve complète
**Description:** Passer automatiquement au status 'full' quand max atteint

**Logique:**
```typescript
const confirmedCount = await getConfirmedCount(race.id);

if (confirmedCount >= race.max_participants) {
  await db.races.update({
    where: { id: race.id },
    data: { status: 'full' }
  });
}
```

---

### Règle R5: Suppression impossible si inscriptions
**Description:** Une épreuve ne peut être supprimée si elle a des inscriptions

**Validation:**
```typescript
const registrationsCount = await db.registrations.count({
  where: { race_id: race.id }
});

if (registrationsCount > 0) {
  throw new ValidationError(
    `Impossible de supprimer l'épreuve : ${registrationsCount} inscription(s) existante(s)`
  );
}
```

---

## 3. TARIFS

### Règle T1: Périodes non chevauchantes
**Description:** Les périodes tarifaires d'une même épreuve ne peuvent pas se chevaucher

**Validation:**
```typescript
const overlapping = await db.pricingPeriods.findFirst({
  where: {
    race_id: period.race_id,
    id: { not: period.id },
    OR: [
      {
        start_date: { lte: period.end_date },
        end_date: { gte: period.start_date }
      }
    ]
  }
});

if (overlapping) {
  throw new ValidationError(
    `Cette période chevauche "${overlapping.name}"`
  );
}
```

---

### Règle T2: Tarif unique par combinaison
**Description:** Un seul tarif par (race, période, type de licence)

**Contrainte DB:**
```sql
UNIQUE(race_id, pricing_period_id, license_type_id)
```

---

### Règle T3: Prix >= 0
**Description:** Le prix ne peut jamais être négatif

**Contrainte DB:**
```sql
CHECK (price_cents >= 0)
```

---

### Règle T4: Quotas par licence
**Description:** Vérifier que les quotas de licences ne sont pas dépassés

**Validation:**
```typescript
const licensedCount = await db.registrations.count({
  where: {
    race_id: pricing.race_id,
    license_type_id: pricing.license_type_id,
    registration_status: 'confirmed'
  }
});

if (pricing.max_registrations && licensedCount >= pricing.max_registrations) {
  throw new ValidationError(
    `Quota atteint pour cette licence (${licensedCount}/${pricing.max_registrations})`
  );
}
```

---

### Règle T5: Date limite licence
**Description:** Bloquer les inscriptions si license_valid_until est dépassée

**Validation:**
```typescript
if (pricing.license_valid_until && now() > pricing.license_valid_until) {
  throw new ValidationError(
    `Les inscriptions pour ce type de licence sont fermées depuis le ${pricing.license_valid_until}`
  );
}
```

---

### Règle T6: Modification des tarifs
**Description:** Impossible de modifier un tarif si déjà utilisé par des inscriptions

**Validation:**
```typescript
const usedCount = await db.registrations.count({
  where: {
    race_id: pricing.race_id,
    // Filtrer sur période active au moment de l'inscription
  }
});

if (usedCount > 0) {
  throw new ValidationError(
    'Ce tarif ne peut être modifié car des inscriptions l\'utilisent déjà'
  );
}
```

---

## 4. INVITATIONS

### Règle I1: Email unique par événement
**Description:** Un email ne peut recevoir qu'une seule invitation active par événement

**Validation:**
```typescript
const existing = await db.invitations.findFirst({
  where: {
    event_id: invitation.event_id,
    invited_email: invitation.invited_email,
    status: { in: ['sent', 'used'] }
  }
});

if (existing) {
  throw new ValidationError('Cet email a déjà une invitation active');
}
```

---

### Règle I2: Code unique
**Description:** Le code d'invitation doit être unique globalement

**Génération automatique:**
```typescript
function generateInvitationCode(eventSlug: string): string {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${eventSlug.toUpperCase()}-${random}`;
}
```

---

### Règle I3: Validation temporelle
**Description:** Une invitation expirée ne peut plus être utilisée

**Validation:**
```typescript
if (invitation.valid_until && now() > invitation.valid_until) {
  throw new ValidationError('Cette invitation a expiré');
}

if (invitation.status !== 'sent') {
  throw new ValidationError(`Cette invitation est ${invitation.status}`);
}
```

---

### Règle I4: Utilisation unique
**Description:** Une invitation ne peut être utilisée qu'une seule fois

**Validation:**
```typescript
if (invitation.status === 'used') {
  throw new ValidationError(
    `Cette invitation a déjà été utilisée le ${invitation.used_at}`
  );
}
```

---

### Règle I5: Révocation
**Description:** Une invitation peut être révoquée tant qu'elle n'est pas utilisée

**Validation:**
```typescript
if (invitation.status === 'used') {
  throw new ValidationError('Impossible de révoquer une invitation déjà utilisée');
}

await db.invitations.update({
  where: { id: invitation.id },
  data: { status: 'revoked' }
});
```

---

## 5. CODES PROMOTIONNELS

### Règle P1: Code unique
**Description:** Le code doit être unique globalement

**Validation:**
```typescript
const existing = await db.promoCodes.findFirst({
  where: { code: promoCode.code.toUpperCase() }
});

if (existing) {
  throw new ValidationError('Ce code existe déjà');
}
```

---

### Règle P2: Dates cohérentes
**Description:** valid_until > valid_from

**Contrainte DB:**
```sql
CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from)
```

---

### Règle P3: Limite d'utilisation
**Description:** Respecter max_uses selon usage_type

**Validation:**
```typescript
if (promoCode.usage_type === 'single' && promoCode.current_uses >= 1) {
  throw new ValidationError('Ce code a déjà été utilisé');
}

if (promoCode.usage_type === 'multiple' && promoCode.current_uses >= promoCode.max_uses) {
  throw new ValidationError('Ce code a atteint sa limite d\'utilisation');
}
```

---

### Règle P4: Validation temporelle
**Description:** Le code doit être dans sa période de validité

**Validation:**
```typescript
const now = new Date();

if (promoCode.valid_from && now < promoCode.valid_from) {
  throw new ValidationError('Ce code n\'est pas encore valide');
}

if (promoCode.valid_until && now > promoCode.valid_until) {
  throw new ValidationError('Ce code a expiré');
}
```

---

### Règle P5: Épreuve ouverte
**Description:** Le code ne fonctionne pas si l'épreuve est fermée ou complète

**Validation:**
```typescript
if (promoCode.race_id) {
  const race = await db.races.findUnique({
    where: { id: promoCode.race_id }
  });

  if (race.status === 'full') {
    throw new ValidationError('L\'épreuve est complète');
  }

  if (race.status === 'closed') {
    throw new ValidationError('Les inscriptions sont fermées');
  }
}
```

---

### Règle P6: Calcul de réduction
**Description:** Appliquer correctement la réduction

**Logique:**
```typescript
function applyDiscount(price: number, promoCode: PromoCode): number {
  if (promoCode.discount_type === 'percentage') {
    return Math.max(0, price - (price * promoCode.discount_value / 100));
  }

  if (promoCode.discount_type === 'fixed_amount') {
    return Math.max(0, price - promoCode.discount_value);
  }

  return price;
}
```

---

### Règle P7: Prix minimum
**Description:** Le prix après réduction ne peut être < min_price_cents

**Validation:**
```typescript
const discountedPrice = applyDiscount(originalPrice, promoCode);

if (discountedPrice < promoCode.min_price_cents) {
  throw new ValidationError(
    `Le prix minimum après réduction est de ${promoCode.min_price_cents / 100}€`
  );
}
```

---

## 6. DOSSARDS

### Règle B1: Numéro unique par événement
**Description:** Un dossard ne peut être attribué qu'à un seul participant par événement

**Validation:**
```typescript
const existing = await db.registrations.findFirst({
  where: {
    event_id: registration.event_id,
    bib_number: bibNumber,
    registration_status: { not: 'cancelled' }
  }
});

if (existing) {
  throw new ValidationError(`Le dossard ${bibNumber} est déjà attribué`);
}
```

---

### Règle B2: Plage valide
**Description:** Le numéro doit être dans la plage configurée

**Validation:**
```typescript
const config = await db.bibNumberConfig.findUnique({
  where: { event_id: event.id }
});

if (bibNumber < config.range_start || bibNumber > config.range_end) {
  throw new ValidationError(
    `Le dossard doit être entre ${config.range_start} et ${config.range_end}`
  );
}
```

---

### Règle B3: Attribution par genre
**Description:** Respecter les plages homme/femme si configuré

**Validation:**
```typescript
if (config.assignment_strategy === 'by_gender') {
  if (registration.participant_gender === 'male') {
    if (bibNumber < config.male_range_start || bibNumber > config.male_range_end) {
      throw new ValidationError(
        `Pour un homme, le dossard doit être entre ${config.male_range_start} et ${config.male_range_end}`
      );
    }
  }

  if (registration.participant_gender === 'female') {
    if (bibNumber < config.female_range_start || bibNumber > config.female_range_end) {
      throw new ValidationError(
        `Pour une femme, le dossard doit être entre ${config.female_range_start} et ${config.female_range_end}`
      );
    }
  }
}
```

---

### Règle B4: Attribution automatique
**Description:** Attribution séquentielle selon stratégie

**Logique:**
```typescript
async function getNextBibNumber(eventId: string, gender: string): Promise<number> {
  const config = await db.bibNumberConfig.findUnique({
    where: { event_id: eventId }
  });

  if (!config.auto_assign) {
    return null;
  }

  let rangeStart = config.range_start;
  let rangeEnd = config.range_end;

  if (config.assignment_strategy === 'by_gender') {
    if (gender === 'male') {
      rangeStart = config.male_range_start;
      rangeEnd = config.male_range_end;
    } else if (gender === 'female') {
      rangeStart = config.female_range_start;
      rangeEnd = config.female_range_end;
    }
  }

  const usedBibs = await db.registrations.findMany({
    where: {
      event_id: eventId,
      bib_number: {
        gte: rangeStart,
        lte: rangeEnd
      },
      registration_status: { not: 'cancelled' }
    },
    select: { bib_number: true },
    orderBy: { bib_number: 'asc' }
  });

  const usedSet = new Set(usedBibs.map(r => r.bib_number));

  for (let num = rangeStart; num <= rangeEnd; num++) {
    if (!usedSet.has(num)) {
      return num;
    }
  }

  throw new ValidationError('Plus de dossards disponibles dans cette plage');
}
```

---

### Règle B5: Verrouillage temporel
**Description:** Après lock_date, seul un super admin peut modifier

**Validation:**
```typescript
const config = await db.bibNumberConfig.findUnique({
  where: { event_id: event.id }
});

if (config.locked_at && user.role !== 'super_admin') {
  throw new ForbiddenError(
    `La numérotation a été verrouillée le ${config.locked_at}. Contactez Timepulse.`
  );
}

if (config.lock_date && now() >= config.lock_date && user.role !== 'super_admin') {
  throw new ForbiddenError(
    'La date de verrouillage est dépassée. Seul Timepulse peut modifier les dossards.'
  );
}
```

---

### Règle B6: Verrouillage manuel
**Description:** Un admin peut verrouiller manuellement avant lock_date

**Logique:**
```typescript
async function lockBibEdits(eventId: string, adminId: string) {
  await db.bibNumberConfig.update({
    where: { event_id: eventId },
    data: {
      locked_at: new Date(),
      locked_by: adminId
    }
  });

  await logAudit({
    entity_type: 'bib_number_config',
    entity_id: eventId,
    action: 'locked',
    actor_type: 'admin',
    actor_id: adminId
  });
}
```

---

## 7. INSCRIPTIONS

### Règle REG1: Âge minimum
**Description:** Le participant doit avoir l'âge minimum requis le jour de la course

**Validation:**
```typescript
const age = calculateAge(registration.participant_birth_date, race.race_date);

if (age < race.min_age) {
  throw new ValidationError(
    `L'âge minimum est de ${race.min_age} ans. Participant : ${age} ans.`
  );
}

if (race.max_age && age > race.max_age) {
  throw new ValidationError(
    `L'âge maximum est de ${race.max_age} ans. Participant : ${age} ans.`
  );
}
```

---

### Règle REG2: Jauge respectée
**Description:** Ne pas dépasser max_participants

**Validation:**
```typescript
const confirmedCount = await db.registrations.count({
  where: {
    race_id: race.id,
    registration_status: 'confirmed'
  }
});

if (race.max_participants && confirmedCount >= race.max_participants) {
  throw new ValidationError('L\'épreuve est complète');
}
```

---

### Règle REG3: Jauge globale événement
**Description:** Respecter max_participants de l'événement

**Validation:**
```typescript
const eventTotalConfirmed = await db.registrations.count({
  where: {
    event_id: event.id,
    registration_status: 'confirmed'
  }
});

if (event.max_participants && eventTotalConfirmed >= event.max_participants) {
  throw new ValidationError('L\'événement a atteint sa capacité maximale');
}
```

---

### Règle REG4: Doublon
**Description:** Un participant ne peut s'inscrire qu'une fois par épreuve

**Validation:**
```typescript
const existing = await db.registrations.findFirst({
  where: {
    race_id: registration.race_id,
    participant_email: registration.participant_email,
    registration_status: { not: 'cancelled' }
  }
});

if (existing) {
  throw new ValidationError('Vous êtes déjà inscrit à cette épreuve');
}
```

---

### Règle REG5: Licence valide
**Description:** Vérifier que la licence est valide si nécessaire

**Validation:**
```typescript
if (licenseType.code !== 'NON_LIC' && !registration.license_number) {
  throw new ValidationError('Le numéro de licence est obligatoire');
}

if (registration.license_expiry_date && registration.license_expiry_date < race.race_date) {
  throw new ValidationError('La licence sera expirée le jour de la course');
}
```

---

### Règle REG6: Certificat médical
**Description:** Informer si un certificat est requis

**Validation:**
```typescript
if (race.requires_medical_certificate && licenseType.code === 'NON_LIC') {
  // Avertissement (non bloquant) lors de l'inscription
  warnings.push('Un certificat médical sera exigé le jour de la course');
}
```

---

### Règle REG7: Calcul du prix
**Description:** Appliquer le bon tarif selon période active et licence

**Logique:**
```typescript
async function calculatePrice(raceId: string, licenseTypeId: string): Promise<number> {
  const now = new Date();

  const activePeriod = await db.pricingPeriods.findFirst({
    where: {
      race_id: raceId,
      active: true,
      start_date: { lte: now },
      end_date: { gte: now }
    }
  });

  if (!activePeriod) {
    throw new ValidationError('Aucune période tarifaire active');
  }

  const pricing = await db.racePricing.findUnique({
    where: {
      race_id_pricing_period_id_license_type_id: {
        race_id: raceId,
        pricing_period_id: activePeriod.id,
        license_type_id: licenseTypeId
      }
    }
  });

  if (!pricing || !pricing.active) {
    throw new ValidationError('Tarif non disponible pour cette combinaison');
  }

  return pricing.price_cents;
}
```

---

## 8. AUDIT LOGS

### Règle A1: Log automatique
**Description:** Toute modification importante doit être tracée

**Actions à logger:**
- CREATE, UPDATE, DELETE sur: events, races, pricing, invitations, promo_codes, bib_config
- Utilisation d'une invitation
- Utilisation d'un code promo
- Attribution/modification d'un dossard
- Verrouillage dossards

**Fonction générique:**
```typescript
async function logAudit(params: {
  entity_type: string;
  entity_id: string;
  action: string;
  actor_type: 'organizer' | 'admin' | 'system';
  actor_id: string;
  actor_email?: string;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
}) {
  await db.auditLogs.create({
    data: {
      ...params,
      created_at: new Date()
    }
  });
}
```

---

### Règle A2: Immutabilité
**Description:** Les logs d'audit ne peuvent jamais être modifiés ou supprimés

**Contrainte:**
```typescript
// Pas de UPDATE ni DELETE sur audit_logs
// Seulement INSERT et SELECT
```

---

### Règle A3: Rétention
**Description:** Conservation des logs selon politique de rétention

**Politique recommandée:**
- 1 an minimum pour événements actifs
- 3 ans pour événements archivés
- 7 ans pour transactions financières

---

## RÉCAPITULATIF DES CONTRAINTES CRITIQUES

| Code | Description | Type | Priorité |
|------|-------------|------|----------|
| E2 | Dates d'inscription cohérentes | Validation | Critique |
| R3 | Jauge minimale >= inscrits | Validation | Critique |
| T4 | Quotas par licence | Validation | Haute |
| T5 | Date limite licence | Validation | Haute |
| I3 | Validation temporelle invitations | Validation | Haute |
| P5 | Épreuve ouverte pour code promo | Validation | Haute |
| B1 | Unicité dossard par événement | Contrainte DB | Critique |
| B5 | Verrouillage temporel dossards | Validation | Critique |
| REG2 | Jauge épreuve respectée | Validation | Critique |
| REG3 | Jauge globale événement | Validation | Critique |
| REG4 | Pas de doublon | Validation | Critique |
