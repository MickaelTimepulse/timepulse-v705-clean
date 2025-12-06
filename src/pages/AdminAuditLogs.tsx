import { useState, useEffect } from 'react';
import { Shield, Filter, Search, Calendar, User, FileText, ChevronDown, ChevronUp, Download } from 'lucide-react';
import AdminLayout from '../components/Admin/AdminLayout';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute';
import { useAuth } from '../contexts/AuthContext';
import { auditService, AuditLog, AuditLogFilters } from '../lib/audit-service';

export default function AdminAuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
  });
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadLogs();
    }
  }, [user, filters]);

  const loadLogs = async () => {
    if (!user?.id) return;

    setLoading(true);
    const data = await auditService.getAuditLogs(user.id, filters);
    setLogs(data);
    setLoading(false);
  };

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0,
    }));
  };

  const clearFilters = () => {
    setFilters({
      limit: 50,
      offset: 0,
    });
    setSearchTerm('');
  };

  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Type', 'Entité', 'Action', 'Acteur', 'Email', 'Description'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString('fr-FR'),
        auditService.getEntityTypeLabel(log.entity_type),
        log.entity_name || log.entity_id,
        auditService.getActionLabel(log.action),
        log.actor_name || auditService.getActorTypeLabel(log.actor_type),
        log.actor_email || '',
        log.description || auditService.formatChangesSummary(log.changes),
      ].map(field => `"${field}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        if (link.parentNode === document.body) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error cleaning up download link:', err);
      }
    }, 100);
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.entity_name?.toLowerCase().includes(search) ||
      log.actor_name?.toLowerCase().includes(search) ||
      log.actor_email?.toLowerCase().includes(search) ||
      log.description?.toLowerCase().includes(search)
    );
  });

  const loadMore = () => {
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 50),
    }));
  };

  return (
    <ProtectedAdminRoute module="logs" permission="view" title="Journal d'Audit">
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Journal d'Audit
              </h1>
              <p className="text-gray-600 mt-1">
                Traçabilité complète des actions administratives
              </p>
            </div>

            <button
              onClick={exportLogs}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'entité
                </label>
                <select
                  value={filters.entity_type || ''}
                  onChange={(e) => handleFilterChange('entity_type', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tous</option>
                  <option value="organizer">Organisateurs</option>
                  <option value="event">Événements</option>
                  <option value="race">Courses</option>
                  <option value="entry">Inscriptions</option>
                  <option value="result">Résultats</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'acteur
                </label>
                <select
                  value={filters.actor_type || ''}
                  onChange={(e) => handleFilterChange('actor_type', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tous</option>
                  <option value="admin">Admins</option>
                  <option value="organizer">Organisateurs</option>
                  <option value="system">Système</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Toutes</option>
                  <option value="created">Créé</option>
                  <option value="updated">Modifié</option>
                  <option value="deleted">Supprimé</option>
                  <option value="password_reset">Mot de passe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recherche
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom, email..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {(filters.entity_type || filters.actor_type || filters.action || searchTerm) && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Chargement des logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucun log trouvé
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                            {auditService.getEntityTypeLabel(log.entity_type)}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                            {auditService.getActionLabel(log.action)}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(log.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {log.entity_name || log.entity_id.slice(0, 8)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>
                              {log.actor_name || auditService.getActorTypeLabel(log.actor_type)}
                            </span>
                            {log.actor_email && (
                              <span className="text-gray-400">({log.actor_email})</span>
                            )}
                          </div>
                        </div>

                        {log.description && (
                          <p className="mt-2 text-sm text-gray-600">{log.description}</p>
                        )}

                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <button
                            onClick={() => toggleExpanded(log.id)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            {expandedLogs.has(log.id) ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Masquer les détails
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Voir les détails
                              </>
                            )}
                          </button>
                        )}

                        {expandedLogs.has(log.id) && log.changes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <pre className="text-xs text-gray-700 overflow-x-auto">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && logs.length >= (filters.limit || 50) && (
              <div className="p-4 text-center border-t border-gray-200">
                <button
                  onClick={loadMore}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Charger plus de logs
                </button>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
