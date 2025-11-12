import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ImagePlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/Admin/AdminLayout';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  background_image_url: string | null;
  image_opacity: number;
  display_order: number;
  is_active: boolean;
  link_url: string | null;
  link_type: string;
}

export default function AdminHomepageFeatures() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Star',
    background_image_url: '',
    image_opacity: 20,
    display_order: 0,
    is_active: true,
    link_url: '',
    link_type: 'none',
  });

  useEffect(() => {
    loadFeatures();
  }, []);

  async function loadFeatures() {
    try {
      const { data, error } = await supabase
        .from('homepage_features')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFeatures(data || []);
    } catch (err) {
      console.error('Error loading features:', err);
      alert('Erreur lors du chargement des fonctionnalités');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      if (editingId) {
        const { error } = await supabase
          .from('homepage_features')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        alert('Fonctionnalité mise à jour avec succès');
      } else {
        const { error } = await supabase
          .from('homepage_features')
          .insert([formData]);

        if (error) throw error;
        alert('Fonctionnalité ajoutée avec succès');
      }

      setEditingId(null);
      setShowAddForm(false);
      resetForm();
      loadFeatures();
    } catch (err: any) {
      console.error('Error saving feature:', err);
      alert(`Erreur lors de l'enregistrement: ${err.message || 'Erreur inconnue'}\n\nDétails: ${JSON.stringify(err, null, 2)}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette fonctionnalité ?')) return;

    try {
      const { error } = await supabase
        .from('homepage_features')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Fonctionnalité supprimée avec succès');
      loadFeatures();
    } catch (err) {
      console.error('Error deleting feature:', err);
      alert('Erreur lors de la suppression');
    }
  }

  function startEdit(feature: Feature) {
    setEditingId(feature.id);
    setFormData({
      title: feature.title,
      description: feature.description,
      icon: feature.icon,
      background_image_url: feature.background_image_url || '',
      image_opacity: feature.image_opacity,
      display_order: feature.display_order,
      is_active: feature.is_active,
      link_url: feature.link_url || '',
      link_type: feature.link_type || 'none',
    });
    setShowAddForm(false);
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      icon: 'Star',
      background_image_url: '',
      image_opacity: 20,
      display_order: features.length + 1,
      is_active: true,
      link_url: '',
      link_type: 'none',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setShowAddForm(false);
    resetForm();
  }

  const commonIcons = [
    'Shield', 'Zap', 'Users', 'Award', 'Clock', 'CreditCard',
    'Star', 'Heart', 'Check', 'CheckCircle', 'Target', 'Trophy',
    'Rocket', 'Sparkles', 'ThumbsUp', 'TrendingUp', 'Activity',
    'Timer', 'Stopwatch'
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p>Chargement...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fonctionnalités de la page d'accueil</h1>
            <p className="text-gray-600 mt-1">Gérez les fonctionnalités affichées dans "Pourquoi choisir Timepulse ?"</p>
          </div>
          {!showAddForm && !editingId && (
            <button
              onClick={() => {
                setShowAddForm(true);
                resetForm();
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Ajouter une fonctionnalité</span>
            </button>
          )}
        </div>

        {(showAddForm || editingId) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingId ? 'Modifier la fonctionnalité' : 'Nouvelle fonctionnalité'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ex: Sécurisé"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={3}
                  placeholder="Ex: Paiement sécurisé et données protégées"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icône (Lucide React)</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {commonIcons.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image de fond (URL)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={formData.background_image_url}
                    onChange={(e) => setFormData({ ...formData, background_image_url: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  <ImagePlus className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Laisser vide pour aucune image de fond</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacité de l'image ({formData.image_opacity}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.image_opacity}
                  onChange={(e) => setFormData({ ...formData, image_opacity: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de lien</label>
                <select
                  value={formData.link_type}
                  onChange={(e) => setFormData({ ...formData, link_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="none">Pas de lien</option>
                  <option value="internal">Lien interne</option>
                  <option value="external">Lien externe</option>
                </select>
              </div>

              {formData.link_type !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL du lien {formData.link_type === 'internal' ? '(ex: /services/chronometrage)' : '(ex: https://...)'}
                  </label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder={formData.link_type === 'internal' ? '/services/chronometrage' : 'https://example.com'}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ordre d'affichage</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={cancelEdit}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Annuler</span>
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Icône
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {features.map((feature) => (
                <tr key={feature.id} className={editingId === feature.id ? 'bg-pink-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {feature.display_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {feature.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {feature.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {feature.icon}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        feature.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {feature.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => startEdit(feature)}
                      className="text-cyan-600 hover:text-cyan-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(feature.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {features.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">Aucune fonctionnalité configurée</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
