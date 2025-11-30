# CMS Timepulse - A/B Testing, SEO, i18n & Audit

## A/B Testing System

### Allocation Strategy

```typescript
// lib/abtest/allocation.ts
import crypto from 'crypto';

export interface Variant {
  id: string;
  name: string;
  weight: number; // 0-100
}

export function allocateVariant(variants: Variant[], userId?: string, sessionId?: string): string {
  const id = userId || sessionId || crypto.randomUUID();

  // Deterministic hash-based allocation
  const hash = crypto.createHash('md5').update(id).digest('hex');
  const numericHash = parseInt(hash.substring(0, 8), 16);
  const position = numericHash % 100;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (position < cumulative) {
      return variant.id;
    }
  }

  return variants[0].id;
}

export function setVariantCookie(testId: string, variantId: string, response: Response) {
  response.headers.append(
    'Set-Cookie',
    `ab_${testId}=${variantId}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Strict`
  );
}

export function getVariantFromCookie(testId: string, cookies: Map<string, string>): string | null {
  return cookies.get(`ab_${testId}`) || null;
}
```

### Middleware for A/B Tests

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { allocateVariant } from '@/lib/abtest/allocation';
import { prisma } from '@/lib/prisma';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if page has active A/B test
  const page = await prisma.page.findFirst({
    where: {
      slug: pathname.split('/').pop(),
      status: 'PUBLISHED',
    },
    include: {
      abTest: {
        where: { status: 'RUNNING' },
      },
    },
  });

  if (page?.abTest) {
    const test = page.abTest;
    const cookies = new Map(
      request.cookies.getAll().map((c) => [c.name, c.value])
    );

    let variantId = getVariantFromCookie(test.id, cookies);

    if (!variantId) {
      const sessionId = request.cookies.get('session_id')?.value || crypto.randomUUID();
      variantId = allocateVariant(test.variants as any[], undefined, sessionId);

      const response = NextResponse.next();
      setVariantCookie(test.id, variantId, response);

      // Track view event
      await fetch(`${request.nextUrl.origin}/api/track`, {
        method: 'POST',
        body: JSON.stringify({
          abTestId: test.id,
          variantId,
          eventType: 'view',
          sessionId,
        }),
      });

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:locale/:slug'],
};
```

### Tracking API

```typescript
// app/api/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const trackEventSchema = z.object({
  abTestId: z.string().cuid(),
  variantId: z.string(),
  eventType: z.enum(['view', 'click', 'submit', 'scroll']),
  sessionId: z.string(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = trackEventSchema.parse(body);

    await prisma.abTestEvent.create({
      data: {
        abTestId: data.abTestId,
        variantId: data.variantId,
        eventType: data.eventType,
        sessionId: data.sessionId,
        metadata: data.metadata,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

### Statistical Analysis

```typescript
// lib/abtest/statistics.ts

export interface VariantStats {
  variantId: string;
  views: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
}

export function calculateCTR(clicks: number, views: number): number {
  if (views === 0) return 0;
  return (clicks / views) * 100;
}

export function calculateConversionRate(conversions: number, views: number): number {
  if (views === 0) return 0;
  return (conversions / views) * 100;
}

// Chi-square test for statistical significance
export function chiSquareTest(
  controlConversions: number,
  controlViews: number,
  variantConversions: number,
  variantViews: number
): { pValue: number; significant: boolean } {
  const controlRate = controlConversions / controlViews;
  const variantRate = variantConversions / variantViews;

  const pooledRate = (controlConversions + variantConversions) / (controlViews + variantViews);

  const expectedControl = controlViews * pooledRate;
  const expectedVariant = variantViews * pooledRate;

  const chiSquare =
    Math.pow(controlConversions - expectedControl, 2) / expectedControl +
    Math.pow(variantConversions - expectedVariant, 2) / expectedVariant;

  // Simplified p-value approximation (use proper library in production)
  const pValue = 1 - cumulativeChiSquare(chiSquare, 1);

  return {
    pValue,
    significant: pValue < 0.05,
  };
}

function cumulativeChiSquare(x: number, df: number): number {
  // Simplified approximation - use jStat or similar library for accuracy
  return 1 - Math.exp(-x / 2);
}

export async function analyzeAbTest(testId: string) {
  const events = await prisma.abTestEvent.groupBy({
    by: ['variantId', 'eventType'],
    where: { abTestId: testId },
    _count: true,
  });

  const variantStats = new Map<string, VariantStats>();

  for (const event of events) {
    if (!variantStats.has(event.variantId)) {
      variantStats.set(event.variantId, {
        variantId: event.variantId,
        views: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        conversionRate: 0,
      });
    }

    const stats = variantStats.get(event.variantId)!;

    if (event.eventType === 'view') stats.views = event._count;
    if (event.eventType === 'click') stats.clicks = event._count;
    if (event.eventType === 'submit') stats.conversions = event._count;
  }

  // Calculate rates
  for (const stats of variantStats.values()) {
    stats.ctr = calculateCTR(stats.clicks, stats.views);
    stats.conversionRate = calculateConversionRate(stats.conversions, stats.views);
  }

  return Array.from(variantStats.values());
}

// Auto-stop rule
export async function checkStopRule(testId: string) {
  const test = await prisma.abTest.findUnique({ where: { id: testId } });
  if (!test) return false;

  const stats = await analyzeAbTest(testId);

  // Check minimum sample size
  const totalViews = stats.reduce((sum, s) => sum + s.views, 0);
  if (totalViews < test.minSample) return false;

  // Check significance
  if (stats.length !== 2) return false; // Only support 2 variants for now

  const [control, variant] = stats;
  const result = chiSquareTest(
    control.conversions,
    control.views,
    variant.conversions,
    variant.views
  );

  if (result.significant) {
    const winner = variant.conversionRate > control.conversionRate ? variant.variantId : control.variantId;

    await prisma.abTest.update({
      where: { id: testId },
      data: {
        status: 'COMPLETED',
        stoppedAt: new Date(),
        winner,
      },
    });

    return true;
  }

  return false;
}
```

### A/B Test Example

```typescript
// Example: Hero variant test
const heroAbTest = {
  name: 'Hero CTA Wording Test',
  scope: 'BLOCK',
  variants: [
    {
      id: 'control',
      name: 'Control - "Demander un devis"',
      weight: 50,
      props: {
        buttons: [{ text: 'Demander un devis', href: '/contact', variant: 'primary' }],
      },
    },
    {
      id: 'variant-a',
      name: 'Variant A - "Obtenir un devis gratuit"',
      weight: 50,
      props: {
        buttons: [{ text: 'Obtenir un devis gratuit', href: '/contact', variant: 'primary' }],
      },
    },
  ],
  goals: [
    { type: 'click', target: 'button[href="/contact"]' },
    { type: 'submit', target: 'form#contact-form' },
  ],
  minSample: 500,
};
```

---

## SEO & i18n Implementation

### Sitemap Generation

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://timepulse.fr';

  const pages = await prisma.page.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      slug: true,
      locale: true,
      updatedAt: true,
      type: true,
    },
  });

  return pages.map((page) => ({
    url: `${baseUrl}/${page.locale}/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: page.type === 'BLOG' ? 'weekly' : 'monthly',
    priority: page.slug === 'index' ? 1.0 : 0.8,
    alternates: {
      languages: {
        fr: `${baseUrl}/fr/${page.slug}`,
        en: `${baseUrl}/en/${page.slug}`,
      },
    },
  }));
}
```

### Robots.txt

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://timepulse.fr';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/preview/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

### Metadata Generation

```typescript
// lib/seo/metadata.ts
import { Metadata } from 'next';
import { SeoSnippet } from '@prisma/client';

export function generateMetadata(seo: SeoSnippet, locale: string): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://timepulse.fr';

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: seo.canonical || undefined,
      languages: seo.hreflang as Record<string, string>,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonical || undefined,
      siteName: 'Timepulse',
      images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
    robots: seo.noindex ? 'noindex, nofollow' : 'index, follow',
  };
}
```

### Hreflang Implementation

```typescript
// components/HreflangLinks.tsx
import { SeoSnippet } from '@prisma/client';

export function HreflangLinks({ seo }: { seo: SeoSnippet }) {
  const hreflang = (seo.hreflang || {}) as Record<string, string>;

  return (
    <>
      {Object.entries(hreflang).map(([locale, url]) => (
        <link key={locale} rel="alternate" hrefLang={locale} href={url} />
      ))}
    </>
  );
}
```

### JSON-LD Schema

```typescript
// lib/seo/jsonld.ts
export function generateArticleSchema(page: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.excerpt,
    image: page.seoSnippet?.ogImage,
    datePublished: page.publishedAt,
    dateModified: page.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'Timepulse',
      url: 'https://timepulse.fr',
    },
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Timepulse',
    url: 'https://timepulse.fr',
    logo: 'https://timepulse.fr/logo.png',
    description: 'Chronométrage professionnel d\'événements sportifs depuis 2009',
    foundingDate: '2009',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+33-X-XX-XX-XX-XX',
      contactType: 'customer service',
      availableLanguage: ['French', 'English'],
    },
  };
}
```

### SEO Validation

```typescript
// lib/seo/validation.ts
export interface SEOIssue {
  field: string;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
}

export async function validateSEO(page: any): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];
  const seo = page.seoSnippet;

  if (!seo) {
    issues.push({
      field: 'seo',
      issue: 'Aucun snippet SEO',
      severity: 'critical',
    });
    return issues;
  }

  // Title checks
  if (!seo.title) {
    issues.push({ field: 'title', issue: 'Titre manquant', severity: 'critical' });
  } else {
    if (seo.title.length < 30) {
      issues.push({ field: 'title', issue: 'Titre trop court (<30 car)', severity: 'warning' });
    }
    if (seo.title.length > 60) {
      issues.push({ field: 'title', issue: 'Titre trop long (>60 car)', severity: 'warning' });
    }
  }

  // Description checks
  if (!seo.description) {
    issues.push({ field: 'description', issue: 'Description manquante', severity: 'critical' });
  } else {
    if (seo.description.length < 120) {
      issues.push({ field: 'description', issue: 'Description trop courte (<120 car)', severity: 'warning' });
    }
    if (seo.description.length > 160) {
      issues.push({ field: 'description', issue: 'Description trop longue (>160 car)', severity: 'warning' });
    }
  }

  // OG Image
  if (!seo.ogImage) {
    issues.push({ field: 'ogImage', issue: 'Image Open Graph manquante', severity: 'info' });
  }

  // Duplicate check
  const duplicates = await prisma.seoSnippet.count({
    where: {
      title: seo.title,
      id: { not: seo.id },
    },
  });

  if (duplicates > 0) {
    issues.push({ field: 'title', issue: 'Titre dupliqué', severity: 'warning' });
  }

  return issues;
}
```

---

## Audit Log with Hash Chain

### Hash Chain Implementation

```typescript
// lib/audit/hash-chain.ts
import crypto from 'crypto';

export function calculateRecordHash(record: {
  timestampUtc: Date;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  previousHash?: string | null;
}): string {
  const data = JSON.stringify({
    timestamp: record.timestampUtc.toISOString(),
    actor: record.actorId,
    action: record.action,
    entity: `${record.entityType}:${record.entityId}`,
    before: record.before,
    after: record.after,
    previous: record.previousHash || '',
  });

  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function appendAuditLog(record: {
  actorId: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  reason?: string;
}) {
  // Get last record hash
  const lastRecord = await prisma.auditLog.findFirst({
    orderBy: { timestampUtc: 'desc' },
    select: { recordHash: true },
  });

  const timestampUtc = new Date();
  const previousHash = lastRecord?.recordHash || null;

  const recordHash = calculateRecordHash({
    timestampUtc,
    actorId: record.actorId,
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    before: record.before,
    after: record.after,
    previousHash,
  });

  await prisma.auditLog.create({
    data: {
      timestampUtc,
      actorId: record.actorId,
      role: record.role,
      action: record.action,
      entityType: record.entityType,
      entityId: record.entityId,
      before: record.before,
      after: record.after,
      reason: record.reason,
      previousHash,
      recordHash,
    },
  });
}

export async function verifyAuditIntegrity(): Promise<{
  valid: boolean;
  brokenAt?: string;
}> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestampUtc: 'asc' },
  });

  for (let i = 1; i < logs.length; i++) {
    const current = logs[i];
    const previous = logs[i - 1];

    if (current.previousHash !== previous.recordHash) {
      return {
        valid: false,
        brokenAt: current.id,
      };
    }

    // Recalculate hash to verify tampering
    const expectedHash = calculateRecordHash({
      timestampUtc: current.timestampUtc,
      actorId: current.actorId,
      action: current.action,
      entityType: current.entityType,
      entityId: current.entityId,
      before: current.before,
      after: current.after,
      previousHash: current.previousHash,
    });

    if (expectedHash !== current.recordHash) {
      return {
        valid: false,
        brokenAt: current.id,
      };
    }
  }

  return { valid: true };
}
```

### Audit Log Examples (10 entries)

```typescript
const auditExamples = [
  {
    id: '1',
    timestamp: '2025-10-14T10:00:00Z',
    actor: 'user_123',
    role: 'editor',
    action: 'create',
    entityType: 'page',
    entityId: 'page_001',
    after: { slug: 'chronometrage', title: 'Chronométrage Pro', status: 'DRAFT' },
    previousHash: null,
    recordHash: 'abc123...',
  },
  {
    id: '2',
    timestamp: '2025-10-14T10:05:00Z',
    actor: 'user_123',
    role: 'editor',
    action: 'update',
    entityType: 'block',
    entityId: 'block_001',
    before: { type: 'HERO', props: { title: 'Old title' } },
    after: { type: 'HERO', props: { title: 'New title' } },
    previousHash: 'abc123...',
    recordHash: 'def456...',
  },
  {
    id: '3',
    timestamp: '2025-10-14T10:10:00Z',
    actor: 'user_123',
    role: 'editor',
    action: 'submit_review',
    entityType: 'page',
    entityId: 'page_001',
    before: { status: 'DRAFT' },
    after: { status: 'REVIEW' },
    previousHash: 'def456...',
    recordHash: 'ghi789...',
  },
  {
    id: '4',
    timestamp: '2025-10-14T10:15:00Z',
    actor: 'user_456',
    role: 'reviewer',
    action: 'approve',
    entityType: 'page',
    entityId: 'page_001',
    reason: 'Contenu validé',
    previousHash: 'ghi789...',
    recordHash: 'jkl012...',
  },
  {
    id: '5',
    timestamp: '2025-10-14T10:20:00Z',
    actor: 'user_123',
    role: 'editor',
    action: 'schedule',
    entityType: 'page',
    entityId: 'page_001',
    after: { status: 'SCHEDULED', scheduledFor: '2025-10-15T08:00:00Z' },
    previousHash: 'jkl012...',
    recordHash: 'mno345...',
  },
  {
    id: '6',
    timestamp: '2025-10-15T08:00:00Z',
    actor: 'system',
    role: 'system',
    action: 'publish',
    entityType: 'page',
    entityId: 'page_001',
    after: { status: 'PUBLISHED', publishedAt: '2025-10-15T08:00:00Z' },
    previousHash: 'mno345...',
    recordHash: 'pqr678...',
  },
  {
    id: '7',
    timestamp: '2025-10-15T09:00:00Z',
    actor: 'user_789',
    role: 'editor',
    action: 'ab_start',
    entityType: 'abtest',
    entityId: 'test_001',
    after: { status: 'RUNNING', startAt: '2025-10-15T09:00:00Z' },
    previousHash: 'pqr678...',
    recordHash: 'stu901...',
  },
  {
    id: '8',
    timestamp: '2025-10-16T10:00:00Z',
    actor: 'user_789',
    role: 'editor',
    action: 'ab_stop',
    entityType: 'abtest',
    entityId: 'test_001',
    after: { status: 'STOPPED', winner: 'variant-a' },
    previousHash: 'stu901...',
    recordHash: 'vwx234...',
  },
  {
    id: '9',
    timestamp: '2025-10-16T11:00:00Z',
    actor: 'user_999',
    role: 'author',
    action: 'form_submit',
    entityType: 'form_submission',
    entityId: 'sub_001',
    after: { formId: 'form_contact', email: 'client@example.com' },
    previousHash: 'vwx234...',
    recordHash: 'yz567...',
  },
  {
    id: '10',
    timestamp: '2025-10-16T12:00:00Z',
    actor: 'user_123',
    role: 'editor',
    action: 'media_update',
    entityType: 'media',
    entityId: 'media_001',
    before: { alt: '' },
    after: { alt: 'Course marathon 2024' },
    reason: 'Ajout texte alternatif pour accessibilité',
    previousHash: 'yz567...',
    recordHash: 'abc890...',
  },
];
```
