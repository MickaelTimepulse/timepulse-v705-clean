import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Image, Package, Users, X, Upload } from 'lucide-react';

interface RaceOption {
  id: string;
  race_id: string;
  type: string;
  label: string;
  description: string | null;
  image_url: string | null;
  is_question: boolean;
  is_required: boolean;
  has_quantity_limit: boolean;
  max_quantity: number | null;
  current_quantity: number;
  price_cents: number;
  available_from: string | null;
  available_until: string | null;
  display_order: number;
  active: boolean;
  choices?: RaceOptionChoice[];
}

interface RaceOptionChoice {
  id: string;
  option_id: string;
  label: string;
  description: string | null;
  price_modifier_cents: number;
  has_quantity_limit: boolean;
  max_quantity: number | null;
  current_quantity: number;
  display_order: number;
  active: boolean;
}

interface RaceOptionsManagerProps {
  raceId: string;
  raceName: string;
}

export default function RaceOptionsManager({ raceId, raceName }: RaceOptionsManagerProps) {
  const [options, setOptions] = useState<RaceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOption, setEditingOption] = useState<RaceOption | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    type: 'custom',
    label: '',
    description: '',
    is_question: false,
    is_required: false,
    has_quantity_limit: false,
    max_quantity: '',
    price_cents: '0',
    available_from: '',
    available_until: '',
    image_url: '',
  });

  const [choices, setChoices] = useState<Array<{
    label: string;
    description: string;
    price_modifier_cents: string;
    has_quantity_limit: boolean;
    max_quantity: string;
  }>>([]);

  const optionTypes = [
    { value: 'tshirt', label: 'T-shirt' },
    { value: 'meal', label: 'Repas' },
    { value: 'shuttle', label: 'Navette' },
    { value: 'reference_time', label: 'Temps de référence' },
    { value: 'itra_points', label: 'Points ITRA' },
    { value: 'betrail_points', label: 'Points Betrail' },
    { value: 'custom', label: 'Personnalisé' },
  ];

  useEffect(() => {
    loadOptions();
  }, [raceId]);

  const loadOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('race_options')
        .select(`
          *,
          choices:race_option_choices(*)
        `)
        .eq('race_id', raceId)
        .order('display_order');

      if (error) throw error;
      setOptions(data || []);
    } catch (err) {
      console.error('Error loading options:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${raceId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('race-options')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('race-options')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
    } catch (err: any) {
      alert('Erreur lors de l\'upload : ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: optionData, error: optionError } = await supabase
        .from('race_options')
        .insert([{
          race_id: raceId,
          type: formData.type,
          label: formData.label,
          description: formData.description || null,
          image_url: formData.image_url || null,
          is_question: formData.is_question,
          is_required: formData.is_required,
          has_quantity_limit: formData.has_quantity_limit,
          max_quantity: formData.has_quantity_limit ? parseInt(formData.max_quantity) : null,
          current_quantity: 0,
          price_cents: parseInt(formData.price_cents),
          available_from: formData.available_from ? new Date(formData.available_from).toISOString() : null,
          available_until: formData.available_until ? new Date(formData.available_until).toISOString() : null,
          display_order: options.length,
          active: true,
        }])
        .select()
        .single();

      if (optionError) throw optionError;

      if (formData.is_question && choices.length > 0) {
        const choicesData = choices.map((choice, index) => ({
          option_id: optionData.id,
          label: choice.label,
          description: choice.description || null,
          price_modifier_cents: parseInt(choice.price_modifier_cents),
          has_quantity_limit: choice.has_quantity_limit,
          max_quantity: choice.has_quantity_limit ? parseInt(choice.max_quantity) : null,
          current_quantity: 0,
          display_order: index,
          active: true,
        }));

        const { error: choicesError } = await supabase
          .from('race_option_choices')
          .insert(choicesData);

        if (choicesError) throw choicesError;
      }

      await loadOptions();
      resetForm();
      setShowCreateModal(false);
      alert('Option créée avec succès !');
    } catch (err: any) {
      alert('Erreur lors de la création : ' + err.message);
    }
  };

  const handleEditOption = (option: RaceOption) => {
    setEditingOption(option);
    setFormData({
      type: option.type,
      label: option.label,
      description: option.description || '',
      is_question: option.is_question,
      is_required: option.is_required,
      has_quantity_limit: option.has_quantity_limit,
      max_quantity: option.max_quantity?.toString() || '',
      price_cents: option.price_cents.toString(),
      available_from: option.available_from ? new Date(option.available_from).toISOString().slice(0, 16) : '',
      available_until: option.available_until ? new Date(option.available_until).toISOString().slice(0, 16) : '',
      image_url: option.image_url || '',
    });

    if (option.choices && option.choices.length > 0) {
      setChoices(option.choices.map(choice => ({
        label: choice.label,
        description: choice.description || '',
        price_modifier_cents: choice.price_modifier_cents.toString(),
        has_quantity_limit: choice.has_quantity_limit,
        max_quantity: choice.max_quantity?.toString() || '',
      })));
    }

    setShowEditModal(true);
  };

  const handleUpdateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOption) return;

    try {
      const { error: optionError } = await supabase
        .from('race_options')
        .update({
          type: formData.type,
          label: formData.label,
          description: formData.description || null,
          image_url: formData.image_url || null,
          is_question: formData.is_question,
          is_required: formData.is_required,
          has_quantity_limit: formData.has_quantity_limit,
          max_quantity: formData.has_quantity_limit ? parseInt(formData.max_quantity) : null,
          price_cents: parseInt(formData.price_cents),
          available_from: formData.available_from ? new Date(formData.available_from).toISOString() : null,
          available_until: formData.available_until ? new Date(formData.available_until).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingOption.id);

      if (optionError) throw optionError;

      if (formData.is_question) {
        const { error: deleteError } = await supabase
          .from('race_option_choices')
          .delete()
          .eq('option_id', editingOption.id);

        if (deleteError) throw deleteError;

        if (choices.length > 0) {
          const choicesData = choices.map((choice, index) => ({
            option_id: editingOption.id,
            label: choice.label,
            description: choice.description || null,
            price_modifier_cents: parseInt(choice.price_modifier_cents),
            has_quantity_limit: choice.has_quantity_limit,
            max_quantity: choice.has_quantity_limit ? parseInt(choice.max_quantity) : null,
            current_quantity: 0,
            display_order: index,
            active: true,
          }));

          const { error: choicesError } = await supabase
            .from('race_option_choices')
            .insert(choicesData);

          if (choicesError) throw choicesError;
        }
      }

      await loadOptions();
      resetForm();
      setShowEditModal(false);
      setEditingOption(null);
      alert('Option modifiée avec succès !');
    } catch (err: any) {
      alert('Erreur lors de la modification : ' + err.message);
    }
  };

  const handleToggleActive = async (optionId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('race_options')
        .update({ active: !currentActive })
        .eq('id', optionId);

      if (error) throw error;
      await loadOptions();
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette option ? Cette action est irréversible.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('race_options')
        .delete()
        .eq('id', optionId);

      if (error) throw error;
      await loadOptions();
    } catch (err: any) {
      alert('Erreur lors de la suppression : ' + err.message);
    }
  };

  const addChoice = () => {
    setChoices([...choices, {
      label: '',
      description: '',
      price_modifier_cents: '0',
      has_quantity_limit: false,
      max_quantity: '',
    }]);
  };

  const removeChoice = (index: number) => {
    setChoices(choices.filter((_, i) => i !== index));
  };

  const updateChoice = (index: number, field: string, value: any) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setChoices(newChoices);
  };

  const resetForm = () => {
    setFormData({
      type: 'custom',
      label: '',
      description: '',
      is_question: false,
      is_required: false,
      has_quantity_limit: false,
      max_quantity: '',
      price_cents: '0',
      available_from: '',
      available_until: '',
      image_url: '',
    });
    setChoices([]);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-gray-900">Gestion des options</h4>
          <p className="text-sm text-gray-600 mt-1">
            Configurez les options disponibles pour cette épreuve (t-shirts, repas, navettes, etc.)
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4" />
          Ajouter une option
        </button>
      </div>

      {options.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Aucune option configurée</p>
          <p className="text-sm text-gray-500">
            Créez des options pour permettre aux participants de réserver des services
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {options.map((option) => (
            <div key={option.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                {option.image_url && (
                  <img
                    src={option.image_url}
                    alt={option.label}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-gray-900">{option.label}</h5>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {optionTypes.find(t => t.value === option.type)?.label}
                        </span>
                        {option.is_required && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                            Obligatoire
                          </span>
                        )}
                        {!option.active && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded">
                            Désactivé
                          </span>
                        )}
                      </div>

                      {option.description && (
                        <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Prix:</strong> {(option.price_cents / 100).toFixed(2)}€
                        </div>
                        {option.has_quantity_limit && (
                          <div>
                            <strong>Quantité:</strong> {option.current_quantity} / {option.max_quantity}
                          </div>
                        )}
                        {option.is_question && option.choices && (
                          <div className="col-span-2">
                            <strong>Choix disponibles:</strong>
                            <div className="mt-1 space-y-1">
                              {option.choices.map(choice => (
                                <div key={choice.id} className="text-xs text-gray-600 pl-4">
                                  • {choice.label}
                                  {choice.price_modifier_cents !== 0 && (
                                    <span className="ml-2 text-pink-600">
                                      ({choice.price_modifier_cents > 0 ? '+' : ''}
                                      {(choice.price_modifier_cents / 100).toFixed(2)}€)
                                    </span>
                                  )}
                                  {choice.has_quantity_limit && (
                                    <span className="ml-2 text-gray-500">
                                      ({choice.current_quantity}/{choice.max_quantity})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditOption(option)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(option.id, option.active)}
                        className={`p-2 rounded-lg transition-colors ${
                          option.active
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={option.active ? 'Désactiver' : 'Activer'}
                      >
                        {option.active ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteOption(option.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Créer une option</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateOption} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'option *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {optionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix (€) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={(parseInt(formData.price_cents) / 100).toFixed(2)}
                    onChange={(e) => setFormData({ ...formData, price_cents: (parseFloat(e.target.value) * 100).toString() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Libellé *
                </label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ex: T-shirt technique"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={3}
                  placeholder="Description détaillée de l'option"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image
                </label>
                {formData.image_url ? (
                  <div className="relative inline-block">
                    <img src={formData.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploadingImage ? 'Upload en cours...' : 'Cliquez pour uploader une image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_question}
                    onChange={(e) => setFormData({ ...formData, is_question: e.target.checked })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">Question avec choix multiples</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">Obligatoire</span>
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={formData.has_quantity_limit}
                  onChange={(e) => setFormData({ ...formData, has_quantity_limit: e.target.checked })}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 mt-1"
                />
                <div className="flex-1">
                  <label className="text-sm text-gray-700">Limiter la quantité disponible</label>
                  {formData.has_quantity_limit && (
                    <input
                      type="number"
                      required={formData.has_quantity_limit}
                      min="1"
                      value={formData.max_quantity}
                      onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent mt-2"
                      placeholder="Quantité maximale"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponible à partir de
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.available_from}
                    onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponible jusqu'à
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.available_until}
                    onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {formData.is_question && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">Choix de réponses</h3>
                    <button
                      type="button"
                      onClick={addChoice}
                      className="text-sm text-pink-600 hover:text-pink-700"
                    >
                      + Ajouter un choix
                    </button>
                  </div>

                  <div className="space-y-4">
                    {choices.map((choice, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Choix {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeChoice(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              required
                              value={choice.label}
                              onChange={(e) => updateChoice(index, 'label', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              placeholder="Libellé (ex: Taille M)"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              value={(parseInt(choice.price_modifier_cents) / 100).toFixed(2)}
                              onChange={(e) => updateChoice(index, 'price_modifier_cents', (parseFloat(e.target.value) * 100).toString())}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              placeholder="Supplément prix (€)"
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={choice.has_quantity_limit}
                            onChange={(e) => updateChoice(index, 'has_quantity_limit', e.target.checked)}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                          <span className="text-sm text-gray-700">Limiter la quantité</span>
                          {choice.has_quantity_limit && (
                            <input
                              type="number"
                              required={choice.has_quantity_limit}
                              min="1"
                              value={choice.max_quantity}
                              onChange={(e) => updateChoice(index, 'max_quantity', e.target.value)}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              placeholder="Qté max"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {choices.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Aucun choix ajouté. Cliquez sur "Ajouter un choix" pour commencer.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
                >
                  Créer l'option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Modifier l'option</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOption(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateOption} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'option *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {optionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix (€) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={(parseInt(formData.price_cents) / 100).toFixed(2)}
                    onChange={(e) => setFormData({ ...formData, price_cents: (parseFloat(e.target.value) * 100).toString() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Libellé *
                </label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ex: T-shirt technique"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={3}
                  placeholder="Description détaillée de l'option"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image
                </label>
                {formData.image_url ? (
                  <div className="relative inline-block">
                    <img src={formData.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploadingImage ? 'Upload en cours...' : 'Cliquez pour uploader une image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_question}
                    onChange={(e) => setFormData({ ...formData, is_question: e.target.checked })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">Question avec choix multiples</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">Obligatoire</span>
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={formData.has_quantity_limit}
                  onChange={(e) => setFormData({ ...formData, has_quantity_limit: e.target.checked })}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 mt-1"
                />
                <div className="flex-1">
                  <label className="text-sm text-gray-700">Limiter la quantité disponible</label>
                  {formData.has_quantity_limit && (
                    <input
                      type="number"
                      required={formData.has_quantity_limit}
                      min="1"
                      value={formData.max_quantity}
                      onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent mt-2"
                      placeholder="Quantité maximale"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponible à partir de
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.available_from}
                    onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponible jusqu'à
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.available_until}
                    onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {formData.is_question && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">Choix de réponses</h3>
                    <button
                      type="button"
                      onClick={addChoice}
                      className="text-sm text-pink-600 hover:text-pink-700"
                    >
                      + Ajouter un choix
                    </button>
                  </div>

                  <div className="space-y-4">
                    {choices.map((choice, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Choix {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeChoice(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              required
                              value={choice.label}
                              onChange={(e) => updateChoice(index, 'label', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              placeholder="Libellé (ex: Taille M)"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              value={(parseInt(choice.price_modifier_cents) / 100).toFixed(2)}
                              onChange={(e) => updateChoice(index, 'price_modifier_cents', (parseFloat(e.target.value) * 100).toString())}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              placeholder="Supplément prix (€)"
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={choice.has_quantity_limit}
                            onChange={(e) => updateChoice(index, 'has_quantity_limit', e.target.checked)}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                          <span className="text-sm text-gray-700">Limiter la quantité</span>
                          {choice.has_quantity_limit && (
                            <input
                              type="number"
                              required={choice.has_quantity_limit}
                              min="1"
                              value={choice.max_quantity}
                              onChange={(e) => updateChoice(index, 'max_quantity', e.target.value)}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              placeholder="Qté max"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {choices.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Aucun choix ajouté. Cliquez sur "Ajouter un choix" pour commencer.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOption(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
