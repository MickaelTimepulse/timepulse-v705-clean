import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, ArrowRight, TrendingUp, Users, Award, Activity, Upload, Heart } from 'lucide-react';
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
  is_external?: boolean;
}

interface GlobalStats {
  total_results: number;
  by_gender: { male: number; female: number; other: number };
  by_age_group: { [key: string]: number };
  by_license: { [key: string]: number };
  by_sport: { [key: string]: number };
}

export default function ResultsListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<GlobalStats>({
    total_results: 0,
    by_gender: { male: 0, female: 0, other: 0 },
    by_age_group: {},
    by_license: {},
    by_sport: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventsWithResults();
    loadGlobalStats();
  }, []);

  async function loadEventsWithResults() {
    try {
      // Récupérer les événements Timepulse publiés qui ont des résultats
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          name,
          slug,
          city,
          start_date,
          image_url,
          event_type,
          races!inner(
            id,
            results!inner(id)
          )
        `)
        .eq('status', 'published')
        .order('start_date', { ascending: false });

      if (eventsError) throw eventsError;

      // Filtrer uniquement les événements qui ont au moins un résultat
      const timepulseEvents = eventsData?.filter(event =>
        event.races && event.races.length > 0 &&
        event.races.some((race: any) => race.results && race.results.length > 0)
      ).map(e => ({ ...e, is_external: false })) || [];

      // Récupérer les événements externes publiés
      const { data: externalEventsData, error: externalError } = await supabase
        .from('external_events')
        .select('id, name, slug, city, event_date, banner_url, sport_type, total_finishers')
        .eq('status', 'published')
        .eq('is_public', true)
        .gt('total_finishers', 0)
        .order('event_date', { ascending: false });

      if (externalError) throw externalError;

      // Transformer les événements externes au même format
      const externalEvents = externalEventsData?.map(e => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        city: e.city,
        start_date: e.event_date,
        image_url: e.banner_url,
        event_type: e.sport_type || 'running',
        is_external: true
      })) || [];

      // Fusionner et trier par date
      const allEvents = [...timepulseEvents, ...externalEvents]
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        .slice(0, 20);

      setEvents(allEvents);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadGlobalStats() {
    try {
      let allResults: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: results, error } = await supabase
          .from('results')
          .select(`
            id,
            gender,
            category,
            race_id,
            races!inner(sport_type, event_id, events!inner(id))
          `)
          .range(from, from + pageSize - 1);

        if (error) {
          console.error('Error loading results:', error);
          throw error;
        }

        if (results && results.length > 0) {
          allResults = [...allResults, ...results];
          from += pageSize;
          hasMore = results.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      console.log('Total results loaded:', allResults.length);

      const uniqueEvents = new Set();
      const globalStats: GlobalStats = {
        total_results: allResults.length,
        by_gender: { male: 0, female: 0, other: 0 },
        by_age_group: {},
        by_license: {},
        by_sport: {}
      };

      allResults.forEach((result: any) => {
        if (result.gender === 'M') globalStats.by_gender.male++;
        else if (result.gender === 'F') globalStats.by_gender.female++;
        else globalStats.by_gender.other++;

        if (result.category) {
          const category = result.category;
          globalStats.by_age_group[category] = (globalStats.by_age_group[category] || 0) + 1;
        }

        if (result.races?.sport_type) {
          const sport = result.races.sport_type;
          globalStats.by_sport[sport] = (globalStats.by_sport[sport] || 0) + 1;
        }

        if (result.races?.events?.id) {
          uniqueEvents.add(result.races.events.id);
        }
      });

      console.log('Stats computed:', globalStats);
      console.log('Unique events:', uniqueEvents.size);

      setStats(globalStats);
    } catch (err) {
      console.error('Error loading global stats:', err);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Résultats des Événements</h1>
          <p className="text-lg text-gray-600">
            Consultez les résultats et classements de tous nos événements passés
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-pink-500" />
              <h2 className="text-2xl font-bold text-gray-900">Statistiques Globales</h2>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-pink-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total_results.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Résultats</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.by_gender.male + stats.by_gender.female}</div>
                  <div className="text-xs text-gray-600">Participants</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{Object.keys(stats.by_sport).length}</div>
                  <div className="text-xs text-gray-600">Sports</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{events.length}</div>
                  <div className="text-xs text-gray-600">Événements</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Par Genre</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hommes</span>
                  <span className="font-semibold">{stats.by_gender.male}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Femmes</span>
                  <span className="font-semibold">{stats.by_gender.female}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Par Sport</h3>
              <div className="space-y-2">
                {Object.entries(stats.by_sport).slice(0, 3).map(([sport, count]) => (
                  <div key={sport} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{sport}</span>
                    <span className="font-semibold">{count}</span>
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
                    <span className="font-semibold">{count}</span>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Événements avec Résultats</h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Chargement des événements...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun résultat disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200"
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={getSportImage(event.event_type as any)}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className={`absolute top-4 left-4 px-3 py-1.5 ${getSportColor(event.event_type)} rounded-lg text-xs font-bold text-white uppercase tracking-wide shadow-lg`}>
                      {event.event_type}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                      {event.name}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-pink-500" />
                        <span>{formatDate(event.start_date)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-cyan-500" />
                        <span>{event.city}</span>
                      </div>
                    </div>

                    <Link
                      to={event.is_external ? `/resultats-externes/${event.slug}` : `/resultats/${event.slug}`}
                      className="relative flex items-center justify-center w-full text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg overflow-hidden group"
                      style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${getSportImage(event.event_type as any)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-pink-600/20 group-hover:from-pink-500/30 group-hover:to-pink-600/30 transition-all"></div>
                      <Trophy className="w-4 h-4 mr-2 relative z-10" />
                      <span className="relative z-10">Voir les résultats</span>
                      <ArrowRight className="w-4 h-4 ml-2 relative z-10" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl shadow-lg p-8 mt-12 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 mb-6 md:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="w-8 h-8" />
                <h3 className="text-2xl font-bold">Pas encore partenaire Timepulse ?</h3>
              </div>
              <p className="text-lg mb-2">
                Publiez tout de même vos résultats et profitez de <strong>la plateforme la plus aboutie</strong>
              </p>
              <p className="text-pink-100 text-sm">
                Créée et développée par des sportifs comme vous ! 🏃‍♂️
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-pink-200" />
                  <span>Service 100% gratuit et sans engagement</span>
                </li>
                <li className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-pink-200" />
                  <span>Référencement SEO optimal pour vos participants</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-pink-200" />
                  <span>Profils athlètes enrichis automatiquement</span>
                </li>
              </ul>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/publier-resultats"
                className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-pink-600 rounded-lg hover:bg-pink-50 transition shadow-lg font-bold text-lg"
              >
                <Upload className="w-6 h-6" />
                <span>Publier mes résultats</span>
                <ArrowRight className="w-6 h-6" />
              </Link>
              <p className="text-center text-xs text-pink-100 mt-3">
                En 5 minutes seulement
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
