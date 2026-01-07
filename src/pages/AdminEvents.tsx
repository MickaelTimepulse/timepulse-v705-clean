import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Search, MapPin, Users as UsersIcon, Eye, Trash2 } from 'lucide-react';
import AdminLayout from '../components/Admin/AdminLayout';
import { supabase } from '../lib/supabase';

export default function AdminEvents() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, totalParticipants: 0 });

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      const { data: eventsData, error } = await supabase
        .rpc('admin_get_all_events');

      if (error) throw error;

      const eventsWithCounts = eventsData?.map((event: any) => ({
        ...event,
        participants: event.registration_count || 0,
        organizer_name: event.organizer_name
      })) || [];

      setEvents(eventsWithCounts);

      const total = eventsWithCounts.length;
      const published = eventsWithCounts.filter(e => e.status === 'published').length;
      const draft = eventsWithCounts.filter(e => e.status === 'draft').length;
      const totalParticipants = eventsWithCounts.reduce((sum, e) => sum + (e.participants || 0), 0);

      setStats({ total, published, draft, totalParticipants });
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEvent(eventId: string, eventName: string) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${eventName}" ?\n\nCette action est irréversible et supprimera toutes les inscriptions associées.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      alert('Événement supprimé avec succès');
      loadEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  }

  const filteredEvents = events.filter(event =>
    event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.organizer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Événements">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des événements</h1>
            <p className="text-gray-600 mt-1">Vue globale de tous les événements de la plateforme</p>
          </div>
          <button
            onClick={() => navigate('/admin/events/create')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
          >
            <Plus className="w-5 h-5" />
            <span>Créer un événement</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total événements</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Publiés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Brouillons</p>
                <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total inscrits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalParticipants}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des événements...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Aucun événement trouvé' : 'Aucun événement créé'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    event.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {event.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.name}</h3>
                <p className="text-xs text-gray-500 mb-2">Par: {event.organizer_name}</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.city}
                  </div>
                  <div className="flex items-center">
                    <UsersIcon className="w-4 h-4 mr-2" />
                    {event.participants} inscrits
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <button
                    onClick={() => window.open(`/events/${event.slug}`, '_blank')}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Voir
                  </button>
                  <button
                    onClick={async () => {
                      // Vérifier si l'admin a une session Supabase active
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) {
                        alert('⚠️ Vous devez vous déconnecter et vous reconnecter pour accéder à cette page.\n\nAllez dans votre profil admin (en haut à droite) puis cliquez sur "Déconnexion".');
                        return;
                      }
                      navigate(`/organizer/events/${event.id}`);
                    }}
                    className="text-pink-600 hover:text-pink-800 font-medium text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id, event.name)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
