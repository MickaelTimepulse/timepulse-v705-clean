import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Check, AlertCircle, Trash2, Copy, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/Admin/AdminLayout';

interface Asset {
  name: string;
  url: string;
  size: number;
  created_at: string;
}

export default function AdminEmailAssets() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [customFileName, setCustomFileName] = useState('');

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    try {
      const { data, error } = await supabase.storage
        .from('email-assets')
        .list('', {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const assetUrls = data.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('email-assets')
          .getPublicUrl(file.name);

        return {
          name: file.name,
          url: publicUrl,
          size: file.metadata?.size || 0,
          created_at: file.created_at || new Date().toISOString()
        };
      });

      setAssets(assetUrls);
    } catch (error: any) {
      console.error('Error loading assets:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des assets' });
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>, fileName?: string) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Générer un nom de fichier si non fourni
    const finalFileName = fileName || `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

    setUploading(true);
    setMessage(null);

    try {
      const { error } = await supabase.storage
        .from('email-assets')
        .upload(finalFileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (error) throw error;

      setMessage({ type: 'success', text: `${finalFileName} uploadé avec succès !` });
      setCustomFileName('');
      await loadAssets();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  }

  async function handleCustomUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!customFileName) {
      setMessage({ type: 'error', text: 'Veuillez saisir un nom de fichier' });
      return;
    }

    const extension = file.name.split('.').pop();
    const finalName = customFileName.includes('.') ? customFileName : `${customFileName}.${extension}`;

    await handleUpload(event, finalName);
  }

  async function handleDelete(fileName: string) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${fileName} ?`)) return;

    try {
      const { error } = await supabase.storage
        .from('email-assets')
        .remove([fileName]);

      if (error) throw error;

      setMessage({ type: 'success', text: `${fileName} supprimé avec succès !` });
      await loadAssets();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'URL copiée dans le presse-papier !' });
    setTimeout(() => setMessage(null), 2000);
  }

  async function uploadDefaultAssets() {
    setUploading(true);
    setMessage(null);

    try {
      // Fetch the logo from public folder and upload
      const logoResponse = await fetch('/time.png');
      const logoBlob = await logoResponse.blob();

      const { error: logoError } = await supabase.storage
        .from('email-assets')
        .upload('timepulse-logo.png', logoBlob, {
          upsert: true,
          contentType: 'image/png'
        });

      if (logoError) throw logoError;

      // Fetch background image
      const bgResponse = await fetch('/triathlete.jpeg');
      const bgBlob = await bgResponse.blob();

      const { error: bgError } = await supabase.storage
        .from('email-assets')
        .upload('email-header-bg.jpeg', bgBlob, {
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (bgError) throw bgError;

      setMessage({ type: 'success', text: 'Assets par défaut uploadés avec succès !' });
      loadAssets();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assets Email</h1>
          <p className="text-gray-600">
            Gérez les images utilisées dans les emails (logos, backgrounds)
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload rapide</h2>
          <button
            onClick={uploadDefaultAssets}
            disabled={uploading}
            className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>{uploading ? 'Upload en cours...' : 'Uploader les assets par défaut'}</span>
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Upload automatique du logo Timepulse et de l'image de fond depuis le dossier public
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Upload d'images personnalisées
          </h2>

          <div className="space-y-6">
            {/* Upload avec nom personnalisé */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Uploader une image avec nom personnalisé
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder="Nom du fichier (ex: mon-image)"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  disabled={uploading}
                />
                <label className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 cursor-pointer disabled:opacity-50">
                  <Upload className="w-4 h-4" />
                  Choisir
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                L'extension sera ajoutée automatiquement selon le type de fichier
              </p>
            </div>

            {/* Upload rapide sans nom */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Upload rapide (nom automatique avec timestamp)
              </label>
              <label className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 cursor-pointer transition-colors">
                <ImageIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">Cliquez ou déposez une image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e)}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Formats acceptés: JPG, PNG, GIF, WebP (max 10MB)
              </p>
            </div>

            {/* Upload des assets par défaut */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assets prédéfinis
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Logo Timepulse</label>
                  <input
                    type="file"
                    accept="image/png"
                    onChange={(e) => handleUpload(e, 'timepulse-logo.png')}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Image de fond email</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg"
                    onChange={(e) => handleUpload(e, 'email-header-bg.jpeg')}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {assets.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Assets disponibles ({assets.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.map((asset) => (
                <div key={asset.name} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* Aperçu de l'image */}
                  <div className="aspect-video bg-gray-100 flex items-center justify-center p-4">
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Informations */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 truncate" title={asset.name}>
                        {asset.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(asset.size)} • {new Date(asset.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    {/* URL */}
                    <div className="bg-gray-50 rounded p-2 border border-gray-200">
                      <p className="text-xs text-gray-600 font-mono break-all">
                        {asset.url}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(asset.url)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copier URL
                      </button>
                      <button
                        onClick={() => handleDelete(asset.name)}
                        className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {assets.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-2">Aucune image uploadée</p>
            <p className="text-gray-500 text-sm">
              Commencez par uploader votre première image pour la bibliothèque
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
