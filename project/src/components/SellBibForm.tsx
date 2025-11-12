import { useState, useEffect } from 'react';
import { Tag, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Registration {
  id: string;
  race_id: string;
  bib_number: number | null;
  first_name: string;
  last_name: string;
  gender: string;
  races: {
    name: string;
    distance: number;
    events: {
      id: string;
      name: string;
    };
  };
  entries: {
    total_amount_paid: number;
  }[];
}

interface BibExchangeSettings {
  is_enabled: boolean;
  transfer_deadline: string | null;
  timepulse_fee_amount: number;
  allow_gender_mismatch: boolean;
}

interface Props {
  userId: string;
  onSuccess?: () => void;
}

export default function SellBibForm({ userId, onSuccess }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<BibExchangeSettings | null>(null);

  useEffect(() => {
    loadRegistrations();
  }, [userId]);

  useEffect(() => {
    if (selectedRegistration) {
      loadEventSettings();
    }
  }, [selectedRegistration]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          races(
            name,
            distance,
            events(id, name)
          ),
          entries(total_amount_paid)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const futureRegistrations = data.filter(reg => {
        const eventDate = new Date(reg.races.events.date);
        return eventDate > new Date();
      });

      setRegistrations(futureRegistrations || []);
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventSettings = async () => {
    const reg = registrations.find(r => r.id === selectedRegistration);
    if (!reg) return;

    try {
      const { data, error } = await supabase
        .from('bib_exchange_settings')
        .select('*')
        .eq('event_id', reg.races.events.id)
        .eq('is_enabled', true)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRegistration) {
      alert('Veuillez sélectionner une inscription');
      return;
    }

    const reg = registrations.find(r => r.id === selectedRegistration);
    if (!reg) return;

    if (!settings) {
      alert('La bourse aux dossards n\'est pas activée pour cet événement');
      return;
    }

    if (settings.transfer_deadline && new Date() > new Date(settings.transfer_deadline)) {
      alert('La date limite de transfert est dépassée');
      return;
    }

    try {
      setSubmitting(true);

      const originalPrice = reg.entries[0]?.total_amount_paid || 0;
      const sellerRefund = Math.max(0, originalPrice - settings.timepulse_fee_amount);

      const genderRequired = settings.allow_gender_mismatch ? 'any' : (reg.gender === 'M' || reg.gender === 'F' ? reg.gender : 'any');

      const { error } = await supabase
        .from('bib_exchange_listings')
        .insert([{
          event_id: reg.races.events.id,
          race_id: reg.race_id,
          registration_id: reg.id,
          bib_number: reg.bib_number,
          original_price: originalPrice,
          sale_price: originalPrice,
          seller_refund_amount: sellerRefund,
          gender_required: genderRequired,
          status: 'available'
        }]);

      if (error) throw error;

      const { data: alerts } = await supabase
        .from('bib_exchange_alerts')
        .select('email')
        .eq('event_id', reg.races.events.id)
        .or(`race_id.is.null,race_id.eq.${reg.race_id}`);

      if (alerts && alerts.length > 0) {
        console.log(`Sending alerts to ${alerts.length} subscribers`);
        for (const alert of alerts) {
          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bib-exchange-alert`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({
                email: alert.email,
                event_name: reg.races.events.name,
                race_name: reg.races.name,
                event_id: reg.races.events.id
              })
            });
            console.log(`Alert sent to ${alert.email}:`, await response.json());
          } catch (emailError) {
            console.error(`Failed to send alert to ${alert.email}:`, emailError);
          }
        }
      }

      alert(`Votre dossard a été mis en vente avec succès!\n\nPrix de vente: ${originalPrice.toFixed(2)}€\nVous serez remboursé: ${sellerRefund.toFixed(2)}€ (après déduction des frais de 5€)`);

      if (onSuccess) {
        onSuccess();
      }

      setSelectedRegistration('');
      loadRegistrations();
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Erreur lors de la mise en vente du dossard');
    } finally {
      setSubmitting(false);
    }
  };

  const getRegInfo = () => {
    const reg = registrations.find(r => r.id === selectedRegistration);
    if (!reg) return null;

    const originalPrice = reg.entries[0]?.total_amount_paid || 0;
    const sellerRefund = settings ? Math.max(0, originalPrice - settings.timepulse_fee_amount) : 0;

    return {
      reg,
      originalPrice,
      sellerRefund
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Vous n'avez aucune inscription future à revendre.</p>
      </div>
    );
  }

  const regInfo = getRegInfo();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Tag className="w-6 h-6 text-pink-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Revendre mon dossard</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner l'inscription à revendre
          </label>
          <select
            value={selectedRegistration}
            onChange={(e) => setSelectedRegistration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            required
          >
            <option value="">-- Choisir une inscription --</option>
            {registrations.map((reg) => (
              <option key={reg.id} value={reg.id}>
                {reg.races.events.name} - {reg.races.name} (Dossard #{reg.bib_number || 'non attribué'})
              </option>
            ))}
          </select>
        </div>

        {regInfo && settings && (
          <>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Événement</span>
                <span className="text-sm font-medium text-gray-900">{regInfo.reg.races.events.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Course</span>
                <span className="text-sm font-medium text-gray-900">{regInfo.reg.races.name} ({regInfo.reg.races.distance} km)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Dossard n°</span>
                <span className="text-sm font-medium text-gray-900">
                  {regInfo.reg.bib_number || 'Non attribué'}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Prix d'achat initial</span>
                  <span className="text-sm font-semibold text-gray-900">{regInfo.originalPrice.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Frais Timepulse</span>
                  <span className="text-sm font-semibold text-red-600">- {settings.timepulse_fee_amount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Vous serez remboursé</span>
                  <span className="text-lg font-bold text-green-600">{regInfo.sellerRefund.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {!settings.allow_gender_mismatch && (regInfo.reg.gender === 'M' || regInfo.reg.gender === 'F') && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Restriction de genre</p>
                    <p>
                      Votre dossard ne pourra être acheté que par une personne du même genre ({regInfo.reg.gender === 'M' ? 'Homme' : 'Femme'})
                      car vous êtes inscrit dans une catégorie genrée.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {settings.transfer_deadline && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium mb-1">Date limite de transfert</p>
                    <p>
                      Les transferts de dossards seront possibles jusqu'au{' '}
                      {new Date(settings.transfer_deadline).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                <div className="text-sm text-green-700">
                  <p className="font-medium mb-1">Remboursement automatique</p>
                  <p>
                    Dès qu'un acheteur prendra votre dossard, vous serez automatiquement remboursé de {regInfo.sellerRefund.toFixed(2)} €
                    sur votre moyen de paiement initial.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Mise en vente...
                </>
              ) : (
                <>
                  <Tag className="w-5 h-5 mr-2" />
                  Mettre en vente mon dossard
                </>
              )}
            </button>
          </>
        )}

        {regInfo && !settings && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">Bourse non disponible</p>
                <p>
                  La bourse aux dossards n'est pas activée pour cet événement.
                  Contactez l'organisateur pour plus d'informations.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
