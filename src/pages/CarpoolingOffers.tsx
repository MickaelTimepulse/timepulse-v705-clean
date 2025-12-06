import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, Users, Clock, MapPin, Filter, X, Calendar, Search, ArrowLeft, Edit, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CarpoolingOfferCard from '../components/CarpoolingOfferCard';

interface CarpoolingOffer {
  id: string;
  driver_first_name: string;
  driver_last_name: string;
  driver_email: string;
  driver_phone: string;
  meeting_location: string;
  meeting_address: string;
  meeting_city: string;
  meeting_postal_code: string;
  departure_time: string;
  available_seats: number;
  additional_info: string;
  management_code?: string;
  status: string;
  created_at: string;
}

interface Event {
  id: string;
  slug: string;
  name: string;
  start_date: string;
  location: string;
  full_address: string;
  city: string;
  postal_code: string;
}

interface Passenger {
  id: string;
  passenger_first_name: string;
  passenger_last_name: string;
  seats_reserved: number;
  created_at: string;
}

export default function CarpoolingOffers() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [offers, setOffers] = useState<CarpoolingOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<CarpoolingOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableSeats, setAvailableSeats] = useState<{[key: string]: number}>({});
  const [passengers, setPassengers] = useState<{[key: string]: Passenger[]}>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<CarpoolingOffer | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

  const [filters, setFilters] = useState({
    searchLocation: '',
    minSeats: '',
    departureDate: '',
    departureTime: ''
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
    loadEventAndOffers();
  }, [eventId]);

  useEffect(() => {
    applyFilters();
  }, [filters, offers, availableSeats]);

  const loadEventAndOffers = async () => {
    try {
      setLoading(true);

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, slug, name, start_date, location, full_address, city, postal_code')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      const { data: offersData, error: offersError } = await supabase
        .from('carpooling_offers')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .order('departure_time', { ascending: true });

      if (offersError) throw offersError;
      setOffers(offersData || []);

      if (offersData) {
        const seatsMap: {[key: string]: number} = {};
        const passengersMap: {[key: string]: Passenger[]} = {};

        for (const offer of offersData) {
          const { data: bookings } = await supabase
            .from('carpooling_bookings')
            .select('id, passenger_first_name, passenger_last_name, seats_reserved, created_at')
            .eq('offer_id', offer.id)
            .eq('status', 'confirmed')
            .order('created_at', { ascending: true });

          passengersMap[offer.id] = bookings || [];
          const totalReserved = bookings?.reduce((sum, booking) => sum + booking.seats_reserved, 0) || 0;
          seatsMap[offer.id] = offer.available_seats - totalReserved;
        }

        setPassengers(passengersMap);
        setAvailableSeats(seatsMap);

        console.log('📊 Données chargées:', {
          offres: offersData.length,
          passagers: passengersMap,
          placesDisponibles: seatsMap
        });
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };


  const applyFilters = () => {
    let filtered = [...offers];

    if (filters.searchLocation) {
      filtered = filtered.filter(offer =>
        offer.meeting_location.toLowerCase().includes(filters.searchLocation.toLowerCase())
      );
    }

    if (filters.minSeats) {
      const minSeats = parseInt(filters.minSeats);
      filtered = filtered.filter(offer => (availableSeats[offer.id] || 0) >= minSeats);
    }

    if (filters.departureDate) {
      filtered = filtered.filter(offer => {
        const offerDate = new Date(offer.departure_time).toISOString().split('T')[0];
        return offerDate === filters.departureDate;
      });
    }

    if (filters.departureTime) {
      filtered = filtered.filter(offer => {
        const offerTime = new Date(offer.departure_time).toTimeString().slice(0, 5);
        return offerTime >= filters.departureTime;
      });
    }

    setFilteredOffers(filtered);
  };

  const resetFilters = () => {
    setFilters({
      searchLocation: '',
      minSeats: '',
      departureDate: '',
      departureTime: ''
    });
  };

  const handleJoinOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;

    try {
      const { error } = await supabase
        .from('carpooling_bookings')
        .insert({
          offer_id: selectedOffer.id,
          passenger_first_name: joinFormData.passenger_first_name,
          passenger_last_name: joinFormData.passenger_last_name,
          passenger_email: joinFormData.passenger_email,
          passenger_phone: joinFormData.passenger_phone,
          seats_reserved: joinFormData.seats_reserved
        });

      if (error) throw error;

      alert('Votre demande a été enregistrée ! Le conducteur va recevoir vos coordonnées par email.');
      setShowJoinForm(false);
      setJoinFormData({
        passenger_first_name: '',
        passenger_last_name: '',
        passenger_email: '',
        passenger_phone: '',
        seats_reserved: 1,
        terms_accepted: false
      });
      loadEventAndOffers();
    } catch (error) {
      console.error('Error joining offer:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  const handleUpdateOffer = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      setEditFormData({
        driver_first_name: offer.driver_first_name,
        driver_last_name: offer.driver_last_name,
        driver_email: offer.driver_email,
        driver_phone: offer.driver_phone,
        meeting_location: offer.meeting_location,
        departure_time: new Date(offer.departure_time).toISOString().slice(0, 16),
        available_seats: offer.available_seats,
        additional_info: offer.additional_info || ''
      });
      setSelectedOffer(offer);
      setShowEditForm(true);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('carpooling_offers')
        .update({ status: 'cancelled' })
        .eq('id', offerId);

      if (error) throw error;

      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/carpooling-cancellation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ offer_id: offerId })
      });

      alert('Votre annonce a été supprimée. Les passagers ont été informés par email.');
      loadEventAndOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Une erreur est survenue lors de la suppression.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;

    try {
      const { error } = await supabase
        .from('carpooling_offers')
        .update({
          driver_first_name: editFormData.driver_first_name,
          driver_last_name: editFormData.driver_last_name,
          driver_email: editFormData.driver_email,
          driver_phone: editFormData.driver_phone,
          meeting_location: editFormData.meeting_location,
          departure_time: editFormData.departure_time,
          available_seats: editFormData.available_seats,
          additional_info: editFormData.additional_info,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOffer.id);

      if (error) throw error;

      alert('Votre annonce a été modifiée avec succès !');
      setShowEditForm(false);
      loadEventAndOffers();
    } catch (error) {
      console.error('Error updating offer:', error);
      alert('Une erreur est survenue lors de la modification.');
    }
  };

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

  const formatDate = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(`/events/${event?.slug || eventId}`)}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à l'événement
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Car className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Co-voiturage</h1>
                <p className="text-gray-600">{event?.name}</p>
              </div>
            </div>
            <button
              onClick={() => {
                loadEventAndOffers();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Actualiser les données"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Partagez votre trajet !</strong> Soyez à l'heure, respectueux et partagez les frais.
              Timepulse met en relation les participants mais n'est pas responsable des retards, absences ou incidents.
            </p>
          </div>
        </div>

        {filteredOffers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-pink-600" />
                Points de départ des co-voiturages ({filteredOffers.length})
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <Filter className="w-4 h-4" />
                Filtres
              </button>
            </div>

            {showFilters && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Ville de départ
                    </label>
                    <input
                      type="text"
                      value={filters.searchLocation}
                      onChange={(e) => setFilters({...filters, searchLocation: e.target.value})}
                      placeholder="Ex: Nantes, Paris..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date de départ
                    </label>
                    <input
                      type="date"
                      value={filters.departureDate}
                      onChange={(e) => setFilters({...filters, departureDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Heure après
                    </label>
                    <input
                      type="time"
                      value={filters.departureTime}
                      onChange={(e) => setFilters({...filters, departureTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    Réinitialiser
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {filteredOffers.map((offer, index) => {
                const fullAddress = `${offer.meeting_address}, ${offer.meeting_postal_code} ${offer.meeting_city}`;
                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

                return (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="mb-2">
                            <p className="text-lg font-bold text-gray-900">
                              {offer.meeting_city}
                            </p>
                            <p className="text-sm text-gray-600">
                              Point de RDV : {offer.meeting_location}
                            </p>
                            <p className="text-xs text-gray-500">
                              {offer.meeting_address}, {offer.meeting_postal_code}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-pink-600" />
                              <span>{new Date(offer.departure_time).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-pink-600" />
                              <span>{new Date(offer.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-pink-600" />
                              <span className="font-semibold text-green-600">{availableSeats[offer.id] || offer.available_seats} place{(availableSeats[offer.id] || offer.available_seats) > 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          {passengers[offer.id] && passengers[offer.id].length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs font-medium text-gray-500 mb-2">
                                {passengers[offer.id].length} personne{passengers[offer.id].length > 1 ? 's' : ''} inscrite{passengers[offer.id].length > 1 ? 's' : ''} :
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {passengers[offer.id].map((passenger) => (
                                  <span
                                    key={passenger.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                                  >
                                    <Users className="w-3 h-3" />
                                    {passenger.passenger_first_name.charAt(0)}.{passenger.passenger_last_name.charAt(0)}.
                                    {passenger.seats_reserved > 1 && (
                                      <span className="ml-1 text-blue-600 font-bold">×{passenger.seats_reserved}</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setSelectedOffer(offer);
                            setShowJoinForm(true);
                          }}
                          disabled={availableSeats[offer.id] === 0}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          <Car className="w-4 h-4" />
                          Rejoindre
                        </button>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                          title="Ouvrir dans Google Maps"
                        >
                          <MapPin className="w-4 h-4" />
                          Itinéraire
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showEditForm && selectedOffer && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Modifier l'annonce</h3>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.driver_first_name}
                    onChange={(e) => setEditFormData({...editFormData, driver_first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.driver_last_name}
                    onChange={(e) => setEditFormData({...editFormData, driver_last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.driver_email}
                  onChange={(e) => setEditFormData({...editFormData, driver_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={editFormData.driver_phone}
                  onChange={(e) => setEditFormData({...editFormData, driver_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu de rencontre *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.meeting_location}
                  onChange={(e) => setEditFormData({...editFormData, meeting_location: e.target.value})}
                  placeholder="Ex: Parking Carrefour Grenoble"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure de départ *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editFormData.departure_time}
                  onChange={(e) => setEditFormData({...editFormData, departure_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de places disponibles *
                </label>
                <select
                  required
                  value={editFormData.available_seats}
                  onChange={(e) => setEditFormData({...editFormData, available_seats: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} place{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Informations complémentaires
                </label>
                <textarea
                  value={editFormData.additional_info}
                  onChange={(e) => setEditFormData({...editFormData, additional_info: e.target.value})}
                  rows={3}
                  placeholder="Ex: Je pars de Grenoble centre, possibilité de faire un détour"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinForm && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Rejoindre ce co-voiturage</h3>
              <button
                onClick={() => setShowJoinForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleJoinOffer} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Car className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Détails du trajet</p>
                    <p><strong>Conducteur :</strong> {getInitials(selectedOffer.driver_first_name, selectedOffer.driver_last_name)}</p>
                    <p><strong>Lieu de départ :</strong> {selectedOffer.meeting_location}</p>
                    <p><strong>Heure de départ :</strong> {formatDateTime(selectedOffer.departure_time)}</p>
                    <p><strong>Places disponibles :</strong> {availableSeats[selectedOffer.id] || 0}</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={joinFormData.passenger_first_name}
                    onChange={(e) => setJoinFormData({...joinFormData, passenger_first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={joinFormData.passenger_last_name}
                    onChange={(e) => setJoinFormData({...joinFormData, passenger_last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={joinFormData.passenger_email}
                  onChange={(e) => setJoinFormData({...joinFormData, passenger_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={joinFormData.passenger_phone}
                  onChange={(e) => setJoinFormData({...joinFormData, passenger_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de places souhaitées *
                </label>
                <select
                  required
                  value={joinFormData.seats_reserved}
                  onChange={(e) => setJoinFormData({...joinFormData, seats_reserved: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {[...Array(Math.min(availableSeats[selectedOffer.id] || 0, 4))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} place{i > 0 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  checked={joinFormData.terms_accepted}
                  onChange={(e) => setJoinFormData({...joinFormData, terms_accepted: e.target.checked})}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  J'accepte de partager mes coordonnées avec le conducteur et je m'engage à respecter les règles de bon sens du co-voiturage *
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirmer ma demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
