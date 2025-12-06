import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, FileText, CheckCircle, ArrowRight, ArrowLeft, Image, Building } from 'lucide-react';
import AdminLayout from '../components/Admin/AdminLayout';
import EventCharacteristicsPicker from '../components/EventCharacteristicsPicker';

interface EventFormData {
  organizer_id: string;
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
}

const STEPS = [
  { id: 1, name: 'Organisateur', icon: Building },
  { id: 2, name: 'Informations générales', icon: FileText },
  { id: 3, name: 'Localisation & Dates', icon: MapPin },
  { id: 4, name: 'Récapitulatif', icon: CheckCircle },
];

export default function AdminCreateEvent() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [searchOrganizer, setSearchOrganizer] = useState('');

  const [formData, setFormData] = useState<EventFormData>({
    organizer_id: '',
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
  });

  useEffect(() => {
    loadOrganizers();
  }, []);

  async function loadOrganizers() {
    try {
      const { data, error } = await supabase
        .rpc('admin_get_all_organizers');

      if (error) throw error;
      setOrganizers(data || []);
    } catch (error) {
      console.error('Error loading organizers:', error);
    }
  }

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
        if (!formData.organizer_id) {
          setError('Veuillez sélectionner un organisateur');
          return false;
        }
        return true;
      case 2:
        if (!formData.name || !formData.slug || !formData.short_description || !formData.contact_email) {
          setError('Veuillez remplir tous les champs obligatoires');
          return false;
        }
        if (formData.ffa_affiliated && !formData.ffa_calorg_code) {
          setError('Le code CalOrg FFA est obligatoire pour les événements affiliés FFA');
          return false;
        }
        return true;
      case 3:
        if (!formData.location_city || !formData.start_date || !formData.end_date) {
          setError('Veuillez remplir tous les champs obligatoires');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      setError('');
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
      const uniqueSlug = await ensureUniqueSlug(formData.slug);

      const eventData = {
        organizer_id: formData.organizer_id,
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

      navigate(`/admin/events`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'événement');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizers = organizers.filter(org =>
    org.organization_name?.toLowerCase().includes(searchOrganizer.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchOrganizer.toLowerCase())
  );

  const selectedOrganizer = organizers.find(org => org.id === formData.organizer_id);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Créer un événement</h1>
          <p className="text-gray-600 mt-2">Créez un événement et rattachez-le à un organisateur</p>
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
                          ? 'bg-pink-600 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-sm mt-2 text-center ${isActive ? 'text-pink-600 font-medium' : 'text-gray-600'}`}>
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
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sélectionner l'organisateur</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher un organisateur
                </label>
                <input
                  type="text"
                  value={searchOrganizer}
                  onChange={(e) => setSearchOrganizer(e.target.value)}
                  placeholder="Nom ou email de l'organisateur..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {selectedOrganizer && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800">Organisateur sélectionné :</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedOrganizer.organization_name}</p>
                  <p className="text-sm text-gray-600">{selectedOrganizer.email}</p>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                {filteredOrganizers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Aucun organisateur trouvé
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredOrganizers.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => handleInputChange('organizer_id', org.id)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          formData.organizer_id === org.id ? 'bg-pink-50 border-l-4 border-pink-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{org.organization_name}</p>
                            <p className="text-sm text-gray-500">{org.email}</p>
                            {org.mobile_phone && (
                              <p className="text-sm text-gray-500">{org.mobile_phone}</p>
                            )}
                          </div>
                          {formData.organizer_id === org.id && (
                            <CheckCircle className="w-6 h-6 text-pink-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations générales</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'événement *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ex: Marathon de Paris 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL (slug) *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="marathon-de-paris-2024"
                />
                <p className="mt-1 text-sm text-gray-500">
                  URL de votre événement : timepulse.fr/events/{formData.slug || 'votre-slug'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description courte *
                </label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Une brève description de votre événement (150 caractères max)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description complète
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Description détaillée de votre événement"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de contact *
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone de contact
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de l'image de couverture
                </label>
                <input
                  type="url"
                  value={formData.cover_image_url}
                  onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="https://"
                />
              </div>

              <div className="border-t pt-6">
                <EventCharacteristicsPicker
                  selectedCharacteristics={formData.characteristic_ids}
                  onChange={(ids) => handleInputChange('characteristic_ids', ids)}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Affiliation FFA</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.ffa_affiliated}
                      onChange={(e) => handleInputChange('ffa_affiliated', e.target.checked)}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Événement affilié à la FFA</span>
                  </label>

                  {formData.ffa_affiliated && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code CalOrg FFA *
                      </label>
                      <input
                        type="text"
                        value={formData.ffa_calorg_code}
                        onChange={(e) => handleInputChange('ffa_calorg_code', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Ex: 2024-123456"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Localisation & Dates</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville *
                </label>
                <input
                  type="text"
                  value={formData.location_city}
                  onChange={(e) => handleInputChange('location_city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={formData.location_postal_code}
                    onChange={(e) => handleInputChange('location_postal_code', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inscriptions</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.public_registration}
                      onChange={(e) => handleInputChange('public_registration', e.target.checked)}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Autoriser les inscriptions publiques</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre maximum de participants (optionnel)
                    </label>
                    <input
                      type="number"
                      value={formData.max_participants || ''}
                      onChange={(e) => handleInputChange('max_participants', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Laisser vide pour illimité"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Récapitulatif</h2>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Organisateur</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{selectedOrganizer?.organization_name}</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500">Nom de l'événement</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{formData.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date de début</h3>
                    <p className="mt-1 text-gray-900">
                      {formData.start_date ? new Date(formData.start_date).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date de fin</h3>
                    <p className="mt-1 text-gray-900">
                      {formData.end_date ? new Date(formData.end_date).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500">Localisation</h3>
                  <p className="mt-1 text-gray-900">{formData.location_city}</p>
                  {formData.location_address && (
                    <p className="text-sm text-gray-600">{formData.location_address}</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                  <p className="mt-1 text-gray-900">{formData.contact_email}</p>
                  {formData.contact_phone && (
                    <p className="text-sm text-gray-600">{formData.contact_phone}</p>
                  )}
                </div>

                {formData.ffa_affiliated && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-500">Affiliation FFA</h3>
                    <p className="mt-1 text-gray-900">Code CalOrg: {formData.ffa_calorg_code}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Précédent
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
              >
                Suivant
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Créer l'événement
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
