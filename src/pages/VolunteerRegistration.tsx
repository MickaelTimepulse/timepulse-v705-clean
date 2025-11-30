import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, MapPin, Clock, Heart, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

interface Event {
  id: string;
  name: string;
  start_date: string;
  city: string;
  cover_image_url: string;
  volunteer_info_text: string;
}

interface VolunteerPost {
  id: string;
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  required_volunteers_count: number;
}

export default function VolunteerRegistration() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [posts, setPosts] = useState<VolunteerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    tshirt_size: '',
    dietary_restrictions: '',
    has_first_aid_certification: false,
    has_driving_license: false,
    preferred_post_types: [] as string[],
    notes: ''
  });

  useEffect(() => {
    loadEventData();
  }, [slug]);

  const loadEventData = async () => {
    if (!slug) return;

    try {
      setLoading(true);

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, name, start_date, city, cover_image_url, volunteer_info_text, volunteer_enabled, volunteer_registration_open')
        .eq('slug', slug)
        .single();

      if (eventError) throw eventError;

      if (!eventData.volunteer_enabled || !eventData.volunteer_registration_open) {
        navigate('/');
        return;
      }

      setEvent(eventData);

      const { data: postsData } = await supabase
        .from('volunteer_posts')
        .select('id, name, type, start_time, end_time, required_volunteers_count')
        .eq('event_id', eventData.id)
        .eq('status', 'active')
        .order('start_time');

      if (postsData) {
        setPosts(postsData);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      setSubmitting(true);

      const { data, error } = await supabase
        .from('volunteers')
        .insert({
          event_id: event.id,
          ...formData,
          preferred_post_types: JSON.stringify(formData.preferred_post_types),
          status: 'confirmed'
        })
        .select()
        .single();

      if (error) throw error;

      setSuccess(true);

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting volunteer registration:', error);
      alert(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const togglePostType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_post_types: prev.preferred_post_types.includes(type)
        ? prev.preferred_post_types.filter(t => t !== type)
        : [...prev.preferred_post_types, type]
    }));
  };

  const getPostTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      ravitaillement: 'Ravitaillement',
      securite: 'Sécurité',
      signalisation: 'Signalisation',
      depart_arrivee: 'Départ/Arrivée',
      vestiaire: 'Vestiaire',
      retrait_dossards: 'Retrait Dossards',
      animation: 'Animation',
      secourisme: 'Secourisme',
      autre: 'Autre'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Événement introuvable</h1>
          <p className="text-gray-600">L'inscription bénévole n'est pas disponible pour cet événement.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription confirmée !</h2>
            <p className="text-gray-600 mb-6">
              Merci pour votre engagement ! Vous allez recevoir un email de confirmation avec tous les détails.
            </p>
            <p className="text-sm text-gray-500">Redirection automatique...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {event.cover_image_url && (
        <div className="relative h-64 bg-gray-900">
          <img
            src={event.cover_image_url}
            alt={event.name}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
              <div className="flex items-center justify-center space-x-4 text-lg">
                <span className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>{event.city}</span>
                </span>
                <span className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>{new Date(event.start_date).toLocaleDateString('fr-FR')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Devenez bénévole !</h2>
              <p className="text-gray-600">Rejoignez l'aventure et participez au succès de l'événement</p>
            </div>
          </div>

          {event.volunteer_info_text && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-gray-700">{event.volunteer_info_text}</p>
            </div>
          )}

          {posts.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Postes disponibles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {posts.map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-3">
                    <p className="font-medium text-gray-900">{post.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(post.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} -
                      {new Date(post.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {post.required_volunteers_count} bénévoles recherchés
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Formulaire d'inscription</h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taille T-shirt
                </label>
                <select
                  name="tshirt_size"
                  value={formData.tshirt_size}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restrictions alimentaires
              </label>
              <input
                type="text"
                name="dietary_restrictions"
                value={formData.dietary_restrictions}
                onChange={handleInputChange}
                placeholder="Végétarien, allergies, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="has_first_aid_certification"
                  checked={formData.has_first_aid_certification}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">J'ai une formation aux premiers secours (PSC1, SST, etc.)</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="has_driving_license"
                  checked={formData.has_driving_license}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">J'ai le permis de conduire</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Types de postes préférés (optionnel)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['ravitaillement', 'securite', 'signalisation', 'depart_arrivee', 'animation', 'secourisme'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => togglePostType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.preferred_post_types.includes(type)
                        ? 'bg-pink-100 text-pink-700 border-2 border-pink-600'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {getPostTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message / Commentaires
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Vos disponibilités, expériences, motivations..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">* Champs obligatoires</p>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Inscription en cours...' : 'M\'inscrire comme bénévole'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
