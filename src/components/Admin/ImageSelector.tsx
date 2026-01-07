import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Image as ImageIcon, Check, X, RefreshCw } from 'lucide-react';

interface ImageSelectorProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
}

export default function ImageSelector({ value, onChange, bucket = 'email-assets' }: ImageSelectorProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from(bucket)
        .list();

      if (error) throw error;

      if (data) {
        const imageFiles = data
          .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))
          .map(file => {
            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(file.name);
            return urlData.publicUrl;
          });

        setImages(imageFiles);
      }
    } catch (err) {
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith('{{site_url}}')) {
      return url.replace('{{site_url}}', window.location.origin);
    }
    return url;
  };

  const getStorageUrl = (publicUrl: string) => {
    // Convert public URL to {{site_url}}/email-assets/filename.jpg format
    const filename = publicUrl.split('/').pop();
    return `{{site_url}}/email-assets/${filename}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="block text-sm font-medium text-gray-700">
          <ImageIcon className="w-4 h-4 inline mr-1" />
          Image de l'email
        </label>
        <button
          type="button"
          onClick={loadImages}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Recharger
        </button>
      </div>

      {/* Current Image Preview */}
      {value && (
        <div className="relative group">
          <img
            src={getImageUrl(value)}
            alt="Image sélectionnée"
            className="w-full h-40 object-cover rounded-lg border-2 border-blue-500"
            onError={(e) => {
              // Fallback if image doesn't load
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
            }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            title="Supprimer l'image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toggle Selector */}
      <button
        type="button"
        onClick={() => setShowSelector(!showSelector)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
      >
        <ImageIcon className="w-4 h-4" />
        {value ? 'Changer l\'image' : 'Sélectionner une image'}
      </button>

      {/* Image Grid */}
      {showSelector && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Sélectionnez une image
            </h3>
            <button
              type="button"
              onClick={() => setShowSelector(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Chargement des images...
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Aucune image trouvée dans Assets.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Uploadez des images dans l'onglet "Assets" d'abord.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {images.map((imageUrl) => {
                const storageUrl = getStorageUrl(imageUrl);
                const isSelected = value === storageUrl;

                return (
                  <button
                    key={imageUrl}
                    type="button"
                    onClick={() => {
                      onChange(storageUrl);
                      setShowSelector(false);
                    }}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt="Asset"
                      className="w-full h-24 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                        <div className="bg-blue-600 text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Manual URL Input */}
          <div className="pt-3 border-t border-gray-300">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Ou entrez une URL manuellement
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              placeholder="{{site_url}}/email-assets/image.jpg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
