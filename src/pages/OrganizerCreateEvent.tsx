import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, FileText, CheckCircle, ArrowRight, ArrowLeft, Image } from 'lucide-react';
import OrganizerLayout from '../components/OrganizerLayout';
import EventCharacteristicsPicker from '../components/EventCharacteristicsPicker';
import FederationSelector from '../components/FederationSelector';
import DisciplinePicker from '../components/DisciplinePicker';

interface EventFormData {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  location_city: string;
  location_address: string;
  location_postal_code: string;
  location_country: string;
  start_date: string;
  end_date: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  cover_image_url: string;
  public_registration: boolean;
  max_participants: number | null;
  ffa_affiliated: boolean;
  ffa_calorg_code: string;
  characteristic_ids: string[];
  federation_id: string | null;
  discipline_id: string | null;
}

const STEPS = [
  { id: 1, name: 'Informations générales', icon: FileText },
  { id: 2, name: 'Localisation & Dates', icon: MapPin },
  { id: 3, name: 'Récapitulatif', icon: CheckCircle },
];

export default function OrganizerCreateEvent() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    location_city: '',
    location_address: '',
    location_postal_code: '',
    location_country: 'France',
    start_date: '',
    end_date: '',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    cover_image_url: '',
    public_registration: true,
    max_participants: null,
    ffa_affiliated: false,
    ffa_calorg_code: '',
    characteristic_ids: [],
    federation_id: null,
    discipline_id: null,
  });

  const generateSlug = (name: string, startDate: string) => {
    const year = startDate ? new Date(startDate).getFullYear() : '';
    const baseName = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return year ? `${baseName}-${year}` : baseName;
  };

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'name' || field === 'start_date') {
      const name = field === 'name' ? value : formData.name;
      const date = field === 'start_date' ? value : formData.start_date;
      if (name) {
        setFormData(prev => ({ ...prev, slug: generateSlug(name, date) }));
      }
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name || !formData.slug || !formData.short_description || !formData.contact_email) {
          return false;
        }
        if (formData.ffa_affiliated && !formData.ffa_calorg_code) {
          setError('Le code CalOrg FFA est obligatoire pour les événements affiliés FFA');
          return false;
        }
        if (!formData.ffa_affiliated && (!formData.federation_id || !formData.discipline_id)) {
          setError('La fédération et la discipline sont obligatoires pour les événements non-FFA');
          return false;
        }
        return true;
      case 2:
        return !!(formData.location_city && formData.start_date && formData.end_date);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      setError('');
    } else {
      setError('Veuillez remplir tous les champs obligatoires');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const ensureUniqueSlug = async (baseSlug: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: organizer } = await supabase
        .from('organizers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!organizer) throw new Error('Profil organisateur introuvable');

      const uniqueSlug = await ensureUniqueSlug(formData.slug);

      const eventData = {
        organizer_id: organizer.id,
        name: formData.name,
        slug: uniqueSlug,
        description: formData.description,
        short_description: formData.short_description,
        location: formData.location_city,
        full_address: formData.location_address,
        city: formData.location_city,
        postal_code: formData.location_postal_code,
        country: formData.location_country,
        start_date: formData.start_date,
        end_date: formData.end_date,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website: formData.website_url,
        image_url: formData.cover_image_url,
        banner_url: formData.cover_image_url,
        max_participants: formData.max_participants,
        public_registration: formData.public_registration,
        ffa_affiliated: formData.ffa_affiliated,
        ffa_calorg_code: formData.ffa_affiliated ? formData.ffa_calorg_code : null,
        federation_id: !formData.ffa_affiliated ? formData.federation_id : null,
        discipline_id: !formData.ffa_affiliated ? formData.discipline_id : null,
        status: 'published',
      };

      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (eventError) throw eventError;

      if (formData.characteristic_ids.length > 0) {
        const characteristicsData = formData.characteristic_ids.map(charId => ({
          event_id: event.id,
          characteristic_type_id: charId,
        }));

        const { error: charError } = await supabase
          .from('event_characteristics')
          .insert(characteristicsData);

        if (charError) {
          console.error('Error inserting characteristics:', charError);
        }
      }

      navigate(`/organizer/events/${event.id}`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'événement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrganizerLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Créer un événement</h1>
          <p className="text-gray-600 mt-2">Créez votre événement, puis ajoutez vos courses</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-sm mt-2 text-center ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`h-1 flex-1 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations générales</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'événement <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Trail des Écrins 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL généré automatiquement)
                </label>
                <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {formData.slug || 'sera-genere-automatiquement'}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  URL: timepulse.fr/events/{formData.slug || 'sera-genere-automatiquement'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description courte <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez votre événement en quelques mots..."
                  maxLength={200}
                />
                <p className="text-sm text-gray-500 mt-1">{formData.short_description.length}/200 caractères</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description complète
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description détaillée de votre événement..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image de couverture (Hero)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="url"
                    value={formData.cover_image_url}
                    onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://exemple.com/image.jpg"
                  />
                  {formData.cover_image_url && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                      <img src={formData.cover_image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">URL de l'image de couverture de votre événement</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contact@exemple.fr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site web
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.exemple.fr"
                />
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Affiliation FFA</h3>

                <div className="mb-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ffa_affiliated}
                      onChange={(e) => handleInputChange('ffa_affiliated', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Cet événement est affilié à la FFA (Fédération Française d'Athlétisme)
                    </span>
                  </label>
                </div>

                {formData.ffa_affiliated && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code CalOrg FFA <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.ffa_calorg_code}
                        onChange={(e) => handleInputChange('ffa_calorg_code', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: 12345678"
                        maxLength={20}
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        Le code CalOrg est le code de votre épreuve déclaré sur{' '}
                        <a
                          href="https://calorg.athle.fr"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          calorg.athle.fr
                        </a>
                        . Ce code permet de vérifier automatiquement les licences FFA et les PSP (Pass Prévention Santé) des participants.
                      </p>
                      <div className="mt-3 text-sm text-gray-700 bg-white rounded p-3 border border-blue-100">
                        <p className="font-medium mb-1">Rappel des règles FFA :</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          <li>Licenciés FFA : vérification via numéro de licence</li>
                          <li>Non-licenciés majeurs (≥18 ans) : PSP (Pass Prévention Santé) obligatoire (validité 1 an)</li>
                          <li>Non-licenciés mineurs (&lt;18 ans) : questionnaire de santé + autorisation parentale</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!formData.ffa_affiliated && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Fédération et discipline
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Pour les événements non affiliés à la FFA, veuillez sélectionner votre fédération et la discipline sportive.
                  </p>

                  <div className="space-y-6">
                    <FederationSelector
                      value={formData.federation_id}
                      onChange={(federationId) => handleInputChange('federation_id', federationId)}
                      required
                      showRequirements={true}
                    />

                    <DisciplinePicker
                      value={formData.discipline_id}
                      onChange={(disciplineId) => handleInputChange('discipline_id', disciplineId)}
                      required
                      showCategories={true}
                    />
                  </div>
                </div>
              )}

              <div className="border-t pt-6 mt-6">
                <EventCharacteristicsPicker
                  selectedCharacteristics={formData.characteristic_ids}
                  onChange={(ids) => handleInputChange('characteristic_ids', ids)}
                />
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Limites d'inscriptions</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite d'inscriptions sur l'événement (optionnel)
                  </label>
                  <input
                    type="number"
                    value={formData.max_participants || ''}
                    onChange={(e) => handleInputChange('max_participants', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 2000"
                    min="1"
                  />
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Important :</strong> Cette limite s'applique à l'ensemble de l'événement (toutes épreuves confondues).
                      Si vous laissez ce champ vide, vous pourrez définir une limite par épreuve lors de leur création.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Localisation & Dates</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location_city}
                  onChange={(e) => handleInputChange('location_city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Briançon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète
                </label>
                <input
                  type="text"
                  value={formData.location_address}
                  onChange={(e) => handleInputChange('location_address', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Rue, numéro..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={formData.location_postal_code}
                    onChange={(e) => handleInputChange('location_postal_code', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="05100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays
                  </label>
                  <input
                    type="text"
                    value={formData.location_country}
                    onChange={(e) => handleInputChange('location_country', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dates</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleInputChange('end_date', e.target.value)}
                      min={formData.start_date}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres</h3>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.public_registration}
                      onChange={(e) => handleInputChange('public_registration', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Autoriser les inscriptions publiques
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Récapitulatif</h2>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Informations générales</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Nom:</dt>
                    <dd className="font-medium text-gray-900">{formData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Slug:</dt>
                    <dd className="font-medium text-gray-900">{formData.slug}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Email:</dt>
                    <dd className="font-medium text-gray-900">{formData.contact_email}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Localisation</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Ville:</dt>
                    <dd className="font-medium text-gray-900">{formData.location_city}</dd>
                  </div>
                  {formData.location_address && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Adresse:</dt>
                      <dd className="font-medium text-gray-900">{formData.location_address}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Dates:</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(formData.start_date).toLocaleDateString('fr-FR')} - {new Date(formData.end_date).toLocaleDateString('fr-FR')}
                    </dd>
                  </div>
                </dl>
              </div>

              {formData.cover_image_url && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Image de couverture</h3>
                  <img src={formData.cover_image_url} alt="Couverture" className="w-full h-48 object-cover rounded-lg" />
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> L'événement sera créé en mode brouillon. Vous pourrez ensuite ajouter vos courses et configurer les tarifs avant de le publier.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Précédent
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Suivant
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Création...' : 'Créer l\'événement'}
                <CheckCircle className="h-5 w-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
}
