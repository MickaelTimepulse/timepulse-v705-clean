import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import EmailTemplateEditor from '../components/Admin/EmailTemplateEditor';
import {
  Mail, ArrowLeft, Save, Eye, AlertCircle, X, Info, Plus,
  Search, Filter, Check, Copy, Send, BookOpen
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  description: string;
  category: string;
  subject: string;
  html_body: string;
  text_body: string | null;
  available_variables: string[];
  is_active: boolean;
  background_image?: string;
  background_color?: string;
  opacity?: number;
  created_at: string;
  updated_at: string;
}

const EMAIL_CATEGORIES = [
  { key: 'all', label: 'Tous', icon: Mail },
  { key: 'inscription', label: 'Inscription', icon: Check },
  { key: 'paiement', label: 'Paiement', icon: Send },
  { key: 'rappel', label: 'Rappels', icon: AlertCircle },
  { key: 'confirmation', label: 'Confirmations', icon: Check },
  { key: 'modification', label: 'Modifications', icon: Copy },
];

// Liste complète des templates d'emails basée sur votre document
const DEFAULT_EMAIL_TEMPLATES = [
  {
    key: 'registration_confirmation',
    name: 'Confirmation d\'inscription',
    category: 'inscription',
    description: 'Email envoyé après une inscription réussie',
    subject: 'Confirmation de votre inscription - {{event_name}}',
    variables: ['athlete_name', 'event_name', 'race_name', 'bib_number', 'registration_date', 'management_code']
  },
  {
    key: 'payment_confirmation',
    name: 'Confirmation de paiement',
    category: 'paiement',
    description: 'Email envoyé après un paiement réussi',
    subject: 'Paiement confirmé - {{event_name}}',
    variables: ['athlete_name', 'event_name', 'amount', 'payment_date', 'transaction_id']
  },
  {
    key: 'payment_pending',
    name: 'Paiement en attente',
    category: 'paiement',
    description: 'Email envoyé quand le paiement est en attente',
    subject: 'Paiement en attente - {{event_name}}',
    variables: ['athlete_name', 'event_name', 'amount', 'payment_link']
  },
  {
    key: 'registration_modification',
    name: 'Modification d\'inscription',
    category: 'modification',
    description: 'Email envoyé après modification d\'une inscription',
    subject: 'Modification de votre inscription - {{event_name}}',
    variables: ['athlete_name', 'event_name', 'modifications', 'management_code']
  },
  {
    key: 'registration_cancellation',
    name: 'Annulation d\'inscription',
    category: 'modification',
    description: 'Email envoyé lors de l\'annulation d\'une inscription',
    subject: 'Annulation de votre inscription - {{event_name}}',
    variables: ['athlete_name', 'event_name', 'refund_amount', 'cancellation_date']
  },
  {
    key: 'event_reminder_7days',
    name: 'Rappel J-7',
    category: 'rappel',
    description: 'Rappel envoyé 7 jours avant l\'événement',
    subject: 'Plus que 7 jours avant {{event_name}} !',
    variables: ['athlete_name', 'event_name', 'event_date', 'race_name', 'bib_number', 'race_info']
  },
  {
    key: 'event_reminder_1day',
    name: 'Rappel J-1',
    category: 'rappel',
    description: 'Rappel envoyé la veille de l\'événement',
    subject: 'C\'est demain ! {{event_name}}',
    variables: ['athlete_name', 'event_name', 'event_date', 'meeting_time', 'meeting_place', 'bib_number']
  },
  {
    key: 'bib_number_assigned',
    name: 'Attribution du dossard',
    category: 'confirmation',
    description: 'Email envoyé quand un dossard est attribué',
    subject: 'Votre dossard pour {{event_name}}',
    variables: ['athlete_name', 'event_name', 'bib_number', 'race_name']
  },
  {
    key: 'document_required',
    name: 'Documents requis',
    category: 'rappel',
    description: 'Email demandant l\'envoi de documents',
    subject: 'Documents à fournir - {{event_name}}',
    variables: ['athlete_name', 'event_name', 'missing_documents', 'deadline', 'upload_link']
  },
  {
    key: 'certificate_medical_expiry',
    name: 'Certificat médical expiré',
    category: 'rappel',
    description: 'Email rappelant l\'expiration du certificat médical',
    subject: 'Certificat médical à renouveler - {{event_name}}',
    variables: ['athlete_name', 'event_name', 'expiry_date', 'upload_link']
  },
  {
    key: 'license_verification_success',
    name: 'Licence FFA vérifiée',
    category: 'confirmation',
    description: 'Email confirmant la vérification de la licence FFA',
    subject: 'Licence FFA vérifiée - {{event_name}}',
    variables: ['athlete_name', 'event_name', 'license_number', 'license_type']
  },
  {
    key: 'license_verification_failed',
    name: 'Licence FFA non valide',
    category: 'rappel',
    description: 'Email en cas de problème avec la licence FFA',
    subject: 'Problème avec votre licence FFA - {{event_name}}',
    variables: ['athlete_name', 'event_name', 'license_number', 'error_message']
  },
  {
    key: 'race_results_available',
    name: 'Résultats disponibles',
    category: 'confirmation',
    description: 'Email envoyé quand les résultats sont en ligne',
    subject: 'Vos résultats sont disponibles - {{event_name}}',
    variables: ['athlete_name', 'event_name', 'race_name', 'finish_time', 'rank', 'results_link']
  },
  {
    key: 'race_certificate_available',
    name: 'Attestation de participation',
    category: 'confirmation',
    description: 'Email avec l\'attestation de participation',
    subject: 'Votre attestation de participation - {{event_name}}',
    variables: ['athlete_name', 'event_name', 'race_name', 'finish_time', 'certificate_link']
  },
  {
    key: 'bib_exchange_request',
    name: 'Demande d\'échange de dossard',
    category: 'modification',
    description: 'Email lors d\'une demande d\'échange de dossard',
    subject: 'Demande d\'échange de dossard - {{event_name}}',
    variables: ['athlete_name', 'event_name', 'race_name', 'exchange_code']
  },
  {
    key: 'bib_exchange_accepted',
    name: 'Échange de dossard accepté',
    category: 'confirmation',
    description: 'Email confirmant l\'échange de dossard',
    subject: 'Échange de dossard confirmé - {{event_name}}',
    variables: ['buyer_name', 'seller_name', 'event_name', 'race_name', 'bib_number']
  },
  {
    key: 'carpooling_match',
    name: 'Covoiturage - Correspondance',
    category: 'confirmation',
    description: 'Email envoyé lors d\'une correspondance de covoiturage',
    subject: 'Covoiturage trouvé pour {{event_name}}',
    variables: ['passenger_name', 'driver_name', 'event_name', 'departure_location', 'contact_info']
  },
  {
    key: 'volunteer_confirmation',
    name: 'Confirmation bénévolat',
    category: 'confirmation',
    description: 'Email confirmant l\'inscription comme bénévole',
    subject: 'Confirmation bénévolat - {{event_name}}',
    variables: ['volunteer_name', 'event_name', 'role', 'date', 'location']
  },
  {
    key: 'organizer_new_registration',
    name: 'Nouvelle inscription (organisateur)',
    category: 'confirmation',
    description: 'Email notifiant l\'organisateur d\'une nouvelle inscription',
    subject: 'Nouvelle inscription - {{event_name}}',
    variables: ['organizer_name', 'athlete_name', 'event_name', 'race_name', 'registration_date']
  },
  {
    key: 'organizer_daily_summary',
    name: 'Résumé quotidien (organisateur)',
    category: 'rappel',
    description: 'Résumé quotidien des inscriptions pour l\'organisateur',
    subject: 'Résumé du jour - {{event_name}}',
    variables: ['organizer_name', 'event_name', 'new_registrations_count', 'total_registrations', 'revenue']
  }
];

export default function AdminEmailManager() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [testEmail, setTestEmail] = useState('mickael@timepulse.run');
  const [showTestModal, setShowTestModal] = useState(false);

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
          p_background_image: selectedTemplate.background_image,
          p_background_color: selectedTemplate.background_color,
          p_opacity: selectedTemplate.opacity
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

  const handleDuplicate = async () => {
    if (!selectedTemplate) return;

    try {
      const { data, error: insertError } = await supabase
        .rpc('admin_duplicate_email_template', {
          p_id: selectedTemplate.id
        });

      if (insertError) throw insertError;

      setSuccess('Template dupliqué avec succès');
      await loadTemplates();

      const newTemplate = templates.find(t => t.id === data);
      if (newTemplate) {
        setSelectedTemplate(newTemplate);
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error duplicating template:', err);
      setError('Erreur lors de la duplication du template');
    }
  };

  const handleSendTest = async () => {
    if (!selectedTemplate || !testEmail) return;

    try {
      setSendingTest(true);
      setError(null);
      setSuccess(null);

      // Créer des variables de test avec des données factices
      const testVariables: Record<string, string> = {
        athlete_name: 'Jean Dupont',
        event_name: 'Marathon de Paris 2025',
        race_name: '10km',
        bib_number: '1234',
        registration_date: new Date().toLocaleDateString('fr-FR'),
        management_code: 'TEST123',
        amount: '45.00',
        payment_date: new Date().toLocaleDateString('fr-FR'),
        transaction_id: 'TXN-TEST-123456',
        event_date: '15 juin 2025',
        meeting_time: '08:00',
        meeting_place: 'Champs-Élysées, Paris',
        race_info: 'Départ à 9h00 - Retrait des dossards de 7h à 8h30',
        organizer_name: 'Timepulse',
        organizer_email: 'contact@timepulse.run',
        event_url: 'https://timepulse.fr/events/marathon-paris-2025',
        results_url: 'https://timepulse.fr/results/test'
      };

      // Remplacer les variables dans le sujet et le corps
      let subject = selectedTemplate.subject;
      let htmlBody = selectedTemplate.html_body;

      Object.entries(testVariables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        htmlBody = htmlBody.replace(regex, value);
      });

      // Envoyer l'email de test via l'edge function
      const { error: sendError } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: `[TEST] ${subject}`,
          html: htmlBody,
          type: 'test',
          template_key: selectedTemplate.template_key
        }
      });

      if (sendError) throw sendError;

      setSuccess(`Email de test envoyé à ${testEmail}`);
      setShowTestModal(false);

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error sending test email:', err);
      setError('Erreur lors de l\'envoi de l\'email de test');
    } finally {
      setSendingTest(false);
    }
  };

  const getPreviewHtml = () => {
    if (!selectedTemplate) return '';

    const sampleValues: Record<string, string> = {
      athlete_name: 'Jean Dupont',
      event_name: 'Marathon de Paris 2025',
      race_name: 'Marathon 42km',
      bib_number: '12345',
      registration_date: '15/11/2025',
      management_code: 'ABC123XYZ',
      amount: '45,00 €',
      payment_date: '15/11/2025',
      transaction_id: 'TRX-789456',
      event_date: '06/04/2025',
      meeting_time: '08:00',
      meeting_place: 'Champs-Élysées',
      finish_time: '3h 45min 23s',
      rank: '234ème',
      license_number: '929636',
      organizer_name: 'Association Sportive'
    };

    let preview = selectedTemplate.html_body;

    selectedTemplate.available_variables.forEach(variable => {
      const value = sampleValues[variable] || `[${variable}]`;
      preview = preview.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });

    const bgImage = selectedTemplate.background_image || '';
    const bgColor = selectedTemplate.background_color || '#ffffff';
    const opacity = (selectedTemplate.opacity || 100) / 100;

    const wrappedPreview = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: ${bgColor};
              ${bgImage ? `background-image: url('${bgImage}');` : ''}
              background-size: cover;
              background-position: center;
              border-radius: 8px;
              overflow: hidden;
            }
            .email-content {
              background-color: rgba(255, 255, 255, ${opacity});
              padding: 40px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-content">
              ${preview}
            </div>
          </div>
        </body>
      </html>
    `;

    return wrappedPreview;
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
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

      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/admin/settings')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux paramètres
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des emails</h1>
            <p className="text-gray-600">Personnalisez les emails d'inscription et de communication</p>
          </div>
          <button
            onClick={() => navigate('/admin/email-variables')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            Guide des variables
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un template..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {EMAIL_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Liste des templates */}
        <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredTemplates.map((template) => (
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
                <Mail className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  selectedTemplate?.id === template.id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      template.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {template.is_active ? 'Actif' : 'Inactif'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {template.category}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucun template trouvé</p>
            </div>
          )}
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
                  onClick={handleDuplicate}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" />
                  Dupliquer
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Masquer' : 'Aperçu'}
                </button>
                <button
                  onClick={() => setShowTestModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Send className="w-4 h-4" />
                  Test
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

            {/* Éditeur */}
            <EmailTemplateEditor
              value={selectedTemplate.html_body}
              onChange={(value) => setSelectedTemplate({ ...selectedTemplate, html_body: value })}
              subject={selectedTemplate.subject}
              onSubjectChange={(subject) => setSelectedTemplate({ ...selectedTemplate, subject })}
              backgroundImage={selectedTemplate.background_image || ''}
              onBackgroundImageChange={(url) => setSelectedTemplate({ ...selectedTemplate, background_image: url })}
              backgroundColor={selectedTemplate.background_color || '#ffffff'}
              onBackgroundColorChange={(color) => setSelectedTemplate({ ...selectedTemplate, background_color: color })}
              opacity={selectedTemplate.opacity || 100}
              onOpacityChange={(opacity) => setSelectedTemplate({ ...selectedTemplate, opacity })}
            />

            {/* Aperçu */}
            {showPreview && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Aperçu avec données exemples</h3>
                <div className="border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
                  <iframe
                    srcDoc={getPreviewHtml()}
                    className="w-full h-[700px] bg-white"
                    title="Aperçu de l'email"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Test Email */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Envoyer un email de test</h2>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template sélectionné
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="font-semibold text-gray-900">{selectedTemplate?.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedTemplate?.description}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email de destination
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Par défaut: mickael@timepulse.run
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Email de test avec données fictives</p>
                    <p className="text-blue-700">
                      L'email sera envoyé avec des données d'exemple pour visualiser le rendu final.
                      Le sujet sera préfixé par [TEST].
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTestModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSendTest}
                disabled={sendingTest || !testEmail}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sendingTest ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
