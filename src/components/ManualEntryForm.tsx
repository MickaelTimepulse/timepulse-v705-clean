import { useState, useEffect } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadCountries, type Country } from '../lib/countries';

interface Race {
  id: string;
  name: string;
}

interface ManualEntryFormProps {
  eventId: string;
  races: Race[];
  organizerId: string;
  adminUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface AthleteData {
  first_name: string;
  last_name: string;
  birthdate: string;
  gender: string;
  email: string;
  phone: string;
  address_line1: string;
  city: string;
  postal_code: string;
  country_code: string;
  license_type: string;
  license_id: string;
  license_club: string;
  license_valid_until: string;
  consent_data_processing: boolean;
  nationality: string;
  is_anonymous: boolean;
}

interface EntryData {
  race_id: string;
  category: string;
  reason: string;
  notes: string;
}

interface PaymentData {
  payment_status: string;
  amount_paid: string;
  payment_method: string;
  payment_reference: string;
}

interface RaceOption {
  id: string;
  label: string;
  description: string | null;
  type: string;
  is_required: boolean;
  is_question: boolean;
  price_cents: number;
  image_url: string | null;
  choices?: RaceOptionChoice[];
}

interface RaceOptionChoice {
  id: string;
  label: string;
  price_modifier_cents: number;
}

export default function ManualEntryForm({
  eventId,
  races,
  organizerId,
  adminUserId,
  onClose,
  onSuccess,
}: ManualEntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);

  const [athleteData, setAthleteData] = useState<AthleteData>({
    first_name: '',
    last_name: '',
    birthdate: '',
    gender: 'M',
    email: '',
    phone: '',
    address_line1: '',
    city: '',
    postal_code: '',
    country_code: 'FR',
    license_type: '',
    license_id: '',
    license_club: '',
    license_valid_until: '',
    consent_data_processing: true,
    nationality: 'FRA',
    is_anonymous: false,
  });

  const [entryData, setEntryData] = useState<EntryData>({
    race_id: races[0]?.id || '',
    category: 'SE',
    reason: '',
    notes: '',
  });

  const [paymentData, setPaymentData] = useState<PaymentData>({
    payment_status: 'free',
    amount_paid: '0',
    payment_method: '',
    payment_reference: '',
  });

  const [medicalDocFile, setMedicalDocFile] = useState<File | null>(null);
  const [licenseDocFile, setLicenseDocFile] = useState<File | null>(null);
  const [raceOptions, setRaceOptions] = useState<RaceOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { choiceId?: string; value?: string }>>({});

  useEffect(() => {
    loadCountriesData();
  }, []);

  useEffect(() => {
    if (entryData.race_id) {
      loadRaceOptions(entryData.race_id);
    }
  }, [entryData.race_id]);

  const loadRaceOptions = async (raceId: string) => {
    try {
      const { data, error } = await supabase
        .from('race_options')
        .select(`
          *,
          choices:race_option_choices(*)
        `)
        .eq('race_id', raceId)
        .eq('active', true)
        .order('display_order');

      if (error) throw error;
      setRaceOptions(data || []);
    } catch (err) {
      console.error('Error loading race options:', err);
    }
  };

  const loadCountriesData = async () => {
    const countriesData = await loadCountries();
    setCountries(countriesData);
  };

  const handleMedicalDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMedicalDocFile(e.target.files[0]);
    }
  };

  const handleLicenseDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLicenseDocFile(e.target.files[0]);
    }
  };

  const uploadDocument = async (file: File, type: 'medical' | 'license', entryId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${organizerId}/${entryId}/${type}_${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('entry-documents')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('entry-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!athleteData.first_name || !athleteData.last_name || !athleteData.birthdate) {
      alert('Veuillez remplir tous les champs obligatoires (Prénom, Nom, Date de naissance)');
      return;
    }

    if (!athleteData.consent_data_processing) {
      alert('Le consentement au traitement des données est obligatoire');
      return;
    }

    if (!entryData.race_id) {
      alert('Veuillez sélectionner une épreuve');
      return;
    }

    const requiredOptions = raceOptions.filter(opt => opt.is_required);
    for (const option of requiredOptions) {
      if (!selectedOptions[option.id] || (!selectedOptions[option.id].choiceId && !selectedOptions[option.id].value)) {
        alert(`L'option "${option.label}" est obligatoire`);
        return;
      }
    }

    setLoading(true);

    try {
      // Préparer les données de l'athlète
      const cleanedAthleteData = {
        first_name: athleteData.first_name,
        last_name: athleteData.last_name,
        birthdate: athleteData.birthdate,
        gender: athleteData.gender,
        email: athleteData.email || null,
        phone: athleteData.phone || null,
        nationality: athleteData.nationality || 'FRA',
        license_number: athleteData.license_id || null,
        license_club: athleteData.license_club || null,
      };

      // Préparer les données de l'inscription
      const entryDataToInsert = {
        status: 'confirmed',
        source: 'manual',
        session_token: null,
        amount_cents: Math.round((parseFloat(paymentData.amount_paid) || 0) * 100),
        is_refundable: false,
      };

      // Préparer les options si présentes
      let optionsArray = null;
      if (Object.keys(selectedOptions).length > 0) {
        optionsArray = Object.entries(selectedOptions).map(([optionId, selection]) => {
          const option = raceOptions.find(o => o.id === optionId);
          let pricePaid = option?.price_cents || 0;

          if (selection.choiceId && option?.choices) {
            const choice = option.choices.find(c => c.id === selection.choiceId);
            if (choice) {
              pricePaid += choice.price_modifier_cents;
            }
          }

          return {
            option_id: optionId,
            price_cents: pricePaid,
          };
        });
      }

      // Appeler la fonction PostgreSQL atomique
      const { data: result, error: functionError } = await supabase.rpc(
        'register_athlete_with_quota_check',
        {
          p_race_id: entryData.race_id,
          p_event_id: eventId,
          p_organizer_id: organizerId,
          p_athlete_data: cleanedAthleteData,
          p_entry_data: entryDataToInsert,
          p_options: optionsArray,
        }
      );

      if (functionError) throw functionError;

      // Vérifier le résultat
      if (!result.success) {
        if (result.error === 'race_full') {
          alert('Cette course est complète. Il ne reste plus de places disponibles.');
          setLoading(false);
          return;
        } else if (result.error === 'race_not_found') {
          alert('Course non trouvée. Veuillez réessayer.');
          setLoading(false);
          return;
        } else {
          throw new Error(result.message || 'Une erreur est survenue lors de l\'inscription.');
        }
      }

      // Récupérer l'ID de l'inscription créée
      const entry = { id: result.entry_id };

      // Enregistrer les informations de paiement
      const { error: paymentError } = await supabase
        .from('entry_payments')
        .insert([{
          entry_id: entry.id,
          amount_paid: parseFloat(paymentData.amount_paid) || 0,
          currency: 'EUR',
          payment_status: paymentData.payment_status,
          payment_method: paymentData.payment_method || null,
          payment_reference: paymentData.payment_reference || null,
          paid_at: paymentData.payment_status === 'paid' ? new Date().toISOString() : null,
        }]);

      if (paymentError) throw paymentError;

      // Note : Les options ont déjà été insérées par la fonction atomique

      if (medicalDocFile) {
        setUploadingDoc(true);
        const medicalUrl = await uploadDocument(medicalDocFile, 'medical', entry.id);
        if (medicalUrl) {
          await supabase
            .from('athletes')
            .update({
              medical_doc_url: medicalUrl,
              medical_doc_uploaded_at: new Date().toISOString(),
            })
            .eq('id', athlete.id);
        }
      }

      if (licenseDocFile) {
        setUploadingDoc(true);
        const licenseUrl = await uploadDocument(licenseDocFile, 'license', entry.id);
        if (licenseUrl) {
          await supabase
            .from('athletes')
            .update({
              license_doc_url: licenseUrl,
              license_doc_uploaded_at: new Date().toISOString(),
            })
            .eq('id', athlete.id);
        }
      }

      alert('Inscription créée avec succès !');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating entry:', error);
      alert('Erreur lors de la création de l\'inscription : ' + error.message);
    } finally {
      setLoading(false);
      setUploadingDoc(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Nouvelle inscription manuelle
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Identité de l'athlète</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={athleteData.first_name}
                  onChange={(e) => setAthleteData({ ...athleteData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={athleteData.last_name}
                  onChange={(e) => setAthleteData({ ...athleteData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance *
                </label>
                <input
                  type="date"
                  value={athleteData.birthdate}
                  onChange={(e) => setAthleteData({ ...athleteData, birthdate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre *
                </label>
                <select
                  value={athleteData.gender}
                  onChange={(e) => setAthleteData({ ...athleteData, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                  <option value="X">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationalité
                </label>
                <select
                  value={athleteData.nationality}
                  onChange={(e) => setAthleteData({ ...athleteData, nationality: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez un pays</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Code pays à 3 lettres (ex: FRA, BEL, CHE)</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="is_anonymous"
                  checked={athleteData.is_anonymous}
                  onChange={(e) => setAthleteData({ ...athleteData, is_anonymous: e.target.checked })}
                  className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="is_anonymous" className="ml-2 text-sm text-gray-700">
                  Marquer cet athlète comme anonyme (le nom ne sera pas affiché publiquement)
                </label>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={athleteData.email}
                  onChange={(e) => setAthleteData({ ...athleteData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={athleteData.phone}
                  onChange={(e) => setAthleteData({ ...athleteData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={athleteData.address_line1}
                  onChange={(e) => setAthleteData({ ...athleteData, address_line1: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={athleteData.city}
                  onChange={(e) => setAthleteData({ ...athleteData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal
                </label>
                <input
                  type="text"
                  value={athleteData.postal_code}
                  onChange={(e) => setAthleteData({ ...athleteData, postal_code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Licence sportive</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de licence
                </label>
                <select
                  value={athleteData.license_type}
                  onChange={(e) => setAthleteData({ ...athleteData, license_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Aucune</option>
                  <option value="FFA">FFA</option>
                  <option value="FFTRI">FFTRI</option>
                  <option value="FFS">FFS</option>
                  <option value="FFCO">FFCO</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de licence
                </label>
                <input
                  type="text"
                  value={athleteData.license_id}
                  onChange={(e) => setAthleteData({ ...athleteData, license_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du club
                </label>
                <input
                  type="text"
                  value={athleteData.license_club}
                  onChange={(e) => setAthleteData({ ...athleteData, license_club: e.target.value })}
                  placeholder="Ex: Athletic Club de Paris"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valide jusqu'au
                </label>
                <input
                  type="date"
                  value={athleteData.license_valid_until}
                  onChange={(e) => setAthleteData({ ...athleteData, license_valid_until: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificat médical
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-5 h-5 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {medicalDocFile ? medicalDocFile.name : 'Choisir un fichier'}
                    </span>
                    <input
                      type="file"
                      onChange={handleMedicalDocUpload}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                  </label>
                  {medicalDocFile && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Copie de licence
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-5 h-5 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {licenseDocFile ? licenseDocFile.name : 'Choisir un fichier'}
                    </span>
                    <input
                      type="file"
                      onChange={handleLicenseDocUpload}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                  </label>
                  {licenseDocFile && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Épreuve et catégorie</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Épreuve *
                </label>
                <select
                  value={entryData.race_id}
                  onChange={(e) => setEntryData({ ...entryData, race_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                >
                  {races.map((race) => (
                    <option key={race.id} value={race.id}>
                      {race.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  value={entryData.category}
                  onChange={(e) => setEntryData({ ...entryData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                >
                  <option value="SE">Senior (SE)</option>
                  <option value="V1">V1 (40-49 ans)</option>
                  <option value="V2">V2 (50-59 ans)</option>
                  <option value="V3">V3 (60-69 ans)</option>
                  <option value="V4">V4 (70+ ans)</option>
                  <option value="ES">Espoir (ES)</option>
                  <option value="JU">Junior (JU)</option>
                  <option value="CA">Cadet (CA)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de l'inscription manuelle
                </label>
                <input
                  type="text"
                  value={entryData.reason}
                  onChange={(e) => setEntryData({ ...entryData, reason: e.target.value })}
                  placeholder="Ex: Partenaire, Invitation, Problème technique..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes internes
                </label>
                <textarea
                  value={entryData.notes}
                  onChange={(e) => setEntryData({ ...entryData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {raceOptions.length > 0 && (
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Options de l'épreuve</h3>
              <div className="space-y-4">
                {raceOptions.map((option) => (
                  <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {option.image_url && (
                        <img
                          src={option.image_url}
                          alt={option.label}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="font-medium text-gray-900">
                            {option.label}
                            {option.is_required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {option.price_cents > 0 && (
                            <span className="text-sm text-gray-600">
                              ({(option.price_cents / 100).toFixed(2)}€)
                            </span>
                          )}
                        </div>
                        {option.description && (
                          <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                        )}

                        {option.is_question && option.choices && option.choices.length > 0 ? (
                          <select
                            value={selectedOptions[option.id]?.choiceId || ''}
                            onChange={(e) => setSelectedOptions({
                              ...selectedOptions,
                              [option.id]: { choiceId: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            required={option.is_required}
                          >
                            <option value="">Sélectionnez une option...</option>
                            {option.choices.map((choice) => (
                              <option key={choice.id} value={choice.id}>
                                {choice.label}
                                {choice.price_modifier_cents !== 0 && (
                                  ` (${choice.price_modifier_cents > 0 ? '+' : ''}${(choice.price_modifier_cents / 100).toFixed(2)}€)`
                                )}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={selectedOptions[option.id]?.value || ''}
                            onChange={(e) => setSelectedOptions({
                              ...selectedOptions,
                              [option.id]: { value: e.target.value }
                            })}
                            placeholder="Votre réponse..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            required={option.is_required}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Paiement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut du paiement *
                </label>
                <select
                  value={paymentData.payment_status}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                >
                  <option value="paid">Payé</option>
                  <option value="pending">En attente</option>
                  <option value="free">Gratuit</option>
                  <option value="comped">Offert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentData.amount_paid}
                  onChange={(e) => setPaymentData({ ...paymentData, amount_paid: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement
                </label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Non spécifié</option>
                  <option value="cash">Espèces</option>
                  <option value="check">Chèque</option>
                  <option value="card">Carte bancaire</option>
                  <option value="transfer">Virement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Référence de paiement
                </label>
                <input
                  type="text"
                  value={paymentData.payment_reference}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
                  placeholder="Ex: Numéro de chèque, de transaction..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-start">
              <input
                type="checkbox"
                id="consent"
                checked={athleteData.consent_data_processing}
                onChange={(e) => setAthleteData({ ...athleteData, consent_data_processing: e.target.checked })}
                className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label htmlFor="consent" className="ml-2 text-sm text-gray-700">
                L'athlète consent au traitement de ses données personnelles conformément au RGPD *
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || uploadingDoc}
            className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Création en cours...' : uploadingDoc ? 'Upload des documents...' : 'Créer l\'inscription'}
          </button>
        </div>
      </form>
    </div>
  );
}
