import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, Tag, Users, DollarSign, Calendar, CheckCircle, XCircle, AlertCircle, Settings, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OrganizerLayout from '../components/OrganizerLayout';

interface BibExchangeSettings {
  id: string;
  event_id: string;
  is_enabled: boolean;
  transfer_opens_at: string | null;
  transfer_deadline: string | null;
  timepulse_fee_amount: number;
  allow_gender_mismatch: boolean;
  rules_text: string | null;
}

interface BibListing {
  id: string;
  event_id: string;
  race_id: string;
  registration_id: string;
  bib_number: number | null;
  original_price: number;
  sale_price: number;
  seller_refund_amount: number;
  gender_required: 'M' | 'F' | 'any';
  status: 'available' | 'sold' | 'cancelled';
  listed_at: string;
  sold_at: string | null;
  cancelled_at: string | null;
  races: {
    name: string;
  };
  registrations: {
    first_name: string;
    last_name: string;
    email: string;
    gender: string;
  };
}

interface Transfer {
  id: string;
  listing_id: string;
  event_id: string;
  seller_refund_amount: number;
  seller_refund_status: string;
  buyer_payment_amount: number;
  buyer_payment_status: string;
  timepulse_fee_amount: number;
  transferred_at: string;
  refund_completed_at: string | null;
  bib_exchange_listings: {
    bib_number: number | null;
    races: {
      name: string;
    };
  };
  seller_registration: {
    first_name: string;
    last_name: string;
  };
  buyer_registration: {
    first_name: string;
    last_name: string;
  };
}

export default function OrganizerBibExchange() {
  const { eventId } = useParams();
  const [settings, setSettings] = useState<BibExchangeSettings | null>(null);
  const [listings, setListings] = useState<BibListing[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [eventName, setEventName] = useState('');

  const [settingsForm, setSettingsForm] = useState({
    is_enabled: false,
    transfer_opens_at: '',
    transfer_deadline: '',
    timepulse_fee_amount: 5.00,
    allow_gender_mismatch: false,
    rules_text: ''
  });

  useEffect(() => {
    loadBibExchangeData();
    loadEventName();

    const listingsSubscription = supabase
      .channel('bib_listings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bib_exchange_listings'
      }, () => {
        loadBibExchangeData();
      })
      .subscribe();

    return () => {
      listingsSubscription.unsubscribe();
    };
  }, [eventId]);

  const loadEventName = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('name')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEventName(data.name);
    } catch (error) {
      console.error('Error loading event name:', error);
    }
  };

  const loadBibExchangeData = async () => {
    try {
      setLoading(true);

      const { data: settingsData, error: settingsError } = await supabase
        .from('bib_exchange_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (settingsData) {
        setSettings(settingsData);
        setSettingsForm({
          is_enabled: settingsData.is_enabled,
          transfer_opens_at: settingsData.transfer_opens_at ? new Date(settingsData.transfer_opens_at).toISOString().slice(0, 16) : '',
          transfer_deadline: settingsData.transfer_deadline ? new Date(settingsData.transfer_deadline).toISOString().slice(0, 16) : '',
          timepulse_fee_amount: settingsData.timepulse_fee_amount,
          allow_gender_mismatch: settingsData.allow_gender_mismatch,
          rules_text: settingsData.rules_text || ''
        });
      }

      const { data: listingsData, error: listingsError } = await supabase
        .from('bib_exchange_listings')
        .select(`
          *,
          races(name),
          registrations(first_name, last_name, email, gender)
        `)
        .eq('event_id', eventId)
        .order('listed_at', { ascending: false });

      if (listingsError) throw listingsError;
      setListings(listingsData || []);

      const { data: transfersData, error: transfersError } = await supabase
        .from('bib_exchange_transfers')
        .select(`
          *,
          bib_exchange_listings(bib_number, races(name)),
          seller_registration:registrations!seller_registration_id(first_name, last_name),
          buyer_registration:registrations!buyer_registration_id(first_name, last_name)
        `)
        .eq('event_id', eventId)
        .order('transferred_at', { ascending: false });

      if (transfersError) throw transfersError;
      setTransfers(transfersData || []);

    } catch (error) {
      console.error('Error loading bib exchange data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        event_id: eventId,
        ...settingsForm,
        transfer_opens_at: settingsForm.transfer_opens_at ? new Date(settingsForm.transfer_opens_at).toISOString() : null,
        transfer_deadline: settingsForm.transfer_deadline ? new Date(settingsForm.transfer_deadline).toISOString() : null
      };

      if (settings) {
        const { error } = await supabase
          .from('bib_exchange_settings')
          .update(payload)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bib_exchange_settings')
          .insert([payload]);

        if (error) throw error;
      }

      alert('Paramètres enregistrés avec succès');
      setShowSettingsModal(false);
      loadBibExchangeData();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de l\'enregistrement des paramètres');
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette annonce ?')) return;

    try {
      const { error } = await supabase
        .from('bib_exchange_listings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', listingId);

      if (error) throw error;
      alert('Annonce annulée avec succès');
      loadBibExchangeData();
    } catch (error) {
      console.error('Error cancelling listing:', error);
      alert('Erreur lors de l\'annulation');
    }
  };

  const stats = {
    available: listings.filter(l => l.status === 'available').length,
    sold: listings.filter(l => l.status === 'sold').length,
    cancelled: listings.filter(l => l.status === 'cancelled').length,
    totalRevenue: transfers.reduce((sum, t) => sum + t.buyer_payment_amount, 0),
    totalFees: transfers.reduce((sum, t) => sum + t.timepulse_fee_amount, 0),
    totalRefunds: transfers.reduce((sum, t) => sum + t.seller_refund_amount, 0)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" />Disponible</span>;
      case 'sold':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"><CheckCircle className="w-4 h-4 mr-1" />Vendu</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"><XCircle className="w-4 h-4 mr-1" />Annulé</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-pink-600" />
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bourse aux Dossards</h1>
            <p className="text-gray-600 mt-1">{eventName}</p>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            <Settings className="w-5 h-5 mr-2" />
            Paramètres
          </button>
        </div>

        {!settings?.is_enabled && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
              <div>
                <p className="text-sm text-yellow-700">
                  La bourse aux dossards est actuellement désactivée. Activez-la dans les paramètres pour permettre aux participants de revendre leurs dossards.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dossards disponibles</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.available}</p>
              </div>
              <Tag className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dossards vendus</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.sold}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Frais Timepulse</p>
                <p className="text-3xl font-bold text-pink-600 mt-2">{stats.totalFees.toFixed(2)} €</p>
              </div>
              <TrendingUp className="w-12 h-12 text-pink-600 opacity-20" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Annonces en cours</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dossard</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendeur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genre requis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mise en vente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {listings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Aucun dossard en vente pour le moment
                    </td>
                  </tr>
                ) : (
                  listings.map((listing) => (
                    <tr key={listing.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-pink-600">
                          {listing.bib_number || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{listing.races.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{listing.registrations.first_name} {listing.registrations.last_name}</div>
                        <div className="text-sm text-gray-500">{listing.registrations.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {listing.gender_required === 'M' && <span className="text-sm text-blue-600">Homme</span>}
                        {listing.gender_required === 'F' && <span className="text-sm text-pink-600">Femme</span>}
                        {listing.gender_required === 'any' && <span className="text-sm text-gray-600">Tous</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">{listing.sale_price.toFixed(2)} €</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(listing.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(listing.listed_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {listing.status === 'available' && (
                          <button
                            onClick={() => handleCancelListing(listing.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Historique des transferts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dossard</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendeur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acheteur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frais Timepulse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remboursement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Aucun transfert effectué pour le moment
                    </td>
                  </tr>
                ) : (
                  transfers.map((transfer) => (
                    <tr key={transfer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-pink-600">
                          {transfer.bib_exchange_listings.bib_number || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{transfer.bib_exchange_listings.races.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transfer.seller_registration.first_name} {transfer.seller_registration.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transfer.buyer_registration.first_name} {transfer.buyer_registration.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {transfer.buyer_payment_amount.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-pink-600">
                        {transfer.timepulse_fee_amount.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {transfer.seller_refund_amount.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(transfer.transferred_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Paramètres de la bourse aux dossards</h3>
              </div>
              <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settingsForm.is_enabled}
                      onChange={(e) => setSettingsForm({...settingsForm, is_enabled: e.target.checked})}
                      className="w-5 h-5 text-pink-600"
                    />
                    <span className="text-sm font-medium text-gray-900">Activer la bourse aux dossards</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'ouverture
                      <span className="text-xs text-gray-500 ml-2">(optionnel)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={settingsForm.transfer_opens_at}
                      onChange={(e) => setSettingsForm({...settingsForm, transfer_opens_at: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Si vide, la bourse ouvre immédiatement</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fermeture
                      <span className="text-xs text-gray-500 ml-2">(optionnel)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={settingsForm.transfer_deadline}
                      onChange={(e) => setSettingsForm({...settingsForm, transfer_deadline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Si vide, la bourse reste ouverte</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Après cette date, aucun transfert ne sera autorisé
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frais Timepulse (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settingsForm.timepulse_fee_amount}
                    onChange={(e) => setSettingsForm({...settingsForm, timepulse_fee_amount: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Montant déduit du remboursement du vendeur
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settingsForm.allow_gender_mismatch}
                      onChange={(e) => setSettingsForm({...settingsForm, allow_gender_mismatch: e.target.checked})}
                      className="w-5 h-5 text-pink-600"
                    />
                    <span className="text-sm font-medium text-gray-900">Autoriser le transfert entre genres différents</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-8 mt-1">
                    Si désactivé, un dossard Homme ne peut être transféré qu'à un Homme
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Règlement de la bourse (affiché publiquement)
                  </label>
                  <textarea
                    value={settingsForm.rules_text}
                    onChange={(e) => setSettingsForm({...settingsForm, rules_text: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Décrivez les règles et conditions d'utilisation de la bourse aux dossards..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OrganizerLayout>
  );
}
