import { supabase } from './supabase';

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  action: string;
  actor_type: string;
  actor_id: string;
  actor_email: string | null;
  actor_name: string | null;
  changes: any;
  description: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  entity_type?: string;
  entity_id?: string;
  actor_type?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export const auditService = {
  async logOrganizerAction(
    organizerId: string,
    action: string,
    adminId: string,
    changes?: any,
    description?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('admin_log_organizer_action', {
        p_organizer_id: organizerId,
        p_action: action,
        p_admin_id: adminId,
        p_changes: changes || null,
        p_description: description || null,
      });

      if (error) {
        console.error('Error logging organizer action:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to log organizer action:', err);
      return null;
    }
  },

  async logEventAction(
    eventId: string,
    action: string,
    adminId: string,
    changes?: any,
    description?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('admin_log_event_action', {
        p_event_id: eventId,
        p_action: action,
        p_admin_id: adminId,
        p_changes: changes || null,
        p_description: description || null,
      });

      if (error) {
        console.error('Error logging event action:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to log event action:', err);
      return null;
    }
  },

  async getAuditLogs(
    adminId: string,
    filters: AuditLogFilters = {}
  ): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase.rpc('admin_get_audit_logs', {
        p_admin_id: adminId,
        p_entity_type: filters.entity_type || null,
        p_entity_id: filters.entity_id || null,
        p_actor_type: filters.actor_type || null,
        p_action: filters.action || null,
        p_limit: filters.limit || 100,
        p_offset: filters.offset || 0,
      });

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      return [];
    }
  },

  async getEntityHistory(
    adminId: string,
    entityType: string,
    entityId: string
  ): Promise<Omit<AuditLog, 'entity_type' | 'entity_id' | 'entity_name'>[]> {
    try {
      const { data, error } = await supabase.rpc('admin_get_entity_history', {
        p_admin_id: adminId,
        p_entity_type: entityType,
        p_entity_id: entityId,
      });

      if (error) {
        console.error('Error fetching entity history:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch entity history:', err);
      return [];
    }
  },

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      created: 'Créé',
      updated: 'Modifié',
      deleted: 'Supprimé',
      locked: 'Verrouillé',
      unlocked: 'Déverrouillé',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      published: 'Publié',
      unpublished: 'Dépublié',
      password_reset: 'Réinitialisation mot de passe',
      credentials_updated: 'Identifiants modifiés',
      status_changed: 'Statut modifié',
      event_created: 'Événement créé',
      event_updated: 'Événement modifié',
      event_deleted: 'Événement supprimé',
      race_created: 'Course créée',
      race_updated: 'Course modifiée',
      race_deleted: 'Course supprimée',
    };

    return labels[action] || action;
  },

  getEntityTypeLabel(entityType: string): string {
    const labels: Record<string, string> = {
      organizer: 'Organisateur',
      event: 'Événement',
      race: 'Course',
      entry: 'Inscription',
      result: 'Résultat',
      registration: 'Inscription',
      payment: 'Paiement',
    };

    return labels[entityType] || entityType;
  },

  getActorTypeLabel(actorType: string): string {
    const labels: Record<string, string> = {
      admin: 'Admin',
      organizer: 'Organisateur',
      system: 'Système',
      public: 'Public',
    };

    return labels[actorType] || actorType;
  },

  formatChangesSummary(changes: any): string {
    if (!changes) return '';

    if (changes.description) {
      return changes.description;
    }

    if (changes.changes) {
      const changesList = [];
      const changesObj = changes.changes;

      for (const [key, value] of Object.entries(changesObj)) {
        if (typeof value === 'object' && value !== null && 'from' in value && 'to' in value) {
          const v = value as { from: any; to: any };
          changesList.push(`${key}: "${v.from}" → "${v.to}"`);
        }
      }

      return changesList.join(', ');
    }

    return '';
  },
};
