import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, FileText, X, Check, AlertCircle, Download } from 'lucide-react';

interface LiabilityWaiverUploadProps {
  athleteId: string;
  entryId?: string;
  onUploadComplete: (waiverId: string, fileUrl: string) => void;
  existingWaiverId?: string | null;
  templateUrl?: string | null;
  disabled?: boolean;
  required?: boolean;
}

export default function LiabilityWaiverUpload({
  athleteId,
  entryId,
  onUploadComplete,
  existingWaiverId,
  templateUrl,
  disabled = false,
  required = false
}: LiabilityWaiverUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Format de fichier non supporté. Veuillez uploader un PDF ou une image (JPEG, PNG).');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Le fichier est trop volumineux. La taille maximale est de 10 MB.');
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    await uploadFile(file);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${athleteId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('liability-waivers')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      const { data: { publicUrl } } = supabase.storage
        .from('liability-waivers')
        .getPublicUrl(fileName);

      const { data: waiverData, error: waiverError } = await supabase
        .from('liability_waivers')
        .insert({
          athlete_id: athleteId,
          entry_id: entryId || null,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending'
        })
        .select()
        .single();

      if (waiverError) throw waiverError;

      setUploadProgress(100);
      onUploadComplete(waiverData.id, publicUrl);

    } catch (err: any) {
      console.error('Erreur lors de l\'upload:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'upload du fichier.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function handleClear() {
    setPreview(null);
    setFileName(null);
    setFileSize(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Décharge de responsabilité {required && <span className="text-red-500">*</span>}
          </label>
          <p className="text-sm text-gray-500 mt-1">
            PDF ou image (JPEG, PNG) - Maximum 10 MB
          </p>
        </div>

        {templateUrl && (
          <a
            href={templateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <Download className="w-4 h-4" />
            Télécharger le modèle
          </a>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!fileName && !uploading && (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
          }`}
        >
          <Upload className={`w-12 h-12 mx-auto mb-3 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
          <p className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            Cliquez pour uploader votre décharge
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ou glissez-déposez un fichier ici
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
        </div>
      )}

      {uploading && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium text-blue-900">
              Upload en cours... {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {fileName && !uploading && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 truncate">{fileName}</p>
                  {fileSize && (
                    <p className="text-xs text-green-700 mt-0.5">{formatFileSize(fileSize)}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-green-700 hover:text-green-900"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {preview && (
            <div className="mt-3 rounded-lg overflow-hidden border border-green-300">
              <img
                src={preview}
                alt="Aperçu de la décharge"
                className="w-full h-auto"
              />
            </div>
          )}
        </div>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note importante :</strong> Votre décharge de responsabilité sera examinée par l'organisateur.
          Vous recevrez une confirmation une fois qu'elle aura été validée. En cas de rejet, vous pourrez uploader un nouveau document.
        </p>
      </div>
    </div>
  );
}
