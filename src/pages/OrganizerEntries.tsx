import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import EntriesList from '../components/EntriesList';
import OrganizerCarts from '../components/OrganizerCarts';

export default function OrganizerEntries() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId');
  const [event, setEvent] = useState<any>(null);
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'entries' | 'carts'>('entries');

  useEffect(() => {
    if (!eventId) {
      navigate('/organizer/dashboard');
      return;
    }
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      const { data: racesData, error: racesError } = await supabase
        .from('races')
        .select('*')
        .eq('event_id', eventId)
        .order('name');

      if (racesError) throw racesError;
      setRaces(racesData || []);
    } catch (error) {
      console.error('Error loading event data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Événement introuvable</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(`/organizer/events/${eventId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l'événement
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
            <p className="text-gray-600 mt-1">
              Gestion des inscriptions et des participants
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('entries')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition ${
                  activeTab === 'entries'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-5 h-5 inline mr-2" />
                Inscriptions validées
              </button>
              <button
                onClick={() => setActiveTab('carts')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition ${
                  activeTab === 'carts'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShoppingCart className="w-5 h-5 inline mr-2" />
                Paniers en attente
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'entries' ? (
          <EntriesList eventId={eventId} races={races} />
        ) : (
          <OrganizerCarts eventId={eventId} />
        )}
      </div>
    </div>
  );
}
