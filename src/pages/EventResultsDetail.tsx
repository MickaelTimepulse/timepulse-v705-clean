import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, ArrowLeft, TrendingUp, Users, Award, Activity } from 'lucide-react';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import { supabase } from '../lib/supabase';
import { getSportImage } from '../lib/sport-images';

interface Event {
  id: string;
  name: string;
  slug: string;
  city: string;
  start_date: string;
  image_url: string | null;
  event_type: string;
}

interface Race {
  id: string;
  name: string;
  distance: number;
  sport_type: string;
  result_count: number;
  slug?: string;
}

interface EventStats {
  total_results: number;
  by_gender: { male: number; female: number };
  by_age_group: { [key: string]: number };
  by_license: { [key: string]: number };
  by_race: { [key: string]: number };
}

export default function EventResultsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [stats, setStats] = useState<EventStats>({
    total_results: 0,
    by_gender: { male: 0, female: 0 },
    by_age_group: {},
    by_license: {},
    by_race: {}
  });
  const [uniqueAthletes, setUniqueAthletes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadEventData();
    }
  }, [slug]);

  async function loadEventData() {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, name, slug, city, start_date, image_url, event_type')
        .eq('slug', slug)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      const { data: racesData, error: racesError } = await supabase
        .from('races')
        .select('id, name, distance, sport_type, slug')
        .eq('event_id', eventData.id);

      if (racesError) throw racesError;

      const racesWithCounts = await Promise.all(
        (racesData || []).map(async (race) => {
          const { count } = await supabase
            .from('results')
            .select('id', { count: 'exact', head: true })
            .eq('race_id', race.id)
            .eq('status', 'finished');

          return {
            ...race,
            result_count: count || 0
          };
        })
      );

      setRaces(racesWithCounts);

      const { data: statsData, error: statsError } = await supabase.rpc('get_event_statistics', {
        p_event_id: eventData.id
      });

      if (statsError) {
        console.error('Error loading stats via RPC:', statsError);

        let allResults: any[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data: results, error: resultsError } = await supabase
            .from('results')
            .select(`
              id,
              gender,
              category,
              race_id,
              status,
              athlete_name,
              races!inner(id, name, sport_type, event_id)
            `)
            .eq('races.event_id', eventData.id)
            .eq('status', 'finished')
            .range(from, from + pageSize - 1);

          if (resultsError) throw resultsError;

          if (results && results.length > 0) {
            allResults = [...allResults, ...results];
            from += pageSize;
            hasMore = results.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        console.log('Total event results loaded:', allResults.length);

        const uniqueAthletesSet = new Set(allResults.map((r: any) => r.athlete_name).filter(Boolean));
        setUniqueAthletes(uniqueAthletesSet);

        const eventStats: EventStats = {
          total_results: allResults.length,
          by_gender: { male: 0, female: 0 },
          by_age_group: {},
          by_license: {},
          by_race: {}
        };

        allResults.forEach((result: any) => {
          if (result.gender === 'M') eventStats.by_gender.male++;
          else if (result.gender === 'F') eventStats.by_gender.female++;

          if (result.category) {
            const category = result.category;
            eventStats.by_age_group[category] = (eventStats.by_age_group[category] || 0) + 1;
          }

          if (result.races?.name) {
            const raceName = result.races.name;
            eventStats.by_race[raceName] = (eventStats.by_race[raceName] || 0) + 1;
          }
        });

        setStats(eventStats);
      } else {
        const uniqueAthletesSet = new Set<string>();
        for (let i = 0; i < (statsData.unique_athletes || 0); i++) {
          uniqueAthletesSet.add(`athlete_${i}`);
        }
        setUniqueAthletes(uniqueAthletesSet);

        const eventStats: EventStats = {
          total_results: statsData.total_results || 0,
          by_gender: statsData.by_gender || { male: 0, female: 0 },
          by_age_group: statsData.by_age_group || {},
          by_license: statsData.by_license || {},
          by_race: statsData.by_race || {}
        };

        setStats(eventStats);
      }
    } catch (err) {
      console.error('Error loading event data:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getSportColor = (sportType: string) => {
    const colors: { [key: string]: string } = {
      'running': 'bg-blue-500',
      'trail': 'bg-green-600',
      'triathlon': 'bg-purple-600',
      'cycling': 'bg-yellow-500',
      'swimming': 'bg-cyan-500',
      'obstacle': 'bg-red-600',
      'walking': 'bg-teal-500',
      'other': 'bg-gray-600'
    };
    return colors[sportType] || colors['other'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600">Chargement...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600">Événement non trouvé</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/resultats"
          className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux résultats
        </Link>

        <div className="relative rounded-xl shadow-lg overflow-hidden mb-8 min-h-[400px] sm:min-h-[450px]">
          {/* Image de fond */}
          <div className="absolute inset-0">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <Calendar className="w-24 h-24 text-gray-600" />
              </div>
            )}
            {/* Overlay sombre */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
          </div>

          {/* Contenu sur l'image */}
          <div className="relative z-10 p-6 sm:p-8 text-white">
            {/* En-tête avec titre et type de sport */}
            <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-3">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-5xl font-bold mb-3 drop-shadow-lg leading-tight">
                  {event.name}
                </h1>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-pink-400" />
                    <span className="text-base sm:text-lg">{formatDate(event.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    <span className="text-base sm:text-lg">{event.city}</span>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right group">
                <div className="text-xl sm:text-2xl font-bold tracking-wider bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%] transition-all duration-300 group-hover:scale-105 drop-shadow-lg">
                  Timepulse
                </div>
                <div className="text-xs text-pink-200 uppercase tracking-wide opacity-90 transition-opacity duration-300 group-hover:opacity-100">
                  Chronométrage
                </div>
              </div>
            </div>

            {/* Statistiques en overlay avec style caractéristiques */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-pink-400" />
                <h2 className="text-xl sm:text-2xl font-bold drop-shadow-lg">Statistiques de l'Événement</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-5 h-5 text-pink-400" />
                    <div className="text-xs text-white/70 uppercase tracking-wide font-medium">Résultats</div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold">{stats.total_results.toLocaleString()}</div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-blue-400" />
                    <div className="text-xs text-white/70 uppercase tracking-wide font-medium">Participants</div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold">{uniqueAthletes.size.toLocaleString()}</div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-5 h-5 text-green-400" />
                    <div className="text-xs text-white/70 uppercase tracking-wide font-medium">Épreuves</div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold">{races.length}</div>
                </div>
              </div>
            </div>

            {/* Statistiques Par Genre */}
            <div className="col-span-2 sm:col-span-4 mt-4">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                Par Genre
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                  <div className="text-sm text-white/70 mb-1">Hommes</div>
                  <div className="text-xl font-bold">
                    {stats.by_gender.male.toLocaleString()}
                    <span className="text-sm text-white/60 ml-2">
                      ({stats.total_results > 0 ? ((stats.by_gender.male / stats.total_results) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                  <div className="text-sm text-white/70 mb-1">Femmes</div>
                  <div className="text-xl font-bold">
                    {stats.by_gender.female.toLocaleString()}
                    <span className="text-sm text-white/60 ml-2">
                      ({stats.total_results > 0 ? ((stats.by_gender.female / stats.total_results) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistiques Par Épreuve */}
            {Object.keys(stats.by_race).length > 0 && (
              <div className="col-span-2 sm:col-span-4 mt-4">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-400" />
                  Par Épreuve
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(stats.by_race).map(([race, count]) => (
                    <div key={race} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                      <div className="text-sm text-white/70 mb-1 truncate" title={race}>{race}</div>
                      <div className="text-xl font-bold">
                        {count.toLocaleString()}
                        <span className="text-sm text-white/60 ml-2">
                          ({stats.total_results > 0 ? ((count / stats.total_results) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Résultats par Épreuve</h2>

          {races.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun résultat disponible pour cet événement</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {races.map((race) => (
                <Link
                  key={race.id}
                  to={`/races/${race.slug || race.id}/results`}
                  className="relative rounded-xl shadow-lg overflow-hidden min-h-[280px] hover:shadow-2xl transition-all duration-300 group"
                >
                  {/* Image de fond */}
                  <div className="absolute inset-0">
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${event.image_url || getSportImage(race.sport_type as any)})`
                      }}
                    />
                    {/* Overlay sombre */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 group-hover:from-black/70 group-hover:via-black/60 group-hover:to-black/80 transition-all duration-300"></div>
                  </div>

                  {/* Contenu en overlay */}
                  <div className="relative z-10 p-6 text-white h-full flex flex-col">
                    {/* En-tête avec titre et type */}
                    <div className="mb-4">
                      <div className={`inline-block px-3 py-1 ${getSportColor(race.sport_type)} rounded-lg text-xs font-bold uppercase mb-3 shadow-lg`}>
                        {race.sport_type}
                      </div>
                      <h3 className="text-xl font-bold drop-shadow-lg leading-tight mb-2">
                        {race.name}
                      </h3>
                      <p className="text-white/80 text-sm">{race.distance} km</p>
                    </div>

                    {/* Statistiques en overlay avec style caractéristiques */}
                    <div className="mt-auto space-y-3">
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            <span className="text-sm text-white/70 uppercase tracking-wide font-medium">Participants</span>
                          </div>
                          <span className="text-2xl font-bold">{race.result_count}</span>
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg group-hover:bg-white/15 transition-all duration-200 flex items-center justify-center gap-2">
                        <Trophy className="w-5 h-5" />
                        <span className="font-semibold">Voir les résultats</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
