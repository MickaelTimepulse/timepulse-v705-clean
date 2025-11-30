import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tag, MapPin, Calendar, Users, Info, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getBackgroundImageByType } from '../lib/background-images';

interface BibExchangeSettings {
  is_enabled: boolean;
  transfer_deadline: string | null;
  allow_gender_mismatch: boolean;
  rules_text: string | null;
}

interface BibListing {
  id: string;
  race_id: string;
  bib_number: number | null;
  sale_price: number;
  gender_required: 'M' | 'F' | 'any';
  listed_at: string;
  races: {
    name: string;
    distance: number;
    elevation_gain: number;
    race_date: string | null;
  };
}

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  city: string;
  image_url: string;
}

interface Race {
  id: string;
  name: string;
  race_date: string | null;
}

export default function BibExchange() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [settings, setSettings] = useState<BibExchangeSettings | null>(null);
  const [listings, setListings] = useState<BibListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<BibListing[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [raceFilter, setRaceFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [alertEmail, setAlertEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);

  useEffect(() => {
    loadData();

    const listingsSubscription = supabase
      .channel('public_bib_listings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bib_exchange_listings'
      }, () => {
        loadListings();
      })
      .subscribe();

    return () => {
      listingsSubscription.unsubscribe();
    };
  }, [eventId]);

  useEffect(() => {
    applyFilters();
  }, [listings, raceFilter, genderFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      const { data: racesData, error: racesError } = await supabase
        .from('races')
        .select('id, name, start_time')
        .eq('event_id', eventId)
        .order('start_time', { ascending: true });

      if (racesError) throw racesError;
      setRaces(racesData || []);

      const { data: settingsData, error: settingsError } = await supabase
        .from('bib_exchange_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      console.log('Bib Exchange Settings Query:', { settingsData, settingsError, eventId });

      if (settingsError) throw settingsError;
      setSettings(settingsData);

      if (settingsData?.is_enabled) {
        await loadListings();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadListings = async () => {
    try {
      const { data, error } = await supabase
        .from('bib_exchange_listings')
        .select(`
          *,
          races(name, distance, elevation_gain, race_date)
        `)
        .eq('event_id', eventId)
        .eq('status', 'available')
        .order('listed_at', { ascending: true });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    if (raceFilter !== 'all') {
      filtered = filtered.filter(l => l.race_id === raceFilter);
    }

    if (genderFilter !== 'all') {
      filtered = filtered.filter(l => {
        if (genderFilter === 'any') return l.gender_required === 'any';
        return l.gender_required === genderFilter || l.gender_required === 'any';
      });
    }

    setFilteredListings(filtered);
  };

  const getRaces = () => {
    const raceMap = new Map<string, { id: string; name: string }>();
    listings.forEach(listing => {
      if (!raceMap.has(listing.race_id)) {
        raceMap.set(listing.race_id, {
          id: listing.race_id,
          name: listing.races.name
        });
      }
    });
    return Array.from(raceMap.values());
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const isDeadlinePassed = () => {
    if (!settings?.transfer_deadline) return false;
    return new Date() > new Date(settings.transfer_deadline);
  };

  const handleSubscribeAlert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!alertEmail || !alertEmail.includes('@')) {
      alert('Veuillez saisir une adresse email valide');
      return;
    }

    try {
      setSubscribing(true);

      const { error } = await supabase
        .from('bib_exchange_alerts')
        .insert([{
          event_id: eventId,
          email: alertEmail,
          race_id: raceFilter !== 'all' ? raceFilter : null
        }]);

      if (error) {
        if (error.code === '23505') {
          alert('Vous êtes déjà inscrit aux alertes pour cet événement');
        } else {
          throw error;
        }
        return;
      }

      setAlertSuccess(true);
      setAlertEmail('');
      setTimeout(() => setAlertSuccess(false), 5000);
    } catch (error) {
      console.error('Error subscribing to alerts:', error);
      alert('Erreur lors de l\'inscription aux alertes');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${getBackgroundImageByType('victory')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            opacity: 0.3
          }}
        />
        <RefreshCw className="w-8 h-8 animate-spin text-pink-600 relative z-10" />
      </div>
    );
  }

  if (!settings?.is_enabled) {
    return (
      <div className="min-h-screen relative">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${getBackgroundImageByType('victory')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            opacity: 0.2
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bourse aux dossards non disponible</h1>
            <p className="text-gray-600 mb-6">
              La bourse aux dossards n'est pas activée pour cet événement.
            </p>
            <Link
              to={`/event/${eventId}`}
              className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              Retour à l'événement
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isDeadlinePassed()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Date limite dépassée</h1>
            <p className="text-gray-600 mb-6">
              La date limite pour les transferts de dossards est dépassée.
              {settings.transfer_deadline && (
                <span className="block mt-2">
                  Date limite : {formatDateTime(settings.transfer_deadline)}
                </span>
              )}
            </p>
            <Link
              to={`/event/${eventId}`}
              className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              Retour à l'événement
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${getBackgroundImageByType('victory')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: 0.2
        }}
      />
      <div className="relative z-10">
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-4">
            <Tag className="w-8 h-8 mr-3" />
            <h1 className="text-4xl font-bold">Bourse aux Dossards</h1>
          </div>
          {event && (
            <>
              <h2 className="text-2xl font-semibold mb-2">{event.name}</h2>
              <div className="flex items-center space-x-6 text-pink-100">
                {races.length > 0 && races[0].race_date && !isNaN(new Date(races[0].race_date).getTime()) && (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    {new Date(races[0].race_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                )}
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  {event.city}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {settings.transfer_deadline && formatDateTime(settings.transfer_deadline) && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
            <div className="flex">
              <Info className="h-5 w-5 text-blue-400 mr-3" />
              <div>
                <p className="text-sm text-blue-700">
                  <strong>Date limite de transfert :</strong> {formatDateTime(settings.transfer_deadline)}
                </p>
              </div>
            </div>
          </div>
        )}

        {settings.rules_text && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-pink-600" />
              Règlement de la bourse
            </h3>
            <div className="text-gray-700 whitespace-pre-wrap">{settings.rules_text}</div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <select
                value={raceFilter}
                onChange={(e) => setRaceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Toutes les courses</option>
                {getRaces().map(race => (
                  <option key={race.id} value={race.id}>{race.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre requis
              </label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tous les genres</option>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
                <option value="any">Non spécifié</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Dossards disponibles ({filteredListings.length})
              </h2>
            </div>
          </div>
          <div className="p-6">
            {filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Aucun dossard disponible</p>
                <p className="text-gray-400 text-sm mb-8">Revenez plus tard ou ajustez vos filtres</p>

                <div className="max-w-md mx-auto">
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-pink-900 mb-2">
                      Soyez alerté en premier !
                    </h3>
                    <p className="text-pink-700 text-sm mb-4">
                      Laissez votre email et recevez une notification dès qu'un dossard est mis en vente.
                      Attention, vous ne serez pas le seul, alors dépêchez-vous ! 😉
                    </p>

                    {alertSuccess ? (
                      <div className="bg-green-100 border border-green-300 rounded-lg p-4 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">Vous êtes inscrit aux alertes !</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSubscribeAlert} className="space-y-3">
                        <input
                          type="email"
                          value={alertEmail}
                          onChange={(e) => setAlertEmail(e.target.value)}
                          placeholder="votre@email.com"
                          className="w-full px-4 py-3 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          required
                          disabled={subscribing}
                        />
                        <button
                          type="submit"
                          disabled={subscribing}
                          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                        >
                          {subscribing ? 'Inscription...' : 'M\'alerter par email'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-3xl font-bold text-pink-600 mb-1">
                          {listing.bib_number || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">Dossard n°</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {listing.sale_price.toFixed(2)} €
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-start">
                        <Tag className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{listing.races.name}</div>
                          <div className="text-gray-500">
                            {listing.races.distance} km · {listing.races.elevation_gain}m D+
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-700">
                          {listing.gender_required === 'M' && <span className="font-medium text-blue-600">Homme uniquement</span>}
                          {listing.gender_required === 'F' && <span className="font-medium text-pink-600">Femme uniquement</span>}
                          {listing.gender_required === 'any' && <span className="text-gray-600">Tous genres</span>}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-xs text-gray-500">
                          Mis en vente le {formatDateTime(listing.listed_at)}
                        </div>
                      </div>
                    </div>

                    {user ? (
                      <Link
                        to={`/events/${eventId}/bib-exchange/buy/${listing.id}`}
                        className="w-full flex items-center justify-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Acheter ce dossard
                      </Link>
                    ) : (
                      <Link
                        to="/organizer/login"
                        className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Se connecter pour acheter
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0" />
            <div className="text-sm text-yellow-700">
              <p className="font-medium mb-1">Important</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Le prix de vente est fixé au prix d'achat initial</li>
                <li>Des frais de 5€ sont déduits du remboursement du vendeur</li>
                <li>Vous devez respecter le genre requis pour certains dossards (catégories genrées)</li>
                <li>Le transfert est définitif une fois validé</li>
                <li>Vous devrez transmettre l'ensemble des justificatifs requis (licence, PSP (Pass Prévention Santé), FIS, certificat médical ou tout autre document demandé par l'organisateur)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
