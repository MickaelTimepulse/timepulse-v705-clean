import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import {
  ArrowLeft, Save, CheckCircle, XCircle, Edit2, Trash2,
  RefreshCw, Eye, Calendar, MapPin, Users, Award,
  AlertTriangle, Upload
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminExternalResultsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    loadEventAndResults();
  }, [id]);

  async function loadEventAndResults() {
    try {
      setLoading(true);

      const { data: eventsData, error: eventsError } = await supabase
        .rpc('admin_get_external_events');

      if (eventsError) throw eventsError;

      const eventData = eventsData?.find((e: any) => e.id === id);
      if (!eventData) throw new Error('Event not found');

      const { data: resultsData, error: resultsError } = await supabase
        .rpc('admin_get_external_results', {
          p_event_id: id
        });

      if (resultsError) throw resultsError;

      setEvent(eventData);
      setResults(resultsData || []);
    } catch (error) {
      console.error('Error loading event and results:', error);
      alert('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!confirm('Publier cet événement ? Les résultats seront visibles publiquement.')) {
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('external_events')
        .update({
          status: 'published',
          is_public: true
        })
        .eq('id', id);

      if (error) throw error;

      alert('Événement publié avec succès !');
      loadEventAndResults();
    } catch (error: any) {
      console.error('Error publishing event:', error);
      alert('Erreur : ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUnpublish() {
    if (!confirm('Repasser cet événement en brouillon ?')) {
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('external_events')
        .update({
          status: 'draft',
          is_public: false
        })
        .eq('id', id);

      if (error) throw error;

      alert('Événement repassé en brouillon');
      loadEventAndResults();
    } catch (error: any) {
      console.error('Error unpublishing event:', error);
      alert('Erreur : ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRecalculateRankings() {
    if (!confirm('Recalculer les classements pour cet événement ?')) {
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .rpc('recalculate_external_result_rankings', {
          p_event_id: id
        });

      if (error) throw error;

      alert('Classements recalculés avec succès !');
      loadEventAndResults();
    } catch (error: any) {
      console.error('Error recalculating rankings:', error);
      alert('Erreur : ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAllResults() {
    if (!confirm(`⚠️ ATTENTION ⚠️\n\nVoulez-vous supprimer TOUS les résultats de cet événement ?\n\nCette action est IRRÉVERSIBLE !\n\nNombre de résultats : ${results.length}`)) {
      return;
    }

    const confirmText = prompt('Pour confirmer, tapez "SUPPRIMER" en majuscules :');
    if (confirmText !== 'SUPPRIMER') {
      alert('Suppression annulée');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('external_results')
        .delete()
        .eq('external_event_id', id);

      if (error) throw error;

      alert('Tous les résultats ont été supprimés avec succès');
      loadEventAndResults();
    } catch (error: any) {
      console.error('Error deleting all results:', error);
      alert('Erreur : ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReimport() {
    navigate(`/admin/external-results/import?event_id=${id}`);
  }

  function startEdit(result: any) {
    setEditingId(result.id);
    setEditForm({ ...result });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit() {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('external_results')
        .update({
          bib_number: editForm.bib_number,
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          gender: editForm.gender,
          birth_year: editForm.birth_year,
          city: editForm.city,
          club: editForm.club,
          category: editForm.category,
          finish_time_display: editForm.finish_time_display,
          overall_rank: editForm.overall_rank,
          gender_rank: editForm.gender_rank,
          category_rank: editForm.category_rank,
        })
        .eq('id', editingId);

      if (error) throw error;

      alert('Résultat modifié avec succès');
      cancelEdit();
      loadEventAndResults();
    } catch (error: any) {
      console.error('Error saving result:', error);
      alert('Erreur : ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteResult(resultId: string) {
    if (!confirm('Supprimer ce résultat ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('external_results')
        .delete()
        .eq('id', resultId);

      if (error) throw error;

      alert('Résultat supprimé');
      loadEventAndResults();
    } catch (error: any) {
      console.error('Error deleting result:', error);
      alert('Erreur : ' + error.message);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Chargement...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout title="Événement introuvable">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Événement introuvable</p>
          <button
            onClick={() => navigate('/admin/external-results')}
            className="mt-4 text-purple-600 hover:text-purple-700"
          >
            Retour à la liste
          </button>
        </div>
      </AdminLayout>
    );
  }

  const statusBadge = event.status === 'published'
    ? 'bg-green-100 text-green-800'
    : event.status === 'archived'
    ? 'bg-gray-100 text-gray-800'
    : 'bg-yellow-100 text-yellow-800';

  return (
    <AdminLayout title={event.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/external-results')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRecalculateRankings}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recalculer classements</span>
            </button>

            <button
              onClick={handleReimport}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>Réimporter</span>
            </button>

            <button
              onClick={handleDeleteAllResults}
              disabled={saving || results.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer tous les résultats</span>
            </button>

            {event.status === 'draft' ? (
              <button
                onClick={handlePublish}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Publier</span>
              </button>
            ) : (
              <button
                onClick={handleUnpublish}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Dépublier</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.event_date).toLocaleDateString('fr-FR')}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{event.city}</span>
                </span>
                {event.distance_km && (
                  <span className="flex items-center space-x-1">
                    <Award className="w-4 h-4" />
                    <span>{event.distance_km} km</span>
                  </span>
                )}
              </div>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge}`}>
              {event.status === 'published' ? 'Publié' : event.status === 'archived' ? 'Archivé' : 'Brouillon'}
            </span>
          </div>

          {event.status === 'draft' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-900 font-medium">Cet événement est en brouillon</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Les résultats ne sont pas visibles publiquement. Vérifiez les données puis publiez l'événement.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total participants</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{results.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Finishers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {results.filter(r => r.status === 'finished').length}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">DNF</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {results.filter(r => r.status === 'dnf').length}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">DNS</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {results.filter(r => r.status === 'dns').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Résultats ({results.length})</h2>

          {results.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun résultat pour cet événement</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rang</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dossard</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sexe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Club</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temps</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      {editingId === result.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editForm.overall_rank || ''}
                              onChange={(e) => setEditForm({ ...editForm, overall_rank: parseInt(e.target.value) })}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editForm.bib_number || ''}
                              onChange={(e) => setEditForm({ ...editForm, bib_number: e.target.value })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={editForm.first_name || ''}
                                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Prénom"
                              />
                              <input
                                type="text"
                                value={editForm.last_name || ''}
                                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Nom"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={editForm.gender || ''}
                              onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">-</option>
                              <option value="M">M</option>
                              <option value="F">F</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editForm.category || ''}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editForm.club || ''}
                              onChange={(e) => setEditForm({ ...editForm, club: e.target.value })}
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editForm.finish_time_display || ''}
                              onChange={(e) => setEditForm({ ...editForm, finish_time_display: e.target.value })}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="HH:MM:SS"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{result.overall_rank || '-'}</span>
                              {result.gender_rank && (
                                <span className="text-xs text-gray-500">({result.gender_rank} {result.gender})</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{result.bib_number || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {result.first_name} {result.last_name}
                            </div>
                            {result.city && (
                              <div className="text-xs text-gray-500">{result.city}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{result.gender || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{result.category || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{result.club || '-'}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {result.finish_time_display || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => startEdit(result)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteResult(result.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
