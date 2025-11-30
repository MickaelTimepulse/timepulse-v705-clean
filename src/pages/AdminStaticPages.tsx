import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X, AlertCircle, Check, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/Admin/AdminLayout';
import RichTextEditor from '../components/Admin/RichTextEditor';

interface StaticPage {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  show_in_footer: boolean;
  show_in_header: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function AdminStaticPages() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (error: any) {
      console.error('Error loading pages:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des pages' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!editingPage) return;

    try {
      if (isCreating) {
        const { error } = await supabase
          .from('static_pages')
          .insert({
            title: editingPage.title,
            slug: editingPage.slug,
            content: editingPage.content,
            meta_title: editingPage.meta_title,
            meta_description: editingPage.meta_description,
            is_published: editingPage.is_published,
            show_in_footer: editingPage.show_in_footer,
            show_in_header: editingPage.show_in_header,
            display_order: editingPage.display_order
          });

        if (error) throw error;
        setMessage({ type: 'success', text: 'Page créée avec succès !' });
      } else {
        const { error } = await supabase
          .from('static_pages')
          .update({
            title: editingPage.title,
            slug: editingPage.slug,
            content: editingPage.content,
            meta_title: editingPage.meta_title,
            meta_description: editingPage.meta_description,
            is_published: editingPage.is_published,
            show_in_footer: editingPage.show_in_footer,
            show_in_header: editingPage.show_in_header,
            display_order: editingPage.display_order
          })
          .eq('id', editingPage.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Page mise à jour avec succès !' });
      }

      setEditingPage(null);
      setIsCreating(false);
      await loadPages();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving page:', error);
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la page "${title}" ?`)) return;

    try {
      const { error } = await supabase
        .from('static_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Page supprimée avec succès !' });
      await loadPages();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting page:', error);
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function togglePublish(page: StaticPage) {
    try {
      const { error } = await supabase
        .from('static_pages')
        .update({ is_published: !page.is_published })
        .eq('id', page.id);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: page.is_published ? 'Page dépubliée' : 'Page publiée'
      });
      await loadPages();
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      console.error('Error toggling publish:', error);
      setMessage({ type: 'error', text: error.message });
    }
  }

  function startCreate() {
    setEditingPage({
      id: '',
      title: '',
      slug: '',
      content: '',
      meta_title: '',
      meta_description: '',
      is_published: false,
      show_in_footer: true,
      show_in_header: false,
      display_order: pages.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setIsCreating(true);
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

  if (editingPage) {
    return (
      <AdminLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {isCreating ? 'Créer une page' : 'Modifier la page'}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingPage(null);
                  setIsCreating(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            </div>
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

          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de la page
                </label>
                <input
                  type="text"
                  value={editingPage.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setEditingPage({
                      ...editingPage,
                      title: newTitle,
                      slug: isCreating ? generateSlug(newTitle) : editingPage.slug
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Ex: Qui sommes-nous ?"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL (slug)
                </label>
                <input
                  type="text"
                  value={editingPage.slug}
                  onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                  placeholder="qui-sommes-nous"
                />
                <p className="text-xs text-gray-500 mt-1">
                  La page sera accessible sur : /page/{editingPage.slug}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre SEO
                </label>
                <input
                  type="text"
                  value={editingPage.meta_title || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, meta_title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Titre pour les moteurs de recherche"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={editingPage.display_order}
                  onChange={(e) => setEditingPage({ ...editingPage, display_order: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description SEO
                </label>
                <textarea
                  value={editingPage.meta_description || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, meta_description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Description pour les moteurs de recherche (160 caractères max)"
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPage.is_published}
                    onChange={(e) => setEditingPage({ ...editingPage, is_published: e.target.checked })}
                    className="w-4 h-4 text-pink-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Page publiée</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPage.show_in_footer}
                    onChange={(e) => setEditingPage({ ...editingPage, show_in_footer: e.target.checked })}
                    className="w-4 h-4 text-pink-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Afficher dans le footer</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPage.show_in_header}
                    onChange={(e) => setEditingPage({ ...editingPage, show_in_header: e.target.checked })}
                    className="w-4 h-4 text-pink-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Afficher dans le header</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Contenu de la page
            </label>
            <RichTextEditor
              value={editingPage.content || ''}
              onChange={(content) => setEditingPage({ ...editingPage, content })}
            />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pages statiques</h1>
            <p className="text-gray-600">
              Gérez les pages de contenu du site (À propos, Contact, Mentions légales, etc.)
            </p>
          </div>
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            <Plus className="w-4 h-4" />
            Créer une page
          </button>
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

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affichage
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{page.title}</p>
                        <p className="text-sm text-gray-500">
                          Modifiée le {new Date(page.updated_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      /page/{page.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    {page.is_published ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Eye className="w-3 h-3" />
                        Publiée
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <EyeOff className="w-3 h-3" />
                        Brouillon
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-gray-600">
                      {page.show_in_footer && <span>Footer</span>}
                      {page.show_in_header && <span>Header</span>}
                      {!page.show_in_footer && !page.show_in_header && <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => togglePublish(page)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title={page.is_published ? 'Dépublier' : 'Publier'}
                      >
                        {page.is_published ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingPage(page)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(page.id, page.title)}
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

          {pages.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">Aucune page</p>
              <p className="text-gray-500 text-sm">Commencez par créer votre première page</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
