import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Play, Calendar, Eye, ExternalLink, Download, Youtube, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/Admin/AdminLayout';
import { importChannelVideos, getYouTubeApiKey } from '../lib/youtube-service';

interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  youtube_id: string;
  event_id: string | null;
  race_id: string | null;
  published_date: string;
  is_featured: boolean;
  view_count: number;
  event?: {
    name: string;
  };
  race?: {
    name: string;
  };
}

interface Event {
  id: string;
  name: string;
}

interface Race {
  id: string;
  name: string;
  event_id: string;
}

export default function AdminVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importChannelUrl, setImportChannelUrl] = useState('https://www.youtube.com/@Timepulsesports');
  const [importMaxResults, setImportMaxResults] = useState(50);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    event_id: '',
    race_id: '',
    published_date: new Date().toISOString().split('T')[0],
    is_featured: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [videosData, eventsData, racesData] = await Promise.all([
        supabase.from('videos').select('*, event:events(name), race:races(name)').order('published_date', { ascending: false }),
        supabase.from('events').select('id, name').order('name'),
        supabase.from('races').select('id, name, event_id').order('name'),
      ]);

      if (videosData.data) setVideos(videosData.data);
      if (eventsData.data) setEvents(eventsData.data);
      if (racesData.data) setRaces(racesData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const youtubeId = extractYouTubeId(formData.youtube_url);
    if (!youtubeId) {
      alert('URL YouTube invalide');
      return;
    }

    const videoData = {
      ...formData,
      youtube_id: youtubeId,
      event_id: formData.event_id || null,
      race_id: formData.race_id || null,
    };

    try {
      if (editingVideo) {
        const { error } = await supabase
          .from('videos')
          .update(videoData)
          .eq('id', editingVideo.id);

        if (error) throw error;
        alert('Vidéo mise à jour avec succès');
      } else {
        const { error } = await supabase.from('videos').insert([videoData]);

        if (error) throw error;
        alert('Vidéo ajoutée avec succès');
      }

      setShowForm(false);
      setEditingVideo(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving video:', error);
      alert('Erreur: ' + error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return;

    try {
      const { error } = await supabase.from('videos').delete().eq('id', id);

      if (error) throw error;
      alert('Vidéo supprimée avec succès');
      loadData();
    } catch (error: any) {
      console.error('Error deleting video:', error);
      alert('Erreur: ' + error.message);
    }
  }

  function handleEdit(video: Video) {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      youtube_url: video.youtube_url,
      event_id: video.event_id || '',
      race_id: video.race_id || '',
      published_date: video.published_date,
      is_featured: video.is_featured,
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      youtube_url: '',
      event_id: '',
      race_id: '',
      published_date: new Date().toISOString().split('T')[0],
      is_featured: false,
    });
  }

  function handleCancel() {
    setShowForm(false);
    setEditingVideo(null);
    resetForm();
  }

  async function handleImportVideos() {
    try {
      setImporting(true);
      setImportProgress({ current: 0, total: 0 });

      const apiKey = await getYouTubeApiKey();
      if (!apiKey) {
        alert('Clé API YouTube non configurée. Veuillez la configurer dans les paramètres.');
        setShowImportDialog(false);
        setImporting(false);
        return;
      }

      const result = await importChannelVideos(
        importChannelUrl,
        apiKey,
        importMaxResults,
        (current, total) => setImportProgress({ current, total })
      );

      alert(
        `Import terminé !\n\n` +
        `✅ ${result.success} vidéos importées\n` +
        `⏭️ ${result.skipped} vidéos déjà existantes\n` +
        `❌ ${result.errors} erreurs`
      );

      setShowImportDialog(false);
      loadData();
    } catch (error: any) {
      console.error('Error importing videos:', error);
      alert('Erreur lors de l\'import: ' + error.message);
    } finally {
      setImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  }

  const filteredRaces = formData.event_id
    ? races.filter((race) => race.event_id === formData.event_id)
    : races;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Vidéos</h1>
            <p className="text-gray-600 mt-2 font-light">
              Gérez les vidéos YouTube des arrivées d'événements
            </p>
          </div>
          {!showForm && !showImportDialog && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Youtube className="w-5 h-5" />
                Importer depuis YouTube
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                <Plus className="w-5 h-5" />
                Ajouter une vidéo
              </button>
            </div>
          )}
        </div>

        {showImportDialog && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Importer des vidéos depuis YouTube
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la chaîne YouTube
                </label>
                <input
                  type="text"
                  value={importChannelUrl}
                  onChange={(e) => setImportChannelUrl(e.target.value)}
                  placeholder="https://www.youtube.com/@Timepulsesports"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-light"
                  disabled={importing}
                />
                <p className="text-xs text-gray-500 mt-1 font-light">
                  Formats acceptés: @handle, /channel/ID, /c/name, /user/name
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre maximum de vidéos à importer
                </label>
                <input
                  type="number"
                  value={importMaxResults}
                  onChange={(e) => setImportMaxResults(parseInt(e.target.value) || 50)}
                  min="1"
                  max="200"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-light"
                  disabled={importing}
                />
              </div>

              {importing && importProgress.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progression de l'import</span>
                    <span>{importProgress.current} / {importProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-pink-600 h-2 rounded-full transition-all"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Youtube className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 font-light">
                    <p className="font-medium mb-1">Configuration requise</p>
                    <p>
                      Une clé API YouTube est nécessaire. Configurez-la dans{' '}
                      <a href="/admin/settings" className="underline hover:text-blue-900">
                        Paramètres &gt; API YouTube
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleImportVideos}
                  disabled={importing || !importChannelUrl}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Lancer l'import
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportDialog(false)}
                  disabled={importing}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingVideo ? 'Modifier la vidéo' : 'Nouvelle vidéo'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-light"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-light"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL YouTube *
                </label>
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-light"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Événement (optionnel)
                  </label>
                  <select
                    value={formData.event_id}
                    onChange={(e) =>
                      setFormData({ ...formData, event_id: e.target.value, race_id: '' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-light"
                  >
                    <option value="">-- Aucun --</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course (optionnel)
                  </label>
                  <select
                    value={formData.race_id}
                    onChange={(e) => setFormData({ ...formData, race_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-light"
                    disabled={!formData.event_id}
                  >
                    <option value="">-- Aucune --</option>
                    {filteredRaces.map((race) => (
                      <option key={race.id} value={race.id}>
                        {race.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de publication
                </label>
                <input
                  type="date"
                  value={formData.published_date}
                  onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-light"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700 font-light">
                  Mettre en avant sur la page d'accueil
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  {editingVideo ? 'Mettre à jour' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aucune vidéo</h3>
            <p className="text-gray-600 font-light">Ajoutez votre première vidéo YouTube</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative aspect-video">
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {video.is_featured && (
                    <span className="absolute top-2 right-2 bg-pink-600 text-white text-xs px-2 py-1 rounded">
                      En avant
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-gray-600 font-light mb-3 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    {video.event && (
                      <span className="font-light truncate">{video.event.name}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(video.published_date).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {video.view_count}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={video.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      YouTube
                    </a>
                    <button
                      onClick={() => handleEdit(video)}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
