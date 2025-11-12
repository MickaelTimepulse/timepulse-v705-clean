import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight, Clock, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  name: string;
  slug: string;
  city: string;
  start_date: string;
  image_url: string | null;
  event_type: string;
}

interface EventListProps {
  heroFilters?: { month: string; sport: string; region: string } | null;
}

export default function EventList({ heroFilters }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);

  const getDaysUntilEvent = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSportColor = (sportType: string) => {
    const colors: { [key: string]: string } = {
      'running': 'bg-slate-900',
      'trail': 'bg-emerald-800',
      'triathlon': 'bg-indigo-900',
      'cycling': 'bg-amber-700',
      'swimming': 'bg-cyan-800',
      'obstacle': 'bg-red-900',
      'walking': 'bg-teal-800',
      'other': 'bg-gray-800'
    };
    return colors[sportType] || colors['other'];
  };

  useEffect(() => {
    loadEvents();
    loadCities();
  }, []);

  useEffect(() => {
    if (heroFilters) {
      setSelectedMonth(heroFilters.month);
      setSelectedSport(heroFilters.sport.toLowerCase());
    }
  }, [heroFilters]);

  useEffect(() => {
    loadEvents();
  }, [searchText, selectedSport, selectedMonth, selectedCity]);

  async function loadCities() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('city')
        .eq('status', 'published')
        .gte('start_date', new Date().toISOString());

      if (error) throw error;
      const uniqueCities = [...new Set(data?.map(e => e.city).filter(Boolean))] as string[];
      setCities(uniqueCities.sort());
    } catch (err) {
      console.error('Error loading cities:', err);
    }
  }

  async function loadEvents() {
    try {
      let query = supabase
        .from('events')
        .select('id, name, slug, city, start_date, image_url, event_type')
        .eq('status', 'published')
        .gte('start_date', new Date().toISOString());

      if (searchText) {
        query = query.or(`name.ilike.%${searchText}%,city.ilike.%${searchText}%`);
      }

      if (selectedSport) {
        query = query.eq('event_type', selectedSport);
      }

      if (selectedCity) {
        query = query.eq('city', selectedCity);
      }

      if (selectedMonth) {
        const year = new Date().getFullYear();
        const monthNum = parseInt(selectedMonth);
        const startOfMonth = new Date(year, monthNum - 1, 1).toISOString();
        const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59).toISOString();
        query = query.gte('start_date', startOfMonth).lte('start_date', endOfMonth);
      }

      query = query.order('start_date', { ascending: true }).limit(8);

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <section id="events" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Événements à venir</h2>
            <p className="mt-4 text-lg text-gray-600">Chargement...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="events" className="relative py-12 overflow-hidden">
      {/* Background image with 50% opacity */}
      <div
        className="absolute inset-0 opacity-50 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/2524874/pexels-photo-2524874.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      ></div>

      {/* White overlay for softening */}
      <div className="absolute inset-0 bg-white/40"></div>

      {/* Decorative blur circles */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] bg-slate-200/30 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] bg-gray-200/40 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
            Rechercher mon événement
          </h2>

          {/* Filters */}
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou ville..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-slate-900 focus:outline-none text-gray-900 placeholder-gray-400 shadow-sm"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              {/* Sport filter */}
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:border-slate-900 focus:outline-none text-gray-700 font-medium shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="">Tous les sports</option>
                <option value="running">Course à pied</option>
                <option value="trail">Trail</option>
                <option value="triathlon">Triathlon</option>
                <option value="cycling">Cyclisme</option>
                <option value="swimming">Natation</option>
                <option value="obstacle">Course d'obstacles</option>
                <option value="walking">Marche</option>
                <option value="other">Autre</option>
              </select>

              {/* Month filter */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:border-slate-900 focus:outline-none text-gray-700 font-medium shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="">Tous les mois</option>
                <option value="1">Janvier</option>
                <option value="2">Février</option>
                <option value="3">Mars</option>
                <option value="4">Avril</option>
                <option value="5">Mai</option>
                <option value="6">Juin</option>
                <option value="7">Juillet</option>
                <option value="8">Août</option>
                <option value="9">Septembre</option>
                <option value="10">Octobre</option>
                <option value="11">Novembre</option>
                <option value="12">Décembre</option>
              </select>

              {/* City filter */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:border-slate-900 focus:outline-none text-gray-700 font-medium shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="">Toutes les villes</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              {/* Reset filters */}
              {(searchText || selectedSport || selectedMonth || selectedCity) && (
                <button
                  onClick={() => {
                    setSearchText('');
                    setSelectedSport('');
                    setSelectedMonth('');
                    setSelectedCity('');
                  }}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium shadow-sm flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Réinitialiser</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event) => {
            const daysUntil = getDaysUntilEvent(event.start_date);
            return (
              <Link
                key={event.id}
                to={`/events/${event.slug}`}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`w-full h-full ${getSportColor(event.event_type)} flex items-center justify-center`}>
                      <Calendar className="w-20 h-20 text-white/30" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <span className={`px-3 py-1.5 ${getSportColor(event.event_type)} rounded-xl text-xs font-bold text-white uppercase tracking-wider shadow-lg backdrop-blur-sm bg-opacity-90`}>
                      {event.event_type}
                    </span>
                    {daysUntil <= 30 && (
                      <span className="px-3 py-1.5 bg-slate-900 bg-opacity-90 rounded-xl text-xs font-bold text-white shadow-lg flex items-center space-x-1 backdrop-blur-sm">
                        <Clock className="w-3 h-3" />
                        <span>{daysUntil}j</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 drop-shadow-lg">
                      {event.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    <span className="font-medium">{formatDate(event.start_date)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    <span className="truncate">{event.city}</span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Voir l'événement</span>
                    <ArrowRight className="w-5 h-5 text-slate-900 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {events.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl shadow-md">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <p className="text-xl text-gray-600 font-medium">Aucun événement disponible pour le moment</p>
            <p className="text-gray-500 mt-2">Revenez bientôt pour découvrir de nouveaux événements</p>
          </div>
        )}

        {events.length > 0 && (
          <div className="text-center mt-10">
            <Link
              to="/"
              className="inline-flex items-center space-x-3 px-8 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl font-bold group"
            >
              <span>Voir tous les événements</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
