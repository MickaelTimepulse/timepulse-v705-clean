import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PublicEntriesList from '../components/PublicEntriesList';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

export default function RaceEntriesList() {
  const { eventSlug, raceId } = useParams<{ eventSlug: string; raceId: string }>();
  const navigate = useNavigate();
  const [race, setRace] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [eventSlug, raceId]);

  const loadData = async () => {
    try {
      console.log('Loading event with slug:', eventSlug);
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', eventSlug)
        .maybeSingle();

      console.log('Event data:', eventData, 'Error:', eventError);

      if (eventData) {
        setEvent(eventData);

        console.log('Loading race with id:', raceId, 'for event:', eventData.id);
        const { data: raceData, error: raceError } = await supabase
          .from('races')
          .select('*')
          .eq('id', raceId)
          .eq('event_id', eventData.id)
          .maybeSingle();

        console.log('Race data:', raceData, 'Error:', raceError);

        if (raceData) {
          setRace(raceData);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!race || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Épreuve non trouvée</p>
          <button
            onClick={() => navigate(-1)}
            className="text-pink-600 hover:text-pink-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/events/${eventSlug}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Retour à l'événement</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <PublicEntriesList raceId={raceId!} raceName={race.name} eventName={event.name} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
