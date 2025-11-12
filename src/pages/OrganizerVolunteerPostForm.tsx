import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, Save, ArrowLeft, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OrganizerLayout from '../components/OrganizerLayout';

interface Race {
  id: string;
  name: string;
}

export default function OrganizerVolunteerPostForm() {
  const { id, postId } = useParams<{ id: string; postId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventName, setEventName] = useState('');
  const [races, setRaces] = useState<Race[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'ravitaillement',
    race_id: '',
    location_name: '',
    location_lat: '',
    location_lng: '',
    km_marker: '',
    start_time: '',
    end_time: '',
    required_volunteers_count: 1,
    instructions: '',
    material_needed: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, [id, postId]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const { data: event } = await supabase
        .from('events')
        .select('name, start_date')
        .eq('id', id)
        .single();

      if (event) {
        setEventName(event.name);

        const eventDate = new Date(event.start_date);
        const defaultStartTime = new Date(eventDate);
        defaultStartTime.setHours(7, 0, 0, 0);
        const defaultEndTime = new Date(eventDate);
        defaultEndTime.setHours(14, 0, 0, 0);

        setFormData(prev => ({
          ...prev,
          start_time: defaultStartTime.toISOString().slice(0, 16),
          end_time: defaultEndTime.toISOString().slice(0, 16)
        }));
      }

      const { data: racesData } = await supabase
        .from('races')
        .select('id, name')
        .eq('event_id', id)
        .order('name');

      if (racesData) {
        setRaces(racesData);
      }

      if (postId && postId !== 'new') {
        const { data: postData } = await supabase
          .from('volunteer_posts')
          .select('*')
          .eq('id', postId)
          .single();

        if (postData) {
          setFormData({
            name: postData.name || '',
            type: postData.type || 'ravitaillement',
            race_id: postData.race_id || '',
            location_name: postData.location_name || '',
            location_lat: postData.location_lat?.toString() || '',
            location_lng: postData.location_lng?.toString() || '',
            km_marker: postData.km_marker?.toString() || '',
            start_time: postData.start_time ? new Date(postData.start_time).toISOString().slice(0, 16) : '',
            end_time: postData.end_time ? new Date(postData.end_time).toISOString().slice(0, 16) : '',
            required_volunteers_count: postData.required_volunteers_count || 1,
            instructions: postData.instructions || '',
            material_needed: postData.material_needed || '',
            emergency_contact_name: postData.emergency_contact_name || '',
            emergency_contact_phone: postData.emergency_contact_phone || '',
            status: postData.status || 'active'
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);

      const postData = {
        event_id: id,
        name: formData.name,
        type: formData.type,
        race_id: formData.race_id || null,
        location_name: formData.location_name || null,
        location_lat: formData.location_lat ? parseFloat(formData.location_lat) : null,
        location_lng: formData.location_lng ? parseFloat(formData.location_lng) : null,
        km_marker: formData.km_marker ? parseFloat(formData.km_marker) : null,
        start_time: formData.start_time,
        end_time: formData.end_time,
        required_volunteers_count: formData.required_volunteers_count,
        instructions: formData.instructions || null,
        material_needed: formData.material_needed || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        status: formData.status
      };

      if (postId && postId !== 'new') {
        const { error } = await supabase
          .from('volunteer_posts')
          .update(postData)
          .eq('id', postId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('volunteer_posts')
          .insert(postData);

        if (error) throw error;
      }

      navigate(`/organizer/events/${id}/volunteers`);
    } catch (error: any) {
      console.error('Error saving post:', error);
      alert(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!postId || postId === 'new') return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce poste ? Cette action est irréversible.')) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('volunteer_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      navigate(`/organizer/events/${id}/volunteers`);
    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert(error.message || 'Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const postTypes = [
    { value: 'ravitaillement', label: 'Ravitaillement', icon: '🥤' },
    { value: 'securite', label: 'Sécurité', icon: '🚨' },
    { value: 'signalisation', label: 'Signalisation', icon: '🚧' },
    { value: 'depart_arrivee', label: 'Départ/Arrivée', icon: '🏁' },
    { value: 'vestiaire', label: 'Vestiaire', icon: '👕' },
    { value: 'retrait_dossards', label: 'Retrait Dossards', icon: '🎫' },
    { value: 'animation', label: 'Animation', icon: '🎉' },
    { value: 'secourisme', label: 'Secourisme', icon: '🚑' },
    { value: 'autre', label: 'Autre', icon: '📋' }
  ];

  if (loading) {
    return (
      <OrganizerLayout title="Gestion des Bénévoles">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout title={postId === 'new' ? 'Créer un poste' : 'Modifier le poste'}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/organizer/events/${id}/volunteers`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la gestion des bénévoles</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {postId === 'new' ? 'Créer un nouveau poste' : 'Modifier le poste'}
            </h2>
            <p className="text-gray-600">{eventName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du poste *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Ravitaillement km 12"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de poste *
                </label>
                <select
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {postTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Épreuve associée (optionnel)
                </label>
                <select
                  name="race_id"
                  value={formData.race_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Toutes les épreuves</option>
                  {races.map((race) => (
                    <option key={race.id} value={race.id}>
                      {race.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Localisation</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du lieu
                  </label>
                  <input
                    type="text"
                    name="location_name"
                    value={formData.location_name}
                    onChange={handleInputChange}
                    placeholder="Ex: Place de la Mairie, Parking du stade..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0000001"
                      name="location_lat"
                      value={formData.location_lat}
                      onChange={handleInputChange}
                      placeholder="48.856614"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0000001"
                      name="location_lng"
                      value={formData.location_lng}
                      onChange={handleInputChange}
                      placeholder="2.352222"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      KM sur parcours
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="km_marker"
                      value={formData.km_marker}
                      onChange={handleInputChange}
                      placeholder="12.5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    💡 Astuce : Vous pouvez obtenir les coordonnées GPS en faisant un clic droit sur Google Maps
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Horaires</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Début de mission *
                  </label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    required
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin de mission *
                  </label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    required
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Besoins</span>
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de bénévoles requis *
                </label>
                <input
                  type="number"
                  min="1"
                  name="required_volunteers_count"
                  required
                  value={formData.required_volunteers_count}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Instructions et matériel
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructions pour les bénévoles
                  </label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Décrivez les tâches, consignes spécifiques, points d'attention..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matériel nécessaire
                  </label>
                  <textarea
                    name="material_needed"
                    value={formData.material_needed}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Tables, chaises, gobelets, bidons d'eau, panneaux..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact d'urgence
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du contact
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleInputChange}
                    placeholder="Responsable sécurité, directeur de course..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone d'urgence
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleInputChange}
                    placeholder="06 XX XX XX XX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                {postId && postId !== 'new' && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(`/organizer/events/${id}/volunteers`)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </OrganizerLayout>
  );
}
