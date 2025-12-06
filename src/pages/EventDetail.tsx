import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, ExternalLink, Mountain, Users, Clock, TrendingUp, List, Tag, FileText, X } from 'lucide-react';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import { supabase } from '../lib/supabase';
import ElevationProfile from '../components/ElevationProfile';
import { parseGPXFile, type GPXData } from '../lib/gpx-parser';
import { getSportImage, getSportLabel, type SportType } from '../lib/sport-images';
import CarpoolingSection from '../components/CarpoolingSection';
import EventCharacteristicsBadges from '../components/EventCharacteristicsBadges';
import EventPartnersSection from '../components/EventPartnersSection';

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<any>(null);
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gpxData, setGpxData] = useState<{[key: string]: GPXData}>({});
  const [registrationCounts, setRegistrationCounts] = useState<{[key: string]: number}>({});
  const [bibExchangeEnabled, setBibExchangeEnabled] = useState(false);
  const [bibExchangeListingsCount, setBibExchangeListingsCount] = useState(0);
  const [characteristics, setCharacteristics] = useState<any[]>([]);
  const [showRegulationsModal, setShowRegulationsModal] = useState(false);
  const [selectedRaceRegulations, setSelectedRaceRegulations] = useState<{name: string, content: string} | null>(null);

  useEffect(() => {
    loadEvent();
  }, [slug]);

  useEffect(() => {
    if (!event || races.length === 0) return;

    const raceIds = races.map(r => r.id);

    const channel = supabase
      .channel('public:entries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entries'
        },
        (payload) => {
          console.log('Realtime entries event:', payload);
          if (payload.new && 'race_id' in payload.new && raceIds.includes(payload.new.race_id)) {
            loadRegistrationCounts(races);
          } else if (payload.old && 'race_id' in payload.old && raceIds.includes(payload.old.race_id)) {
            loadRegistrationCounts(races);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event, races]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (eventError) throw eventError;
      if (!eventData) {
        setError('Événement non trouvé');
        setLoading(false);
        return;
      }

      setEvent(eventData);

      const { data: racesData, error: racesError } = await supabase
        .from('races')
        .select('*')
        .eq('event_id', eventData.id)
        .eq('status', 'active')
        .order('distance', { ascending: true });

      if (racesError) throw racesError;

      setRaces(racesData || []);

      for (const race of racesData || []) {
        if (race.gpx_file_path) {
          await loadGPXData(race.id, race.gpx_file_path);
        }
      }

      await loadRegistrationCounts(racesData || []);
      await loadBibExchangeData(eventData.id);
      await loadCharacteristics(eventData.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCharacteristics = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_characteristics')
        .select(`
          id,
          characteristic_type:event_characteristic_types(
            id,
            code,
            name,
            icon,
            color
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      const characteristics = data?.map(item => item.characteristic_type).filter(Boolean) || [];
      setCharacteristics(characteristics);
    } catch (err) {
      console.error('Error loading characteristics:', err);
    }
  };

  const loadBibExchangeData = async (eventId: string) => {
    try {
      const { data: settingsData } = await supabase
        .from('bib_exchange_settings')
        .select('is_enabled, transfer_deadline')
        .eq('event_id', eventId)
        .eq('is_enabled', true)
        .maybeSingle();

      if (settingsData) {
        const now = new Date();
        const deadline = settingsData.transfer_deadline ? new Date(settingsData.transfer_deadline) : null;

        const isBeforeDeadline = !deadline || now < deadline;

        if (isBeforeDeadline) {
          setBibExchangeEnabled(true);

          const { count } = await supabase
            .from('bib_exchange_listings')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .eq('status', 'available');

          setBibExchangeListingsCount(count || 0);
        }
      }
    } catch (error) {
      console.error('Error loading bib exchange data:', error);
    }
  };

  const loadGPXData = async (raceId: string, filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('organizer-logos')
        .download(filePath);

      if (error) throw error;

      const gpxText = await data.text();
      const parsed = parseGPXFile(gpxText);

      setGpxData((prev) => ({
        ...prev,
        [raceId]: parsed,
      }));
    } catch (err) {
      console.error('Error loading GPX:', err);
    }
  };

  const loadRegistrationCounts = async (racesList: any[]) => {
    const counts: {[key: string]: number} = {};

    for (const race of racesList) {
      const { data: entriesData } = await supabase
        .from('entries')
        .select('id')
        .eq('race_id', race.id)
        .eq('status', 'confirmed');

      counts[race.id] = entriesData?.length || 0;
    }

    setRegistrationCounts(counts);
  };

  const isRegistrationOpen = (event: any) => {
    if (!event.registration_opens) return false;
    const now = new Date();
    const openDate = new Date(event.registration_opens);

    if (!event.registration_closes) {
      return now >= openDate;
    }

    const closeDate = new Date(event.registration_closes);
    return now >= openDate && now <= closeDate;
  };

  const isRaceFull = (race: any) => {
    if (!race.max_participants) return false;
    const currentCount = registrationCounts[race.id] || 0;
    return currentCount >= race.max_participants;
  };

  const canRegisterForRace = (race: any) => {
    return registrationOpen && !isRaceFull(race);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">Chargement...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-red-600">{error || 'Événement non trouvé'}</div>
        </div>
        <Footer />
      </div>
    );
  }

  const registrationOpen = isRegistrationOpen(event);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {event.image_url && (
        <div className="relative h-96 overflow-hidden">
          <img
            src={event.image_url}
            alt={event.name}
            className="w-full h-full object-cover"
            style={{
              objectPosition: `${event.image_position_x || 50}% ${event.image_position_y || 50}%`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{event.name}</h1>
              <div className="flex flex-wrap gap-4 text-white/90 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{event.city} ({event.postal_code})</span>
                </div>
              </div>
              {characteristics.length > 0 && (
                <EventCharacteristicsBadges characteristics={characteristics} size="md" maxDisplay={5} />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {!event.image_url && (
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.name}</h1>
                <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{event.city} ({event.postal_code})</span>
                  </div>
                </div>
                {characteristics.length > 0 && (
                  <EventCharacteristicsBadges characteristics={characteristics} size="md" maxDisplay={5} />
                )}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">À propos de l'événement</h2>
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                {event.description ? (
                  event.description.split('\n').map((paragraph: string, index: number) => (
                    <p key={index} className="mb-4 whitespace-pre-wrap">{paragraph}</p>
                  ))
                ) : (
                  <p className="text-gray-500 italic">Aucune description disponible.</p>
                )}
              </div>
            </div>

            {/* Partners Section */}
            <EventPartnersSection eventId={event.id} />

            {event.full_address && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Lieu & Co-voiturage</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Adresse</h3>
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{event.full_address}</p>
                        <p className="mb-3">{event.postal_code} {event.city}</p>
                        <a
                          href={`https://waze.com/ul?q=${encodeURIComponent(`${event.full_address}, ${event.city} ${event.postal_code}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-[#33CCFF] text-white rounded-lg hover:bg-[#2BB8E8] transition-colors text-sm font-medium"
                        >
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                          Ouvrir dans Waze
                        </a>
                      </div>
                    </div>
                  </div>

                  {event.carpooling_enabled && (
                    <div className="border-l border-gray-200 pl-6">
                      <CarpoolingSection eventId={event.id} carpoolingEnabled={event.carpooling_enabled} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {event.carpooling_enabled && !event.full_address && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <CarpoolingSection eventId={event.id} carpoolingEnabled={event.carpooling_enabled} />
              </div>
            )}

            {event.contact_email && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
                <div className="space-y-2 text-gray-600">
                  {event.contact_email && (
                    <p>
                      <span className="font-medium">Email :</span>{' '}
                      <a href={`mailto:${event.contact_email}`} className="text-pink-600 hover:text-pink-700">
                        {event.contact_email}
                      </a>
                    </p>
                  )}
                  {event.contact_phone && (
                    <p>
                      <span className="font-medium">Téléphone :</span>{' '}
                      <a href={`tel:${event.contact_phone}`} className="text-pink-600 hover:text-pink-700">
                        {event.contact_phone}
                      </a>
                    </p>
                  )}
                  {event.website && (
                    <p>
                      <a
                        href={event.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-700 inline-flex items-center gap-1"
                      >
                        Site web de l'événement
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-4 order-first lg:order-last">
            {races.length > 0 && (
              <>
                {races.map((race) => (
                  <div
                    key={race.id}
                    className="relative bg-white rounded-xl shadow-lg overflow-hidden"
                    style={{
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url(${getSportImage(race.sport_type as SportType)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="p-5 text-white">
                      <h3 className="text-xl font-bold mb-3">{race.name}</h3>

                      <div className="space-y-2 mb-4">
                        {race.distance && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mountain className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">{race.distance} km</span>
                          </div>
                        )}

                        {race.elevation_gain && (
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">D+ {race.elevation_gain} m</span>
                          </div>
                        )}

                        {race.start_time && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">
                              {new Date(`2000-01-01T${race.start_time}`).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}

                        {race.max_participants && (
                          <div className="text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">{registrationCounts[race.id] || 0} / {race.max_participants}</span>
                              </div>
                              <span className="text-xs font-semibold">{Math.round(((registrationCounts[race.id] || 0) / race.max_participants) * 100)}%</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-1.5">
                              <div
                                className="bg-white h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(((registrationCounts[race.id] || 0) / race.max_participants) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {(gpxData[race.id] || race.elevation_profile) && (
                        <div className="mb-4">
                          <ElevationProfile
                            data={gpxData[race.id] || race.elevation_profile}
                            height={80}
                            compact={true}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        {race.regulations && (
                          <button
                            onClick={() => {
                              setSelectedRaceRegulations({name: race.name, content: race.regulations});
                              setShowRegulationsModal(true);
                            }}
                            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg text-center transition-all duration-200 text-sm flex items-center justify-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Règlement sportif
                          </button>
                        )}

                        {isRaceFull(race) ? (
                          <div
                            className="block w-full font-bold py-2.5 px-4 rounded-lg text-center text-sm backdrop-blur-md shadow-lg transition-all duration-300"
                            style={{
                              background: 'linear-gradient(135deg, #dc262615 0%, #dc262625 100%)',
                              border: '2px solid #dc2626',
                              color: 'white',
                              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                          >
                            Course complète
                          </div>
                        ) : canRegisterForRace(race) ? (
                          event.public_registration ? (
                            <Link
                              to={`/events/${event.id}/register?race=${race.id}`}
                              className="block w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-2.5 px-4 rounded-lg text-center transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                            >
                              S'inscrire
                            </Link>
                          ) : (
                            <a
                              href={event.registration_url || '#'}
                              target={event.registration_url ? "_blank" : "_self"}
                              rel="noopener noreferrer"
                              className="block w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-2.5 px-4 rounded-lg text-center transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                            >
                              S'inscrire
                            </a>
                          )
                        ) : (
                          <div
                            className="block w-full font-bold py-2.5 px-4 rounded-lg text-center text-sm backdrop-blur-md shadow-lg transition-all duration-300"
                            style={{
                              background: 'linear-gradient(135deg, #78716c15 0%, #78716c25 100%)',
                              border: '2px solid #78716c',
                              color: 'white',
                              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                          >
                            Inscriptions fermées
                          </div>
                        )}

                        {race.show_public_entries_list && (
                          <Link
                            to={`/events/${event.slug}/races/${race.id}/entries`}
                            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2.5 px-4 rounded-lg text-center transition-all duration-200 text-sm flex items-center justify-center gap-2"
                          >
                            <List className="w-4 h-4" />
                            Liste des inscrits
                          </Link>
                        )}

                        {bibExchangeEnabled && (
                          <Link
                            to={`/events/${event.id}/bib-exchange`}
                            className="block w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-2.5 px-4 rounded-lg text-center transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <Tag className="w-4 h-4" />
                            Bourse aux dossards
                            {bibExchangeListingsCount > 0 && (
                              <span className="bg-white text-pink-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                {bibExchangeListingsCount}
                              </span>
                            )}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {showRegulationsModal && selectedRaceRegulations && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-500 to-blue-600">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Règlement sportif - {selectedRaceRegulations.name}
              </h2>
              <button
                onClick={() => {
                  setShowRegulationsModal(false);
                  setSelectedRaceRegulations(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div
                className="prose prose-lg max-w-none
                  [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-gray-900 [&>h1]:mb-4
                  [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mt-8 [&>h2]:mb-4
                  [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-gray-800 [&>h3]:mt-6 [&>h3]:mb-3
                  [&>p]:text-gray-700 [&>p]:leading-relaxed [&>p]:mb-4
                  [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ul]:text-gray-700
                  [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>ol]:text-gray-700
                  [&>li]:mb-2
                  [&>strong]:font-semibold [&>strong]:text-gray-900
                  [&>em]:italic [&>em]:text-gray-700
                  [&>a]:text-blue-600 [&>a]:underline [&>a]:hover:text-blue-800"
                dangerouslySetInnerHTML={{ __html: selectedRaceRegulations.content }}
              />
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end bg-gray-50">
              <button
                onClick={() => {
                  setShowRegulationsModal(false);
                  setSelectedRaceRegulations(null);
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
