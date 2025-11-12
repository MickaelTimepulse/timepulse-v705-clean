import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, AlertCircle, Check, Link as LinkIcon, Facebook, Twitter, Instagram, Linkedin, Youtube, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/Admin/AdminLayout';

interface FooterLink {
  label: string;
  url: string;
}

interface FooterSection {
  section: string;
  items: FooterLink[];
}

interface FooterSettings {
  id: string;
  company_name: string;
  company_description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  copyright_text: string;
  links: FooterSection[];
}

export default function AdminFooterSettings() {
  const [settings, setSettings] = useState<FooterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('footer_settings')
        .select('*')
        .single();

      if (error) throw error;

      setSettings(data);
    } catch (error: any) {
      console.error('Error loading footer settings:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des paramètres' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

    try {
      setSaving(true);
      setMessage(null);

      const { error } = await supabase
        .from('footer_settings')
        .update({
          company_name: settings.company_name,
          company_description: settings.company_description,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          facebook_url: settings.facebook_url,
          twitter_url: settings.twitter_url,
          instagram_url: settings.instagram_url,
          linkedin_url: settings.linkedin_url,
          youtube_url: settings.youtube_url,
          copyright_text: settings.copyright_text,
          links: settings.links
        })
        .eq('id', settings.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Footer mis à jour avec succès !' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving footer settings:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  }

  function addSection() {
    if (!settings) return;

    const newSection: FooterSection = {
      section: 'Nouvelle Section',
      items: []
    };

    setSettings({
      ...settings,
      links: [...settings.links, newSection]
    });
  }

  function removeSection(index: number) {
    if (!settings) return;

    const newLinks = settings.links.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      links: newLinks
    });
  }

  function updateSection(index: number, sectionName: string) {
    if (!settings) return;

    const newLinks = [...settings.links];
    newLinks[index].section = sectionName;
    setSettings({
      ...settings,
      links: newLinks
    });
  }

  function addLink(sectionIndex: number) {
    if (!settings) return;

    const newLinks = [...settings.links];
    newLinks[sectionIndex].items.push({ label: '', url: '' });
    setSettings({
      ...settings,
      links: newLinks
    });
  }

  function removeLink(sectionIndex: number, linkIndex: number) {
    if (!settings) return;

    const newLinks = [...settings.links];
    newLinks[sectionIndex].items = newLinks[sectionIndex].items.filter((_, i) => i !== linkIndex);
    setSettings({
      ...settings,
      links: newLinks
    });
  }

  function updateLink(sectionIndex: number, linkIndex: number, field: 'label' | 'url', value: string) {
    if (!settings) return;

    const newLinks = [...settings.links];
    newLinks[sectionIndex].items[linkIndex][field] = value;
    setSettings({
      ...settings,
      links: newLinks
    });
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

  if (!settings) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Impossible de charger les paramètres du footer</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration du Footer</h1>
            <p className="text-gray-600">
              Gérez les informations affichées dans le pied de page du site
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>

        {/* Message */}
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

        {/* Informations de l'entreprise */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informations de l'entreprise
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'entreprise
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Téléphone
              </label>
              <input
                type="tel"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Adresse
              </label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={settings.company_description || ''}
              onChange={(e) => setSettings({ ...settings, company_description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Courte description de votre entreprise..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texte du copyright
            </label>
            <input
              type="text"
              value={settings.copyright_text}
              onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="© 2025 Votre Entreprise"
            />
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Réseaux sociaux</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Facebook className="w-4 h-4 inline mr-1" />
                Facebook
              </label>
              <input
                type="url"
                value={settings.facebook_url || ''}
                onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Twitter className="w-4 h-4 inline mr-1" />
                Twitter / X
              </label>
              <input
                type="url"
                value={settings.twitter_url || ''}
                onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="https://twitter.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Instagram className="w-4 h-4 inline mr-1" />
                Instagram
              </label>
              <input
                type="url"
                value={settings.instagram_url || ''}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Linkedin className="w-4 h-4 inline mr-1" />
                LinkedIn
              </label>
              <input
                type="url"
                value={settings.linkedin_url || ''}
                onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="https://linkedin.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Youtube className="w-4 h-4 inline mr-1" />
                YouTube
              </label>
              <input
                type="url"
                value={settings.youtube_url || ''}
                onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </div>

        {/* Liens du footer */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Sections de liens
            </h2>
            <button
              onClick={addSection}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Ajouter une section
            </button>
          </div>

          <div className="space-y-6">
            {settings.links.map((section, sectionIndex) => (
              <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={section.section}
                    onChange={(e) => updateSection(sectionIndex, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 font-semibold"
                    placeholder="Nom de la section"
                  />
                  <button
                    onClick={() => addLink(sectionIndex)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeSection(sectionIndex)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 pl-4">
                  {section.items.map((link, linkIndex) => (
                    <div key={linkIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(sectionIndex, linkIndex, 'label', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="Libellé du lien"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateLink(sectionIndex, linkIndex, 'url', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="URL (ex: /about)"
                      />
                      <button
                        onClick={() => removeLink(sectionIndex, linkIndex)}
                        className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {section.items.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Aucun lien dans cette section</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton de sauvegarde en bas */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
