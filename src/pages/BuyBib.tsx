import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tag, AlertCircle, CheckCircle, User, Calendar, CreditCard, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BibListing {
  id: string;
  event_id: string;
  race_id: string;
  registration_id: string;
  bib_number: number | null;
  sale_price: number;
  gender_required: 'M' | 'F' | 'any';
  races: {
    name: string;
    distance: number;
    elevation_gain: number;
  };
  events: {
    slug: string;
    name: string;
    start_date: string;
    city: string;
  };
}

export default function BuyBib() {
  const { eventId, listingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<BibListing | null>(null);
  const [eventSlug, setEventSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [buyerInfo, setBuyerInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    nationality: 'FRA',
    address: '',
    city: '',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  useEffect(() => {
    loadListing();
  }, [listingId]);

  const loadListing = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('bib_exchange_listings')
        .select(`
          *,
          races(name, distance, elevation_gain),
          events(slug, name, start_date, city)
        `)
        .eq('id', listingId)
        .eq('status', 'available')
        .single();

      if (error) throw error;
      setListing(data);
      if (data?.events?.slug) setEventSlug(data.events.slug);
    } catch (error) {
      console.error('Error loading listing:', error);
      alert('Dossard non disponible');
      navigate(`/events/${eventId}/bib-exchange`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vous devez être connecté pour acheter un dossard');
      return;
    }

    if (!agreedToTerms) {
      alert('Vous devez accepter les conditions générales');
      return;
    }

    if (!listing) return;

    if (listing.gender_required !== 'any' && buyerInfo.gender !== listing.gender_required) {
      alert(`Ce dossard est réservé aux ${listing.gender_required === 'M' ? 'hommes' : 'femmes'} uniquement`);
      return;
    }

    try {
      setProcessing(true);

      const { data: existingReg, error: checkError } = await supabase
        .from('registrations')
        .select('id')
        .eq('race_id', listing.race_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingReg) {
        alert('Vous êtes déjà inscrit à cette course');
        return;
      }

      const { data: newRegistration, error: regError } = await supabase
        .from('registrations')
        .insert([{
          race_id: listing.race_id,
          user_id: user.id,
          ...buyerInfo,
          registration_type: 'bib_transfer',
          payment_status: 'completed',
          payment_method: 'stripe'
        }])
        .select()
        .single();

      if (regError) throw regError;

      const { data: newEntry, error: entryError } = await supabase
        .from('entries')
        .insert([{
          race_id: listing.race_id,
          registration_id: newRegistration.id,
          bib_number: listing.bib_number,
          total_amount_paid: listing.sale_price,
          payment_status: 'completed',
          registration_status: 'confirmed'
        }])
        .select()
        .single();

      if (entryError) throw entryError;

      const { data: settingsData } = await supabase
        .from('bib_exchange_settings')
        .select('timepulse_fee_amount')
        .eq('event_id', eventId)
        .single();

      const timepulseFee = settingsData?.timepulse_fee_amount || 5.00;
      const sellerRefund = Math.max(0, listing.sale_price - timepulseFee);

      const { error: transferError } = await supabase
        .from('bib_exchange_transfers')
        .insert([{
          listing_id: listing.id,
          event_id: listing.event_id,
          race_id: listing.race_id,
          seller_registration_id: listing.registration_id,
          buyer_registration_id: newRegistration.id,
          seller_refund_amount: sellerRefund,
          seller_refund_status: 'pending',
          buyer_payment_amount: listing.sale_price,
          buyer_payment_status: 'completed',
          timepulse_fee_amount: timepulseFee
        }]);

      if (transferError) throw transferError;

      const { error: listingUpdateError } = await supabase
        .from('bib_exchange_listings')
        .update({
          status: 'sold',
          sold_at: new Date().toISOString()
        })
        .eq('id', listing.id);

      if (listingUpdateError) throw listingUpdateError;

      const { error: oldRegUpdateError } = await supabase
        .from('registrations')
        .update({
          registration_status: 'transferred'
        })
        .eq('id', listing.registration_id);

      if (oldRegUpdateError) throw oldRegUpdateError;

      alert(`Félicitations ! Vous avez acheté le dossard #${listing.bib_number || 'N/A'} pour ${listing.sale_price.toFixed(2)}€\n\nVous recevrez un email de confirmation avec tous les détails.`);

      navigate(`/events/${eventSlug || eventId}`);
    } catch (error) {
      console.error('Error buying bib:', error);
      alert('Erreur lors de l\'achat du dossard');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dossard non disponible</h1>
          <Link
            to={`/events/${eventSlug || eventId}/bib-exchange`}
            className="text-pink-600 hover:text-pink-700"
          >
            Retour à la bourse aux dossards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to={`/events/${eventSlug || eventId}/bib-exchange`}
            className="inline-flex items-center text-pink-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la bourse
          </Link>
          <div className="flex items-center">
            <Tag className="w-8 h-8 mr-3" />
            <h1 className="text-3xl font-bold">Acheter un dossard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informations du dossard</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Événement</p>
              <p className="font-medium text-gray-900">{listing.events.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Course</p>
              <p className="font-medium text-gray-900">{listing.races.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dossard n°</p>
              <p className="text-2xl font-bold text-pink-600">{listing.bib_number || 'Non attribué'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Prix</p>
              <p className="text-2xl font-bold text-gray-900">{listing.sale_price.toFixed(2)} €</p>
            </div>
            {listing.gender_required !== 'any' && (
              <div className="col-span-2">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Restriction de genre</p>
                      <p>
                        Ce dossard est réservé aux {listing.gender_required === 'M' ? 'hommes' : 'femmes'} uniquement
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <User className="w-6 h-6 mr-2 text-pink-600" />
            Vos informations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyerInfo.first_name}
                onChange={(e) => setBuyerInfo({...buyerInfo, first_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyerInfo.last_name}
                onChange={(e) => setBuyerInfo({...buyerInfo, last_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={buyerInfo.email}
                onChange={(e) => setBuyerInfo({...buyerInfo, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={buyerInfo.phone}
                onChange={(e) => setBuyerInfo({...buyerInfo, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de naissance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={buyerInfo.date_of_birth}
                onChange={(e) => setBuyerInfo({...buyerInfo, date_of_birth: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre <span className="text-red-500">*</span>
              </label>
              <select
                value={buyerInfo.gender}
                onChange={(e) => setBuyerInfo({...buyerInfo, gender: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Sélectionner</option>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyerInfo.address}
                onChange={(e) => setBuyerInfo({...buyerInfo, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyerInfo.city}
                onChange={(e) => setBuyerInfo({...buyerInfo, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code postal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyerInfo.postal_code}
                onChange={(e) => setBuyerInfo({...buyerInfo, postal_code: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nationalité <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyerInfo.nationality}
                onChange={(e) => setBuyerInfo({...buyerInfo, nationality: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact d'urgence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du contact <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={buyerInfo.emergency_contact_name}
                  onChange={(e) => setBuyerInfo({...buyerInfo, emergency_contact_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={buyerInfo.emergency_contact_phone}
                  onChange={(e) => setBuyerInfo({...buyerInfo, emergency_contact_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-2">Documents à fournir</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Certificat médical (obligatoire)</li>
                  <li>Licence sportive si applicable</li>
                  <li>Autorisation parentale si mineur</li>
                </ul>
                <p className="mt-2">
                  Ces documents devront être téléchargés après validation de votre achat.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-5 h-5 text-pink-600"
                required
              />
              <span className="text-sm text-gray-700">
                J'accepte les conditions générales de vente et je comprends que cet achat est définitif.
                Je m'engage à fournir tous les justificatifs nécessaires dans les délais impartis.
              </span>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <Link
              to={`/events/${eventSlug || eventId}/bib-exchange`}
              className="text-gray-600 hover:text-gray-800"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={processing || !agreedToTerms}
              className="flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Traitement en cours...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Confirmer l'achat · {listing.sale_price.toFixed(2)} €
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
