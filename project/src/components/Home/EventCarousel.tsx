import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EventCharacteristicsBadges from '../EventCharacteristicsBadges';

interface Event {
  id: string;
  name: string;
  slug: string;
  city: string;
  start_date: string;
  image_url: string | null;
  event_type: string;
  description?: string;
  characteristics?: Array<{
    id: string;
    code: string;
    name: string;
    icon: string;
    color: string;
  }>;
}

interface EventCarouselProps {
  filters?: {
    searchText: string;
    selectedSport: string;
    selectedMonth: string;
    selectedCity: string;
    selectedCharacteristics: string[];
  } | null;
}

export default function EventCarousel({ filters }: EventCarouselProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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
      'triathlon': 'bg-blue-900',
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
  }, [filters]);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || events.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, events.length]);

  async function loadEvents() {
    try {
      let query = supabase
        .from('events')
        .select('id, name, slug, city, start_date, image_url, event_type, description')
        .eq('status', 'published')
        .gte('start_date', new Date().toISOString());

      if (filters?.searchText) {
        query = query.or(`name.ilike.%${filters.searchText}%,city.ilike.%${filters.searchText}%`);
      }

      if (filters?.selectedSport) {
        query = query.eq('event_type', filters.selectedSport);
      }

      if (filters?.selectedCity) {
        query = query.eq('city', filters.selectedCity);
      }

      if (filters?.selectedMonth) {
        const year = new Date().getFullYear();
        const monthNum = parseInt(filters.selectedMonth);
        const startOfMonth = new Date(year, monthNum - 1, 1).toISOString();
        const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59).toISOString();
        query = query.gte('start_date', startOfMonth).lte('start_date', endOfMonth);
      }

      query = query.order('start_date', { ascending: true }).limit(20);

      const { data: eventsData, error } = await query;

      if (error) throw error;

      let filteredEvents = eventsData || [];

      if (filteredEvents.length > 0) {
        const eventIds = filteredEvents.map(e => e.id);

        const { data: characteristicsData } = await supabase
          .from('event_characteristics')
          .select(`
            event_id,
            characteristic_type:event_characteristic_types(
              id,
              code,
              name,
              icon,
              color
            )
          `)
          .in('event_id', eventIds);

        const characteristicsByEvent = (characteristicsData || []).reduce((acc: any, item: any) => {
          if (!acc[item.event_id]) {
            acc[item.event_id] = [];
          }
          if (item.characteristic_type) {
            acc[item.event_id].push(item.characteristic_type);
          }
          return acc;
        }, {});

        filteredEvents = filteredEvents.map(event => ({
          ...event,
          characteristics: characteristicsByEvent[event.id] || []
        }));

        if (filters?.selectedCharacteristics && filters.selectedCharacteristics.length > 0) {
          filteredEvents = filteredEvents.filter(event => {
            const eventCharIds = event.characteristics?.map(c => c.id) || [];
            return filters.selectedCharacteristics.every(charId => eventCharIds.includes(charId));
          });
        }
      }

      setEvents(filteredEvents);
    } catch (err) {
      console.error('Error loading events:', err);
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

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
    setIsAutoPlaying(false);
  }, [events.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
    setIsAutoPlaying(false);
  }, [events.length]);

  const handleDotClick = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  }, []);

  if (loading) {
    return (
      <section id="events" className="relative py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Événements à venir</h2>
            <p className="mt-4 text-lg text-gray-600">Chargement...</p>
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section id="events" className="relative py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Événements à venir</h2>
          </div>
          <div className="text-center py-16 bg-white rounded-3xl shadow-md">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <p className="text-xl text-gray-600 font-medium">Aucun événement disponible pour le moment</p>
            <p className="text-gray-500 mt-2">Revenez bientôt pour découvrir de nouveaux événements</p>
          </div>
        </div>
      </section>
    );
  }

  const currentEvent = events[currentIndex];
  const daysUntil = getDaysUntilEvent(currentEvent.start_date);

  return (
    <section id="events" className="relative py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Événements à venir
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Découvrez les prochains événements sportifs
          </p>
        </div>

        {/* Main Carousel */}
        <div
          className="relative group mb-12"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Main Event Card */}
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="relative aspect-[21/9] md:aspect-[21/9] lg:aspect-[21/9]">
              {/* Background Image */}
              {currentEvent.image_url ? (
                <img
                  src={currentEvent.image_url}
                  alt={currentEvent.name}
                  className="w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className={`w-full h-full ${getSportColor(currentEvent.event_type)} flex items-center justify-center`}>
                  <Calendar className="w-32 h-32 text-white/20" />
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/35"></div>

              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full lg:w-2/3 px-8 sm:px-12 lg:px-16 py-8">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <span className={`px-4 py-2 ${getSportColor(currentEvent.event_type)} rounded-xl text-sm font-bold text-white uppercase tracking-wider shadow-lg backdrop-blur-sm`}>
                      {currentEvent.event_type}
                    </span>
                    {daysUntil <= 30 && (
                      <span className="px-4 py-2 bg-red-600 rounded-xl text-sm font-bold text-white shadow-lg flex items-center space-x-2 backdrop-blur-sm">
                        <Clock className="w-4 h-4" />
                        <span>Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-2xl">
                    {currentEvent.name}
                  </h3>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-6 mb-6 text-white">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 flex-shrink-0" />
                      <span className="font-semibold text-lg">{formatDate(currentEvent.start_date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 flex-shrink-0" />
                      <span className="font-semibold text-lg">{currentEvent.city}</span>
                    </div>
                  </div>

                  {/* Characteristics */}
                  {currentEvent.characteristics && currentEvent.characteristics.length > 0 && (
                    <div className="mb-6">
                      <EventCharacteristicsBadges
                        characteristics={currentEvent.characteristics}
                        size="md"
                        maxDisplay={4}
                      />
                    </div>
                  )}

                  {/* CTA Button */}
                  <Link
                    to={`/events/${currentEvent.slug}`}
                    className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-slate-900 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl font-bold text-lg group"
                  >
                    <span>S'inscrire maintenant</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {events.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                aria-label="Événement précédent"
              >
                <ChevronLeft className="w-6 h-6 text-gray-900" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                aria-label="Événement suivant"
              >
                <ChevronRight className="w-6 h-6 text-gray-900" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Dots */}
        {events.length > 1 && (
          <div className="flex justify-center space-x-2 mb-12">
            {events.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`transition-all ${
                  index === currentIndex
                    ? 'w-8 h-3 bg-slate-900 rounded-full'
                    : 'w-3 h-3 bg-gray-300 hover:bg-gray-400 rounded-full'
                }`}
                aria-label={`Aller à l'événement ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Upcoming Events Preview */}
        {events.length > 1 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Prochains événements</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {events.slice(0, 4).map((event, index) => (
                <button
                  key={event.id}
                  onClick={() => handleDotClick(index)}
                  className={`group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 ${
                    index === currentIndex ? 'ring-4 ring-slate-900' : ''
                  }`}
                >
                  <div className="aspect-[4/3] relative">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-full h-full object-cover opacity-65 group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full ${getSportColor(event.event_type)} flex items-center justify-center`}>
                        <Calendar className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-bold text-white line-clamp-2">{event.name}</p>
                      <p className="text-xs text-white/80 mt-1">{event.city}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center space-x-3 px-8 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl font-bold group"
          >
            <span>Voir tous les événements</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
