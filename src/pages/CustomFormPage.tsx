import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

interface CustomForm {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  success_message: string;
  recipient_emails: string[];
  is_active: boolean;
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

export default function CustomFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<CustomForm | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadForm();
    }
  }, [slug]);

  async function loadForm() {
    try {
      setLoading(true);

      const { data: formData, error: formError } = await supabase
        .from('custom_forms')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (formError) throw formError;
      if (!formData) {
        setError('Formulaire introuvable');
        return;
      }

      setForm(formData);

      const { data: fieldsData, error: fieldsError } = await supabase
        .from('custom_form_fields')
        .select('*')
        .eq('form_id', formData.id)
        .order('display_order', { ascending: true });

      if (fieldsError) throw fieldsError;
      setFields(fieldsData || []);

      const initialData: Record<string, any> = {};
      fieldsData?.forEach(field => {
        if (field.field_type === 'checkbox') {
          initialData[field.label] = [];
        } else if (field.field_type === 'date_range') {
          initialData[field.label] = { start: '', end: '' };
        } else {
          initialData[field.label] = '';
        }
      });
      setFormData(initialData);

    } catch (error: any) {
      console.error('Error loading form:', error);
      setError('Erreur lors du chargement du formulaire');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const missingFields = fields
      .filter(field => field.is_required)
      .filter(field => {
        const value = formData[field.label];
        if (Array.isArray(value)) {
          return value.length === 0;
        }
        if (field.field_type === 'date_range') {
          return !value?.start || !value?.end;
        }
        return !value || String(value).trim() === '';
      });

    if (missingFields.length > 0) {
      setError(`Veuillez remplir tous les champs obligatoires: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { error: submitError } = await supabase
        .from('custom_form_submissions')
        .insert({
          form_id: form!.id,
          data: formData,
          ip_address: null,
          user_agent: navigator.userAgent
        });

      if (submitError) throw submitError;

      await supabase.functions.invoke('send-email', {
        body: {
          to: form!.recipient_emails,
          subject: `Nouvelle soumission: ${form!.title}`,
          html: generateEmailHTML(formData)
        }
      });

      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setError('Erreur lors de l\'envoi du formulaire. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  function generateEmailHTML(data: Record<string, any>): string {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ec4899;">Nouvelle soumission de formulaire</h2>
        <p style="color: #666;">Formulaire: <strong>${form!.title}</strong></p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
    `;

    Object.entries(data).forEach(([key, value]) => {
      let displayValue: string;
      if (Array.isArray(value)) {
        displayValue = value.join(', ');
      } else if (typeof value === 'object' && value !== null && value.start && value.end) {
        displayValue = `Du ${value.start} au ${value.end}`;
      } else {
        displayValue = String(value);
      }

      html += `
        <div style="margin-bottom: 15px;">
          <strong style="color: #374151;">${key}:</strong>
          <p style="color: #6b7280; margin: 5px 0 0 0;">${displayValue}</p>
        </div>
      `;
    });

    html += `
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          Soumis le ${new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    `;

    return html;
  }

  function handleFieldChange(fieldLabel: string, value: any, fieldType: string) {
    if (fieldType === 'checkbox') {
      const currentValues = formData[fieldLabel] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v: string) => v !== value)
        : [...currentValues, value];
      setFormData({ ...formData, [fieldLabel]: newValues });
    } else {
      setFormData({ ...formData, [fieldLabel]: value });
    }
  }

  function renderField(field: FormField) {
    const value = formData[field.label] || '';

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <input
            type={field.field_type}
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value, field.field_type)}
            placeholder={field.placeholder || ''}
            required={field.is_required}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value, field.field_type)}
            placeholder={field.placeholder || ''}
            required={field.is_required}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value, field.field_type)}
            required={field.is_required}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">Sélectionnez une option</option>
            {field.options.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options.map((option, index) => (
              <label key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.label}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(field.label, e.target.value, field.field_type)}
                  required={field.is_required}
                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options.map((option, index) => (
              <label key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={option}
                  checked={(value || []).includes(option)}
                  onChange={(e) => handleFieldChange(field.label, option, field.field_type)}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value, field.field_type)}
            required={field.is_required}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        );

      case 'date_range':
        const dateRange = typeof value === 'string' ? { start: '', end: '' } : (value || { start: '', end: '' });
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Du</label>
              <input
                type="date"
                value={dateRange.start || ''}
                onChange={(e) => handleFieldChange(field.label, { ...dateRange, start: e.target.value }, field.field_type)}
                required={field.is_required}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Au</label>
              <input
                type="date"
                value={dateRange.end || ''}
                onChange={(e) => handleFieldChange(field.label, { ...dateRange, end: e.target.value }, field.field_type)}
                required={field.is_required}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Formulaire introuvable</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Formulaire envoyé !</h1>
            <p className="text-gray-600 mb-6">{form?.success_message}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{form?.title}</h1>
            {form?.description && (
              <p className="text-gray-600 mb-8">{form.description}</p>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-red-800">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.is_required && (
                      <span className="text-red-600 ml-1">*</span>
                    )}
                  </label>
                  {renderField(field)}
                </div>
              ))}

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-6 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer le formulaire'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
