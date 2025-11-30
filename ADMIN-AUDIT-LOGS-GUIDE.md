# 📋 Guide du Système de Logs d'Audit

## 🎯 Objectif

Le système de logs d'audit permet de **tracer toutes les actions** effectuées par les admins sur les comptes organisateurs et événements. Cela garantit une **traçabilité complète** et répond aux exigences de conformité.

---

## ✅ Fonctionnalités Implémentées

### **1. Fonctions de Logging PostgreSQL**

#### **`admin_log_organizer_action`**
Logger les actions des admins sur les organisateurs.

```sql
SELECT admin_log_organizer_action(
  'organizer-uuid'::uuid,           -- ID de l'organisateur
  'updated',                         -- Action (created, updated, deleted, etc.)
  'admin-uuid'::uuid,               -- ID de l'admin
  '{"field": "value"}'::jsonb,      -- Changements (optionnel)
  'Description de l''action'        -- Description (optionnel)
);
```

**Exemples d'actions** :
- `created` - Organisateur créé
- `updated` - Informations modifiées
- `password_reset` - Mot de passe réinitialisé
- `credentials_updated` - Identifiants modifiés
- `locked` - Compte verrouillé
- `unlocked` - Compte déverrouillé

#### **`admin_log_event_action`**
Logger les actions des admins sur les événements.

```sql
SELECT admin_log_event_action(
  'event-uuid'::uuid,               -- ID de l'événement
  'event_updated',                  -- Action
  'admin-uuid'::uuid,               -- ID de l'admin
  '{"name": {"from": "Ancien", "to": "Nouveau"}}'::jsonb,
  'Modification du nom de l''événement'
);
```

**Exemples d'actions** :
- `event_created` - Événement créé pour un organisateur
- `event_updated` - Événement modifié
- `event_deleted` - Événement supprimé
- `race_created` - Course ajoutée
- `race_updated` - Course modifiée
- `race_deleted` - Course supprimée

#### **`admin_get_audit_logs`**
Récupérer les logs avec filtres avancés.

```sql
SELECT * FROM admin_get_audit_logs(
  'admin-uuid'::uuid,               -- ID de l'admin demandeur
  'organizer',                      -- Type d'entité (optionnel)
  'organizer-uuid'::uuid,           -- ID de l'entité (optionnel)
  'admin',                          -- Type d'acteur (optionnel)
  'updated',                        -- Action (optionnel)
  100,                              -- Limite (défaut: 100)
  0                                 -- Offset (défaut: 0)
);
```

#### **`admin_get_entity_history`**
Récupérer l'historique complet d'une entité.

```sql
SELECT * FROM admin_get_entity_history(
  'admin-uuid'::uuid,               -- ID de l'admin demandeur
  'organizer',                      -- Type d'entité
  'organizer-uuid'::uuid            -- ID de l'entité
);
```

---

### **2. Service TypeScript** (`audit-service.ts`)

#### **Logger une action sur un organisateur**

```typescript
import { auditService } from '../lib/audit-service';

// Logger une modification
await auditService.logOrganizerAction(
  organizerId,
  'updated',
  adminId,
  {
    name: { from: 'Ancien nom', to: 'Nouveau nom' },
    email: { from: 'old@email.com', to: 'new@email.com' }
  },
  'Modification des informations de contact'
);
```

#### **Logger une action sur un événement**

```typescript
// Logger la création d'un événement pour un organisateur
await auditService.logEventAction(
  eventId,
  'event_created',
  adminId,
  {
    name: event.name,
    date: event.date,
    created_for: organizerId
  },
  'Création d\'un nouvel événement pour l\'organisateur'
);
```

#### **Récupérer les logs avec filtres**

```typescript
// Tous les logs
const allLogs = await auditService.getAuditLogs(adminId);

// Logs d'un organisateur spécifique
const organizerLogs = await auditService.getAuditLogs(adminId, {
  entity_type: 'organizer',
  entity_id: organizerId
});

// Actions de modification uniquement
const updateLogs = await auditService.getAuditLogs(adminId, {
  action: 'updated',
  limit: 50
});
```

#### **Récupérer l'historique d'une entité**

```typescript
// Historique complet d'un organisateur
const history = await auditService.getEntityHistory(
  adminId,
  'organizer',
  organizerId
);

// Historique d'un événement
const eventHistory = await auditService.getEntityHistory(
  adminId,
  'event',
  eventId
);
```

---

### **3. Interface Admin** (`/admin/audit-logs`)

#### **Accès**
- Menu Admin → **Administration** → **Journal d'Audit**
- Permission requise : `logs.view`

#### **Fonctionnalités**

✅ **Filtres Multiples** :
- Type d'entité (Organisateur, Événement, Course, etc.)
- Type d'acteur (Admin, Organisateur, Système)
- Action (Créé, Modifié, Supprimé, etc.)
- Recherche textuelle (nom, email)

✅ **Affichage des Logs** :
- Date et heure de l'action
- Type d'entité et nom
- Action effectuée
- Nom et email de l'acteur
- Description de l'action
- Détails des changements (expandable)

✅ **Export CSV** :
- Télécharger tous les logs affichés
- Format : Date, Type, Entité, Action, Acteur, Email, Description

✅ **Pagination** :
- 50 logs par page par défaut
- Bouton "Charger plus" pour les pages suivantes

---

## 🔧 Intégration dans les Pages Admin

### **Exemple : Page d'Édition d'Organisateur**

```typescript
import { auditService } from '../lib/audit-service';
import { useAuth } from '../contexts/AuthContext';

export default function AdminOrganizerEdit() {
  const { user } = useAuth();

  const handleSave = async (organizerId: string, oldData: any, newData: any) => {
    // 1. Sauvegarder les modifications
    const { error } = await supabase
      .from('organizers')
      .update(newData)
      .eq('id', organizerId);

    if (error) {
      console.error('Erreur:', error);
      return;
    }

    // 2. Logger l'action
    const changes: any = {};
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key]
        };
      }
    }

    await auditService.logOrganizerAction(
      organizerId,
      'updated',
      user!.id,
      changes,
      'Modification des informations de l\'organisateur'
    );

    // 3. Afficher un message de succès
    alert('Organisateur mis à jour avec succès');
  };

  // ... reste du composant
}
```

### **Exemple : Création d'Événement pour un Organisateur**

```typescript
const handleCreateEvent = async (organizerId: string, eventData: any) => {
  // 1. Créer l'événement
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      organizer_id: organizerId,
    })
    .select()
    .single();

  if (error || !event) {
    console.error('Erreur:', error);
    return;
  }

  // 2. Logger l'action
  await auditService.logEventAction(
    event.id,
    'event_created',
    user!.id,
    {
      event_name: event.name,
      event_date: event.date,
      organizer_id: organizerId
    },
    `Création de l'événement "${event.name}" pour l'organisateur`
  );

  alert('Événement créé avec succès');
};
```

### **Exemple : Réinitialisation de Mot de Passe**

```typescript
const handleResetPassword = async (organizerId: string, newPassword: string) => {
  // 1. Réinitialiser le mot de passe
  const { error } = await supabase.rpc('admin_reset_organizer_password', {
    p_organizer_id: organizerId,
    p_new_password: newPassword
  });

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  // 2. Logger l'action
  await auditService.logOrganizerAction(
    organizerId,
    'password_reset',
    user!.id,
    null,
    'Réinitialisation du mot de passe par un administrateur'
  );

  alert('Mot de passe réinitialisé');
};
```

---

## 📊 Structure des Logs

### **Table `audit_logs`**

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | ID unique du log |
| `entity_type` | text | Type d'entité (organizer, event, race, etc.) |
| `entity_id` | uuid | ID de l'entité modifiée |
| `action` | text | Action effectuée |
| `actor_type` | text | Type d'acteur (admin, organizer, system) |
| `actor_id` | uuid | ID de l'acteur |
| `actor_email` | text | Email de l'acteur |
| `changes` | jsonb | Détails des modifications |
| `ip_address` | inet | Adresse IP (optionnel) |
| `user_agent` | text | User agent (optionnel) |
| `created_at` | timestamptz | Date de l'action |

### **Format du Champ `changes`**

```json
{
  "changes": {
    "name": {
      "from": "Ancien nom",
      "to": "Nouveau nom"
    },
    "email": {
      "from": "old@email.com",
      "to": "new@email.com"
    }
  },
  "description": "Modification des informations de contact",
  "admin_name": "Jean Dupont",
  "organizer_id": "uuid-de-l-organisateur"
}
```

---

## 🔒 Sécurité et RLS

### **Politiques RLS sur `audit_logs`**

✅ **Lecture** :
- Les **admins** peuvent voir **tous les logs**
- Les **organisateurs** peuvent voir **uniquement** les logs de leurs événements
- Les **super admins** voient tout (bypass RLS)

❌ **Modification** :
- **Personne** ne peut modifier ou supprimer les logs
- Table **append-only** (insertion uniquement)
- Garantit l'**intégrité** de l'audit trail

### **Permissions Requises**

Pour accéder au Journal d'Audit :
- Permission : `logs.view`
- Module : `logs`

---

## 🎯 Cas d'Usage

### **1. Admin Aide un Organisateur**

**Contexte** : Un organisateur ne peut pas créer son événement. Un admin le fait pour lui.

**Actions** :
1. Admin crée l'événement dans l'interface admin
2. Système log automatiquement :
   ```typescript
   auditService.logEventAction(
     eventId,
     'event_created',
     adminId,
     { organizer_id: organizerId, event_name: "Marathon de Paris" },
     'Création d\'événement pour l\'organisateur à sa demande'
   );
   ```
3. L'organisateur voit dans son historique que l'événement a été créé par un admin
4. L'admin voit l'action dans le Journal d'Audit

### **2. Admin Modifie un Compte Organisateur**

**Contexte** : Un organisateur a besoin de changer son email mais n'y arrive pas.

**Actions** :
1. Admin modifie l'email dans `/admin/organizers`
2. Système log :
   ```typescript
   auditService.logOrganizerAction(
     organizerId,
     'updated',
     adminId,
     { email: { from: 'old@email.com', to: 'new@email.com' } },
     'Modification de l\'email à la demande de l\'organisateur'
   );
   ```
3. Log visible dans le Journal d'Audit
4. L'organisateur peut voir l'historique de son compte

### **3. Audit de Sécurité**

**Contexte** : Le super admin veut vérifier toutes les actions d'un admin spécifique.

**Actions** :
1. Aller dans `/admin/audit-logs`
2. Filtrer par **Type d'acteur : Admin**
3. Rechercher l'email de l'admin
4. Exporter en CSV pour analyse

---

## 📈 Statistiques et Rapports

### **Actions les Plus Fréquentes**

```sql
SELECT
  action,
  COUNT(*) as count
FROM audit_logs
WHERE actor_type = 'admin'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY action
ORDER BY count DESC;
```

### **Admins les Plus Actifs**

```sql
SELECT
  actor_email,
  actor_name,
  COUNT(*) as actions_count
FROM (
  SELECT
    actor_email,
    changes->>'admin_name' as actor_name
  FROM audit_logs
  WHERE actor_type = 'admin'
    AND created_at >= NOW() - INTERVAL '30 days'
) sub
GROUP BY actor_email, actor_name
ORDER BY actions_count DESC;
```

### **Organisateurs les Plus Modifiés**

```sql
SELECT
  o.name,
  COUNT(*) as modifications_count
FROM audit_logs al
JOIN organizers o ON al.entity_id = o.id
WHERE al.entity_type = 'organizer'
  AND al.action = 'updated'
  AND al.created_at >= NOW() - INTERVAL '30 days'
GROUP BY o.id, o.name
ORDER BY modifications_count DESC
LIMIT 10;
```

---

## ✅ Checklist d'Intégration

Quand vous ajoutez une fonctionnalité admin qui modifie des organisateurs ou événements :

- [ ] **Identifier les actions** à logger (créer, modifier, supprimer)
- [ ] **Appeler `auditService.logOrganizerAction`** après modification d'organisateur
- [ ] **Appeler `auditService.logEventAction`** après modification d'événement
- [ ] **Inclure les changements** dans le paramètre `changes`
- [ ] **Ajouter une description** claire de l'action
- [ ] **Tester** que le log apparaît dans `/admin/audit-logs`
- [ ] **Vérifier** que l'organisateur peut voir l'historique (si applicable)

---

## 🚀 État Actuel

### **✅ Implémenté**

- ✅ Table `audit_logs` avec RLS
- ✅ Fonctions PostgreSQL pour logging
- ✅ Service TypeScript `audit-service.ts`
- ✅ Page Admin `/admin/audit-logs`
- ✅ Filtres et recherche
- ✅ Export CSV
- ✅ Permissions `logs.view` et `logs.export`
- ✅ Documentation complète

### **🔜 À Faire**

- [ ] Intégrer le logging dans toutes les pages admin existantes
- [ ] Ajouter l'historique dans la page détail organisateur
- [ ] Ajouter l'historique dans la page détail événement
- [ ] Créer des rapports automatiques (emails hebdomadaires)
- [ ] Ajouter des alertes pour actions critiques
- [ ] Implémenter la rétention automatique (archivage après 3 ans)

---

## 📝 Notes Importantes

### **Immutabilité des Logs**

Les logs sont **immuables** par design :
- Aucune politique RLS pour `UPDATE` ou `DELETE`
- Garantit l'intégrité de l'audit trail
- Conformité GDPR et réglementations

### **Performance**

Des index sont créés pour optimiser les requêtes :
- `idx_audit_logs_entity` - Recherche par entité
- `idx_audit_logs_actor` - Recherche par acteur
- `idx_audit_logs_created` - Tri chronologique
- `idx_audit_logs_action` - Filtrage par action
- `idx_audit_logs_organizer_id` - Recherche par organisateur (GIN index sur JSONB)

### **Conformité**

Le système est conçu pour :
- **GDPR** - Traçabilité des accès et modifications
- **Audit de sécurité** - Qui a fait quoi et quand
- **Conformité légale** - Preuve d'actions administratives

---

Le système de logs d'audit est maintenant **opérationnel** et prêt à être intégré dans toutes les pages admin ! 🎉
