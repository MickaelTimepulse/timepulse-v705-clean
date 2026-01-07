import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X, AlertCircle, Check, FileText, Mail, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/Admin/AdminLayout';

interface CustomForm {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  success_message: string;
  recipient_emails: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormField {
  id: string;
  form_id: string;
  label: string;
  field_type: string;
  options: string[];
  is_required: boolean;
  display_order: number;
  placeholder: string | null;
}

interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, any>;
  submitted_at: string;
  is_processed: boolean;
  processed_at: string | null;
  notes: string | null;
}

export default function AdminCustomForms() {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [isCreatingField, setIsCreatingField] = useState(false);
  const [view, setView] = useState<'forms' | 'fields' | 'submissions'>('forms');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (selectedForm) {
      loadFields(selectedForm.id);
      loadSubmissions(selectedForm.id);
    }
  }, [selectedForm]);

  async function loadForms() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error: any) {
      console.error('Error loading forms:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des formulaires' });
    } finally {
      setLoading(false);
    }
  }

  async function loadFields(formId: string) {
    try {
      const { data, error } = await supabase
        .from('custom_form_fields')
        .select('*')
        .eq('form_id', formId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error: any) {
      console.error('Error loading fields:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des champs' });
    }
  }

  async function loadSubmissions(formId: string) {
    try {
      const { data, error } = await supabase
        .from('custom_form_submissions')
        .select('*')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error('Error loading submissions:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des soumissions' });
    }
  }

  async function handleSaveForm() {
    if (!editingForm) return;

    try {
      if (isCreatingForm) {
        // Exclure le champ id vide lors de la création
        const { id, ...formData } = editingForm;
        const { error } = await supabase
          .from('custom_forms')
          .insert(formData);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Formulaire créé avec succès !' });
      } else {
        const { error } = await supabase
          .from('custom_forms')
          .update(editingForm)
          .eq('id', editingForm.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Formulaire mis à jour avec succès !' });
      }

      setEditingForm(null);
      setIsCreatingForm(false);
      await loadForms();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving form:', error);
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function handleSaveField() {
    if (!editingField || !selectedForm) return;

    try {
      if (isCreatingField) {
        // Exclure le champ id vide lors de la création
        const { id, ...fieldData } = editingField;
        const { error } = await supabase
          .from('custom_form_fields')
          .insert(fieldData);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Champ créé avec succès !' });
      } else {
        const { error } = await supabase
          .from('custom_form_fields')
          .update(editingField)
          .eq('id', editingField.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Champ mis à jour avec succès !' });
      }

      setEditingField(null);
      setIsCreatingField(false);
      await loadFields(selectedForm.id);
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving field:', error);
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function handleDeleteForm(id: string, title: string) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le formulaire "${title}" ?`)) return;

    try {
      const { error } = await supabase
        .from('custom_forms')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Formulaire supprimé avec succès !' });
      if (selectedForm?.id === id) {
        setSelectedForm(null);
      }
      await loadForms();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting form:', error);
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function handleDeleteField(id: string, label: string) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le champ "${label}" ?`)) return;

    try {
      const { error } = await supabase
        .from('custom_form_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Champ supprimé avec succès !' });
      if (selectedForm) {
        await loadFields(selectedForm.id);
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting field:', error);
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function toggleActive(form: CustomForm) {
    try {
      const { error } = await supabase
        .from('custom_forms')
        .update({ is_active: !form.is_active })
        .eq('id', form.id);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: form.is_active ? 'Formulaire désactivé' : 'Formulaire activé'
      });
      await loadForms();
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      console.error('Error toggling active:', error);
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function moveField(fieldId: string, direction: 'up' | 'down') {
    const fieldIndex = fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;

    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    try {
      const field = fields[fieldIndex];
      const targetField = fields[targetIndex];

      await supabase
        .from('custom_form_fields')
        .update({ display_order: targetField.display_order })
        .eq('id', field.id);

      await supabase
        .from('custom_form_fields')
        .update({ display_order: field.display_order })
        .eq('id', targetField.id);

      if (selectedForm) {
        await loadFields(selectedForm.id);
      }
    } catch (error: any) {
      console.error('Error moving field:', error);
      setMessage({ type: 'error', text: error.message });
    }
  }

  function startCreateForm() {
    setEditingForm({
      id: '',
      title: '',
      slug: '',
      description: '',
      success_message: 'Merci pour votre demande. Nous vous contacterons dans les plus brefs délais.',
      recipient_emails: ['mickael@timepulse.fr', 'leonard@timepulse.fr'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setIsCreatingForm(true);
  }

  function startCreateField() {
    if (!selectedForm) return;

    setEditingField({
      id: '',
      form_id: selectedForm.id,
      label: '',
      field_type: 'text',
      options: [],
      is_required: false,
      display_order: fields.length + 1,
      placeholder: null
    });
    setIsCreatingField(true);
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Formulaires personnalisables</h1>
            <p className="text-gray-600">
              Créez et gérez vos formulaires de demande de devis et autres
            </p>
          </div>
          {!selectedForm && (
            <button
              onClick={startCreateForm}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              <Plus className="w-4 h-4" />
              Créer un formulaire
            </button>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {editingForm && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {isCreatingForm ? 'Créer un formulaire' : 'Modifier le formulaire'}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingForm(null);
                    setIsCreatingForm(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  onClick={handleSaveForm}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du formulaire
                </label>
                <input
                  type="text"
                  value={editingForm.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setEditingForm({
                      ...editingForm,
                      title: newTitle,
                      slug: isCreatingForm ? generateSlug(newTitle) : editingForm.slug
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Ex: Demande de devis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL (slug)
                </label>
                <input
                  type="text"
                  value={editingForm.slug}
                  onChange={(e) => setEditingForm({ ...editingForm, slug: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                  placeholder="demande-de-devis"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le formulaire sera accessible sur : /form/{editingForm.slug}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingForm.description || ''}
                  onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Description du formulaire"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message de succès
                </label>
                <textarea
                  value={editingForm.success_message}
                  onChange={(e) => setEditingForm({ ...editingForm, success_message: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Message affiché après soumission"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emails destinataires (un par ligne)
                </label>
                <textarea
                  value={editingForm.recipient_emails.join('\n')}
                  onChange={(e) => setEditingForm({
                    ...editingForm,
                    recipient_emails: e.target.value.split('\n').filter(email => email.trim())
                  })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                  placeholder="mickael@timepulse.fr&#10;leonard@timepulse.fr"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingForm.is_active}
                    onChange={(e) => setEditingForm({ ...editingForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-pink-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Formulaire actif</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {!selectedForm && !editingForm && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formulaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destinataires
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
                {forms.map((form) => (
                  <tr key={form.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedForm(form)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{form.title}</p>
                          <p className="text-sm text-gray-500">{form.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        /form/{form.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {form.recipient_emails.length}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {form.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Eye className="w-3 h-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <EyeOff className="w-3 h-3" />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActive(form);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          title={form.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {form.is_active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingForm(form);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteForm(form.id, form.title);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {forms.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium mb-2">Aucun formulaire</p>
                <p className="text-gray-500 text-sm">Commencez par créer votre premier formulaire</p>
              </div>
            )}
          </div>
        )}

        {selectedForm && !editingForm && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedForm.title}</h2>
                  <p className="text-gray-600">{selectedForm.description}</p>
                </div>
                <button
                  onClick={() => setSelectedForm(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Retour à la liste
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setView('fields')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    view === 'fields'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Champs ({fields.length})
                </button>
                <button
                  onClick={() => setView('submissions')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    view === 'submissions'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Soumissions ({submissions.length})
                </button>
              </div>

              {view === 'fields' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Champs du formulaire</h3>
                    <button
                      onClick={startCreateField}
                      className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un champ
                    </button>
                  </div>

                  {editingField && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">
                          {isCreatingField ? 'Nouveau champ' : 'Modifier le champ'}
                        </h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingField(null);
                              setIsCreatingField(false);
                            }}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleSaveField}
                            className="px-3 py-1 bg-pink-600 text-white rounded hover:bg-pink-700"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Label du champ
                          </label>
                          <input
                            type="text"
                            value={editingField.label}
                            onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Ex: Nom complet"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type de champ
                          </label>
                          <select
                            value={editingField.field_type}
                            onChange={(e) => setEditingField({ ...editingField, field_type: e.target.value })}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          >
                            <option value="text">Texte</option>
                            <option value="email">Email</option>
                            <option value="tel">Téléphone</option>
                            <option value="number">Nombre</option>
                            <option value="date">Date</option>
                            <option value="date_range">Période (du... au...)</option>
                            <option value="textarea">Texte long</option>
                            <option value="select">Liste déroulante</option>
                            <option value="radio">Boutons radio</option>
                            <option value="checkbox">Cases à cocher</option>
                          </select>
                        </div>

                        {['select', 'radio', 'checkbox'].includes(editingField.field_type) && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Options
                            </label>
                            <div className="space-y-2">
                              {editingField.options.map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...editingField.options];
                                      newOptions[index] = e.target.value;
                                      setEditingField({ ...editingField, options: newOptions });
                                    }}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                                    placeholder={`Option ${index + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (index > 0) {
                                        const newOptions = [...editingField.options];
                                        [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
                                        setEditingField({ ...editingField, options: newOptions });
                                      }
                                    }}
                                    disabled={index === 0}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Monter"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (index < editingField.options.length - 1) {
                                        const newOptions = [...editingField.options];
                                        [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
                                        setEditingField({ ...editingField, options: newOptions });
                                      }
                                    }}
                                    disabled={index === editingField.options.length - 1}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Descendre"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = editingField.options.filter((_, i) => i !== index);
                                      setEditingField({ ...editingField, options: newOptions });
                                    }}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingField({
                                    ...editingField,
                                    options: [...editingField.options, '']
                                  });
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                              >
                                <Plus className="w-4 h-4" />
                                Ajouter une option
                              </button>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Texte d'aide (placeholder)
                          </label>
                          <input
                            type="text"
                            value={editingField.placeholder || ''}
                            onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Ex: Entrez votre nom"
                          />
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editingField.is_required}
                              onChange={(e) => setEditingField({ ...editingField, is_required: e.target.checked })}
                              className="w-4 h-4 text-pink-600 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">Champ obligatoire</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{field.label}</span>
                            {field.is_required && (
                              <span className="text-red-600 text-sm">*</span>
                            )}
                            <span className="text-sm text-gray-500">
                              ({field.field_type})
                            </span>
                          </div>
                          {field.placeholder && (
                            <p className="text-sm text-gray-500 mt-1">{field.placeholder}</p>
                          )}
                          {field.options.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              Options: {field.options.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => moveField(field.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveField(field.id, 'down')}
                            disabled={index === fields.length - 1}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingField(field)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteField(field.id, field.label)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {fields.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Aucun champ. Commencez par ajouter votre premier champ.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'submissions' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Soumissions reçues</h3>

                  <div className="space-y-3">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-sm text-gray-500">
                            {new Date(submission.submitted_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            submission.is_processed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {submission.is_processed ? 'Traité' : 'En attente'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(submission.data).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-sm font-medium text-gray-700">{key}:</span>
                              <span className="text-sm text-gray-900 ml-2">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {submission.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="text-sm font-medium text-gray-700">Notes:</span>
                            <p className="text-sm text-gray-600 mt-1">{submission.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {submissions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Aucune soumission reçue pour le moment.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
