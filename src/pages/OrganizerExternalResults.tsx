import { useState, useEffect } from 'react';
import OrganizerLayout from '../components/OrganizerLayout';
import { Upload, Plus, Eye, Edit2, Trash2, Search, Users, TrendingUp, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function OrganizerExternalResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalResults: 0,
    matchedAthletes: 0,
    averageMatchRate: 0,
  });

  useEffect(() => {
    if (user) {
      loadEvents();
      loadStats();
    }
  }, [user]);

  async function loadEvents() {
    try {
      setLoading(true);

      const { data: organizer } = await supabase
        .from('organizers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!organizer) {
        console.error('Organizer not found');
        return;
      }

      const { data, error } = await supabase
        .from('external_events')
        .select('*')
        .eq('organizer_id', organizer.id)
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading external events:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const { data: organizer } = await supabase
        .from('organizers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!organizer) return;

      const { data: eventsData } = await supabase
        .from('external_events')
        .select('id')
        .eq('organizer_id', organizer.id);

      const eventIds = eventsData?.map(e => e.id) || [];

      if (eventIds.length === 0) {
        setStats({
          totalEvents: 0,
          totalResults: 0,
          matchedAthletes: 0,
          averageMatchRate: 0,
        });
        return;
      }

      const { data: resultsData } = await supabase
        .from('external_results')
        .select('id, is_matched, matching_confidence')
        .in('external_event_id', eventIds);

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

  async function handleTogglePublish(eventId: string, currentStatus: string) {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const action = newStatus === 'published' ? 'publier' : 'dépublier';

    if (!confirm(`Voulez-vous ${action} cet événement ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('external_events')
        .update({ status: newStatus })
        .eq('id', eventId);

      if (error) throw error;

      alert(`Événement ${action === 'publier' ? 'publié' : 'dépublié'} avec succès`);
      loadEvents();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Erreur : ' + error.message);
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Résultats Externes</h1>
            <p className="text-gray-600 mt-1">Publiez les résultats d'événements non gérés sur Timepulse</p>
          </div>
          <button
            onClick={() => navigate('/organizer/external-results/import')}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Publier des résultats</span>
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Pourquoi publier vos résultats sur Timepulse ?</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✅ <strong>Visibilité accrue</strong> : Vos participants pourront consulter leurs résultats sur Timepulse</li>
                <li>✅ <strong>Référencement Google</strong> : Chaque résultat est indexé et améliore votre visibilité</li>
                <li>✅ <strong>Base de données nationale</strong> : Alimentez l'Index Timepulse et valorisez vos coureurs</li>
                <li>✅ <strong>Partage social</strong> : Les participants partagent leurs résultats sur les réseaux sociaux</li>
                <li>✅ <strong>Service gratuit</strong> : Aucun coût pour vous, valorisation pour vos participants</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Événements publiés</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEvents}</p>
              </div>
              <Database className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Résultats publiés</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalResults}</p>
              </div>
              <Upload className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Athlètes liés</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.matchedAthletes}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de liaison</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageMatchRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
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
                onClick={() => navigate('/organizer/external-results/import')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Publier vos premiers résultats
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
                          <div className="text-sm text-gray-500">{event.city}</div>
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
                            onClick={() => navigate(`/results/${event.slug}`)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Voir les résultats publics"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleMatchResults(event.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Lier les athlètes"
                          >
                            <Users className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => navigate(`/organizer/external-results/${event.id}/edit`)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Modifier"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleTogglePublish(event.id, event.status)}
                            className={`${event.status === 'published' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                            title={event.status === 'published' ? 'Dépublier' : 'Publier'}
                          >
                            {event.status === 'published' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
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
      </div>
    </OrganizerLayout>
  );
}
