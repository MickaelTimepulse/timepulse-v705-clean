# CMS Timepulse - Prisma Schema

## Complete Schema

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== AUTH & RBAC ====================

model User {
  id                String   @id @default(cuid())
  email             String   @unique
  emailVerified     DateTime?
  name              String?
  image             String?
  hashedPassword    String?
  twoFactorEnabled  Boolean  @default(false)
  twoFactorSecret   String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  accounts          Account[]
  sessions          Session[]
  roleBindings      RoleBinding[]
  createdPages      Page[]     @relation("CreatedPages")
  updatedPages      Page[]     @relation("UpdatedPages")
  createdVersions   Version[]
  auditLogs         AuditLog[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  permissions Json

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  bindings    RoleBinding[]

  @@map("roles")
}

model RoleBinding {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  scope     String?

  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId, scope])
  @@map("role_bindings")
}

// ==================== CMS CORE ====================

model Page {
  id            String    @id @default(cuid())
  slug          String
  locale        String    @default("fr")
  type          PageType
  status        PageStatus @default(DRAFT)
  layout        String?

  title         String
  excerpt       String?

  publishedAt   DateTime?
  unpublishAt   DateTime?
  scheduledFor  DateTime?

  seoSnippetId  String?
  abTestId      String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  createdById   String
  updatedById   String

  blocks        Block[]
  seoSnippet    SeoSnippet? @relation(fields: [seoSnippetId], references: [id])
  abTest        AbTest?     @relation(fields: [abTestId], references: [id])
  createdBy     User        @relation("CreatedPages", fields: [createdById], references: [id])
  updatedBy     User        @relation("UpdatedPages", fields: [updatedById], references: [id])
  versions      Version[]

  @@unique([slug, locale, status])
  @@index([status, locale])
  @@index([publishedAt])
  @@index([type, status])
  @@map("pages")
}

enum PageType {
  LANDING
  PRODUCT
  CASE
  BLOG
  ABOUT
}

enum PageStatus {
  DRAFT
  REVIEW
  SCHEDULED
  PUBLISHED
  ARCHIVED
}

model Block {
  id          String   @id @default(cuid())
  pageId      String
  type        BlockType
  order       Int
  props       Json
  visibility  Json?
  variant     String?
  trackingId  String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  page        Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  versions    Version[]

  @@index([pageId, order])
  @@map("blocks")
}

enum BlockType {
  HERO
  FEATURES
  PRICING
  STEPS
  STATS
  LOGOS
  MEDIA
  CASE_TEASER
  CTA
  FAQ
  RICHTEXT
  FORM
  MAP
}

model SeoSnippet {
  id          String   @id @default(cuid())
  title       String
  description String
  canonical   String?
  ogImage     String?
  noindex     Boolean  @default(false)
  jsonLd      Json?
  hreflang    Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  pages       Page[]

  @@map("seo_snippets")
}

model Media {
  id          String   @id @default(cuid())
  key         String   @unique
  url         String
  alt         String?
  focalPoint  Json?
  rights      String?
  width       Int?
  height      Int?
  format      String?
  size        Int?
  hashes      Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([key])
  @@map("media")
}

model Form {
  id            String   @id @default(cuid())
  name          String
  fields        Json
  validations   Json
  destinations  Json
  consent       Json?
  captcha       Boolean  @default(true)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  submissions   FormSubmission[]

  @@map("forms")
}

model FormSubmission {
  id          String   @id @default(cuid())
  formId      String
  data        Json
  metadata    Json?
  ipAddress   String?
  userAgent   String?

  createdAt   DateTime @default(now())

  form        Form     @relation(fields: [formId], references: [id], onDelete: Cascade)

  @@index([formId, createdAt])
  @@map("form_submissions")
}

// ==================== A/B TESTING ====================

model AbTest {
  id          String      @id @default(cuid())
  name        String
  scope       AbTestScope
  variants    Json
  allocation  Json
  goals       Json

  startAt     DateTime?
  endAt       DateTime?
  stoppedAt   DateTime?

  minSample   Int         @default(100)
  stopRule    Json?

  status      AbTestStatus @default(DRAFT)
  winner      String?

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  pages       Page[]
  events      AbTestEvent[]

  @@map("ab_tests")
}

enum AbTestScope {
  PAGE
  BLOCK
}

enum AbTestStatus {
  DRAFT
  RUNNING
  STOPPED
  COMPLETED
}

model AbTestEvent {
  id          String   @id @default(cuid())
  abTestId    String
  variantId   String
  eventType   String
  userId      String?
  sessionId   String?
  metadata    Json?

  createdAt   DateTime @default(now())

  abTest      AbTest   @relation(fields: [abTestId], references: [id], onDelete: Cascade)

  @@index([abTestId, variantId, eventType])
  @@index([createdAt])
  @@map("ab_test_events")
}

// ==================== VERSIONING ====================

model Version {
  id          String   @id @default(cuid())
  entityType  String
  entityId    String
  snapshot    Json
  comment     String?

  createdAt   DateTime @default(now())
  createdById String

  createdBy   User     @relation(fields: [createdById], references: [id])
  page        Page?    @relation(fields: [entityId], references: [id])
  block       Block?   @relation(fields: [entityId], references: [id])

  @@index([entityType, entityId, createdAt])
  @@map("versions")
}

// ==================== AUDIT LOG ====================

model AuditLog {
  id            String   @id @default(cuid())
  timestampUtc  DateTime @default(now())
  actorId       String
  role          String
  action        String
  entityType    String
  entityId      String
  before        Json?
  after         Json?
  reason        String?
  ipAddress     String?
  userAgent     String?
  previousHash  String?
  recordHash    String

  actor         User     @relation(fields: [actorId], references: [id])

  @@index([entityType, entityId])
  @@index([actorId])
  @@index([timestampUtc])
  @@index([recordHash])
  @@map("audit_logs")
}

// ==================== PREVIEW TOKENS ====================

model PreviewToken {
  id          String   @id @default(cuid())
  token       String   @unique
  pageId      String
  expiresAt   DateTime

  createdAt   DateTime @default(now())

  @@index([token, expiresAt])
  @@map("preview_tokens")
}
```

## Key Indexes Explanation

### Performance Indexes

```sql
-- Page lookups by status and locale
CREATE INDEX idx_pages_status_locale ON pages(status, locale);

-- Published pages chronological
CREATE INDEX idx_pages_published_at ON pages(published_at) WHERE published_at IS NOT NULL;

-- Page type filtering
CREATE INDEX idx_pages_type_status ON pages(type, status);

-- Block ordering per page
CREATE INDEX idx_blocks_page_order ON blocks(page_id, "order");

-- Media lookup by key
CREATE INDEX idx_media_key ON media(key);

-- Form submissions by form and date
CREATE INDEX idx_form_submissions_form_created ON form_submissions(form_id, created_at);

-- A/B test event analytics
CREATE INDEX idx_ab_events_test_variant_type ON ab_test_events(ab_test_id, variant_id, event_type);
CREATE INDEX idx_ab_events_created ON ab_test_events(created_at);

-- Version history lookup
CREATE INDEX idx_versions_entity_created ON versions(entity_type, entity_id, created_at);

-- Audit log queries
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp_utc DESC);
CREATE INDEX idx_audit_hash ON audit_logs(record_hash);
```

### GIN Indexes for JSONB Search

```sql
-- Search in block props
CREATE INDEX idx_blocks_props_gin ON blocks USING GIN (props);

-- Search in SEO JSON-LD
CREATE INDEX idx_seo_jsonld_gin ON seo_snippets USING GIN (json_ld);

-- Search in form fields
CREATE INDEX idx_forms_fields_gin ON forms USING GIN (fields);

-- Search in A/B test variants
CREATE INDEX idx_ab_variants_gin ON ab_tests USING GIN (variants);
```

## Unique Constraints

```sql
-- Prevent duplicate slug+locale for active pages
CREATE UNIQUE INDEX idx_pages_slug_locale_active
ON pages(slug, locale)
WHERE status != 'ARCHIVED';

-- User email uniqueness
ALTER TABLE users ADD CONSTRAINT unique_users_email UNIQUE (email);

-- Media key uniqueness
ALTER TABLE media ADD CONSTRAINT unique_media_key UNIQUE (key);

-- Preview token uniqueness
ALTER TABLE preview_tokens ADD CONSTRAINT unique_preview_token UNIQUE (token);

-- Role name uniqueness
ALTER TABLE roles ADD CONSTRAINT unique_role_name UNIQUE (name);

-- Account provider uniqueness
ALTER TABLE accounts ADD CONSTRAINT unique_account_provider
UNIQUE (provider, provider_account_id);
```

## Triggers for Timestamps

```sql
-- Auto-update updated_at for pages
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON pages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at
BEFORE UPDATE ON blocks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_snippets_updated_at
BEFORE UPDATE ON seo_snippets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at
BEFORE UPDATE ON media
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```
