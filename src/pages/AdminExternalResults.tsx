import { useState, useEffect } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import { Upload, Plus, Eye, Trash2, Search, Filter, Users, TrendingUp, Database, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AdminExternalResults() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalResults: 0,
    matchedAthletes: 0,
    averageMatchRate: 0,
  });

  useEffect(() => {
    loadEvents();
    loadStats();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.email);

      const { data, error } = await supabase
        .rpc('admin_get_external_events');

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      console.log('External events loaded:', data?.length);
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading external events:', error);
      alert('Erreur lors du chargement des événements externes : ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const { data: eventsData } = await supabase
        .from('external_events')
        .select('id');

      const { data: resultsData } = await supabase
        .from('external_results')
        .select('id, is_matched, matching_confidence');

      const matchedResults = resultsData?.filter(r => r.is_matched) || [];
      const totalResults = resultsData?.length || 0;

      setStats({
        totalEvents: eventsData?.length || 0,
        totalResults,
        matchedAthletes: matchedResults.length,
        averageMatchRate: totalResults > 0 ? Math.round((matchedResults.length / totalResults) * 100) : 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement et tous ses résultats ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('external_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      alert('Événement supprimé avec succès');
      loadEvents();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      alert('Erreur lors de la suppression : ' + error.message);
    }
  }

  async function handleMatchResults(eventId: string) {
    if (!confirm('Lancer le matching automatique des athlètes pour cet événement ?')) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('batch_match_external_results', {
        p_event_id: eventId
      });

      if (error) throw error;

      alert(`Matching terminé !\n\nTotal : ${data.total}\nMatchés : ${data.matched} (${data.match_rate}%)\nNon matchés : ${data.unmatched}`);
      loadEvents();
      loadStats();
    } catch (error: any) {
      console.error('Error matching results:', error);
      alert('Erreur lors du matching : ' + error.message);
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.organizer_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout title="Résultats Externes">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Résultats Externes</h1>
            <p className="text-gray-600 mt-1">Importez des résultats d'événements non gérés sur Timepulse</p>
          </div>
          <button
            onClick={() => navigate('/admin/external-results/import')}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Importer des résultats</span>
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            ℹ️
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium">Événements non gérés par Timepulse</p>
            <p className="text-xs text-blue-700 mt-1">
              Ces résultats proviennent d'événements chronométrés par d'autres prestataires. Ils sont affichés sur Timepulse pour offrir plus de visibilité aux participants.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Événements</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEvents}</p>
              </div>
              <Database className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Résultats importés</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalResults}</p>
              </div>
              <Upload className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Athlètes matchés</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.matchedAthletes}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de matching</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageMatchRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un événement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-gray-600 mt-4">Chargement...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Aucun événement externe trouvé</p>
              <button
                onClick={() => navigate('/admin/external-results/import')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Importer vos premiers résultats
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Événement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lieu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{event.name}</div>
                          <div className="text-sm text-gray-500">{event.organizer_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(event.event_date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{event.city}</div>
                        {event.distance_km && (
                          <div className="text-sm text-gray-500">{event.distance_km} km</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{event.total_finishers} finishers</div>
                        {event.total_participants > 0 && (
                          <div className="text-sm text-gray-500">sur {event.total_participants} inscrits</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'archived'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.status === 'published' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {event.status === 'archived' && <XCircle className="w-3 h-3 mr-1" />}
                          {event.status === 'published' ? 'Publié' : event.status === 'archived' ? 'Archivé' : 'Brouillon'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/admin/external-results/${event.id}`)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Voir les résultats"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleMatchResults(event.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Matcher les athlètes"
                          >
                            <Users className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">À propos des résultats externes</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Importez des résultats d'événements non gérés sur Timepulse pour enrichir votre base de données</li>
            <li>• Le matching automatique associe les résultats aux profils athlètes existants (basé sur nom + prénom + date de naissance)</li>
            <li>• Les résultats publiés sont visibles publiquement et alimentent l'Index Timepulse</li>
            <li>• Les athlètes peuvent consulter leurs performances et les partager sur les réseaux sociaux</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
