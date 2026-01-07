import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Save, AlertCircle, Check, X, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';

type WaiverFieldType = 'checkbox' | 'yes_no' | 'radio' | 'text';

interface WaiverCheckbox {
  id?: string;
  label: string;
  description?: string;
  is_required: boolean;
  display_order: number;
  field_type?: WaiverFieldType;
  expected_value?: string;
  is_blocking?: boolean;
  blocking_message?: string;
  help_text?: string;
}

interface WaiverTemplate {
  id?: string;
  title: string;
  content: string;
  footer_text?: string;
  show_organizer_logo: boolean;
  show_organizer_info: boolean;
  show_event_info: boolean;
  show_date_location: boolean;
  require_manual_signature: boolean;
  require_checkboxes: boolean;
  minimum_age_to_sign: number;
  allow_parent_signature: boolean;
  is_active: boolean;
}

interface Props {
  raceId: string;
  eventId: string;
  organizerId: string;
  onSave?: () => void;
}

const DEFAULT_TEMPLATE_CONTENT = `DÉCHARGE DE RESPONSABILITÉ DU PARTICIPANT

Je suis âgé(e) d'au moins 16 ans et souhaite participer à l'événement "{EVENT_NAME}" - épreuve "{RACE_NAME}" ({DISTANCE}) qui se tiendra le {DATE} à {LOCATION}.

J'accepte les conditions ci-dessous de manière irrévocable et inconditionnelle, tant pour moi-même que pour mes héritiers, successeurs, ayants droit, ayants cause et assureurs :

RECONNAISSANCE DES RISQUES

{ORGANIZER_NAME} ne m'a fait aucune déclaration concernant le caractère approprié, les conditions ou la sécurité du lieu où l'événement se déroulera et je reconnais que ma participation à l'événement peut comporter des risques et être à l'origine d'accidents, de préjudices corporels et de dommages matériels.

Je déclare être en bonne santé et que mon état de santé et mes antécédents médicaux ne sont pas de nature à remettre en cause ou limiter ma capacité à participer à l'événement.

Je reconnais avoir examiné et évalué la nature, la portée et l'étendue des risques concernés, et je choisis volontairement et librement d'assumer ces risques.

Par ailleurs, je m'engage à me conformer aux consignes raisonnables données par les responsables de l'événement pendant la durée de celui-ci.

ASSURANCE

Je reconnais que {ORGANIZER_NAME} ne fournit aucune police d'assurance, que ce soit une assurance vie, médicale ou responsabilité civile, en cas de maladie, d'accident, de préjudice, de perte ou de dommage susceptible de survenir dans le cadre de ma participation à l'événement.

DÉDOMMAGEMENT

Dans toute la mesure permise par la réglementation en vigueur, j'accepte, par les présentes, de manière irrévocable et inconditionnelle, de garantir {ORGANIZER_NAME} contre toute réclamation, action en justice, montant, débours ou dommages et intérêts (y compris, notamment, les frais de justice, pour un montant raisonnable) résultant de tout accident, perte ou préjudice survenant du fait de ma participation à l'événement.

DIFFUSION DE FILMS ET DE VIDÉOS

Je reconnais et conviens que {ORGANIZER_NAME}, ses collaborateurs, sociétés affiliées, filiales, licenciés, mandataires, successeurs, ayants droit et partenaires commerciaux autorisés par {ORGANIZER_NAME}, pourront filmer, prendre en photos ou enregistrer de toute autre manière et par tout autre moyen ma participation à l'événement et à toute activité y afférente à des fins publicitaires ou promotionnelles.

PROTECTION DES DONNÉES PERSONNELLES

Je reconnais et conviens que pour participer à l'événement, je dois fournir certaines informations me concernant. Je reconnais et conviens que mes données personnelles seront utilisées par {ORGANIZER_NAME} à des fins de gestion de l'événement et pour les besoins spécifiques exposés aux présentes.

MENTIONS LÉGALES

{ORGANIZER_NAME}
{ORGANIZER_ADDRESS}`;

export default function WaiverTemplateManager({ raceId, eventId, organizerId, onSave }: Props) {
  const [template, setTemplate] = useState<WaiverTemplate>({
    title: 'Décharge de responsabilité',
    content: DEFAULT_TEMPLATE_CONTENT,
    footer_text: '',
    show_organizer_logo: true,
    show_organizer_info: true,
    show_event_info: true,
    show_date_location: true,
    require_manual_signature: true,
    require_checkboxes: true,
    minimum_age_to_sign: 18,
    allow_parent_signature: true,
    is_active: true,
  });

  const [checkboxes, setCheckboxes] = useState<WaiverCheckbox[]>([
    {
      label: 'J\'ai lu et compris la décharge de responsabilité',
      description: 'Cette case doit être cochée pour continuer',
      is_required: true,
      display_order: 0,
    },
    {
      label: 'J\'accepte les conditions générales de participation',
      is_required: true,
      display_order: 1,
    },
    {
      label: 'J\'autorise l\'utilisation de mon image à des fins promotionnelles',
      is_required: false,
      display_order: 2,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    loadExistingTemplate();
  }, [raceId]);

  const loadExistingTemplate = async () => {
    // Charger le modèle
    const { data: templateData, error: templateError } = await supabase
      .from('waiver_templates')
      .select('*')
      .eq('race_id', raceId)
      .eq('is_active', true)
      .maybeSingle();

    if (templateData) {
      setTemplate(templateData);

      // Charger les cases à cocher associées
      const { data: checkboxData, error: checkboxError } = await supabase
        .from('waiver_checkboxes')
        .select('*')
        .eq('waiver_template_id', templateData.id)
        .order('display_order', { ascending: true });

      if (checkboxData && checkboxData.length > 0) {
        setCheckboxes(checkboxData);
      }
    }
  };

  const addCheckbox = () => {
    setCheckboxes([
      ...checkboxes,
      {
        label: '',
        description: '',
        is_required: true,
        display_order: checkboxes.length,
        field_type: 'checkbox',
        expected_value: '',
        is_blocking: false,
        blocking_message: '',
        help_text: '',
      },
    ]);
  };

  const updateCheckbox = (index: number, field: keyof WaiverCheckbox, value: any) => {
    const updated = [...checkboxes];
    updated[index] = { ...updated[index], [field]: value };
    setCheckboxes(updated);
  };

  const removeCheckbox = (index: number) => {
    const updated = checkboxes.filter((_, i) => i !== index);
    updated.forEach((cb, i) => (cb.display_order = i));
    setCheckboxes(updated);
  };

  const handlePreview = async () => {
    try {
      // Charger les informations de la course, de l'événement et de l'organisateur
      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .select(`
          *,
          events!inner(
            *,
            organizers!inner(*)
          )
        `)
        .eq('id', raceId)
        .single();

      if (raceError) {
        setError('Erreur lors du chargement des données de prévisualisation');
        return;
      }

      // Remplacer les variables dans le contenu actuel
      let previewContent = template.content;
      const event = raceData.events;
      const organizer = event.organizers;

      previewContent = previewContent.replace(/{ORGANIZER_NAME}/g, organizer.name || '');
      previewContent = previewContent.replace(/{ORGANIZER_ADDRESS}/g, `${organizer.address || ''}, ${organizer.city || ''} ${organizer.postal_code || ''}`);
      previewContent = previewContent.replace(/{EVENT_NAME}/g, event.name || '');
      previewContent = previewContent.replace(/{RACE_NAME}/g, raceData.name || '');
      previewContent = previewContent.replace(/{DISTANCE}/g, raceData.distance ? `${raceData.distance} km` : '');
      previewContent = previewContent.replace(/{DATE}/g, event.date ? new Date(event.date).toLocaleDateString('fr-FR') : '');
      previewContent = previewContent.replace(/{LOCATION}/g, event.postal_code ? `${event.location || ''} ${event.postal_code}`.trim() : event.location || '');

      setPreviewData({
        content: previewContent,
        organizer_logo: organizer.logo_url,
        organizer_name: organizer.name,
        organizer_address: `${organizer.address || ''}, ${organizer.city || ''} ${organizer.postal_code || ''}`,
        event_name: event.name,
        race_name: raceData.name,
        distance: raceData.distance,
        event_date: event.date,
        location: event.location
      });

      setShowPreview(true);
    } catch (err: any) {
      setError(`Erreur lors de la prévisualisation: ${err.message}`);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Désactiver les anciens modèles pour cette course
      await supabase
        .from('waiver_templates')
        .update({ is_active: false })
        .eq('race_id', raceId);

      // Insérer le nouveau modèle
      const { data: newTemplate, error: templateError } = await supabase
        .from('waiver_templates')
        .insert([
          {
            organizer_id: organizerId,
            event_id: eventId,
            race_id: raceId,
            ...template,
          },
        ])
        .select()
        .single();

      if (templateError) throw templateError;

      // Insérer les cases à cocher
      if (checkboxes.length > 0) {
        const checkboxesData = checkboxes.map((cb) => ({
          waiver_template_id: newTemplate.id,
          label: cb.label,
          description: cb.description,
          is_required: cb.is_required,
          display_order: cb.display_order,
          field_type: cb.field_type || 'checkbox',
          expected_value: cb.expected_value || null,
          is_blocking: cb.is_blocking || false,
          blocking_message: cb.blocking_message || null,
          help_text: cb.help_text || null,
        }));

        const { error: checkboxError } = await supabase
          .from('waiver_checkboxes')
          .insert(checkboxesData);

        if (checkboxError) throw checkboxError;
      }

      // Associer le modèle à la course
      const { error: raceError } = await supabase
        .from('races')
        .update({ waiver_template_id: newTemplate.id })
        .eq('id', raceId);

      if (raceError) throw raceError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      if (onSave) onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Configuration de la décharge de responsabilité</h2>
        <p className="text-sm text-gray-600 mt-2">
          Configurez la décharge que les participants devront accepter lors de l'inscription. Utilisez les variables dynamiques pour personnaliser le contenu.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">Décharge de responsabilité enregistrée avec succès !</p>
        </div>
      )}

      {/* Variables disponibles */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-blue-900">Variables dynamiques</h3>
        <p className="text-xs text-blue-700">
          Copiez-collez ces variables dans votre texte, elles seront automatiquement remplacées par les vraies données :
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText('{ORGANIZER_NAME}')}
            className="bg-blue-100 px-2 py-1 rounded hover:bg-blue-200 text-left"
          >
            <code>{'{'}ORGANIZER_NAME{'}'}</code> - Nom organisateur
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText('{ORGANIZER_ADDRESS}')}
            className="bg-blue-100 px-2 py-1 rounded hover:bg-blue-200 text-left"
          >
            <code>{'{'}ORGANIZER_ADDRESS{'}'}</code> - Adresse complète
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText('{EVENT_NAME}')}
            className="bg-blue-100 px-2 py-1 rounded hover:bg-blue-200 text-left"
          >
            <code>{'{'}EVENT_NAME{'}'}</code> - Nom événement
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText('{RACE_NAME}')}
            className="bg-blue-100 px-2 py-1 rounded hover:bg-blue-200 text-left"
          >
            <code>{'{'}RACE_NAME{'}'}</code> - Nom course
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText('{DISTANCE}')}
            className="bg-blue-100 px-2 py-1 rounded hover:bg-blue-200 text-left"
          >
            <code>{'{'}DISTANCE{'}'}</code> - Distance
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText('{DATE}')}
            className="bg-blue-100 px-2 py-1 rounded hover:bg-blue-200 text-left"
          >
            <code>{'{'}DATE{'}'}</code> - Date événement
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText('{LOCATION}')}
            className="bg-blue-100 px-2 py-1 rounded hover:bg-blue-200 text-left"
          >
            <code>{'{'}LOCATION{'}'}</code> - Lieu + Code postal
          </button>
        </div>
        <p className="text-xs text-blue-600 italic">💡 Cliquez sur une variable pour la copier dans le presse-papier</p>
      </div>

      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre du document
        </label>
        <input
          type="text"
          value={template.title}
          onChange={(e) => setTemplate({ ...template, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="Décharge de responsabilité"
        />
      </div>

      {/* Contenu */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contenu de la décharge *
        </label>
        <textarea
          value={template.content}
          onChange={(e) => setTemplate({ ...template, content: e.target.value })}
          rows={20}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm"
          placeholder="Saisissez le contenu de votre décharge..."
          required
        />
      </div>

      {/* Options d'affichage */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Options d'affichage</h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={template.show_organizer_logo}
            onChange={(e) => setTemplate({ ...template, show_organizer_logo: e.target.checked })}
            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
          />
          <span className="text-sm text-gray-700">Afficher le logo de l'organisateur</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={template.show_organizer_info}
            onChange={(e) => setTemplate({ ...template, show_organizer_info: e.target.checked })}
            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
          />
          <span className="text-sm text-gray-700">Afficher les informations de l'organisateur</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={template.show_event_info}
            onChange={(e) => setTemplate({ ...template, show_event_info: e.target.checked })}
            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
          />
          <span className="text-sm text-gray-700">Afficher les informations de l'événement</span>
        </label>
      </div>

      {/* Paramètres de signature */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Paramètres de signature</h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={template.require_manual_signature}
            onChange={(e) => setTemplate({ ...template, require_manual_signature: e.target.checked })}
            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
          />
          <span className="text-sm text-gray-700">Exiger une signature manuelle</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={template.allow_parent_signature}
            onChange={(e) => setTemplate({ ...template, allow_parent_signature: e.target.checked })}
            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
          />
          <span className="text-sm text-gray-700">Autoriser la signature parentale pour les mineurs</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Âge minimum pour signer
          </label>
          <input
            type="number"
            min="0"
            max="120"
            value={template.minimum_age_to_sign}
            onChange={(e) => setTemplate({ ...template, minimum_age_to_sign: parseInt(e.target.value) })}
            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Les participants plus jeunes nécessiteront une signature parentale</p>
        </div>
      </div>

      {/* Cases à cocher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Cases à cocher</h3>
          <button
            type="button"
            onClick={addCheckbox}
            className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700"
          >
            <Plus className="w-4 h-4" />
            Ajouter une case
          </button>
        </div>

        <div className="space-y-3">
          {checkboxes.map((checkbox, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center cursor-move text-gray-400 hover:text-gray-600">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-4">
                  {/* Type de champ */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type de champ</label>
                    <select
                      value={checkbox.field_type || 'checkbox'}
                      onChange={(e) => updateCheckbox(index, 'field_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                    >
                      <option value="checkbox">Case à cocher standard</option>
                      <option value="yes_no">Question Oui/Non</option>
                      <option value="radio">Choix multiple (radio)</option>
                    </select>
                  </div>

                  {/* Question */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Question / Label</label>
                    <input
                      type="text"
                      value={checkbox.label}
                      onChange={(e) => updateCheckbox(index, 'label', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="Ex: Avez-vous subi une opération dans les 3 derniers mois ?"
                    />
                  </div>

                  {/* Description / Aide */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Texte d'aide (optionnel)</label>
                    <input
                      type="text"
                      value={checkbox.help_text || ''}
                      onChange={(e) => updateCheckbox(index, 'help_text', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="Information complémentaire affichée sous la question"
                    />
                  </div>

                  {/* Options de validation */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-700">Validation conditionnelle</h4>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkbox.is_required}
                        onChange={(e) => updateCheckbox(index, 'is_required', e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-sm text-gray-700">Réponse obligatoire</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkbox.is_blocking || false}
                        onChange={(e) => updateCheckbox(index, 'is_blocking', e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-sm text-gray-700">Bloquer l'inscription si réponse incorrecte</span>
                    </label>

                    {checkbox.is_blocking && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Réponse attendue pour valider
                          </label>
                          <input
                            type="text"
                            value={checkbox.expected_value || ''}
                            onChange={(e) => updateCheckbox(index, 'expected_value', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                            placeholder={checkbox.field_type === 'yes_no' ? 'Ex: non' : 'Ex: accepte'}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {checkbox.field_type === 'yes_no'
                              ? 'Saisir "oui" ou "non" selon la réponse attendue'
                              : 'Valeur exacte que doit cocher/saisir l\'utilisateur'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Message de refus
                          </label>
                          <textarea
                            value={checkbox.blocking_message || ''}
                            onChange={(e) => updateCheckbox(index, 'blocking_message', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                            placeholder="Ex: Une autorisation médicale est requise pour participer à cet événement"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeCheckbox(index)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handlePreview}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <Eye className="w-5 h-5" />
          Prévisualiser
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Modal de prévisualisation */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Prévisualisation de la décharge</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {template.show_organizer_logo && previewData.organizer_logo && (
                <div className="flex justify-center">
                  <img src={previewData.organizer_logo} alt="Logo" className="h-24 object-contain" />
                </div>
              )}
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold text-center">{template.title}</h2>
                <div className="whitespace-pre-wrap text-sm">{previewData.content}</div>
              </div>
              {checkboxes.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Acceptations requises :</h4>
                  {checkboxes.map((cb, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {cb.field_type === 'yes_no' ? (
                          <div className="flex gap-4 mt-1">
                            <label className="flex items-center gap-2">
                              <input type="radio" name={`question-${idx}`} className="w-4 h-4" disabled />
                              <span className="text-sm">Oui</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="radio" name={`question-${idx}`} className="w-4 h-4" disabled />
                              <span className="text-sm">Non</span>
                            </label>
                          </div>
                        ) : (
                          <input type="checkbox" className="mt-1 w-4 h-4" disabled />
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 font-medium">
                            {cb.label}
                            {cb.is_required && <span className="text-red-600 ml-1">*</span>}
                          </p>
                          {cb.help_text && (
                            <p className="text-xs text-gray-600 mt-1">{cb.help_text}</p>
                          )}
                          {cb.is_blocking && (
                            <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                              <p className="text-xs text-yellow-800">
                                ⚠️ Validation requise : {cb.expected_value}
                              </p>
                              {cb.blocking_message && (
                                <p className="text-xs text-yellow-700 mt-1">
                                  {cb.blocking_message}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
