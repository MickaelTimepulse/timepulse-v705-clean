import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Building2, Plus, Search, Mail, Phone, MapPinned, CheckCircle2, Edit2, AlertCircle, DollarSign } from 'lucide-react';
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
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/organizer/login');
        return;
      }

      const { data: organizerData, error: orgError } = await supabase
        .from('organizers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (orgError) throw orgError;
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
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex items-center space-x-3">
                {organizer.logo_file_url ? (
                  <img
                    src={organizer.logo_file_url}
                    alt={organizer.organization_name}
                    className="w-16 h-16 object-cover rounded-lg bg-white/20 backdrop-blur-sm"
                  />
                ) : (
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}
                {federations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {federations.slice(0, 3).map((fed: any) => (
                      fed.federations?.logo_url && (
                        <img
                          key={fed.federation_id}
                          src={fed.federations.logo_url}
                          alt={fed.federations.code}
                          className="w-12 h-12 object-contain bg-white/90 rounded-lg p-1"
                          title={fed.federations.name}
                        />
                      )
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{organizer.organization_name}</h1>
                <p className="text-pink-100 text-sm mb-4">
                  {organizer.organizer_type === 'association' && 'Association'}
                  {organizer.organizer_type === 'club' && 'Club'}
                  {organizer.organizer_type === 'federation' && 'Fédération'}
                  {organizer.organizer_type === 'company' && 'Entreprise'}
                  {organizer.organizer_type === 'municipality' && 'Municipalité'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {organizer.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{organizer.email}</span>
                    </div>
                  )}
                  {organizer.mobile_phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{organizer.mobile_phone}</span>
                    </div>
                  )}
                  {organizer.city && (
                    <div className="flex items-center space-x-2">
                      <MapPinned className="w-4 h-4" />
                      <span>{organizer.city} {organizer.postal_code}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right space-y-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                organizer.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {organizer.status === 'active' ? 'Actif' : organizer.status}
              </span>
              <button
                onClick={() => navigate('/organizer/profile')}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>Modifier mon profil</span>
              </button>
            </div>
          </div>

          {federations.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-sm font-medium mb-2">
                {federations.length === 1 ? 'Fédération affiliée' : 'Fédérations affiliées'} :
              </p>
              <div className="flex flex-wrap gap-2">
                {federations.map((fed: any) => (
                  <span
                    key={fed.federation_id}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm"
                  >
                    {fed.federations?.code}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Profil complété</p>
              <span className="text-2xl font-bold">{calculateCompletion(organizer)}%</span>
            </div>
            <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all ${
                  calculateCompletion(organizer) === 100
                    ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-400'
                }`}
                style={{ width: `${calculateCompletion(organizer)}%` }}
              ></div>
            </div>
            {calculateCompletion(organizer) === 100 ? (
              <div className="flex items-center text-green-100 text-sm">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Profil complet !
              </div>
            ) : (
              <div className="flex items-start space-x-2 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-pink-100">
                    Complétez votre profil pour accéder à toutes les fonctionnalités.
                    {!organizer.siret && ' Pensez à ajouter votre numéro SIRET.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

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
