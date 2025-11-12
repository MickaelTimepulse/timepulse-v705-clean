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
        .select('id, name, distance, sport_type')
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

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="aspect-[21/9] bg-gradient-to-br from-gray-100 to-gray-200 relative">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Calendar className="w-24 h-24 text-gray-400" />
              </div>
            )}
            <div className={`absolute top-6 left-6 px-4 py-2 ${getSportColor(event.event_type)} rounded-lg text-sm font-bold text-white uppercase tracking-wide shadow-lg`}>
              {event.event_type}
            </div>
          </div>

          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.name}</h1>
            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-pink-500" />
                <span>{formatDate(event.start_date)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-cyan-500" />
                <span>{event.city}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-6 h-6 text-pink-500" />
            <h2 className="text-2xl font-bold text-gray-900">Statistiques de l'Événement</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-6">
              <Trophy className="w-8 h-8 text-pink-600 mb-2" />
              <div className="text-3xl font-bold text-gray-900">{stats.total_results.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Résultats</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <div className="text-3xl font-bold text-gray-900">{uniqueAthletes.size.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
              <Award className="w-8 h-8 text-green-600 mb-2" />
              <div className="text-3xl font-bold text-gray-900">{races.length}</div>
              <div className="text-sm text-gray-600">Épreuves</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              <Activity className="w-8 h-8 text-purple-600 mb-2" />
              <div className="text-3xl font-bold text-gray-900">{Object.keys(stats.by_license).length}</div>
              <div className="text-sm text-gray-600">Types de Licence</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Par Genre</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hommes</span>
                  <span className="font-semibold">
                    {stats.by_gender.male}
                    <span className="text-xs text-gray-500 ml-1">
                      ({stats.total_results > 0 ? ((stats.by_gender.male / stats.total_results) * 100).toFixed(1) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Femmes</span>
                  <span className="font-semibold">
                    {stats.by_gender.female}
                    <span className="text-xs text-gray-500 ml-1">
                      ({stats.total_results > 0 ? ((stats.by_gender.female / stats.total_results) * 100).toFixed(1) : 0}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Par Épreuve</h3>
              <div className="space-y-2">
                {Object.entries(stats.by_race).slice(0, 3).map(([race, count]) => (
                  <div key={race} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate pr-2">{race}</span>
                    <span className="font-semibold">
                      {count}
                      <span className="text-xs text-gray-500 ml-1">
                        ({stats.total_results > 0 ? ((count / stats.total_results) * 100).toFixed(1) : 0}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Par Licence</h3>
              <div className="space-y-2">
                {Object.entries(stats.by_license).slice(0, 3).map(([license, count]) => (
                  <div key={license} className="flex justify-between text-sm">
                    <span className="text-gray-600">{license}</span>
                    <span className="font-semibold">
                      {count}
                      <span className="text-xs text-gray-500 ml-1">
                        ({stats.total_results > 0 ? ((count / stats.total_results) * 100).toFixed(1) : 0}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Par Âge</h3>
              <div className="space-y-2">
                {Object.entries(stats.by_age_group).slice(0, 3).map(([age, count]) => (
                  <div key={age} className="flex justify-between text-sm">
                    <span className="text-gray-600">{age}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
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
                <div
                  key={race.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200 flex flex-col"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                          {race.name}
                        </h3>
                        <p className="text-sm text-gray-600">{race.distance} km</p>
                      </div>
                      <div className={`px-3 py-1 ${getSportColor(race.sport_type)} rounded-lg text-xs font-bold text-white uppercase`}>
                        {race.sport_type}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-gray-600 mb-4">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{race.result_count} résultat{race.result_count > 1 ? 's' : ''}</span>
                    </div>

                    <div className="mt-auto">
                      <Link
                        to={`/races/${race.id}/results`}
                        className="relative flex items-center justify-center w-full text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg overflow-hidden group"
                        style={{
                          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${getSportImage(race.sport_type as any)})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-pink-600/20 group-hover:from-pink-500/30 group-hover:to-pink-600/30 transition-all"></div>
                        <Trophy className="w-4 h-4 mr-2 relative z-10" />
                        <span className="relative z-10">Voir les résultats</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
