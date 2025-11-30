import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Search, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface MediaFile {
  id: string;
  filename: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: number;
  width?: number;
  height?: number;
  alt_text?: string;
  category: string;
  created_at: string;
}

interface MediaLibraryProps {
  onSelect?: (file: MediaFile) => void;
  selectedId?: string;
  category?: string;
}

export default function MediaLibrary({ onSelect, selectedId, category }: MediaLibraryProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState(category || 'all');

  useEffect(() => {
    fetchFiles();
  }, [filterCategory]);

  async function fetchFiles() {
    let query = supabase
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (filterCategory !== 'all') {
      query = query.eq('category', filterCategory);
    }

    const { data } = await query;

    if (data) {
      setFiles(data);
    }
    setLoading(false);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      let width: number | undefined;
      let height: number | undefined;

      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => {
          img.onload = () => {
            width = img.width;
            height = img.height;
            resolve(null);
          };
        });
      }

      const { error: dbError } = await supabase
        .from('media_files')
        .insert({
          filename: file.name,
          file_path: filePath,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          width,
          height,
          category: filterCategory !== 'all' ? filterCategory : 'general',
          uploaded_by: user.id,
        } as any);

      if (dbError) throw dbError;

      await fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erreur lors du téléchargement du fichier');
    } finally {
      setUploading(false);
    }
  }

  async function deleteFile(fileId: string, filePath: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    const { error: storageError } = await supabase.storage
      .from('media')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    await supabase.from('media_files').delete().eq('id', fileId);
    await fetchFiles();
  }

  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la photothèque...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un fichier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Toutes catégories</option>
          <option value="hero">Images hero</option>
          <option value="icon">Icônes</option>
          <option value="content">Contenu</option>
          <option value="thumbnail">Miniatures</option>
          <option value="general">Général</option>
        </select>

        <label className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
          <Upload className="w-5 h-5" />
          <span>{uploading ? 'Téléchargement...' : 'Télécharger'}</span>
          <input
            type="file"
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className={`group relative bg-white rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
              selectedId === file.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => onSelect?.(file)}
          >
            <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
              {file.file_type.startsWith('image/') ? (
                <img
                  src={file.file_url}
                  alt={file.alt_text || file.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>

            {selectedId === file.id && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFile(file.id, file.file_path);
                }}
                className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 bg-white">
              <p className="text-xs text-gray-600 truncate" title={file.filename}>
                {file.filename}
              </p>
              <p className="text-xs text-gray-400">
                {(file.file_size / 1024).toFixed(0)} KB
                {file.width && file.height && ` • ${file.width}×${file.height}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchQuery
              ? 'Aucun fichier trouvé'
              : 'Aucun fichier dans la photothèque'}
          </p>
          <label className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
            <Upload className="w-5 h-5" />
            Télécharger le premier fichier
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </div>
  );
}
