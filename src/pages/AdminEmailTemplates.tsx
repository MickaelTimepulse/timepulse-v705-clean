import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, ArrowLeft, Save, Eye, AlertCircle, X, Info } from 'lucide-react';
import ImageSelector from '../components/Admin/ImageSelector';

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  description: string;
  subject: string;
  html_body: string;
  text_body: string | null;
  available_variables: string[];
  is_active: boolean;
  header_image_url?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminEmailTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('admin_get_email_templates');

      if (fetchError) throw fetchError;

      setTemplates(data || []);
      if (data && data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { data, error: updateError } = await supabase
        .rpc('admin_update_email_template', {
          p_id: selectedTemplate.id,
          p_subject: selectedTemplate.subject,
          p_html_body: selectedTemplate.html_body,
          p_text_body: selectedTemplate.text_body,
          p_is_active: selectedTemplate.is_active,
          p_header_image_url: selectedTemplate.header_image_url || null
        });

      if (updateError) throw updateError;
      if (!data) throw new Error('Échec de la mise à jour');

      setSuccess('Template mis à jour avec succès');
      await loadTemplates();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Erreur lors de la sauvegarde du template');
    } finally {
      setSaving(false);
    }
  };

  const getPreviewHtml = () => {
    if (!selectedTemplate) return '';

    let preview = selectedTemplate.html_body;

    // Replace {{site_url}} with current origin
    preview = preview.replace(/\{\{site_url\}\}/g, window.location.origin);

    selectedTemplate.available_variables.forEach(variable => {
      const sampleValues: Record<string, string> = {
        name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        password: 'MotDePasse123',
        loginUrl: 'https://timepulse.fr/admin/login',
        athlete_name: 'Marie Martin',
        buyer_name: 'Pierre Durand',
        seller_name: 'Sophie Lefebvre',
        organizer_name: 'Jean-Claude Organisateur',
        event_name: 'Trail des Montagnes 2025',
        race_name: '21 km - Semi-marathon',
        bib_number: '1234',
        price: '45.00',
        refund_amount: '45.00',
        event_date: '15 juin 2025',
        refund_date: '10 janvier 2025',
        sale_date: '5 janvier 2025',
        exchange_date: '5 janvier 2025 à 14h30',
        management_code: 'ABC123XYZ',
        bib_exchange_url: 'https://timepulse.fr/bib-exchange/manage',
        event_url: 'https://timepulse.fr/events/trail-montagnes-2025',
        entries_url: 'https://timepulse.fr/organizer/entries',
        payment_method: 'Carte bancaire',
        transaction_id: 'TXN-2025-001234',
        athleteFirstName: 'Marie',
        athleteLastName: 'Martin',
        athleteEmail: 'marie.martin@example.com'
      };
      const value = sampleValues[variable] || `[${variable}]`;
      preview = preview.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });
    return preview;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Erreur</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-green-700">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div>
        <button
          onClick={() => navigate('/admin/settings')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux paramètres
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Templates d'emails</h1>
        <p className="text-gray-600">Personnalisez les emails envoyés automatiquement par la plateforme</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Liste des templates */}
        <div className="lg:col-span-1 space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <Mail className={`w-5 h-5 mt-0.5 ${
                  selectedTemplate?.id === template.id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      template.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {template.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Éditeur de template */}
        {selectedTemplate && (
          <div className="lg:col-span-3 bg-white rounded-lg shadow p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Masquer' : 'Aperçu'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>

            {/* Variables disponibles */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Variables disponibles</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.available_variables.map((variable) => (
                  <code
                    key={variable}
                    className="px-2 py-1 bg-white border border-blue-300 rounded text-sm text-blue-800 font-mono cursor-pointer hover:bg-blue-100"
                    onClick={() => {
                      navigator.clipboard.writeText(`{{${variable}}}`);
                      setSuccess(`Variable {{${variable}}} copiée !`);
                      setTimeout(() => setSuccess(null), 2000);
                    }}
                  >
                    {`{{${variable}}}`}
                  </code>
                ))}
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Cliquez sur une variable pour la copier dans le presse-papier
              </p>
            </div>

            {/* Toggle actif/inactif */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTemplate.is_active}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    is_active: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm text-gray-700">
                Template {selectedTemplate.is_active ? 'activé' : 'désactivé'}
              </span>
            </div>

            {/* Image Selector */}
            <ImageSelector
              value={selectedTemplate.header_image_url || ''}
              onChange={(url) => setSelectedTemplate({
                ...selectedTemplate,
                header_image_url: url
              })}
            />

            {/* Sujet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sujet de l'email
              </label>
              <input
                type="text"
                value={selectedTemplate.subject}
                onChange={(e) => setSelectedTemplate({
                  ...selectedTemplate,
                  subject: e.target.value
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Sujet de l'email"
              />
            </div>

            {/* Corps HTML */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Corps de l'email (HTML)
              </label>
              <textarea
                value={selectedTemplate.html_body}
                onChange={(e) => setSelectedTemplate({
                  ...selectedTemplate,
                  html_body: e.target.value
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                rows={20}
                placeholder="HTML de l'email"
              />
            </div>

            {/* Aperçu */}
            {showPreview && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Aperçu avec données exemples</h3>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-96 overflow-auto">
                  <iframe
                    srcDoc={getPreviewHtml()}
                    className="w-full h-[600px] bg-white rounded"
                    title="Aperçu de l'email"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
