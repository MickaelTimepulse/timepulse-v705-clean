import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Building2, Plus, Search, Mail, Phone, MapPinned, CheckCircle2, Edit2, AlertCircle, DollarSign, Database, Upload } from 'lucide-react';
import OrganizerLayout from '../components/OrganizerLayout';
import { supabase } from '../lib/supabase';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [organizer, setOrganizer] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [federations, setFederations] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [statistics, setStatistics] = useState({
    totalRegistrations: 0,
    totalRevenue: 0,
    upcomingEvents: 0,
    activeEvents: 0
  });
  const [hasExternalResults, setHasExternalResults] = useState(false);

  useEffect(() => {
    loadOrganizerData();
  }, []);

  useEffect(() => {
    if (!organizer) return;

    const channel = supabase
      .channel('organizer:entries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entries'
        },
        (payload) => {
          console.log('Dashboard - Realtime entries event:', payload);
          loadOrganizerData();
        }
      )
      .subscribe((status) => {
        console.log('Dashboard - Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizer]);

  async function loadOrganizerData() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/organizer/login');
        return;
      }

      // Vérifier si c'est un admin
      const metadata = session.user.user_metadata;
      const isAdmin = metadata?.admin_id && metadata?.admin_role;

      console.log('[loadOrganizerData] User:', session.user.id, 'Is Admin:', isAdmin);

      if (isAdmin) {
        // Pour un admin, afficher un message explicite
        console.log('[loadOrganizerData] Admin detected - cannot show organizer dashboard');
        setOrganizer(null);
        setLoading(false);
        // Un admin ne devrait pas voir cette page, le rediriger vers admin
        navigate('/admin/events');
        return;
      }

      // Pour un organisateur classique
      const { data: organizerData, error: orgError } = await supabase
        .from('organizers')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (orgError) {
        console.error('[loadOrganizerData] Error loading organizer:', orgError);
        throw orgError;
      }

      console.log('[loadOrganizerData] Organizer loaded:', organizerData);
      setOrganizer(organizerData);

      const { data: orgFederations } = await supabase
        .from('organizer_federations')
        .select('federation_id, federations(code, name)')
        .eq('organizer_id', organizerData.id);

      setFederations(orgFederations || []);

      const { data: bankData } = await supabase
        .from('organizer_bank_details')
        .select('*')
        .eq('organizer_id', organizerData.id)
        .maybeSingle();

      setBankDetails(bankData);

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', organizerData.id)
        .order('start_date', { ascending: true });

      setEvents(eventsData || []);

      // Vérifier si l'organisateur a déjà publié des résultats externes
      const { data: externalEventsData } = await supabase
        .from('external_events')
        .select('id')
        .eq('organizer_id', organizerData.id)
        .limit(1);

      setHasExternalResults((externalEventsData && externalEventsData.length > 0) || false);

      if (eventsData && eventsData.length > 0) {
        const eventIds = eventsData.map(e => e.id);

        const { data: racesData } = await supabase
          .from('races')
          .select('id')
          .in('event_id', eventIds);

        if (racesData && racesData.length > 0) {
          const raceIds = racesData.map(r => r.id);

          const { data: entriesData } = await supabase
            .from('entries')
            .select('id, status')
            .in('race_id', raceIds)
            .eq('status', 'confirmed');

          const { data: registrationsData } = await supabase
            .from('registrations')
            .select('price_paid, status')
            .in('race_id', raceIds)
            .in('status', ['pending', 'confirmed']);

          const totalRegistrations = entriesData?.length || 0;
          let totalRevenue = 0;
          if (registrationsData && registrationsData.length > 0) {
            totalRevenue = registrationsData.reduce((sum, reg) => {
              const price = parseFloat(reg.price_paid || '0');
              return sum + (isNaN(price) ? 0 : price);
            }, 0);
          }

          const now = new Date();
          const upcomingEvents = eventsData.filter(e => new Date(e.start_date) > now).length;
          const activeEvents = eventsData.filter(e => e.status === 'published' || e.status === 'open').length;

          setStatistics({
            totalRegistrations,
            totalRevenue,
            upcomingEvents,
            activeEvents
          });
        }
      }
    } catch (error) {
      console.error('Error loading organizer data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <OrganizerLayout title="Module Organisateur">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </OrganizerLayout>
    );
  }

  if (!organizer) {
    return (
      <OrganizerLayout title="Module Organisateur">
        <div className="text-center py-12">
          <p className="text-red-600">Erreur: Organisateur non trouvé</p>
        </div>
      </OrganizerLayout>
    );
  }

  function calculateCompletion(org: any): number {
    const requiredFields = [
      org.organization_name,
      org.contact_name,
      org.email,
      org.mobile_phone,
      org.full_address,
      org.city,
      org.postal_code,
    ];

    const optionalFields = [
      org.siret,
      org.website,
      org.landline_phone,
      org.instagram_url,
      org.facebook_url,
      org.logo_file_url,
      federations.length > 0,
      bankDetails?.iban,
    ];

    const requiredFilled = requiredFields.filter(field => field && String(field).trim() !== '').length;
    const optionalFilled = optionalFields.filter(field => field && (typeof field === 'boolean' ? field : String(field).trim() !== '')).length;

    const requiredWeight = 0.7;
    const optionalWeight = 0.3;

    const requiredScore = (requiredFilled / requiredFields.length) * requiredWeight;
    const optionalScore = (optionalFilled / optionalFields.length) * optionalWeight;

    return Math.round((requiredScore + optionalScore) * 100);
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Brouillon', class: 'bg-gray-100 text-gray-800' },
      published: { label: 'Publié', class: 'bg-blue-100 text-blue-800' },
      open: { label: 'Ouvert', class: 'bg-green-100 text-green-800' },
      closed: { label: 'Fermé', class: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Annulé', class: 'bg-red-100 text-red-800' },
      completed: { label: 'Terminé', class: 'bg-gray-100 text-gray-800' },
    };
    const badge = badges[status as keyof typeof badges] || badges.published;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <OrganizerLayout title="Module Organisateur">
      <div className="space-y-6">
        {events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-pink-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Inscriptions totales</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.totalRegistrations}</p>
                </div>
                <div className="bg-pink-100 p-3 rounded-lg">
                  <Users className="w-8 h-8 text-pink-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Chiffre d'affaires</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.totalRevenue.toFixed(2)}€</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Événements actifs</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.activeEvents}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Événements à venir</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.upcomingEvents}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mes événements</h2>
            <p className="text-gray-600 mt-1">Gérez tous vos événements sportifs</p>
          </div>
          <button
            onClick={() => navigate('/organizer/events/create')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvel événement</span>
          </button>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 mb-6">
                <Calendar className="w-10 h-10 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Créez votre premier événement
              </h3>
              <p className="text-gray-600 mb-8">
                Commencez à gérer vos courses, trails et événements sportifs sur Timepulse.
                Configurez vos inscriptions, tarifs et options en quelques clics.
              </p>
              <button
                onClick={() => navigate('/organizer/events/create')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 shadow-lg text-lg font-medium"
              >
                <Plus className="w-6 h-6" />
                <span>Créer mon premier événement</span>
              </button>

              <div className="mt-8 pt-8 border-t border-gray-200">
                {!hasExternalResults && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-600 p-3 rounded-lg">
                        <Database className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">
                          Publiez vos résultats d'événements passés
                        </h4>
                        <p className="text-gray-700 mb-4">
                          Vous avez organisé des événements en dehors de Timepulse ? Publiez leurs résultats pour donner plus de visibilité à vos participants et alimenter leur profil athlète !
                        </p>
                        <ul className="text-sm text-gray-600 mb-4 space-y-1">
                          <li>✅ Visibilité sur Google</li>
                          <li>✅ Partage social pour vos participants</li>
                          <li>✅ Service 100% gratuit</li>
                        </ul>
                        <button
                          onClick={() => navigate('/organizer/external-results/import')}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          <Upload className="w-5 h-5" />
                          <span>Publier des résultats</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 mb-4">Besoin d'aide pour commencer ?</p>
                <div className="flex justify-center space-x-4">
                  <button className="text-pink-600 hover:text-pink-700 text-sm font-medium">
                    Voir le guide
                  </button>
                  <span className="text-gray-300">•</span>
                  <button className="text-pink-600 hover:text-pink-700 text-sm font-medium">
                    Contacter le support
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
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

            {!hasExternalResults && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        Résultats d'événements passés
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Publiez les résultats d'événements organisés en dehors de Timepulse pour augmenter votre visibilité
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate('/organizer/external-results/import')}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Publier des résultats</span>
                        </button>
                        <button
                          onClick={() => navigate('/organizer/external-results')}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                        >
                          <Database className="w-4 h-4" />
                          <span>Mes résultats publiés</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {events
                .filter(event =>
                  event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  event.location?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((event) => (
                  <div
                    key={event.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Calendar className="w-16 h-16 text-pink-400" />
                      )}
                      <div className="absolute top-4 right-4">
                        {getStatusBadge(event.status || 'published')}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.name}</h3>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(event.start_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {event.location}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/organizer/events/${event.id}`)}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 text-sm font-medium"
                        >
                          Gérer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </OrganizerLayout>
  );
}
