# CMS Timepulse - Preview & Publish Workflow

## Preview Token System

### Token Generation

```typescript
// lib/preview/token.ts
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function generatePreviewToken(pageId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await prisma.previewToken.create({
    data: {
      token,
      pageId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function validatePreviewToken(token: string) {
  const previewToken = await prisma.previewToken.findUnique({
    where: { token },
    include: { page: true },
  });

  if (!previewToken) {
    throw new Error('Token invalide');
  }

  if (previewToken.expiresAt < new Date()) {
    throw new Error('Token expiré');
  }

  return previewToken;
}

export async function revokePreviewToken(token: string) {
  await prisma.previewToken.delete({
    where: { token },
  });
}
```

### Preview API Route

```typescript
// app/api/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validatePreviewToken } from '@/lib/preview/token';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token manquant' },
      { status: 400 }
    );
  }

  try {
    const previewToken = await validatePreviewToken(token);

    // Set secure preview cookie
    const response = NextResponse.redirect(
      new URL(`/${previewToken.page.locale}/${previewToken.page.slug}`, request.url)
    );

    response.cookies.set('__preview_mode', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24h
      path: '/',
    });

    response.cookies.set('__preview_page_id', previewToken.pageId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}

// Exit preview mode
export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.delete('__preview_mode');
  response.cookies.delete('__preview_page_id');

  return response;
}
```

### Preview Page Component

```typescript
// app/[locale]/[slug]/page.tsx
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { validatePreviewToken } from '@/lib/preview/token';
import PageRenderer from '@/components/PageRenderer';
import PreviewBanner from '@/components/PreviewBanner';

interface PageProps {
  params: { locale: string; slug: string };
}

export async function generateStaticParams() {
  const pages = await prisma.page.findMany({
    where: { status: 'PUBLISHED' },
    select: { locale: true, slug: true },
  });

  return pages.map((page) => ({
    locale: page.locale,
    slug: page.slug,
  }));
}

export default async function Page({ params }: PageProps) {
  const cookieStore = cookies();
  const previewToken = cookieStore.get('__preview_mode')?.value;
  const previewPageId = cookieStore.get('__preview_page_id')?.value;

  let page;
  let isPreview = false;

  // Preview mode
  if (previewToken && previewPageId) {
    try {
      await validatePreviewToken(previewToken);

      page = await prisma.page.findUnique({
        where: { id: previewPageId },
        include: {
          blocks: { orderBy: { order: 'asc' } },
          seoSnippet: true,
        },
      });

      isPreview = true;
    } catch (error) {
      console.error('Preview error:', error);
    }
  }

  // Published mode
  if (!page) {
    page = await prisma.page.findFirst({
      where: {
        slug: params.slug,
        locale: params.locale,
        status: 'PUBLISHED',
      },
      include: {
        blocks: { orderBy: { order: 'asc' } },
        seoSnippet: true,
      },
    });
  }

  if (!page) {
    return notFound();
  }

  return (
    <>
      {isPreview && <PreviewBanner pageId={page.id} />}
      <PageRenderer page={page} />
    </>
  );
}

// ISR revalidation
export const revalidate = 3600; // 1 hour
```

### Preview Banner Component

```typescript
// components/PreviewBanner.tsx
'use client';

import { useRouter } from 'next/navigation';

interface PreviewBannerProps {
  pageId: string;
}

export default function PreviewBanner({ pageId }: PreviewBannerProps) {
  const router = useRouter();

  async function exitPreview() {
    await fetch('/api/preview', { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-semibold">MODE PRÉVISUALISATION</span>
        <span className="text-sm">ID: {pageId}</span>
      </div>
      <button
        onClick={exitPreview}
        className="px-3 py-1 bg-black text-white rounded hover:bg-gray-800"
      >
        Quitter
      </button>
    </div>
  );
}
```

## Publish Workflow

### State Machine

```typescript
// lib/publish/state-machine.ts

export enum PageStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export const ALLOWED_TRANSITIONS: Record<PageStatus, PageStatus[]> = {
  [PageStatus.DRAFT]: [PageStatus.REVIEW, PageStatus.ARCHIVED],
  [PageStatus.REVIEW]: [PageStatus.DRAFT, PageStatus.SCHEDULED, PageStatus.PUBLISHED],
  [PageStatus.SCHEDULED]: [PageStatus.DRAFT, PageStatus.PUBLISHED],
  [PageStatus.PUBLISHED]: [PageStatus.DRAFT, PageStatus.ARCHIVED],
  [PageStatus.ARCHIVED]: [PageStatus.DRAFT],
};

export function canTransition(from: PageStatus, to: PageStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) || false;
}

export function validateTransition(from: PageStatus, to: PageStatus) {
  if (!canTransition(from, to)) {
    throw new Error(
      `Transition invalide: ${from} → ${to}. Transitions autorisées: ${ALLOWED_TRANSITIONS[from].join(', ')}`
    );
  }
}
```

### Publish Guards

```typescript
// lib/publish/guards.ts
import { Page, Block, SeoSnippet } from '@prisma/client';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export async function validateForPublish(
  page: Page & { blocks: Block[]; seoSnippet: SeoSnippet | null }
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // SEO validations
  if (!page.seoSnippet) {
    errors.push({
      field: 'seoSnippet',
      message: 'Snippet SEO requis',
      severity: 'error',
    });
  } else {
    const seo = page.seoSnippet;

    if (!seo.title || seo.title.length < 30) {
      errors.push({
        field: 'seo.title',
        message: 'Le titre SEO doit faire au moins 30 caractères',
        severity: 'error',
      });
    }

    if (seo.title && seo.title.length > 60) {
      errors.push({
        field: 'seo.title',
        message: 'Le titre SEO dépasse 60 caractères (recommandé)',
        severity: 'warning',
      });
    }

    if (!seo.description || seo.description.length < 120) {
      errors.push({
        field: 'seo.description',
        message: 'La description SEO doit faire au moins 120 caractères',
        severity: 'error',
      });
    }

    if (seo.description && seo.description.length > 160) {
      errors.push({
        field: 'seo.description',
        message: 'La description SEO dépasse 160 caractères (recommandé)',
        severity: 'warning',
      });
    }

    if (!seo.ogImage) {
      errors.push({
        field: 'seo.ogImage',
        message: 'Image Open Graph recommandée',
        severity: 'warning',
      });
    }
  }

  // Content validations
  if (page.blocks.length === 0) {
    errors.push({
      field: 'blocks',
      message: 'Au moins un bloc est requis',
      severity: 'error',
    });
  }

  // Media alt text validation
  for (const block of page.blocks) {
    const props = block.props as any;

    if (block.type === 'MEDIA' && props.image && !props.image.alt) {
      errors.push({
        field: `block.${block.id}.image.alt`,
        message: 'Texte alternatif manquant pour l\'image',
        severity: 'error',
      });
    }

    if (block.type === 'HERO' && props.image && !props.image.alt) {
      errors.push({
        field: `block.${block.id}.hero.alt`,
        message: 'Texte alternatif manquant pour l\'image hero',
        severity: 'error',
      });
    }
  }

  // Link validation (broken links check)
  const links = extractLinksFromBlocks(page.blocks);
  const brokenLinks = await checkBrokenLinks(links);

  for (const link of brokenLinks) {
    errors.push({
      field: `link.${link}`,
      message: `Lien cassé détecté: ${link}`,
      severity: 'warning',
    });
  }

  // Performance: media size check
  const totalMediaSize = await calculateMediaSize(page.blocks);
  if (totalMediaSize > 5 * 1024 * 1024) { // 5MB
    errors.push({
      field: 'performance.mediaSize',
      message: `Poids total des médias: ${(totalMediaSize / 1024 / 1024).toFixed(2)}MB (>5MB)`,
      severity: 'warning',
    });
  }

  return errors;
}

function extractLinksFromBlocks(blocks: Block[]): string[] {
  const links: string[] = [];

  for (const block of blocks) {
    const props = block.props as any;

    // Extract links from various block types
    if (props.buttons) {
      links.push(...props.buttons.map((b: any) => b.href));
    }
    if (props.link) {
      links.push(props.link.href);
    }
    if (props.cases) {
      links.push(...props.cases.map((c: any) => c.link));
    }
  }

  return links.filter(Boolean);
}

async function checkBrokenLinks(links: string[]): Promise<string[]> {
  const broken: string[] = [];

  for (const link of links) {
    // Skip external links for now
    if (link.startsWith('http')) continue;

    try {
      const response = await fetch(link, { method: 'HEAD' });
      if (!response.ok) {
        broken.push(link);
      }
    } catch {
      broken.push(link);
    }
  }

  return broken;
}

async function calculateMediaSize(blocks: Block[]): Promise<number> {
  // Calculate total media size from blocks
  // This would query the Media table for actual file sizes
  return 0; // Placeholder
}
```

### Publish Service

```typescript
// lib/publish/service.ts
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateForPublish } from './guards';
import { validateTransition, PageStatus } from './state-machine';

export async function publishPage(pageId: string, userId: string) {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: { blocks: true, seoSnippet: true },
  });

  if (!page) {
    throw new Error('Page non trouvée');
  }

  // Validate state transition
  validateTransition(page.status as PageStatus, PageStatus.PUBLISHED);

  // Run guards
  const errors = await validateForPublish(page);
  const criticalErrors = errors.filter((e) => e.severity === 'error');

  if (criticalErrors.length > 0) {
    throw new Error(
      `Validation échouée: ${criticalErrors.map((e) => e.message).join(', ')}`
    );
  }

  // Publish
  const publishedAt = new Date();
  await prisma.page.update({
    where: { id: pageId },
    data: {
      status: 'PUBLISHED',
      publishedAt,
      updatedById: userId,
    },
  });

  // Invalidate ISR cache
  await revalidatePath(`/${page.locale}/${page.slug}`);

  // Also revalidate sitemap
  await revalidatePath('/sitemap.xml');

  return { publishedAt, warnings: errors.filter((e) => e.severity === 'warning') };
}

export async function unpublishPage(pageId: string, userId: string) {
  const page = await prisma.page.findUnique({ where: { id: pageId } });

  if (!page) {
    throw new Error('Page non trouvée');
  }

  validateTransition(page.status as PageStatus, PageStatus.DRAFT);

  await prisma.page.update({
    where: { id: pageId },
    data: {
      status: 'DRAFT',
      updatedById: userId,
    },
  });

  // Invalidate cache
  await revalidatePath(`/${page.locale}/${page.slug}`);
}
```

## Scheduled Publishing

### Cron Job

```typescript
// lib/publish/scheduler.ts
import { prisma } from '@/lib/prisma';
import { publishPage } from './service';

export async function processScheduledPages() {
  const now = new Date();

  const scheduledPages = await prisma.page.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledFor: {
        lte: now,
      },
    },
  });

  console.log(`Processing ${scheduledPages.length} scheduled pages`);

  for (const page of scheduledPages) {
    try {
      await publishPage(page.id, 'system');
      console.log(`✅ Published scheduled page: ${page.slug}`);
    } catch (error) {
      console.error(`❌ Failed to publish page ${page.id}:`, error);

      // Log error and notify admins
      await prisma.auditLog.create({
        data: {
          timestampUtc: new Date(),
          actorId: 'system',
          role: 'system',
          action: 'publish_error',
          entityType: 'page',
          entityId: page.id,
          reason: error.message,
          recordHash: '', // Calculate hash
        },
      });
    }
  }
}

// Auto-unpublish pages
export async function processAutoUnpublish() {
  const now = new Date();

  const expiredPages = await prisma.page.findMany({
    where: {
      status: 'PUBLISHED',
      unpublishAt: {
        lte: now,
      },
    },
  });

  console.log(`Processing ${expiredPages.length} expired pages`);

  for (const page of expiredPages) {
    try {
      await unpublishPage(page.id, 'system');
      console.log(`✅ Auto-unpublished page: ${page.slug}`);
    } catch (error) {
      console.error(`❌ Failed to unpublish page ${page.id}:`, error);
    }
  }
}
```

### API Cron Route

```typescript
// app/api/cron/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processScheduledPages, processAutoUnpublish } from '@/lib/publish/scheduler';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await processScheduledPages();
    await processAutoUnpublish();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/publish",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Cache Invalidation

### On-Demand Revalidation

```typescript
// lib/cache/invalidation.ts
import { revalidatePath, revalidateTag } from 'next/cache';

export async function invalidatePageCache(page: { locale: string; slug: string }) {
  // Revalidate specific page
  await revalidatePath(`/${page.locale}/${page.slug}`);

  // Revalidate home if it's a featured page
  await revalidatePath(`/${page.locale}`);

  // Revalidate sitemap
  await revalidatePath('/sitemap.xml');
}

export async function invalidateAllPages(locale?: string) {
  if (locale) {
    await revalidatePath(`/${locale}/[slug]`);
  } else {
    await revalidatePath('/[locale]/[slug]');
  }
}

export async function invalidateByTag(tag: string) {
  await revalidateTag(tag);
}
```

## Flow Diagram (Pseudo-code)

```
┌──────────┐
│  DRAFT   │ ◄─────────────────────┐
└────┬─────┘                       │
     │ submit_review               │
     ▼                             │ reject
┌──────────┐                       │
│  REVIEW  │ ──────────────────────┘
└────┬─────┘
     │ approve
     ▼
┌─────────────┐  schedule  ┌────────────┐
│ DRAFT       │ ──────────►│ SCHEDULED  │
│ (approved)  │            └─────┬──────┘
└─────┬───────┘                  │ cron trigger
      │ publish                  │
      │                          │
      └──────────┬───────────────┘
                 ▼
           ┌────────────┐
           │ PUBLISHED  │
           └─────┬──────┘
                 │ unpublish / archive
                 ▼
           ┌──────────┐
           │ ARCHIVED │
           └──────────┘
```
