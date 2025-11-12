import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Users, Clock, MapPin, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CarpoolingOffer {
  id: string;
  driver_first_name: string;
  driver_last_name: string;
  meeting_location: string;
  meeting_address: string;
  meeting_city: string;
  meeting_postal_code: string;
  departure_time: string;
  available_seats: number;
  additional_info: string;
  created_at: string;
}

interface CarpoolingSectionProps {
  eventId: string;
  carpoolingEnabled: boolean;
}

export default function CarpoolingSection({ eventId, carpoolingEnabled }: CarpoolingSectionProps) {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<CarpoolingOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<CarpoolingOffer | null>(null);
  const [availableSeats, setAvailableSeats] = useState<{[key: string]: number}>({});

  const [offerFormData, setOfferFormData] = useState({
    driver_first_name: '',
    driver_last_name: '',
    driver_email: '',
    driver_phone: '',
    meeting_location: '',
    meeting_address: '',
    meeting_city: '',
    meeting_postal_code: '',
    departure_time: '',
    available_seats: 3,
    additional_info: '',
    has_valid_license: false,
    terms_accepted: false
  });

  const [joinFormData, setJoinFormData] = useState({
    passenger_first_name: '',
    passenger_last_name: '',
    passenger_email: '',
    passenger_phone: '',
    seats_reserved: 1,
    terms_accepted: false
  });

  useEffect(() => {
    if (carpoolingEnabled) {
      loadOffers();
    }
  }, [eventId, carpoolingEnabled]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('carpooling_offers')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .order('departure_time', { ascending: true });

      if (error) throw error;
      setOffers((data as CarpoolingOffer[]) || []);

      for (const offer of (data || []) as any[]) {
        await loadAvailableSeats(offer.id);
      }
    } catch (err: any) {
      console.error('Error loading carpooling offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSeats = async (offerId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_available_seats', { offer_id_param: offerId } as any);

      if (error) throw error;
      setAvailableSeats(prev => ({ ...prev, [offerId]: data || 0 }));
    } catch (err: any) {
      console.error('Error loading available seats:', err);
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!offerFormData.has_valid_license) {
      alert('Vous devez certifier avoir un permis de conduire valide');
      return;
    }

    if (!offerFormData.terms_accepted) {
      alert('Vous devez accepter les conditions');
      return;
    }

    try {
      const { error } = await supabase
        .from('carpooling_offers')
        .insert([{
          event_id: eventId,
          driver_first_name: offerFormData.driver_first_name,
          driver_last_name: offerFormData.driver_last_name,
          driver_email: offerFormData.driver_email,
          driver_phone: offerFormData.driver_phone,
          meeting_location: offerFormData.meeting_location,
          meeting_address: offerFormData.meeting_address,
          meeting_city: offerFormData.meeting_city,
          meeting_postal_code: offerFormData.meeting_postal_code,
          departure_time: offerFormData.departure_time,
          available_seats: offerFormData.available_seats,
          additional_info: offerFormData.additional_info
        }] as any);

      if (error) throw error;

      alert('Votre offre de co-voiturage a été créée avec succès !');
      setShowOfferForm(false);
      setOfferFormData({
        driver_first_name: '',
        driver_last_name: '',
        driver_email: '',
        driver_phone: '',
        meeting_location: '',
        meeting_address: '',
        meeting_city: '',
        meeting_postal_code: '',
        departure_time: '',
        available_seats: 3,
        additional_info: '',
        has_valid_license: false,
        terms_accepted: false
      });
      loadOffers();
    } catch (err: any) {
      alert('Erreur lors de la création de l\'offre: ' + err.message);
    }
  };

  const handleJoinOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOffer) return;

    if (!joinFormData.terms_accepted) {
      alert('Vous devez accepter les conditions');
      return;
    }

    const available = availableSeats[selectedOffer.id] || 0;
    if (joinFormData.seats_reserved > available) {
      alert(`Il ne reste que ${available} place(s) disponible(s)`);
      return;
    }

    try {
      const { error: bookingError } = await supabase
        .from('carpooling_bookings')
        .insert([{
          offer_id: selectedOffer.id,
          passenger_first_name: joinFormData.passenger_first_name,
          passenger_last_name: joinFormData.passenger_last_name,
          passenger_email: joinFormData.passenger_email,
          passenger_phone: joinFormData.passenger_phone,
          seats_reserved: joinFormData.seats_reserved,
          terms_accepted: joinFormData.terms_accepted
        }] as any)
        .select()
        .single();

      if (bookingError) throw bookingError;

      const { data: offerData, error: offerError } = await supabase
        .from('carpooling_offers')
        .select('*')
        .eq('id', selectedOffer.id)
        .single() as any;

      if (offerError) throw offerError;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      await fetch(`${supabaseUrl}/functions/v1/carpooling-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          driver_email: offerData.driver_email,
          driver_first_name: offerData.driver_first_name,
          driver_last_name: offerData.driver_last_name,
          driver_phone: offerData.driver_phone,
          passenger_email: joinFormData.passenger_email,
          passenger_first_name: joinFormData.passenger_first_name,
          passenger_last_name: joinFormData.passenger_last_name,
          passenger_phone: joinFormData.passenger_phone,
          meeting_location: offerData.meeting_location,
          departure_time: offerData.departure_time,
          seats_reserved: joinFormData.seats_reserved
        })
      });

      alert('Votre réservation a été confirmée ! Vous allez recevoir un email avec les coordonnées du conducteur.');
      setShowJoinForm(false);
      setSelectedOffer(null);
      setJoinFormData({
        passenger_first_name: '',
        passenger_last_name: '',
        passenger_email: '',
        passenger_phone: '',
        seats_reserved: 1,
        terms_accepted: false
      });
      loadOffers();
    } catch (err: any) {
      alert('Erreur lors de la réservation: ' + err.message);
    }
  };

  if (!carpoolingEnabled) {
    return null;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}.${lastName.charAt(0)}.`;
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-900">
        <p className="font-medium mb-1">Partagez votre trajet !</p>
        <p className="text-xs italic">
          Soyez à l'heure, respectueux et partagez les frais. Timepulse n'est pas responsable des retards ou incidents.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowOfferForm(true)}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Car className="w-4 h-4" />
          Je propose
        </button>
      </div>

      {showOfferForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Proposer un co-voiturage</h3>
              <form onSubmit={handleSubmitOffer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={offerFormData.driver_first_name}
                      onChange={(e) => setOfferFormData({ ...offerFormData, driver_first_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      required
                      value={offerFormData.driver_last_name}
                      onChange={(e) => setOfferFormData({ ...offerFormData, driver_last_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={offerFormData.driver_email}
                      onChange={(e) => setOfferFormData({ ...offerFormData, driver_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone portable *</label>
                    <input
                      type="tel"
                      required
                      value={offerFormData.driver_phone}
                      onChange={(e) => setOfferFormData({ ...offerFormData, driver_phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse précise *</label>
                  <input
                    type="text"
                    required
                    value={offerFormData.meeting_address}
                    onChange={(e) => setOfferFormData({ ...offerFormData, meeting_address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 12 Avenue de la République"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code postal *</label>
                    <input
                      type="text"
                      required
                      value={offerFormData.meeting_postal_code}
                      onChange={(e) => setOfferFormData({ ...offerFormData, meeting_postal_code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 38000"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville *</label>
                    <input
                      type="text"
                      required
                      value={offerFormData.meeting_city}
                      onChange={(e) => setOfferFormData({ ...offerFormData, meeting_city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Grenoble"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de rencontre (précisions)</label>
                  <input
                    type="text"
                    value={offerFormData.meeting_location}
                    onChange={(e) => setOfferFormData({ ...offerFormData, meeting_location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Parking du Carrefour, entrée côté nord"
                  />
                  <p className="text-xs text-gray-500 mt-1">Informations complémentaires pour faciliter le rendez-vous</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure de départ *</label>
                    <input
                      type="datetime-local"
                      required
                      value={offerFormData.departure_time}
                      onChange={(e) => setOfferFormData({ ...offerFormData, departure_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Places disponibles *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="8"
                      value={offerFormData.available_seats}
                      onChange={(e) => setOfferFormData({ ...offerFormData, available_seats: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Informations complémentaires</label>
                  <textarea
                    value={offerFormData.additional_info}
                    onChange={(e) => setOfferFormData({ ...offerFormData, additional_info: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Petit véhicule, animaux acceptés, etc."
                  />
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={offerFormData.has_valid_license}
                      onChange={(e) => setOfferFormData({ ...offerFormData, has_valid_license: e.target.checked })}
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Je certifie être en possession d'un permis de conduire valide et en conformité
                    </span>
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={offerFormData.terms_accepted}
                      onChange={(e) => setOfferFormData({ ...offerFormData, terms_accepted: e.target.checked })}
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Je certifie que les informations fournies sont correctes et j'accepte de prendre contact avec les passagers
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowOfferForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Publier mon offre
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showJoinForm && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rejoindre ce co-voiturage</h3>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Conducteur:</strong> {getInitials(selectedOffer.driver_first_name, selectedOffer.driver_last_name)}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Lieu de rencontre:</strong> {selectedOffer.meeting_location}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Départ:</strong> {formatDateTime(selectedOffer.departure_time)}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Places disponibles:</strong> {availableSeats[selectedOffer.id] || 0}
                </p>
              </div>

              <form onSubmit={handleJoinOffer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={joinFormData.passenger_first_name}
                      onChange={(e) => setJoinFormData({ ...joinFormData, passenger_first_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      required
                      value={joinFormData.passenger_last_name}
                      onChange={(e) => setJoinFormData({ ...joinFormData, passenger_last_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={joinFormData.passenger_email}
                      onChange={(e) => setJoinFormData({ ...joinFormData, passenger_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone portable *</label>
                    <input
                      type="tel"
                      required
                      value={joinFormData.passenger_phone}
                      onChange={(e) => setJoinFormData({ ...joinFormData, passenger_phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de places *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={availableSeats[selectedOffer.id] || 1}
                    value={joinFormData.seats_reserved}
                    onChange={(e) => setJoinFormData({ ...joinFormData, seats_reserved: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Une inscription par personne est obligatoire</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={joinFormData.terms_accepted}
                      onChange={(e) => setJoinFormData({ ...joinFormData, terms_accepted: e.target.checked })}
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Je certifie que les informations sont correctes et je m'engage à prendre contact avec le conducteur
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinForm(false);
                      setSelectedOffer(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Réserver ma place
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 text-sm">
            {offers.length} offre{offers.length > 1 ? 's' : ''} disponible{offers.length > 1 ? 's' : ''}
          </h4>
          {offers.length > 0 && (
            <button
              onClick={() => navigate(`/events/${eventId}/carpooling`)}
              className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
            >
              Voir tout
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4 text-gray-500 text-sm">Chargement...</div>
        ) : offers.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-xs">
            Aucune offre disponible
          </div>
        ) : (
          <div className="space-y-2">
            {offers.slice(0, 3).map(offer => (
              <div key={offer.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="font-semibold text-gray-900 text-sm">
                        {getInitials(offer.driver_first_name, offer.driver_last_name)}
                      </span>
                    </div>

                    <div className="space-y-0.5 text-xs text-gray-600">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span className="truncate">{offer.meeting_location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{formatDateTime(offer.departure_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 flex-shrink-0" />
                        <span>{availableSeats[offer.id] || 0} place(s)</span>
                      </div>
                    </div>

                    {offer.additional_info && (
                      <p className="mt-1 text-xs text-gray-500 italic truncate">
                        {offer.additional_info}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/events/${eventId}/carpooling`)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs whitespace-nowrap flex-shrink-0"
                  >
                    Voir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
