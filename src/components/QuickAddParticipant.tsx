import { useState, useEffect } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Race {
  id: string;
  name: string;
}

interface LicenseType {
  id: string;
  name: string;
}

interface RaceOption {
  id: string;
  type: string;
  label: string;
  description?: string;
  is_required: boolean;
  price_cents: number;
  choices?: Array<{
    id: string;
    label: string;
    price_modifier_cents: number;
  }>;
}

interface QuickAddParticipantProps {
  eventId: string;
  cartId: string;
  onParticipantAdded: () => void;
}

export default function QuickAddParticipant({ eventId, cartId, onParticipantAdded }: QuickAddParticipantProps) {
  const [races, setRaces] = useState<Race[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [raceOptions, setRaceOptions] = useState<RaceOption[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birthdate: '',
    gender: '',
    email: '',
    phone: '',
    race_id: '',
    license_type_id: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});

  useEffect(() => {
    loadRaces();
    loadLicenseTypes();
  }, [eventId]);

  useEffect(() => {
    if (formData.race_id) {
      console.log('🏁 [QuickAddParticipant] Course sélectionnée changée:', formData.race_id);
      // IMPORTANT: Réinitialiser les options sélectionnées quand on change de course
      setSelectedOptions({});
      setRaceOptions([]);
      loadRaceOptions(formData.race_id);
    } else {
      console.log('⚠️ [QuickAddParticipant] Aucune course sélectionnée');
      setSelectedOptions({});
      setRaceOptions([]);
    }
  }, [formData.race_id]);

  const loadRaces = async () => {
    const { data } = await supabase
      .from('races')
      .select('id, name')
      .eq('event_id', eventId)
      .order('name');
    if (data) setRaces(data);
  };

  const loadLicenseTypes = async () => {
    const { data } = await supabase
      .from('license_types')
      .select('id, name')
      .order('name');
    if (data) setLicenseTypes(data);
  };

  const loadRaceOptions = async (raceId: string) => {
    console.log('🔄 [QuickAddParticipant] Chargement des options pour race_id:', raceId);
    const { data, error } = await supabase
      .from('race_options')
      .select('*')
      .eq('race_id', raceId)
      .eq('active', true)
      .order('display_order');

    if (error) {
      console.error('❌ [QuickAddParticipant] Erreur chargement options:', error);
      setRaceOptions([]);
    } else if (data) {
      console.log('✅ [QuickAddParticipant] Options chargées:', data.length, 'options', data.map(o => o.label));
      setRaceOptions(data);
    }
  };

  const calculatePrice = async () => {
    let totalCents = 0;

    // Prix de base
    const { data: pricing } = await supabase
      .from('race_pricing')
      .select('price_cents')
      .eq('race_id', formData.race_id)
      .eq('license_type_id', formData.license_type_id)
      .single();

    if (pricing) {
      totalCents += pricing.price_cents;
    }

    // Prix des options
    raceOptions.forEach(option => {
      const value = selectedOptions[option.id];
      if (value) {
        if (option.type === 'checkbox' && value === true) {
          totalCents += option.price_cents;
        } else if (option.type === 'select' && option.choices) {
          const choice = option.choices.find(c => c.id === value);
          if (choice) {
            totalCents += choice.price_modifier_cents;
          }
        }
      }
    });

    return totalCents;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation basique
      if (!formData.first_name || !formData.last_name || !formData.birthdate || !formData.gender) {
        alert('Veuillez remplir tous les champs obligatoires');
        setLoading(false);
        return;
      }

      if (!formData.race_id || !formData.license_type_id) {
        alert('Veuillez sélectionner une course et un type de licence');
        setLoading(false);
        return;
      }

      if (!formData.emergency_contact_name || !formData.emergency_contact_phone) {
        alert('Veuillez renseigner le contact d\'urgence');
        setLoading(false);
        return;
      }

      const basePriceCents = await calculatePrice();
      const optionsPriceCents = 0; // Calculé séparément si nécessaire
      const totalPriceCents = basePriceCents;

      // Ajouter au panier
      const { error: itemError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          race_id: formData.race_id,
          license_type_id: formData.license_type_id,
          participant_data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            birthdate: formData.birthdate,
            gender: formData.gender,
            email: formData.email,
            phone: formData.phone,
            emergency_contact_name: formData.emergency_contact_name,
            emergency_contact_phone: formData.emergency_contact_phone,
          },
          selected_options: selectedOptions,
          base_price_cents: basePriceCents,
          options_price_cents: optionsPriceCents,
          total_price_cents: totalPriceCents,
        });

      if (itemError) throw itemError;

      // Mettre à jour le total du panier
      const { data: items } = await supabase
        .from('cart_items')
        .select('total_price_cents')
        .eq('cart_id', cartId);

      if (items) {
        const newTotal = items.reduce((sum, item) => sum + item.total_price_cents, 0);
        await supabase
          .from('carts')
          .update({ total_price_cents: newTotal })
          .eq('id', cartId);
      }

      // Réinitialiser le formulaire
      setFormData({
        first_name: '',
        last_name: '',
        birthdate: '',
        gender: '',
        email: '',
        phone: '',
        race_id: formData.race_id, // Garder la course sélectionnée
        license_type_id: formData.license_type_id, // Garder le type de licence
        emergency_contact_name: formData.emergency_contact_name, // Garder le contact d'urgence
        emergency_contact_phone: formData.emergency_contact_phone,
      });
      setSelectedOptions({});

      onParticipantAdded();
      alert('Participant ajouté au panier !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      alert('Erreur lors de l\'ajout au panier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5" />
        Ajouter un participant
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prénom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prénom *
          </label>
          <input
            type="text"
            required
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom *
          </label>
          <input
            type="text"
            required
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Date de naissance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de naissance *
          </label>
          <input
            type="date"
            required
            value={formData.birthdate}
            onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Genre *
          </label>
          <select
            required
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Sélectionner</option>
            <option value="M">Homme</option>
            <option value="F">Femme</option>
          </select>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Téléphone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Course */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course *
          </label>
          <select
            required
            value={formData.race_id}
            onChange={(e) => setFormData({ ...formData, race_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Sélectionner une course</option>
            {races.map(race => (
              <option key={race.id} value={race.id}>{race.name}</option>
            ))}
          </select>
        </div>

        {/* Type de licence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de licence *
          </label>
          <select
            required
            value={formData.license_type_id}
            onChange={(e) => setFormData({ ...formData, license_type_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Sélectionner</option>
            {licenseTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        {/* Contact d'urgence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact d'urgence (nom) *
          </label>
          <input
            type="text"
            required
            value={formData.emergency_contact_name}
            onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact d'urgence (tél) *
          </label>
          <input
            type="tel"
            required
            value={formData.emergency_contact_phone}
            onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Options de la course */}
      {raceOptions.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-gray-900">Options</h4>
          {raceOptions.map(option => (
            <div key={option.id} className="border border-gray-200 rounded-lg p-4">
              <label className="block font-medium text-gray-900 mb-2">
                {option.label}
                {option.is_required && <span className="text-red-600 ml-1">*</span>}
              </label>
              {option.description && (
                <p className="text-sm text-gray-600 mb-2">{option.description}</p>
              )}

              {option.type === 'checkbox' && (
                <input
                  type="checkbox"
                  checked={selectedOptions[option.id] || false}
                  onChange={(e) => setSelectedOptions({ ...selectedOptions, [option.id]: e.target.checked })}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              )}

              {(option.type === 'text' || option.type === 'reference_time' || option.type === 'number') && (
                <input
                  type={option.type === 'number' ? 'number' : 'text'}
                  value={selectedOptions[option.id] || ''}
                  onChange={(e) => setSelectedOptions({ ...selectedOptions, [option.id]: e.target.value })}
                  placeholder={option.type === 'reference_time' ? 'Ex: 00:45:30' : ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required={option.is_required}
                />
              )}

              {option.choices && option.choices.length > 0 && (
                <select
                  value={selectedOptions[option.id] || ''}
                  onChange={(e) => setSelectedOptions({ ...selectedOptions, [option.id]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required={option.is_required}
                >
                  <option value="">Sélectionner</option>
                  {option.choices.map(choice => (
                    <option key={choice.id} value={choice.id}>
                      {choice.label}
                      {choice.price_modifier_cents !== 0 && ` (${choice.price_modifier_cents > 0 ? '+' : ''}${(choice.price_modifier_cents / 100).toFixed(2)}€)`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          'Ajout en cours...'
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            Ajouter au panier
          </>
        )}
      </button>
    </form>
  );
}
