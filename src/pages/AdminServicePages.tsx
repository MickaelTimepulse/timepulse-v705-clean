import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, FileEdit, Image, Link2, ExternalLink, Home } from 'lucide-react';
import AdminLayout from '../components/Admin/AdminLayout';
import { supabase } from '../lib/supabase';
import * as Icons from 'lucide-react';

interface ServicePage {
  id: string;
  slug: string;
  title: string;
  icon: string;
  short_description: string;
  is_published: boolean;
  show_on_homepage: boolean;
  order_index: number;
  updated_at: string;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  city: string;
  start_date: string;
  image_url: string | null;
  event_type: string;
  description: string | null;
}

interface SliderEvent {
  id: string;
  event_id: string;
  order_index: number;
  is_active: boolean;
  custom_title: string | null;
  custom_description: string | null;
  custom_image_url: string | null;
  events: Event;
}

export default function AdminServicePages() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pages' | 'slider'>('pages');
  const [pages, setPages] = useState<ServicePage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    const { data, error } = await supabase
      .from('service_pages')
      .select('*')
      .order('order_index', { ascending: true });

    if (data) {
      setPages(data);
    }
    setLoading(false);
  }

  async function togglePublish(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('service_pages')
      .update({ is_published: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchPages();
    }
  }

  async function deletePage(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette page ?')) {
      return;
    }

    const { error } = await supabase
      .from('service_pages')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchPages();
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Pages</h1>
            <p className="text-gray-600 mt-1">Pages de services et slider de la page d'accueil</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('pages')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'pages'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pages de Services
              </button>
              <button
                onClick={() => setActiveTab('slider')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'slider'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Slider Événements
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'pages' ? (
              <ServicePagesTab
                pages={pages}
                onTogglePublish={togglePublish}
                onDelete={deletePage}
                onRefresh={fetchPages}
                navigate={navigate}
              />
            ) : (
              <SliderTab />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

interface ServicePagesTabProps {
  pages: ServicePage[];
  onTogglePublish: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  navigate: (path: string) => void;
}

function ServicePagesTab({ pages, onTogglePublish, onDelete, navigate }: ServicePagesTabProps) {
  const publishedPages = pages.filter(p => p.is_published);
  const homepagePages = pages.filter(p => p.is_published && p.show_on_homepage);

  async function toggleHomepage(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('service_pages')
      .update({ show_on_homepage: !currentStatus })
      .eq('id', id);

    if (!error) {
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">Gérez les pages accessibles depuis les blocs de la page d'accueil</p>
          <p className="text-xs text-blue-600 mt-1">
            {homepagePages.length} bloc{homepagePages.length > 1 ? 's' : ''} affiché{homepagePages.length > 1 ? 's' : ''} sur la page d'accueil
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/services/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle page
        </button>
      </div>

      {pages.length > 0 ? (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Bloc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modifié
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => {
                const blockNumber = page.is_published && page.show_on_homepage
                  ? homepagePages.findIndex(p => p.id === page.id) + 1
                  : null;

                return (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        {blockNumber ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 text-white font-bold rounded-lg text-sm">
                              {blockNumber}
                            </span>
                            <span className="text-xs text-gray-500">(ordre: {page.order_index})</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Non affiché</span>
                        )}
                      </div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{page.title}</div>
                    <div className="text-sm text-gray-500">{page.short_description.substring(0, 60)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-blue-600">/services/{page.slug}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {page.is_published ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Eye className="w-3 h-3" />
                        Publié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <EyeOff className="w-3 h-3" />
                        Brouillon
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(page.updated_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/services/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900"
                        title="Voir la page"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => onTogglePublish(page.id, page.is_published)}
                        className={`${
                          page.is_published ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                        }`}
                        title={page.is_published ? 'Dépublier' : 'Publier'}
                      >
                        {page.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {page.is_published && (
                        <button
                          onClick={() => toggleHomepage(page.id, page.show_on_homepage)}
                          className={`${
                            page.show_on_homepage ? 'text-pink-600 hover:text-pink-900' : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title={page.show_on_homepage ? 'Masquer sur l\'accueil' : 'Afficher sur l\'accueil'}
                        >
                          <Home className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/admin/services/${page.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Éditer la page complète"
                      >
                        <FileEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(page.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <p className="text-gray-500">Aucune page de service pour le moment</p>
          <button
            onClick={() => navigate('/admin/services/new')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Créer la première page
          </button>
        </div>
      )}

      {publishedPages.length > 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-600" />
            Blocs affichés sur la page d'accueil
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {publishedPages.map((page, index) => {
              const IconComponent = (Icons as any)[page.icon] || Icons.Circle;
              return (
                <div
                  key={page.id}
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer group"
                  onClick={() => navigate(`/admin/services/${page.id}`)}
                >
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="font-bold text-2xl text-blue-600 mb-1">#{index + 1}</div>
                    <div className="text-xs font-medium text-gray-700 line-clamp-2">{page.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Cliquez sur une carte pour modifier la page correspondante</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <GripVertical className="w-4 h-4" />
          Comment ça marche ?
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Chaque page publiée devient automatiquement un bloc numéroté sur la page d'accueil</li>
          <li>• Le numéro du bloc correspond à l'ordre d'affichage (Bloc #1, Bloc #2, etc.)</li>
          <li>• Modifiez le champ "order_index" pour réorganiser les blocs</li>
          <li>• Seules les pages avec le statut "Publié" apparaissent sur la page d'accueil</li>
          <li>• Les visiteurs cliquent sur un bloc pour accéder à la page de service complète</li>
        </ul>
      </div>
    </div>
  );
}

function SliderTab() {
  const [sliderEvents, setSliderEvents] = useState<SliderEvent[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchSliderEvents();
    fetchAllEvents();
  }, []);

  async function fetchSliderEvents() {
    const { data, error } = await supabase
      .from('homepage_slider_events')
      .select(`
        *,
        events (
          id,
          name,
          slug,
          city,
          start_date,
          image_url,
          event_type,
          description
        )
      `)
      .order('order_index', { ascending: true });

    if (data) {
      setSliderEvents(data);
    }
    setLoading(false);
  }

  async function fetchAllEvents() {
    const { data } = await supabase
      .from('events')
      .select('id, name, slug, city, start_date, image_url, event_type, description')
      .eq('status', 'published')
      .order('start_date', { ascending: true });

    if (data) {
      setAllEvents(data);
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('homepage_slider_events')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchSliderEvents();
    }
  }

  async function removeFromSlider(id: string) {
    if (!confirm('Retirer cet événement du slider ?')) return;

    const { error } = await supabase
      .from('homepage_slider_events')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchSliderEvents();
    }
  }

  async function addToSlider(eventId: string) {
    const maxOrder = sliderEvents.reduce((max, item) => Math.max(max, item.order_index), 0);

    const { error } = await supabase
      .from('homepage_slider_events')
      .insert([{
        event_id: eventId,
        order_index: maxOrder + 1,
        is_active: true
      }]);

    if (!error) {
      fetchSliderEvents();
      setShowAddModal(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const availableEvents = allEvents.filter(
    event => !sliderEvents.some(slider => slider.event_id === event.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Événements du slider</h3>
          <p className="text-sm text-gray-600 mt-1">
            Gérez les événements affichés dans le slider 3D de la page d'accueil
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter un événement
        </button>
      </div>

      {sliderEvents.length > 0 ? (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Événement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sliderEvents.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <span className="text-sm text-gray-900">{item.order_index}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.events.image_url && (
                        <img
                          src={item.events.image_url}
                          alt={item.events.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.custom_title || item.events.name}
                        </div>
                        <div className="text-sm text-gray-500">{item.events.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.events.start_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Eye className="w-3 h-3" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <EyeOff className="w-3 h-3" />
                        Masqué
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleActive(item.id, item.is_active)}
                        className={`${
                          item.is_active
                            ? 'text-orange-600 hover:text-orange-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={item.is_active ? 'Masquer' : 'Activer'}
                      >
                        {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => removeFromSlider(item.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Retirer du slider"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <p className="text-gray-500">Aucun événement dans le slider</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Ajouter le premier événement
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 À propos du slider</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Le slider affiche 3-4 événements en rotation automatique sur la page d'accueil</li>
          <li>• Seuls les événements actifs sont visibles par les visiteurs</li>
          <li>• L'ordre détermine la séquence d'affichage dans le slider</li>
          <li>• Le slider défile automatiquement toutes les 4 secondes</li>
        </ul>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Ajouter un événement au slider</h2>
            </div>

            <div className="p-6">
              {availableEvents.length > 0 ? (
                <div className="space-y-3">
                  {availableEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => addToSlider(event.id)}
                    >
                      {event.image_url && (
                        <img
                          src={event.image_url}
                          alt={event.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{event.name}</div>
                        <div className="text-sm text-gray-500">
                          {event.city} • {new Date(event.start_date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-blue-600" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Tous les événements publiés sont déjà dans le slider
                </p>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

