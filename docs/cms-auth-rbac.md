# CMS Timepulse - Auth & RBAC System

## Auth.js Configuration

```typescript
// auth.config.ts
import { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  pages: {
    signIn: '/admin/login',
    error: '/admin/error',
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
        totpToken: { label: 'Code 2FA', type: 'text', optional: true },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Identifiants manquants');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) {
          throw new Error('Identifiants invalides');
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValidPassword) {
          throw new Error('Identifiants invalides');
        }

        // Check 2FA
        if (user.twoFactorEnabled) {
          if (!credentials.totpToken) {
            throw new Error('Code 2FA requis');
          }

          const isValidToken = authenticator.verify({
            token: credentials.totpToken,
            secret: user.twoFactorSecret!,
          });

          if (!isValidToken) {
            throw new Error('Code 2FA invalide');
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Attach roles
        const roleBindings = await prisma.roleBinding.findMany({
          where: { userId: user.id },
          include: { role: true },
        });

        session.user.roles = roleBindings.map((rb) => ({
          id: rb.role.id,
          name: rb.role.name,
          permissions: rb.role.permissions,
          scope: rb.scope,
        }));
      }
      return session;
    },
  },
};
```

## RBAC Roles & Permissions

```typescript
// lib/rbac/roles.ts

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  EDITOR: 'editor',
  REVIEWER: 'reviewer',
  AUTHOR: 'author',
  READER: 'reader',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  super_admin: [
    { resource: '*', actions: ['*'] },
  ],

  editor: [
    { resource: 'page', actions: ['create', 'read', 'update', 'delete', 'publish', 'submit_review', 'approve', 'reject'] },
    { resource: 'block', actions: ['create', 'read', 'update', 'delete', 'reorder'] },
    { resource: 'seo', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'media', actions: ['upload', 'read', 'update', 'delete'] },
    { resource: 'form', actions: ['create', 'read', 'update', 'delete', 'view_submissions'] },
    { resource: 'abtest', actions: ['create', 'read', 'update', 'start', 'stop'] },
    { resource: 'version', actions: ['read', 'restore'] },
    { resource: 'audit', actions: ['read'] },
  ],

  reviewer: [
    { resource: 'page', actions: ['read', 'submit_review', 'approve', 'reject'] },
    { resource: 'block', actions: ['read'] },
    { resource: 'seo', actions: ['read'] },
    { resource: 'media', actions: ['read'] },
    { resource: 'form', actions: ['read', 'view_submissions'] },
    { resource: 'version', actions: ['read'] },
    { resource: 'audit', actions: ['read'] },
  ],

  author: [
    {
      resource: 'page',
      actions: ['create', 'read', 'update', 'submit_review'],
      conditions: { createdBy: 'self' },
    },
    {
      resource: 'block',
      actions: ['create', 'read', 'update', 'delete', 'reorder'],
      conditions: { pageCreatedBy: 'self' },
    },
    { resource: 'seo', actions: ['create', 'read', 'update'] },
    { resource: 'media', actions: ['upload', 'read'] },
    { resource: 'version', actions: ['read'] },
  ],

  reader: [
    { resource: 'page', actions: ['read'] },
    { resource: 'block', actions: ['read'] },
    { resource: 'seo', actions: ['read'] },
    { resource: 'media', actions: ['read'] },
    { resource: 'version', actions: ['read'] },
  ],
};
```

## RBAC Service

```typescript
// lib/rbac/service.ts
import { Session } from 'next-auth';
import { ROLE_PERMISSIONS } from './roles';

export class RBACService {
  constructor(private session: Session | null) {}

  private getUserRoles() {
    return this.session?.user?.roles || [];
  }

  can(resource: string, action: string, context?: Record<string, any>): boolean {
    const roles = this.getUserRoles();

    for (const role of roles) {
      const permissions = ROLE_PERMISSIONS[role.name];
      if (!permissions) continue;

      for (const perm of permissions) {
        // Wildcard check
        if (perm.resource === '*' && perm.actions.includes('*')) {
          return true;
        }

        // Resource match
        if (perm.resource !== resource && perm.resource !== '*') {
          continue;
        }

        // Action match
        if (!perm.actions.includes(action) && !perm.actions.includes('*')) {
          continue;
        }

        // Condition check
        if (perm.conditions && context) {
          const conditionsMet = Object.entries(perm.conditions).every(([key, value]) => {
            if (value === 'self') {
              return context[key] === this.session?.user?.id;
            }
            return context[key] === value;
          });

          if (!conditionsMet) continue;
        }

        return true;
      }
    }

    return false;
  }

  async check(resource: string, action: string, context?: Record<string, any>) {
    if (!this.can(resource, action, context)) {
      throw new Error(`Permission refusée: ${resource}.${action}`);
    }
  }

  hasRole(roleName: string): boolean {
    const roles = this.getUserRoles();
    return roles.some((r) => r.name === roleName);
  }

  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some((name) => this.hasRole(name));
  }
}
```

## RBAC Middleware for tRPC

```typescript
// server/middleware/rbac.ts
import { TRPCError } from '@trpc/server';
import { RBACService } from '@/lib/rbac/service';

export const rbacMiddleware = t.middleware(async ({ ctx, next }) => {
  const rbac = new RBACService(ctx.session);

  return next({
    ctx: {
      ...ctx,
      rbac,
    },
  });
});

export const protectedProcedure = publicProcedure.use(rbacMiddleware);
```

## Permission Matrix

| Resource | Action | SuperAdmin | Éditeur | Relecteur | Auteur | Lecteur |
|----------|--------|------------|---------|-----------|--------|---------|
| **Page** |
| | create | ✅ | ✅ | ❌ | ✅ (own) | ❌ |
| | read | ✅ | ✅ | ✅ | ✅ | ✅ |
| | update | ✅ | ✅ | ❌ | ✅ (own) | ❌ |
| | delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| | publish | ✅ | ✅ | ❌ | ❌ | ❌ |
| | submit_review | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| | approve | ✅ | ✅ | ✅ | ❌ | ❌ |
| | reject | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Block** |
| | create | ✅ | ✅ | ❌ | ✅ (own page) | ❌ |
| | read | ✅ | ✅ | ✅ | ✅ | ✅ |
| | update | ✅ | ✅ | ❌ | ✅ (own page) | ❌ |
| | delete | ✅ | ✅ | ❌ | ✅ (own page) | ❌ |
| | reorder | ✅ | ✅ | ❌ | ✅ (own page) | ❌ |
| **SEO** |
| | create | ✅ | ✅ | ❌ | ✅ | ❌ |
| | read | ✅ | ✅ | ✅ | ✅ | ✅ |
| | update | ✅ | ✅ | ❌ | ✅ | ❌ |
| | delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Media** |
| | upload | ✅ | ✅ | ❌ | ✅ | ❌ |
| | read | ✅ | ✅ | ✅ | ✅ | ✅ |
| | update | ✅ | ✅ | ❌ | ❌ | ❌ |
| | delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Form** |
| | create | ✅ | ✅ | ❌ | ❌ | ❌ |
| | read | ✅ | ✅ | ✅ | ❌ | ❌ |
| | update | ✅ | ✅ | ❌ | ❌ | ❌ |
| | delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| | view_submissions | ✅ | ✅ | ✅ | ❌ | ❌ |
| **A/B Test** |
| | create | ✅ | ✅ | ❌ | ❌ | ❌ |
| | read | ✅ | ✅ | ❌ | ❌ | ❌ |
| | update | ✅ | ✅ | ❌ | ❌ | ❌ |
| | start | ✅ | ✅ | ❌ | ❌ | ❌ |
| | stop | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Version** |
| | read | ✅ | ✅ | ✅ | ✅ | ✅ |
| | restore | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Audit** |
| | read | ✅ | ✅ | ✅ | ❌ | ❌ |
| | verify | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Role Management** |
| | assign | ✅ | ❌ | ❌ | ❌ | ❌ |
| | revoke | ✅ | ❌ | ❌ | ❌ | ❌ |

## Policy Examples (JSON)

```json
{
  "policies": [
    {
      "id": "author-own-pages",
      "role": "author",
      "resource": "page",
      "actions": ["create", "read", "update", "submit_review"],
      "conditions": {
        "createdBy": "{{ user.id }}"
      },
      "description": "Les auteurs peuvent gérer uniquement leurs propres pages"
    },
    {
      "id": "editor-publish-all",
      "role": "editor",
      "resource": "page",
      "actions": ["publish", "unpublish"],
      "conditions": {},
      "description": "Les éditeurs peuvent publier toutes les pages"
    },
    {
      "id": "reviewer-approve-review",
      "role": "reviewer",
      "resource": "page",
      "actions": ["approve", "reject"],
      "conditions": {
        "status": "REVIEW"
      },
      "description": "Les relecteurs peuvent approuver/rejeter les pages en review"
    },
    {
      "id": "super-admin-all",
      "role": "super_admin",
      "resource": "*",
      "actions": ["*"],
      "conditions": {},
      "description": "SuperAdmin a tous les droits"
    }
  ]
}
```

## 2FA Implementation

```typescript
// lib/auth/2fa.ts
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export async function generate2FASecret(userId: string, email: string) {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, 'Timepulse CMS', secret);

  // Generate QR code
  const qrCode = await QRCode.toDataURL(otpauthUrl);

  return { secret, qrCode, otpauthUrl };
}

export function verify2FAToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

export async function enable2FA(userId: string, secret: string, token: string) {
  // Verify token first
  if (!verify2FAToken(token, secret)) {
    throw new Error('Token invalide');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
    },
  });
}

export async function disable2FA(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.hashedPassword) {
    throw new Error('Utilisateur non trouvé');
  }

  const isValidPassword = await bcrypt.compare(password, user.hashedPassword);

  if (!isValidPassword) {
    throw new Error('Mot de passe invalide');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });
}
```

## Session Management

```typescript
// lib/auth/session.ts
import { prisma } from '@/lib/prisma';

export async function invalidateUserSessions(userId: string) {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

export async function getActiveSessions(userId: string) {
  return prisma.session.findMany({
    where: {
      userId,
      expires: { gt: new Date() },
    },
    orderBy: { expires: 'desc' },
  });
}

export async function revokeSession(sessionToken: string) {
  await prisma.session.delete({
    where: { sessionToken },
  });
}
```

## Initial Role Seed

```typescript
// prisma/seed-roles.ts
import { prisma } from '../lib/prisma';
import { ROLE_PERMISSIONS, ROLES } from '../lib/rbac/roles';

export async function seedRoles() {
  const roles = [
    {
      name: ROLES.SUPER_ADMIN,
      description: 'Accès complet au système',
      permissions: ROLE_PERMISSIONS.super_admin,
    },
    {
      name: ROLES.EDITOR,
      description: 'Création, édition et publication de contenu',
      permissions: ROLE_PERMISSIONS.editor,
    },
    {
      name: ROLES.REVIEWER,
      description: 'Review et approbation de contenu',
      permissions: ROLE_PERMISSIONS.reviewer,
    },
    {
      name: ROLES.AUTHOR,
      description: 'Création et édition de son propre contenu',
      permissions: ROLE_PERMISSIONS.author,
    },
    {
      name: ROLES.READER,
      description: 'Lecture seule',
      permissions: ROLE_PERMISSIONS.reader,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { permissions: role.permissions },
      create: role,
    });
  }

  console.log('✅ Roles seeded');
}
```
