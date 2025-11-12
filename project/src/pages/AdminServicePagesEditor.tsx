import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Eye, Sparkles } from 'lucide-react';
import * as Icons from 'lucide-react';
import AdminLayout from '../components/Admin/AdminLayout';
import PageEditor from '../components/Admin/PageEditor';
import MediaLibrary from '../components/Admin/MediaLibrary';
import SEOPreview from '../components/Admin/SEOPreview';
import IconPicker from '../components/Admin/IconPicker';
import { supabase } from '../lib/supabase';
import { generateText } from '../lib/ai-service';

interface PageSection {
  id: string;
  type: 'hero' | 'text' | 'features' | 'images' | 'cta';
  content: any;
}

export default function AdminServicePagesEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    icon: 'circle',
    short_description: '',
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    card_image_url: '',
    seo_title: '',
    seo_description: '',
    order_index: 0,
    is_published: false,
  });

  const [sections, setSections] = useState<PageSection[]>([]);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchPage();
    } else {
      setLoading(false);
    }
  }, [id]);

  async function fetchPage() {
    if (!id || id === 'new') return;

    const { data, error } = await supabase
      .from('service_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setFormData({
        slug: data.slug,
        title: data.title,
        icon: data.icon,
        short_description: data.short_description,
        hero_title: data.hero_title || '',
        hero_subtitle: data.hero_subtitle || '',
        hero_image_url: data.hero_image_url || '',
        card_image_url: data.card_image_url || '',
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        order_index: data.order_index,
        is_published: data.is_published,
      });

      if (data.content && Array.isArray(data.content)) {
        setSections(data.content.map((s: any, i: number) => ({
          id: `section_${i}`,
          type: s.type,
          content: s,
        })));
      }
    }

    setLoading(false);
  }

  async function handleSave() {
    if (!formData.title || !formData.slug) {
      alert('Le titre et l\'URL sont requis');
      return;
    }

    setSaving(true);

    try {
      const pageData = {
        slug: formData.slug,
        title: formData.title,
        icon: formData.icon || 'Circle',
        short_description: formData.short_description || '',
        hero_title: formData.hero_title || formData.title,
        hero_subtitle: formData.hero_subtitle || '',
        hero_image_url: formData.hero_image_url || '',
        card_image_url: formData.card_image_url || '',
        seo_title: formData.seo_title || formData.title,
        seo_description: formData.seo_description || formData.short_description,
        order_index: formData.order_index || 0,
        is_published: formData.is_published || false,
        content: sections.map(s => ({ type: s.type, ...s.content })),
      };

      if (id && id !== 'new') {
        const { error } = await supabase
          .from('service_pages')
          .update(pageData)
          .eq('id', id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('service_pages')
          .insert([pageData]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
      }

      alert('Page enregistrée avec succès !');
      navigate('/admin/services');
    } catch (error: any) {
      console.error('Save error:', error);
      const errorMessage = error?.message || 'Erreur inconnue';
      alert(`Erreur lors de l'enregistrement : ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }

  async function generateShortDescription() {
    const result = await generateText({
      prompt: `Génère une description courte et percutante (max 150 caractères) pour une page de service intitulée "${formData.title}". Cette description apparaîtra sur la carte de la page d'accueil.`,
      length: 'short',
    });

    if (result.success) {
      setFormData({ ...formData, short_description: result.text.substring(0, 200) });
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/services')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {id === 'new' ? 'Nouvelle page' : 'Modifier la page'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Créez une page complète avec sections, images et textes générés par IA
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {formData.slug && (
              <a
                href={`/services/${formData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                Prévisualiser
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !formData.title || !formData.slug}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    💡 Lien entre le bloc et la page
                  </h3>
                  <p className="text-sm text-blue-800">
                    Cette page sera accessible via <strong>le bloc "{formData.title || '(titre à définir)'}"</strong> sur la page d'accueil.
                    Les visiteurs qui cliquent sur ce bloc seront redirigés vers <code className="bg-blue-100 px-2 py-0.5 rounded">/services/{formData.slug || '...'}</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de la page *
                  <span className="text-xs text-gray-500 font-normal ml-2">(apparaît sur le bloc d'accueil)</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Chronométrage professionnel"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL (slug) *
                  <span className="text-xs text-gray-500 font-normal ml-2">(lien de destination)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">/services/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                      })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="chronometrage"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icône du bloc d'accueil
                </label>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 border-2 border-gray-300 hover:border-blue-400 rounded-lg transition-all group"
                >
                  {(() => {
                    const IconComponent = (Icons as any)[formData.icon] || Icons.Circle;
                    return (
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <IconComponent className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium text-gray-900">{formData.icon}</div>
                          <div className="text-xs text-gray-500">Cliquez pour changer</div>
                        </div>
                      </div>
                    );
                  })()}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Publier la page</span>
                </label>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description courte (carte d'accueil) *
                </label>
                <button
                  type="button"
                  onClick={generateShortDescription}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                >
                  <Sparkles className="w-3 h-3" />
                  Générer avec l'IA
                </button>
              </div>
              <textarea
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                maxLength={200}
                placeholder="Cette description apparaît sur la carte de la page d'accueil"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.short_description.length}/200 caractères
              </p>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Image de fond du bloc (page d'accueil)
                </label>
                <span className="text-xs text-gray-500">Optionnel</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Image affichée en arrière-plan du bloc sur la page d'accueil. Si vide, une image de chronométrage professionnel Timepulse sera utilisée par défaut.
              </p>
              {formData.card_image_url ? (
                <div className="relative">
                  <img
                    src={formData.card_image_url}
                    alt="Card"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 flex gap-2 items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                    <button
                      type="button"
                      onClick={() => setShowMediaSelector('card_image_url')}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Changer l'image
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, card_image_url: '' })}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMediaSelector('card_image_url')}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors gap-2"
                >
                  <span className="text-sm font-medium">Sélectionner une image personnalisée</span>
                  <span className="text-xs text-gray-400">(Par défaut: image chronométrage Timepulse)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contenu de la page</h2>
            <p className="text-sm text-gray-600 mb-6">
              Ajoutez des sections pour construire votre page. Vous pouvez utiliser l'IA pour générer du contenu.
            </p>

            <PageEditor sections={sections} onChange={setSections} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <SEOPreview
            title={formData.seo_title}
            description={formData.seo_description}
            onTitleChange={(value) => setFormData({ ...formData, seo_title: value })}
            onDescriptionChange={(value) => setFormData({ ...formData, seo_description: value })}
            pageTitle={formData.title}
            pageContent={sections.map(s => s.content?.content || '').join(' ')}
            shortDescription={formData.short_description}
          />
        </div>
      </div>

      {showMediaSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Sélectionner une image</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <MediaLibrary
                onSelect={(file) => {
                  setFormData({ ...formData, [showMediaSelector]: file.file_url });
                  setShowMediaSelector(null);
                }}
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowMediaSelector(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showIconPicker && (
        <IconPicker
          selectedIcon={formData.icon}
          onSelectIcon={(iconName) => {
            setFormData({ ...formData, icon: iconName });
            setShowIconPicker(false);
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </AdminLayout>
  );
}
