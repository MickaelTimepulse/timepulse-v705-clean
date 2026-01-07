import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, ShoppingCart, FileCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import EntriesList from '../components/EntriesList';
import OrganizerCarts from '../components/OrganizerCarts';
import OrganizerWaiverValidator from '../components/OrganizerWaiverValidator';

export default function OrganizerEntries() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizerId, setOrganizerId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'entries' | 'carts' | 'waivers'>('entries');

  useEffect(() => {
    console.log('🚀 [OrganizerEntries] useEffect déclenché', {
      eventId,
      hasEventId: !!eventId,
      eventIdType: typeof eventId
    });

    if (!eventId) {
      console.error('❌ [OrganizerEntries] Pas d\'eventId, redirection...');
      navigate('/organizer/dashboard');
      return;
    }

    console.log('📥 [OrganizerEntries] Début chargement event...');
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: organizerData } = await supabase
        .from('organizers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (organizerData) {
        setOrganizerId(organizerData.id);
      }

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      console.log('🔍 [OrganizerEntries] Event loaded:', {
        eventData,
        eventDataType: typeof eventData,
        isNull: eventData === null,
        isUndefined: eventData === undefined,
        ffa_affiliated: eventData?.ffa_affiliated,
        ffa_calorg_code: eventData?.ffa_calorg_code
      });

      setEvent(eventData);

      console.log('✅ [OrganizerEntries] setEvent appelé avec:', eventData?.id);

      const { data: racesData, error: racesError } = await supabase
        .from('races')
        .select('*')
        .eq('event_id', eventId)
        .order('name');

      if (racesError) throw racesError;
      setRaces(racesData || []);

      console.log('🏁 [OrganizerEntries] Chargement terminé avec succès');
    } catch (error) {
      console.error('❌ [OrganizerEntries] Error loading event data:', error);
    } finally {
      setLoading(false);
      console.log('⏹️ [OrganizerEntries] Loading = false');
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
    console.log('🚫 [OrganizerEntries] Pas d\'event, affichage message erreur');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Événement introuvable</div>
      </div>
    );
  }

  console.log('🎨 [OrganizerEntries] Rendu du composant avec event:', {
    id: event.id,
    name: event.name,
    ffa_affiliated: event.ffa_affiliated,
    eventPassedToEntriesList: !!event
  });

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
              {!event?.ffa_affiliated && (
                <button
                  onClick={() => setActiveTab('waivers')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition ${
                    activeTab === 'waivers'
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileCheck className="w-5 h-5 inline mr-2" />
                  Validation des décharges
                </button>
              )}
            </nav>
          </div>
        </div>

        {activeTab === 'entries' && (
          <>
            {/* Debug: Afficher l'état de l'événement */}
            <div className="bg-purple-100 border-l-4 border-purple-500 text-purple-800 px-4 py-3 rounded mb-4">
              <p className="font-bold">🔍 DEBUG OrganizerEntries</p>
              <p className="text-sm">Event existe: {event ? 'OUI' : 'NON'}</p>
              {event && (
                <>
                  <p className="text-sm">Event ID: {event.id}</p>
                  <p className="text-sm">FFA affilié: {String(event.ffa_affiliated)}</p>
                  <p className="text-sm">Code CalOrg: {event.ffa_calorg_code}</p>
                </>
              )}
            </div>
            <EntriesList eventId={eventId} races={races} event={event} />
          </>
        )}

        {activeTab === 'carts' && (
          <OrganizerCarts eventId={eventId} />
        )}

        {activeTab === 'waivers' && organizerId && (
          <OrganizerWaiverValidator
            eventId={eventId}
            organizerId={organizerId}
          />
        )}
      </div>
    </div>
  );
}
