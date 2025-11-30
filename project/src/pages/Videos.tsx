import { useState, useEffect } from 'react';
import { Search, Calendar, Play, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  youtube_id: string;
  published_date: string;
  view_count: number;
  event: {
    name: string;
  } | null;
  race: {
    name: string;
  } | null;
}

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredVideos(videos);
    } else {
      const filtered = videos.filter(
        (video) =>
          video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          video.event?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          video.race?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVideos(filtered);
    }
  }, [searchTerm, videos]);

  async function loadVideos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          event:events(name),
          race:races(name)
        `)
        .order('published_date', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
      setFilteredVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function incrementViewCount(videoId: string) {
    try {
      await supabase.rpc('increment_video_views', { video_id: videoId });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  function handleVideoClick(video: Video) {
    setSelectedVideo(video);
    incrementViewCount(video.id);
  }

  function getYouTubeThumbnail(youtubeId: string) {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-orange-500 opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Vidéos des Arrivées
            </h1>
            <p className="text-xl font-light text-gray-600 max-w-3xl mx-auto">
              Revivez les moments forts de nos événements. Retrouvez vos performances
              et partagez vos exploits sportifs.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une vidéo, un événement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 font-light"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm ? 'Aucune vidéo trouvée' : 'Aucune vidéo disponible'}
            </h3>
            <p className="text-gray-600 font-light">
              {searchTerm
                ? 'Essayez avec d\'autres mots-clés'
                : 'Les vidéos seront ajoutées prochainement'}
            </p>
          </div>
        ) : (
          <>
            {selectedVideo && (
              <div className="mb-12 bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.youtube_id}?autoplay=1`}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    {selectedVideo.title}
                  </h2>
                  {selectedVideo.description && (
                    <p className="text-gray-600 font-light mb-4">
                      {selectedVideo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {selectedVideo.event && (
                      <span className="flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        {selectedVideo.event.name}
                      </span>
                    )}
                    {selectedVideo.race && (
                      <span className="font-light">{selectedVideo.race.name}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(selectedVideo.published_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {selectedVideo.view_count} vues
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl"
                >
                  <div className="relative aspect-video group">
                    <img
                      src={getYouTubeThumbnail(video.youtube_id)}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
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
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {video.event && (
                        <span className="font-light truncate">{video.event.name}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(video.published_date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
