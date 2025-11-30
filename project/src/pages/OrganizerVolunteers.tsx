import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, UserPlus, MapPin, Clock, AlertCircle, CheckCircle, Download, Mail, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OrganizerLayout from '../components/OrganizerLayout';
import VolunteerManualForm from '../components/VolunteerManualForm';
import VolunteerCSVImport from '../components/VolunteerCSVImport';

interface VolunteerPost {
  id: string;
  name: string;
  type: string;
  location_name: string;
  km_marker: number;
  start_time: string;
  end_time: string;
  required_volunteers_count: number;
  status: string;
  stats?: {
    assigned_count: number;
    confirmed_count: number;
    remaining_slots: number;
  };
}

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

export default function OrganizerVolunteers() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'posts' | 'volunteers' | 'planning'>('posts');
  const [posts, setPosts] = useState<VolunteerPost[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const { data: event } = await supabase
        .from('events')
        .select('name, volunteer_enabled')
        .eq('id', id)
        .single();

      if (event) {
        setEventName(event.name);
      }

      const { data: postsData } = await supabase
        .from('volunteer_posts')
        .select('*')
        .eq('event_id', id)
        .order('start_time');

      if (postsData) {
        const postsWithStats = await Promise.all(
          postsData.map(async (post) => {
            const { data: stats } = await supabase.rpc('get_volunteer_post_stats', {
              p_post_id: post.id
            });
            return { ...post, stats };
          })
        );
        setPosts(postsWithStats);
      }

      const { data: volunteersData } = await supabase
        .from('volunteers')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false });

      if (volunteersData) {
        setVolunteers(volunteersData);
      }

      const { data: summaryData } = await supabase.rpc('get_event_volunteer_summary', {
        p_event_id: id
      });

      if (summaryData) {
        setSummary(summaryData);
      }
    } catch (error) {
      console.error('Error loading volunteer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPostTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      ravitaillement: 'Ravitaillement',
      securite: 'Sécurité',
      signalisation: 'Signalisation',
      depart_arrivee: 'Départ/Arrivée',
      vestiaire: 'Vestiaire',
      retrait_dossards: 'Retrait Dossards',
      animation: 'Animation',
      secourisme: 'Secourisme',
      autre: 'Autre'
    };
    return types[type] || type;
  };

  const getPostTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ravitaillement: 'bg-blue-100 text-blue-800',
      securite: 'bg-red-100 text-red-800',
      signalisation: 'bg-yellow-100 text-yellow-800',
      depart_arrivee: 'bg-green-100 text-green-800',
      vestiaire: 'bg-purple-100 text-purple-800',
      retrait_dossards: 'bg-pink-100 text-pink-800',
      animation: 'bg-orange-100 text-orange-800',
      secourisme: 'bg-red-100 text-red-800',
      autre: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <OrganizerLayout title="Gestion des Bénévoles">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout title="Gestion des Bénévoles">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{eventName}</h2>
              <p className="text-gray-600 mt-1">Gérez vos bénévoles et postes</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/organizer/events/${id}/volunteers/post/new`}
                className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span>Créer un poste</span>
              </Link>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
            </div>
          </div>

          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Postes</p>
                    <p className="text-2xl font-bold text-blue-900">{summary.total_posts || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Bénévoles</p>
                    <p className="text-2xl font-bold text-green-900">{summary.total_volunteers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Affectations</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {summary.total_assigned || 0}/{summary.total_required || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Postes vides</p>
                    <p className="text-2xl font-bold text-orange-900">{summary.posts_empty || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('posts')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'posts'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Postes ({posts.length})
              </button>
              <button
                onClick={() => setActiveTab('volunteers')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'volunteers'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bénévoles ({volunteers.length})
              </button>
              <button
                onClick={() => setActiveTab('planning')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'planning'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Planning
              </button>
            </nav>
          </div>

          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Aucun poste créé pour le moment</p>
                  <Link
                    to={`/organizer/events/${id}/volunteers/post/new`}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Créer le premier poste</span>
                  </Link>
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-pink-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{post.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPostTypeColor(post.type)}`}>
                            {getPostTypeLabel(post.type)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                          {post.location_name && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {post.location_name}
                                {post.km_marker && ` (km ${post.km_marker})`}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatTime(post.start_time)} - {formatTime(post.end_time)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>
                              {post.stats?.assigned_count || 0} / {post.required_volunteers_count} bénévoles
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {post.stats && post.stats.remaining_slots === 0 ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                        )}
                        <Link
                          to={`/organizer/events/${id}/volunteers/post/${post.id}`}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Gérer
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'volunteers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-end space-x-3 mb-4">
                <button
                  onClick={() => setShowManualForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Ajouter un bénévole</span>
                </button>
                <button
                  onClick={() => setShowCSVImport(true)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importer CSV</span>
                </button>
              </div>

              {volunteers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Aucun bénévole inscrit pour le moment</p>
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={() => setShowManualForm(true)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Ajouter un bénévole</span>
                    </button>
                    <button
                      onClick={() => setShowCSVImport(true)}
                      className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Importer CSV</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {volunteers.map((volunteer) => (
                        <tr key={volunteer.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {volunteer.first_name} {volunteer.last_name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {volunteer.email}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {volunteer.phone}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                volunteer.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : volunteer.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {volunteer.status === 'confirmed'
                                ? 'Confirmé'
                                : volunteer.status === 'cancelled'
                                ? 'Annulé'
                                : 'En attente'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(volunteer.created_at)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <Link
                              to={`/organizer/events/${id}/volunteers/${volunteer.id}`}
                              className="text-pink-600 hover:text-pink-700 font-medium"
                            >
                              Voir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'planning' && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Vue planning à venir</p>
            </div>
          )}
        </div>
      </div>

      {showManualForm && id && (
        <VolunteerManualForm
          eventId={id}
          onClose={() => setShowManualForm(false)}
          onSuccess={() => {
            loadData();
            setShowManualForm(false);
          }}
        />
      )}

      {showCSVImport && id && (
        <VolunteerCSVImport
          eventId={id}
          onClose={() => setShowCSVImport(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </OrganizerLayout>
  );
}
