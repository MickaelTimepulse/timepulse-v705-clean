import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Car, Users, MapPin, Clock, Calendar, Mail, Phone, Filter, Search, CheckCircle, XCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OrganizerLayout from '../components/OrganizerLayout';

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
  management_code: string;
  status: 'active' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface Passenger {
  id: string;
  passenger_first_name: string;
  passenger_last_name: string;
  passenger_email: string;
  passenger_phone: string;
  seats_reserved: number;
  status: string;
  created_at: string;
}

export default function OrganizerCarpooling() {
  const { eventId } = useParams();
  const [offers, setOffers] = useState<CarpoolingOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<CarpoolingOffer[]>([]);
  const [passengers, setPassengers] = useState<{[key: string]: Passenger[]}>({});
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<CarpoolingOffer | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassengersModal, setShowPassengersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteCodeError, setDeleteCodeError] = useState('');

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  const [editForm, setEditForm] = useState({
    driver_first_name: '',
    driver_last_name: '',
    driver_email: '',
    driver_phone: '',
    meeting_location: '',
    meeting_address: '',
    meeting_city: '',
    meeting_postal_code: '',
    departure_time: '',
    available_seats: 1,
    additional_info: ''
  });

  useEffect(() => {
    loadCarpoolingData();

    // S'abonner aux changements en temps réel sur les réservations
    const bookingsSubscription = supabase
      .channel('carpooling_bookings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carpooling_bookings'
        },
        (payload) => {
          console.log('🔄 Changement détecté dans les réservations:', payload);
          // Recharger les données quand il y a un changement
          loadCarpoolingData();
        }
      )
      .subscribe();

    return () => {
      bookingsSubscription.unsubscribe();
    };
  }, [eventId]);

  useEffect(() => {
    applyFilters();
  }, [offers, statusFilter, searchTerm]);

  const loadCarpoolingData = async () => {
    try {
      setLoading(true);

      const { data: offersData, error: offersError } = await supabase
        .from('carpooling_offers')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;
      setOffers(offersData || []);

      if (offersData) {
        const passengersMap: {[key: string]: Passenger[]} = {};
        for (const offer of offersData) {
          const { data: passengerData, error: passError } = await supabase
            .from('carpooling_bookings')
            .select('*')
            .eq('offer_id', offer.id)
            .order('created_at', { ascending: true });

          if (passError) {
            console.error('❌ Erreur chargement passagers pour offre', offer.id, passError);
          } else {
            console.log('✅ Passagers chargés pour', offer.driver_first_name, offer.driver_last_name, ':', passengerData);
          }

          passengersMap[offer.id] = passengerData || [];
        }
        setPassengers(passengersMap);
        console.log('📊 TOTAL PASSAGERS:', Object.values(passengersMap).flat().length);
        console.log('📊 PASSAGERS CONFIRMÉS:', Object.values(passengersMap).flat().filter(p => p.status === 'confirmed').length);
      }
    } catch (error) {
      console.error('Error loading carpooling data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...offers];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => offer.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(offer =>
        offer.driver_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.driver_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.driver_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.meeting_location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOffers(filtered);
  };

  const handleEdit = (offer: CarpoolingOffer) => {
    setSelectedOffer(offer);
    setEditForm({
      driver_first_name: offer.driver_first_name,
      driver_last_name: offer.driver_last_name,
      driver_email: offer.driver_email,
      driver_phone: offer.driver_phone,
      meeting_location: offer.meeting_location,
      departure_time: new Date(offer.departure_time).toISOString().slice(0, 16),
      available_seats: offer.available_seats,
      additional_info: offer.additional_info || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;

    try {
      const { error } = await supabase
        .from('carpooling_offers')
        .update({
          ...editForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOffer.id);

      if (error) throw error;

      alert('Annonce modifiée avec succès !');
      setShowEditModal(false);
      loadCarpoolingData();
    } catch (error) {
      console.error('Error updating offer:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleDeleteClick = (offerId: string) => {
    setDeleteOfferId(offerId);
    setDeleteCode('');
    setDeleteCodeError('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOfferId) return;

    try {
      // Vérifier le code de gestion
      const { data: offerData, error: fetchError } = await supabase
        .from('carpooling_offers')
        .select('management_code')
        .eq('id', deleteOfferId)
        .single();

      if (fetchError) throw fetchError;

      if (deleteCode.toUpperCase() !== offerData.management_code) {
        setDeleteCodeError('Code incorrect. Vérifiez le code reçu par email.');
        return;
      }

      // Code correct, procéder à l'annulation
      const { error } = await supabase
        .from('carpooling_offers')
        .update({ status: 'cancelled' })
        .eq('id', deleteOfferId);

      if (error) throw error;

      // Envoyer les notifications d'annulation
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/carpooling-cancellation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ offer_id: deleteOfferId })
      });

      alert('Annonce supprimée et passagers notifiés');
      setShowDeleteModal(false);
      setDeleteOfferId(null);
      loadCarpoolingData();
    } catch (error: any) {
      console.error('Error deleting offer:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleViewPassengers = (offer: CarpoolingOffer) => {
    setSelectedOffer(offer);
    setShowPassengersModal(true);
  };

  const getAvailableSeats = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return 0;

    const reservedSeats = (passengers[offerId] || [])
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + p.seats_reserved, 0);

    return offer.available_seats - reservedSeats;
  };

  const formatDateTime = (dateTime: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateTime));
  };

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Co-voiturages</h1>
          <p className="text-gray-600">Visualisez et gérez toutes les offres de co-voiturage pour cet événement</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Total Offres</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{offers.length}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Actives</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {offers.filter(o => o.status === 'active').length}
              </p>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-600 font-medium">Annulées</span>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {offers.filter(o => o.status === 'cancelled').length}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-purple-600 font-medium">Passagers</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {Object.values(passengers).flat().filter(p => p.status === 'confirmed').length}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou lieu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Actives
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  statusFilter === 'cancelled'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Annulées
              </button>
            </div>
          </div>
        </div>

        {filteredOffers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium text-gray-900 mb-2">Aucune offre trouvée</p>
            <p className="text-gray-600">Aucune offre de co-voiturage ne correspond à vos critères</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map(offer => {
              const offerPassengers = passengers[offer.id] || [];
              const confirmedPassengers = offerPassengers.filter(p => p.status === 'confirmed');
              const availableSeats = getAvailableSeats(offer.id);

              return (
                <div
                  key={offer.id}
                  className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                    offer.status === 'active' ? 'border-green-500' : 'border-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${
                        offer.status === 'active' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Car className={`w-6 h-6 ${
                          offer.status === 'active' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {offer.driver_first_name} {offer.driver_last_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            offer.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {offer.status === 'active' ? 'Active' : 'Annulée'}
                          </span>
                          <span className="text-sm text-gray-500">
                            Code: <span className="font-mono font-bold">{offer.management_code}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {offer.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleEdit(offer)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(offer.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Email</p>
                        <p className="text-sm text-gray-900">{offer.driver_email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Téléphone</p>
                        <p className="text-sm text-gray-900">{offer.driver_phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Lieu de départ</p>
                        <p className="text-sm text-gray-900">{offer.meeting_location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Départ</p>
                        <p className="text-sm text-gray-900">{formatDateTime(offer.departure_time)}</p>
                      </div>
                    </div>
                  </div>

                  {offer.additional_info && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600 italic">"{offer.additional_info}"</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-pink-600" />
                        <span className="text-sm text-gray-600">
                          Places: <span className="font-bold text-gray-900">{availableSeats}</span> / {offer.available_seats}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-600">
                          Passagers: <span className="font-bold text-gray-900">{confirmedPassengers.length}</span>
                        </span>
                      </div>
                    </div>

                    {confirmedPassengers.length > 0 && (
                      <button
                        onClick={() => handleViewPassengers(offer)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Voir les passagers
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showEditModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Modifier l'annonce</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={editForm.driver_first_name}
                    onChange={(e) => setEditForm({...editForm, driver_first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={editForm.driver_last_name}
                    onChange={(e) => setEditForm({...editForm, driver_last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={editForm.driver_email}
                  onChange={(e) => setEditForm({...editForm, driver_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                <input
                  type="tel"
                  required
                  value={editForm.driver_phone}
                  onChange={(e) => setEditForm({...editForm, driver_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de départ *</label>
                <input
                  type="text"
                  required
                  value={editForm.meeting_location}
                  onChange={(e) => setEditForm({...editForm, meeting_location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure de départ *</label>
                <input
                  type="datetime-local"
                  required
                  value={editForm.departure_time}
                  onChange={(e) => setEditForm({...editForm, departure_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Places disponibles *</label>
                <select
                  required
                  value={editForm.available_seats}
                  onChange={(e) => setEditForm({...editForm, available_seats: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} place{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Informations complémentaires</label>
                <textarea
                  value={editForm.additional_info}
                  onChange={(e) => setEditForm({...editForm, additional_info: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPassengersModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Passagers - {selectedOffer.driver_first_name} {selectedOffer.driver_last_name}
              </h3>
              <button
                onClick={() => setShowPassengersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {passengers[selectedOffer.id]?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucun passager inscrit</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {passengers[selectedOffer.id]?.map((passenger, index) => (
                    <div
                      key={passenger.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                            <span className="font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {passenger.passenger_first_name} {passenger.passenger_last_name}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              passenger.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {passenger.status === 'confirmed' ? 'Confirmé' : passenger.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Places réservées</div>
                          <div className="text-xl font-bold text-pink-600">{passenger.seats_reserved}</div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{passenger.passenger_email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{passenger.passenger_phone}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        Inscrit le {new Intl.DateTimeFormat('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(passenger.created_at))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deleteOfferId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Supprimer l'annonce</h3>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-900">
                <strong>Attention :</strong> Cette action est irréversible. Un email d'annulation sera automatiquement envoyé à tous les passagers inscrits.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                Pour supprimer cette annonce, entrez le code de gestion que le conducteur a reçu par email lors de la création de l'annonce.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code de gestion *
              </label>
              <input
                type="text"
                value={deleteCode}
                onChange={(e) => {
                  setDeleteCode(e.target.value.toUpperCase());
                  setDeleteCodeError('');
                }}
                placeholder="Ex: ABC12345"
                maxLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase text-center text-lg tracking-wider font-mono"
              />
              {deleteCodeError && (
                <p className="mt-2 text-sm text-red-600">{deleteCodeError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteOfferId(null);
                  setDeleteCode('');
                  setDeleteCodeError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </OrganizerLayout>
  );
}
