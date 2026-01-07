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
    selectedCharacteristics: string[];
  } | null;
}

export default function EventCarousel({ filters }: EventCarouselProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [shimmerActive, setShimmerActive] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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
      console.log('Loading events...');
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

      if (filters?.selectedMonth) {
        const year = new Date().getFullYear();
        const monthNum = parseInt(filters.selectedMonth);
        const startOfMonth = new Date(year, monthNum - 1, 1).toISOString();
        const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59).toISOString();
        query = query.gte('start_date', startOfMonth).lte('start_date', endOfMonth);
      }

      query = query.order('start_date', { ascending: true }).limit(20);

      const { data: eventsData, error } = await query;

      if (error) {
        console.error('Error loading events:', error);
        throw error;
      }

      console.log('Events loaded:', eventsData?.length || 0, 'events');
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

      console.log('Final filtered events:', filteredEvents.length);
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

  // Auto shimmer effect every 4.5 seconds
  useEffect(() => {
    const shimmerInterval = setInterval(() => {
      setShimmerActive(true);
      setTimeout(() => setShimmerActive(false), 700);
    }, 4500);

    return () => clearInterval(shimmerInterval);
  }, []);

  // Touch handlers for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (loading) {
    return (
      <section id="events" className="relative py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900" style={{
              fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
              letterSpacing: '0.02em'
            }}>Événements à l'affiche</h2>
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
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900" style={{
              fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
              letterSpacing: '0.02em'
            }}>Événements à l'affiche</h2>
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
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900" style={{
            fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
            letterSpacing: '0.02em'
          }}>
            Événements à l'affiche
          </h2>
        </div>

        {/* Main Carousel */}
        <div
          className="relative group mb-12"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Main Event Card */}
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="relative aspect-[3/4] sm:aspect-[16/9] md:aspect-[21/9] lg:aspect-[21/9]">
              {/* Background Image */}
              {currentEvent.image_url ? (
                <img
                  src={currentEvent.image_url}
                  alt={currentEvent.name}
                  className="w-full h-full object-cover object-center opacity-60"
                  style={{ objectPosition: '50% 40%' }}
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
                <div className="w-full lg:w-2/3 px-6 sm:px-8 md:px-12 lg:px-16 py-6 sm:py-8">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <span className={`px-3 py-1.5 sm:px-4 sm:py-2 ${getSportColor(currentEvent.event_type)} rounded-xl text-xs sm:text-sm font-bold text-white uppercase tracking-wider shadow-lg backdrop-blur-sm`}>
                      {currentEvent.event_type}
                    </span>
                    {daysUntil <= 30 && (
                      <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg flex items-center space-x-1 sm:space-x-2 backdrop-blur-sm">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Dans {daysUntil}j</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 sm:mb-4 leading-tight sm:leading-none relative" style={{
                    fontFamily: "'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 20px rgba(255,255,255,0.2), 0 6px 24px rgba(0,0,0,0.6), 0 3px 12px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
                    letterSpacing: '-0.03em',
                    fontWeight: '800',
                    filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.4))'
                  }}>
                    {currentEvent.name}
                  </h3>

                  {/* Meta Info - Same Line with Decorative Lines */}
                  <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 text-white">
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white/40 to-white/60" />
                    <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                      <span className="font-bold tracking-tight" style={{
                        fontFamily: "'SF Pro Display', 'Inter', -apple-system, system-ui, sans-serif",
                        textShadow: '0 2px 8px rgba(0,0,0,0.4)'
                      }}>{formatDate(currentEvent.start_date)}</span>
                      <span className="text-white/60 font-bold">•</span>
                      <span className="font-bold tracking-tight" style={{
                        fontFamily: "'SF Pro Display', 'Inter', -apple-system, system-ui, sans-serif",
                        textShadow: '0 2px 8px rgba(0,0,0,0.4)'
                      }}>{currentEvent.city}</span>
                    </div>
                    <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-white/40 to-white/60" />
                  </div>

                  {/* Characteristics */}
                  {currentEvent.characteristics && currentEvent.characteristics.length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <EventCharacteristicsBadges
                        characteristics={currentEvent.characteristics}
                        size="sm"
                        maxDisplay={3}
                      />
                    </div>
                  )}

                  {/* CTA Button */}
                  <Link
                    to={`/events/${currentEvent.slug}`}
                    className="inline-flex items-center space-x-2 sm:space-x-3 px-8 sm:px-12 py-4 sm:py-6 rounded-3xl font-bold text-lg sm:text-2xl group relative overflow-hidden backdrop-blur-md shadow-2xl hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 border-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.35) 100%)',
                      borderColor: getSportColor(currentEvent.event_type),
                      color: 'white',
                      textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      fontFamily: "'SF Pro Display', 'Inter', -apple-system, system-ui, sans-serif",
                      letterSpacing: '-0.01em'
                    }}
                  >
                    <span className="relative z-10">S'inscrire maintenant</span>
                    <ArrowRight className="w-5 h-5 sm:w-7 sm:h-7 group-hover:translate-x-2 transition-transform duration-300 relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ${
                        shimmerActive ? 'translate-x-[100%]' : 'translate-x-[-100%]'
                      }`}
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows - Desktop only */}
          {events.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                aria-label="Événement précédent"
              >
                <ChevronLeft className="w-6 h-6 text-gray-900" />
              </button>
              <button
                onClick={handleNext}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                aria-label="Événement suivant"
              >
                <ChevronRight className="w-6 h-6 text-gray-900" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Dots + Mobile Swipe Hint */}
        {events.length > 1 && (
          <div className="mb-12">
            <div className="flex justify-center items-center space-x-4">
              {/* Mobile swipe hint */}
              <span className="md:hidden text-sm text-gray-500 flex items-center space-x-2">
                <ChevronLeft className="w-4 h-4" />
                <span>Glissez</span>
                <ChevronRight className="w-4 h-4" />
              </span>

              {/* Dots */}
              <div className="flex space-x-2">
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
            </div>
          </div>
        )}

        {/* Upcoming Events Preview */}
        {events.length > 1 && (
          <div className="mb-12">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Prochains événements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {events.slice(0, 4).map((event, index) => (
                <Link
                  key={event.id}
                  to={`/events/${event.slug}`}
                  className={`group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 block ${
                    index === currentIndex ? 'ring-4 ring-slate-900' : ''
                  }`}
                >
                  <div className="aspect-[16/9] sm:aspect-[4/3] relative">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-full h-full object-cover object-center opacity-65 group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full ${getSportColor(event.event_type)} flex items-center justify-center`}>
                        <Calendar className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent"></div>

                    {/* Content overlay */}
                    <div className="absolute inset-0 p-4 sm:p-3 flex flex-col justify-between">
                      {/* Top badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 ${getSportColor(event.event_type)} rounded-lg text-xs font-bold text-white uppercase tracking-wider shadow-md`}>
                          {event.event_type}
                        </span>
                        {getDaysUntilEvent(event.start_date) <= 30 && (
                          <span className="px-2 py-1 bg-red-600 rounded-lg text-xs font-bold text-white shadow-md flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Dans {getDaysUntilEvent(event.start_date)}j</span>
                          </span>
                        )}
                      </div>

                      {/* Bottom info */}
                      <div>
                        <p className="text-sm sm:text-base font-bold text-white line-clamp-2 mb-1 tracking-tight" style={{
                          fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
                          letterSpacing: '-0.01em',
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}>{event.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-white/90">
                          <MapPin className="w-3 h-3" />
                          <span className="font-medium">{event.city}</span>
                        </div>
                        <p className="text-xs text-white/80 mt-1 font-medium">
                          {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        <div className="text-center">
          <Link
            to="/"
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300 overflow-hidden border-2 border-orange-400 hover:border-orange-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 font-bold tracking-wider bg-gradient-to-r from-white via-orange-50 to-white bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] text-lg" style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif", letterSpacing: '0.02em' }}>
              Voir tous les événements
            </span>
            <ArrowRight className="w-5 h-5 relative z-10 text-orange-400 group-hover:text-orange-300 transition-colors" />
            <div className="absolute top-0 -right-12 w-24 h-full bg-white/10 transform skew-x-12 group-hover:right-full transition-all duration-700"></div>
          </Link>
        </div>
      </div>
    </section>
  );
}
