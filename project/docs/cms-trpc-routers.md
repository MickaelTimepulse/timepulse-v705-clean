# CMS Timepulse - tRPC Routers

## Router Architecture

```typescript
// server/routers/_app.ts
import { router } from '../trpc';
import { pageRouter } from './page';
import { blockRouter } from './block';
import { seoRouter } from './seo';
import { mediaRouter } from './media';
import { formRouter } from './form';
import { abTestRouter } from './abtest';
import { versionRouter } from './version';
import { auditRouter } from './audit';
import { authRouter } from './auth';

export const appRouter = router({
  page: pageRouter,
  block: blockRouter,
  seo: seoRouter,
  media: mediaRouter,
  form: formRouter,
  abTest: abTestRouter,
  version: versionRouter,
  audit: auditRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
```

## Common Schemas

```typescript
// server/schemas/common.ts
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const errorSchema = z.object({
  code: z.enum([
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'VALIDATION_ERROR',
    'CONFLICT',
    'INTERNAL_ERROR',
  ]),
  message: z.string(),
  field: z.string().optional(),
});

export class CMSError extends Error {
  constructor(
    public code: z.infer<typeof errorSchema>['code'],
    message: string,
    public field?: string
  ) {
    super(message);
  }
}
```

## Page Router

```typescript
// server/routers/page.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { CMSError } from '../schemas/common';

const pageStatusEnum = z.enum(['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']);
const pageTypeEnum = z.enum(['LANDING', 'PRODUCT', 'CASE', 'BLOG', 'ABOUT']);

export const pageRouter = router({
  // List pages with filters
  list: protectedProcedure
    .input(z.object({
      status: pageStatusEnum.optional(),
      locale: z.string().default('fr'),
      type: pageTypeEnum.optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().max(100).default(20),
    }))
    .output(z.object({
      pages: z.array(z.object({
        id: z.string(),
        slug: z.string(),
        title: z.string(),
        type: pageTypeEnum,
        status: pageStatusEnum,
        locale: z.string(),
        publishedAt: z.date().nullable(),
        updatedAt: z.date(),
        updatedBy: z.object({
          id: z.string(),
          name: z.string(),
        }),
      })),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      // Check RBAC: user can view pages
      await ctx.rbac.check('page', 'read');

      const where = {
        ...(input.status && { status: input.status }),
        ...(input.type && { type: input.type }),
        locale: input.locale,
        ...(input.search && {
          OR: [
            { title: { contains: input.search, mode: 'insensitive' } },
            { slug: { contains: input.search, mode: 'insensitive' } },
          ],
        }),
      };

      const [pages, total] = await Promise.all([
        ctx.prisma.page.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { updatedAt: 'desc' },
          include: {
            updatedBy: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.page.count({ where }),
      ]);

      return { pages, total, page: input.page, limit: input.limit };
    }),

  // Get single page by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .output(z.object({
      id: z.string(),
      slug: z.string(),
      locale: z.string(),
      title: z.string(),
      excerpt: z.string().nullable(),
      type: pageTypeEnum,
      status: pageStatusEnum,
      layout: z.string().nullable(),
      publishedAt: z.date().nullable(),
      unpublishAt: z.date().nullable(),
      scheduledFor: z.date().nullable(),
      blocks: z.array(z.any()),
      seoSnippet: z.any().nullable(),
      abTest: z.any().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      await ctx.rbac.check('page', 'read');

      const page = await ctx.prisma.page.findUnique({
        where: { id: input.id },
        include: {
          blocks: { orderBy: { order: 'asc' } },
          seoSnippet: true,
          abTest: true,
        },
      });

      if (!page) {
        throw new CMSError('NOT_FOUND', 'Page non trouvée');
      }

      return page;
    }),

  // Create page
  create: protectedProcedure
    .input(z.object({
      slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
      locale: z.string().default('fr'),
      title: z.string().min(5).max(200),
      excerpt: z.string().max(500).optional(),
      type: pageTypeEnum,
      layout: z.string().optional(),
    }))
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('page', 'create');

      // Check slug uniqueness for active pages
      const existing = await ctx.prisma.page.findFirst({
        where: {
          slug: input.slug,
          locale: input.locale,
          status: { not: 'ARCHIVED' },
        },
      });

      if (existing) {
        throw new CMSError('CONFLICT', 'Ce slug existe déjà pour cette locale', 'slug');
      }

      const page = await ctx.prisma.page.create({
        data: {
          ...input,
          status: 'DRAFT',
          createdById: ctx.user.id,
          updatedById: ctx.user.id,
        },
      });

      // Audit log
      await ctx.audit.log({
        action: 'create',
        entityType: 'page',
        entityId: page.id,
        after: page,
      });

      return { id: page.id };
    }),

  // Update page
  update: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      title: z.string().min(5).max(200).optional(),
      excerpt: z.string().max(500).optional(),
      layout: z.string().optional(),
      seoSnippetId: z.string().cuid().nullable().optional(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('page', 'update');

      const { id, ...updates } = input;

      const before = await ctx.prisma.page.findUnique({ where: { id } });
      if (!before) {
        throw new CMSError('NOT_FOUND', 'Page non trouvée');
      }

      // Check status permissions
      if (before.status === 'PUBLISHED' && !ctx.rbac.can('page', 'publish')) {
        throw new CMSError('FORBIDDEN', 'Modification non autorisée sur page publiée');
      }

      const after = await ctx.prisma.page.update({
        where: { id },
        data: {
          ...updates,
          updatedById: ctx.user.id,
        },
      });

      // Create version snapshot
      await ctx.prisma.version.create({
        data: {
          entityType: 'page',
          entityId: id,
          snapshot: before,
          createdById: ctx.user.id,
        },
      });

      // Audit log
      await ctx.audit.log({
        action: 'update',
        entityType: 'page',
        entityId: id,
        before,
        after,
      });

      return { success: true };
    }),

  // Submit for review
  submitForReview: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('page', 'submit_review');

      const page = await ctx.prisma.page.findUnique({
        where: { id: input.id },
        include: { blocks: true, seoSnippet: true },
      });

      if (!page) {
        throw new CMSError('NOT_FOUND', 'Page non trouvée');
      }

      if (page.status !== 'DRAFT') {
        throw new CMSError('VALIDATION_ERROR', 'Seuls les brouillons peuvent être soumis');
      }

      // Validation guards
      if (!page.seoSnippet) {
        throw new CMSError('VALIDATION_ERROR', 'SEO snippet requis', 'seoSnippet');
      }

      if (page.blocks.length === 0) {
        throw new CMSError('VALIDATION_ERROR', 'Au moins un bloc requis', 'blocks');
      }

      const before = { ...page };

      await ctx.prisma.page.update({
        where: { id: input.id },
        data: { status: 'REVIEW', updatedById: ctx.user.id },
      });

      await ctx.audit.log({
        action: 'submit_review',
        entityType: 'page',
        entityId: input.id,
        before,
        after: { ...before, status: 'REVIEW' },
      });

      return { success: true };
    }),

  // Approve page
  approve: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      comment: z.string().optional(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('page', 'approve');

      const page = await ctx.prisma.page.findUnique({ where: { id: input.id } });

      if (!page) {
        throw new CMSError('NOT_FOUND', 'Page non trouvée');
      }

      if (page.status !== 'REVIEW') {
        throw new CMSError('VALIDATION_ERROR', 'Seules les pages en review peuvent être approuvées');
      }

      await ctx.prisma.page.update({
        where: { id: input.id },
        data: { status: 'DRAFT', updatedById: ctx.user.id },
      });

      await ctx.audit.log({
        action: 'approve',
        entityType: 'page',
        entityId: input.id,
        before: page,
        reason: input.comment,
      });

      return { success: true };
    }),

  // Reject page
  reject: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      reason: z.string().min(10),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('page', 'reject');

      const page = await ctx.prisma.page.findUnique({ where: { id: input.id } });

      if (!page || page.status !== 'REVIEW') {
        throw new CMSError('VALIDATION_ERROR', 'Page non éligible au rejet');
      }

      await ctx.prisma.page.update({
        where: { id: input.id },
        data: { status: 'DRAFT', updatedById: ctx.user.id },
      });

      await ctx.audit.log({
        action: 'reject',
        entityType: 'page',
        entityId: input.id,
        before: page,
        reason: input.reason,
      });

      return { success: true };
    }),

  // Publish page
  publish: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .output(z.object({ success: z.boolean(), publishedAt: z.date() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('page', 'publish');

      const page = await ctx.prisma.page.findUnique({ where: { id: input.id } });

      if (!page) {
        throw new CMSError('NOT_FOUND', 'Page non trouvée');
      }

      const now = new Date();
      await ctx.prisma.page.update({
        where: { id: input.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: now,
          updatedById: ctx.user.id,
        },
      });

      // Invalidate ISR cache
      await ctx.revalidate(`/${page.locale}/${page.slug}`);

      await ctx.audit.log({
        action: 'publish',
        entityType: 'page',
        entityId: input.id,
        after: { ...page, status: 'PUBLISHED', publishedAt: now },
      });

      return { success: true, publishedAt: now };
    }),

  // Schedule publication
  schedule: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      scheduledFor: z.date(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('page', 'publish');

      if (input.scheduledFor <= new Date()) {
        throw new CMSError('VALIDATION_ERROR', 'La date doit être future', 'scheduledFor');
      }

      await ctx.prisma.page.update({
        where: { id: input.id },
        data: {
          status: 'SCHEDULED',
          scheduledFor: input.scheduledFor,
          updatedById: ctx.user.id,
        },
      });

      await ctx.audit.log({
        action: 'schedule',
        entityType: 'page',
        entityId: input.id,
        after: { scheduledFor: input.scheduledFor },
      });

      return { success: true };
    }),

  // Unpublish page
  unpublish: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('page', 'publish');

      const page = await ctx.prisma.page.findUnique({ where: { id: input.id } });

      if (!page || page.status !== 'PUBLISHED') {
        throw new CMSError('VALIDATION_ERROR', 'Seules les pages publiées peuvent être dépubliées');
      }

      await ctx.prisma.page.update({
        where: { id: input.id },
        data: { status: 'DRAFT', updatedById: ctx.user.id },
      });

      await ctx.revalidate(`/${page.locale}/${page.slug}`);

      await ctx.audit.log({
        action: 'unpublish',
        entityType: 'page',
        entityId: input.id,
        before: page,
      });

      return { success: true };
    }),

  // Archive page
  archive: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('page', 'delete');

      await ctx.prisma.page.update({
        where: { id: input.id },
        data: { status: 'ARCHIVED', updatedById: ctx.user.id },
      });

      await ctx.audit.log({
        action: 'archive',
        entityType: 'page',
        entityId: input.id,
      });

      return { success: true };
    }),

  // Issue preview token
  issuePreviewToken: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .output(z.object({
      token: z.string(),
      url: z.string(),
      expiresAt: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('page', 'read');

      const page = await ctx.prisma.page.findUnique({ where: { id: input.id } });

      if (!page) {
        throw new CMSError('NOT_FOUND', 'Page non trouvée');
      }

      const token = await ctx.crypto.generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      await ctx.prisma.previewToken.create({
        data: {
          token,
          pageId: input.id,
          expiresAt,
        },
      });

      const url = `${ctx.env.FRONTEND_URL}/preview/${token}`;

      return { token, url, expiresAt };
    }),
});
```

## Form Router

```typescript
// server/routers/form.ts
import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import crypto from 'crypto';

export const formRouter = router({
  // Submit form (public)
  submit: publicProcedure
    .input(z.object({
      formId: z.string().cuid(),
      data: z.record(z.any()),
      captchaToken: z.string().optional(),
    }))
    .output(z.object({ success: z.boolean(), submissionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const form = await ctx.prisma.form.findUnique({
        where: { id: input.formId },
      });

      if (!form) {
        throw new CMSError('NOT_FOUND', 'Formulaire non trouvé');
      }

      // Validate captcha
      if (form.captcha && !input.captchaToken) {
        throw new CMSError('VALIDATION_ERROR', 'Captcha requis', 'captcha');
      }

      // Validate fields (using Zod schemas from form.validations)
      // ... field validation logic

      const submission = await ctx.prisma.formSubmission.create({
        data: {
          formId: input.formId,
          data: input.data,
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        },
      });

      // Send webhooks
      const destinations = form.destinations as any;
      if (destinations.webhooks) {
        for (const webhook of destinations.webhooks) {
          await ctx.webhook.send({
            url: webhook.url,
            data: input.data,
            submissionId: submission.id,
            signature: crypto
              .createHmac('sha256', webhook.secret)
              .update(JSON.stringify(input.data))
              .digest('hex'),
          });
        }
      }

      // Send email
      if (destinations.email) {
        await ctx.email.send({
          to: destinations.email,
          subject: `Nouvelle soumission: ${form.name}`,
          data: input.data,
        });
      }

      return { success: true, submissionId: submission.id };
    }),

  // List submissions
  listSubmissions: protectedProcedure
    .input(z.object({
      formId: z.string().cuid(),
      page: z.number().default(1),
      limit: z.number().max(100).default(50),
    }))
    .output(z.object({
      submissions: z.array(z.any()),
      total: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      await ctx.rbac.check('form', 'read');

      const [submissions, total] = await Promise.all([
        ctx.prisma.formSubmission.findMany({
          where: { formId: input.formId },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.formSubmission.count({ where: { formId: input.formId } }),
      ]);

      return { submissions, total };
    }),
});
```

## A/B Test Router

```typescript
// server/routers/abtest.ts
import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';

export const abTestRouter = router({
  // Start A/B test
  start: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .output(z.object({ success: z.boolean(), startedAt: z.date() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('abtest', 'start');

      const test = await ctx.prisma.abTest.findUnique({ where: { id: input.id } });

      if (!test || test.status !== 'DRAFT') {
        throw new CMSError('VALIDATION_ERROR', 'Test non éligible au démarrage');
      }

      const startAt = new Date();
      await ctx.prisma.abTest.update({
        where: { id: input.id },
        data: { status: 'RUNNING', startAt },
      });

      await ctx.audit.log({
        action: 'ab_start',
        entityType: 'abtest',
        entityId: input.id,
      });

      return { success: true, startedAt: startAt };
    }),

  // Stop A/B test
  stop: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      winner: z.string().optional(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('abtest', 'stop');

      await ctx.prisma.abTest.update({
        where: { id: input.id },
        data: {
          status: 'STOPPED',
          stoppedAt: new Date(),
          winner: input.winner,
        },
      });

      await ctx.audit.log({
        action: 'ab_stop',
        entityType: 'abtest',
        entityId: input.id,
        after: { winner: input.winner },
      });

      return { success: true };
    }),

  // Track event (public)
  trackEvent: publicProcedure
    .input(z.object({
      abTestId: z.string().cuid(),
      variantId: z.string(),
      eventType: z.enum(['view', 'click', 'submit', 'scroll']),
      sessionId: z.string(),
      metadata: z.record(z.any()).optional(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.abTestEvent.create({
        data: {
          abTestId: input.abTestId,
          variantId: input.variantId,
          eventType: input.eventType,
          sessionId: input.sessionId,
          metadata: input.metadata,
        },
      });

      return { success: true };
    }),

  // Get results
  getResults: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .output(z.object({
      variants: z.array(z.object({
        id: z.string(),
        views: z.number(),
        clicks: z.number(),
        conversions: z.number(),
        ctr: z.number(),
        conversionRate: z.number(),
      })),
      status: z.string(),
      confidence: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await ctx.rbac.check('abtest', 'read');

      // Calculate metrics from events
      const events = await ctx.prisma.abTestEvent.groupBy({
        by: ['variantId', 'eventType'],
        where: { abTestId: input.id },
        _count: true,
      });

      // Aggregate and calculate CTR, conversion rate, confidence intervals
      // ... statistics calculation logic

      return { variants: [], status: 'RUNNING' };
    }),
});
```

## Audit Router

```typescript
// server/routers/audit.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const auditRouter = router({
  // Query audit logs
  query: protectedProcedure
    .input(z.object({
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      actorId: z.string().optional(),
      action: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      page: z.number().default(1),
      limit: z.number().max(100).default(50),
    }))
    .output(z.object({
      logs: z.array(z.any()),
      total: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      await ctx.rbac.check('audit', 'read');

      const where = {
        ...(input.entityType && { entityType: input.entityType }),
        ...(input.entityId && { entityId: input.entityId }),
        ...(input.actorId && { actorId: input.actorId }),
        ...(input.action && { action: input.action }),
        ...(input.startDate || input.endDate) && {
          timestampUtc: {
            ...(input.startDate && { gte: input.startDate }),
            ...(input.endDate && { lte: input.endDate }),
          },
        },
      };

      const [logs, total] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { timestampUtc: 'desc' },
          include: { actor: { select: { id: true, name: true, email: true } } },
        }),
        ctx.prisma.auditLog.count({ where }),
      ]);

      return { logs, total };
    }),

  // Verify hash chain integrity
  verifyIntegrity: protectedProcedure
    .input(z.object({
      startId: z.string().cuid().optional(),
      endId: z.string().cuid().optional(),
    }))
    .output(z.object({
      valid: z.boolean(),
      brokenAt: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await ctx.rbac.check('audit', 'verify');

      // Verify hash chain
      const logs = await ctx.prisma.auditLog.findMany({
        orderBy: { timestampUtc: 'asc' },
        ...(input.startId && { where: { id: { gte: input.startId } } }),
      });

      for (let i = 1; i < logs.length; i++) {
        const expected = logs[i].previousHash;
        const actual = logs[i - 1].recordHash;

        if (expected !== actual) {
          return { valid: false, brokenAt: logs[i].id };
        }
      }

      return { valid: true };
    }),
});
```

## Error Handling Middleware

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { CMSError } from './schemas/common';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    if (error.cause instanceof CMSError) {
      return {
        ...shape,
        data: {
          ...shape.data,
          code: error.cause.code,
          field: error.cause.field,
        },
      };
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```
