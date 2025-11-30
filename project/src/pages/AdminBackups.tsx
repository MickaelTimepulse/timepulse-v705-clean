import { useState, useEffect } from 'react';
import { Database, Download, Copy, RefreshCw, AlertCircle, CheckCircle, Clock, Trash2, Eye, HardDrive } from 'lucide-react';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute';
import AdminLayout from '../components/Admin/AdminLayout';
import { supabase } from '../lib/supabase';

interface Backup {
  id: string;
  backup_type: string;
  status: string;
  file_path: string | null;
  file_size: number | null;
  tables_included: any;
  metadata: any;
  error_message: string | null;
  created_at: string;
  created_by: string | null;
}

export default function AdminBackups() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  async function fetchBackups() {
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackups(data || []);
    } catch (err) {
      console.error('Error fetching backups:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createManualBackup() {
    if (!confirm('Créer une nouvelle sauvegarde manuelle ?')) return;

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('backups')
        .insert({
          backup_type: 'manual',
          status: 'success',
          metadata: {
            description: 'Sauvegarde manuelle créée depuis l\'interface admin',
            timestamp: new Date().toISOString()
          },
          created_by: userData?.user?.id
        });

      if (error) throw error;

      alert('Sauvegarde créée avec succès');
      fetchBackups();
    } catch (err) {
      console.error('Error creating backup:', err);
      alert('Erreur lors de la création de la sauvegarde');
    }
  }

  async function duplicateBackup(backup: Backup) {
    if (!confirm('Dupliquer cette sauvegarde ?')) return;

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('backups')
        .insert({
          backup_type: backup.backup_type + '_copy',
          status: backup.status,
          file_path: backup.file_path,
          file_size: backup.file_size,
          tables_included: backup.tables_included,
          metadata: {
            ...backup.metadata,
            original_backup_id: backup.id,
            duplicated_at: new Date().toISOString()
          },
          created_by: userData?.user?.id
        });

      if (error) throw error;

      alert('Sauvegarde dupliquée avec succès');
      fetchBackups();
    } catch (err) {
      console.error('Error duplicating backup:', err);
      alert('Erreur lors de la duplication');
    }
  }

  async function deleteBackup(id: string) {
    if (!confirm('Supprimer cette sauvegarde ? Cette action est irréversible.')) return;

    try {
      const { error } = await supabase
        .from('backups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Sauvegarde supprimée');
      fetchBackups();
    } catch (err) {
      console.error('Error deleting backup:', err);
      alert('Erreur lors de la suppression');
    }
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <ProtectedAdminRoute module="backups" permission="view" title="Sauvegardes">
      <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-600" />
              Gestion des Sauvegardes
            </h1>
            <p className="text-gray-600 mt-1">Suivez et gérez les sauvegardes de la base de données</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchBackups}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Actualiser
            </button>
            <button
              onClick={createManualBackup}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <HardDrive className="w-5 h-5" />
              Nouvelle sauvegarde
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sauvegardes</p>
                <p className="text-3xl font-bold text-gray-900">{backups.length}</p>
              </div>
              <Database className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réussies</p>
                <p className="text-3xl font-bold text-green-600">
                  {backups.filter(b => b.status === 'success').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Échouées</p>
                <p className="text-3xl font-bold text-red-600">
                  {backups.filter(b => b.status === 'failed').length}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taille
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucune sauvegarde disponible</p>
                    </td>
                  </tr>
                ) : (
                  backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(backup.status)}
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(backup.status)}`}>
                            {backup.status === 'success' ? 'Réussie' :
                             backup.status === 'failed' ? 'Échouée' :
                             'En cours'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{backup.backup_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(backup.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(backup.created_at).toLocaleTimeString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(backup.file_size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedBackup(backup);
                              setShowDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateBackup(backup)}
                            className="text-green-600 hover:text-green-900"
                            title="Dupliquer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {backup.file_path && (
                            <button
                              className="text-purple-600 hover:text-purple-900"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteBackup(backup.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDetails && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Détails de la sauvegarde</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <p className="mt-1 text-gray-900">{selectedBackup.backup_type}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Statut</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedBackup.status)}`}>
                    {getStatusIcon(selectedBackup.status)}
                    {selectedBackup.status === 'success' ? 'Réussie' :
                     selectedBackup.status === 'failed' ? 'Échouée' :
                     'En cours'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Date de création</label>
                <p className="mt-1 text-gray-900">
                  {new Date(selectedBackup.created_at).toLocaleString('fr-FR', {
                    dateStyle: 'full',
                    timeStyle: 'long'
                  })}
                </p>
              </div>

              {selectedBackup.file_size && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Taille</label>
                  <p className="mt-1 text-gray-900">{formatFileSize(selectedBackup.file_size)}</p>
                </div>
              )}

              {selectedBackup.tables_included && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Tables incluses</label>
                  <pre className="mt-1 bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedBackup.tables_included, null, 2)}
                  </pre>
                </div>
              )}

              {selectedBackup.metadata && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Métadonnées</label>
                  <pre className="mt-1 bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedBackup.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedBackup.error_message && (
                <div>
                  <label className="text-sm font-medium text-red-700">Message d'erreur</label>
                  <p className="mt-1 text-red-600 bg-red-50 p-3 rounded">{selectedBackup.error_message}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  duplicateBackup(selectedBackup);
                  setShowDetails(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Dupliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
    </ProtectedAdminRoute>
  );
}
