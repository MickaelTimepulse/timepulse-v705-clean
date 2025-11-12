import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ColumnMapping {
  [key: string]: number;
}

interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  file_format: string;
  separator: string;
  mapping: ColumnMapping;
  is_global: boolean;
}

interface ColumnMapperProps {
  headers: string[];
  separator: string;
  onMappingChange: (mapping: ColumnMapping) => void;
  fileFormat: string;
}

const DEFAULT_FIELD_LABELS: { [key: string]: string } = {
  bib: 'Numéro de dossard',
  lastName: 'Nom de famille',
  firstName: 'Prénom',
  fullName: 'Nom complet',
  gender: 'Sexe',
  year: 'Année de naissance',
  category: 'Catégorie',
  club: 'Club',
  nationality: 'Nationalité',
  finishTime: 'Temps final',
  gunTime: 'Temps pistolet',
  netTime: 'Temps net',
  averageSpeed: 'Vitesse moyenne',
  overallRank: 'Classement général',
  genderRank: 'Classement par sexe',
  categoryRank: 'Classement par catégorie',
  splitTime1: 'Temps de passage 1',
  splitTime2: 'Temps de passage 2',
  splitTime3: 'Temps de passage 3',
};

const REQUIRED_FIELDS = ['bib', 'finishTime'];
const NAME_FIELDS = ['lastName', 'firstName', 'fullName'];

export default function ColumnMapper({
  headers,
  separator,
  onMappingChange,
  fileFormat
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [templates, setTemplates] = useState<MappingTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [customFields, setCustomFields] = useState<{ [key: string]: string }>({});
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');

  const FIELD_LABELS = { ...DEFAULT_FIELD_LABELS, ...customFields };

  useEffect(() => {
    loadTemplates();
  }, [fileFormat]);

  async function loadTemplates() {
    try {
      const { data, error } = await supabase
        .from('column_mappings')
        .select('*')
        .eq('file_format', fileFormat)
        .order('is_global', { ascending: false })
        .order('name');

      if (error) throw error;
      setTemplates((data as any) || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  }

  function applyTemplate(templateId: string) {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMapping(template.mapping);
      onMappingChange(template.mapping);
      setSelectedTemplate(templateId);
    }
  }

  function updateMapping(field: string, columnIndex: number) {
    const newMapping = { ...mapping };

    if (columnIndex === -1) {
      delete newMapping[field];
    } else {
      newMapping[field] = columnIndex;
    }

    setMapping(newMapping);
    onMappingChange(newMapping);
    setSelectedTemplate('');
  }

  async function saveTemplate() {
    if (!templateName.trim()) {
      alert('Veuillez entrer un nom pour le template');
      return;
    }

    setSavingTemplate(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('column_mappings')
        .insert({
          name: templateName,
          description: templateDescription || null,
          file_format: fileFormat,
          separator: separator,
          mapping: mapping as any,
          is_global: false,
          created_by: user.id,
        } as any);

      if (error) throw error;

      alert('Template sauvegardé avec succès !');
      setShowSaveModal(false);
      setTemplateName('');
      setTemplateDescription('');
      loadTemplates();
    } catch (err: any) {
      console.error('Error saving template:', err);
      alert('Erreur lors de la sauvegarde : ' + err.message);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function deleteTemplate(templateId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    try {
      const { error } = await supabase
        .from('column_mappings')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      alert('Template supprimé avec succès !');
      if (selectedTemplate === templateId) {
        setSelectedTemplate('');
      }
      loadTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      alert('Erreur lors de la suppression : ' + err.message);
    }
  }

  const hasRequiredFields = REQUIRED_FIELDS.every(field => mapping[field] !== undefined);
  const hasNameField = NAME_FIELDS.some(field => mapping[field] !== undefined);
  const isValid = hasRequiredFields && hasNameField;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Configuration du mapping des colonnes
        </h4>
        <p className="text-xs text-blue-700">
          Associez chaque champ aux colonnes correspondantes de votre fichier.
          Les champs marqués d'une * sont obligatoires.
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Charger un template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => applyTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
          >
            <option value="">-- Sélectionner un template --</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} {template.is_global ? '(Global)' : '(Personnel)'}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowSaveModal(true)}
          disabled={!isValid}
          className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Sauvegarder</span>
        </button>
        <button
          onClick={() => setShowAddFieldModal(true)}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Champ personnalisé</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h5 className="font-semibold text-gray-900">Association des colonnes</h5>
        </div>
        <div className="p-4 space-y-3">
          {Object.entries(FIELD_LABELS).map(([field, label]) => {
            const isRequired = REQUIRED_FIELDS.includes(field) ||
              (NAME_FIELDS.includes(field) && !NAME_FIELDS.some(f => f !== field && mapping[f] !== undefined));
            const isMapped = mapping[field] !== undefined;

            return (
              <div key={field} className="flex items-center space-x-4">
                <div className="w-1/3">
                  <label className="text-sm font-medium text-gray-700">
                    {label}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
                <div className="flex-1 flex items-center space-x-2">
                  <select
                    value={mapping[field] ?? -1}
                    onChange={(e) => updateMapping(field, parseInt(e.target.value))}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 ${
                      isRequired && !isMapped
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value={-1}>-- Non mappé --</option>
                    {headers.map((header, idx) => (
                      <option key={idx} value={idx}>
                        Colonne {idx + 1}: {header}
                      </option>
                    ))}
                  </select>
                  {isMapped && (
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`p-4 rounded-lg ${isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <p className={`text-sm font-medium ${isValid ? 'text-green-900' : 'text-red-900'}`}>
          {isValid
            ? 'Configuration valide. Vous pouvez importer les résultats.'
            : 'Configuration incomplète. Veuillez mapper tous les champs obligatoires.'}
        </p>
      </div>

      {selectedTemplate && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Template actif : {templates.find(t => t.id === selectedTemplate)?.name}
            </p>
            {templates.find(t => t.id === selectedTemplate)?.description && (
              <p className="text-xs text-gray-600">
                {templates.find(t => t.id === selectedTemplate)?.description}
              </p>
            )}
          </div>
          {!templates.find(t => t.id === selectedTemplate)?.is_global && (
            <button
              onClick={() => deleteTemplate(selectedTemplate)}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {showAddFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Ajouter un champ personnalisé
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clé du champ (technique) *
                </label>
                <input
                  type="text"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="Ex: custom_field_1"
                />
                <p className="text-xs text-gray-500 mt-1">Lettres, chiffres et underscore uniquement</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Libellé du champ *
                </label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="Ex: Vitesse moyenne"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (newFieldKey && newFieldLabel) {
                      setCustomFields({ ...customFields, [newFieldKey]: newFieldLabel });
                      setShowAddFieldModal(false);
                      setNewFieldKey('');
                      setNewFieldLabel('');
                    } else {
                      alert('Veuillez remplir tous les champs');
                    }
                  }}
                  disabled={!newFieldKey || !newFieldLabel}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => {
                    setShowAddFieldModal(false);
                    setNewFieldKey('');
                    setNewFieldLabel('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Sauvegarder le template
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du template *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="Ex: Format Timepulse 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="Décrivez ce template..."
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={saveTemplate}
                  disabled={savingTemplate || !templateName.trim()}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  {savingTemplate ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setTemplateName('');
                    setTemplateDescription('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
