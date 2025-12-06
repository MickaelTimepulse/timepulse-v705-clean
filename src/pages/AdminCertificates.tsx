import { useState, useEffect } from 'react';
import { Award, Plus, Edit2, Trash2, Upload, Eye, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/Admin/AdminLayout';
import CertificateEditor from '../components/CertificateEditor';
import { CertificateVariable } from '../lib/certificate-generator';

interface CertificateTemplate {
  id: string;
  name: string;
  template_image_url: string;
  race_id: string | null;
  is_active: boolean;
  variables_config: CertificateVariable[];
  created_at: string;
}

interface Race {
  id: string;
  name: string;
  event?: {
    name: string;
  };
}

export default function AdminCertificates() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    race_id: '',
    is_active: true
  });

  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [variables, setVariables] = useState<CertificateVariable[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Charger les courses
      const { data: racesData, error: racesError } = await supabase
        .from('races')
        .select('id, name, event:events(name)')
        .order('name');

      if (racesError) throw racesError;
      setRaces(racesData || []);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('certificate-templates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('certificate-templates')
        .getPublicUrl(filePath);

      setUploadedImage(publicUrl);
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !uploadedImage) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const templateData = {
        name: formData.name,
        template_image_url: uploadedImage,
        race_id: formData.race_id || null,
        is_active: formData.is_active,
        variables_config: variables
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('certificate_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('certificate_templates')
          .insert([templateData]);

        if (error) throw error;
      }

      alert(editingTemplate ? 'Template mis à jour' : 'Template créé avec succès');
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      race_id: template.race_id || '',
      is_active: template.is_active
    });
    setUploadedImage(template.template_image_url);
    setVariables(template.variables_config || []);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    try {
      const { error } = await supabase
        .from('certificate_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Template supprimé');
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('certificate_templates')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la modification');
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      race_id: '',
      is_active: true
    });
    setUploadedImage('');
    setVariables([]);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-pink-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Diplômes</h1>
              <p className="text-gray-600">Gérez les templates de diplômes partageables</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau template
          </button>
        </div>

        {/* Liste des templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative h-48 bg-gray-100">
                <img
                  src={template.template_image_url}
                  alt={template.name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 right-2">
                  {template.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                      <CheckCircle className="w-3 h-3" />
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded">
                      <XCircle className="w-3 h-3" />
                      Inactif
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2">{template.name}</h3>
                {template.race_id && (
                  <p className="text-sm text-gray-600 mb-3">
                    {races.find(r => r.id === template.race_id)?.name || 'Course non trouvée'}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => toggleActive(template.id, template.is_active)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      template.is_active
                        ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {template.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Aucun template de diplôme pour le moment</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Créer mon premier template
            </button>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-8 flex items-start justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-lg">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingTemplate ? 'Modifier le template' : 'Nouveau template de diplôme'}
                </h2>
              </div>

              <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du template *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Diplôme Trail des Montagnes"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Épreuve associée (optionnel)
                  </label>
                  <select
                    value={formData.race_id}
                    onChange={(e) => setFormData({ ...formData, race_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Template global</option>
                    {races.map(race => (
                      <option key={race.id} value={race.id}>
                        {race.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload de l'image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image du template * (format 1080x1080px recommandé)
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5" />
                    {uploading ? 'Upload en cours...' : 'Choisir une image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {uploadedImage && (
                    <span className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Image uploadée
                    </span>
                  )}
                </div>
              </div>

              {/* Éditeur de variables */}
              {uploadedImage && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Configuration des variables</h3>
                  <CertificateEditor
                    templateImageUrl={uploadedImage}
                    variables={variables}
                    onChange={setVariables}
                  />
                </div>
              )}

              {/* Statut actif */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Template actif (disponible pour génération)
                </label>
              </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-white sticky bottom-0 flex justify-end gap-3 rounded-b-lg">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  disabled={!uploadedImage || !formData.name}
                >
                  {editingTemplate ? 'Mettre à jour' : 'Créer le template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
