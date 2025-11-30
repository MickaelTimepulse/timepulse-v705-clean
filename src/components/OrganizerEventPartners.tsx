import React, { useState, useEffect } from 'react';
import { Upload, X, Link as LinkIcon, GripVertical, Plus, AlertCircle, Save, Edit2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Partner {
  id: string;
  event_id: string;
  name: string | null;
  logo_url: string;
  website_url: string | null;
  display_order: number;
}

interface PendingPartner {
  file: File;
  preview: string;
  name: string;
  website_url: string;
}

interface OrganizerEventPartnersProps {
  eventId: string;
}

export default function OrganizerEventPartners({ eventId }: OrganizerEventPartnersProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ name: string; website_url: string }>({ name: '', website_url: '' });

  const [pendingPartners, setPendingPartners] = useState<PendingPartner[]>([]);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    loadPartners();
  }, [eventId]);

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('event_partners')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (err: any) {
      console.error('Error loading partners:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const validFiles: PendingPartner[] = [];
    let hasError = false;

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError(`Format non supporté : ${file.name}. Seuls PNG, JPEG et JPG sont acceptés.`);
        hasError = true;
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(`Fichier trop volumineux : ${file.name}. Maximum 5 Mo.`);
        hasError = true;
        continue;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        name: '',
        website_url: ''
      });
    }

    if (validFiles.length > 0) {
      setPendingPartners(validFiles);
      setShowPendingModal(true);
      if (!hasError) setError(null);
    }

    e.target.value = '';
  };

  const updatePendingPartner = (index: number, field: 'name' | 'website_url', value: string) => {
    setPendingPartners(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removePendingPartner = (index: number) => {
    setPendingPartners(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const processImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const size = 200;
        canvas.width = size;
        canvas.height = size;

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.clearRect(0, 0, size, size);

        const scale = Math.min(size / img.width, size / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (size - width) / 2;
        const y = (size - height) / 2;

        ctx.drawImage(img, x, y, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/png',
          0.95
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadPendingPartners = async () => {
    setUploading(true);
    setError(null);
    let successCount = 0;

    try {
      const maxOrder = partners.length > 0
        ? Math.max(...partners.map(p => p.display_order))
        : -1;

      for (let i = 0; i < pendingPartners.length; i++) {
        const pending = pendingPartners[i];

        try {
          const processedBlob = await processImage(pending.file);
          const fileExt = 'png';
          const fileName = `${eventId}/${Date.now()}-${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('event-partner-logos')
            .upload(fileName, processedBlob, {
              contentType: 'image/png',
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('event-partner-logos')
            .getPublicUrl(fileName);

          const { error: insertError } = await supabase
            .from('event_partners')
            .insert({
              event_id: eventId,
              name: pending.name.trim() || null,
              logo_url: publicUrl,
              website_url: pending.website_url.trim() || null,
              display_order: maxOrder + i + 1
            });

          if (insertError) throw insertError;
          successCount++;
        } catch (err: any) {
          console.error(`Error uploading ${pending.file.name}:`, err);
          setError(`Erreur lors de l'upload de ${pending.file.name}: ${err.message}`);
        }
      }

      if (successCount > 0) {
        setSuccess(`${successCount} partenaire(s) ajouté(s) avec succès !`);
        setTimeout(() => setSuccess(null), 3000);
      }

      pendingPartners.forEach(p => URL.revokeObjectURL(p.preview));
      setPendingPartners([]);
      setShowPendingModal(false);
      await loadPartners();
    } catch (err: any) {
      console.error('Error in batch upload:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePartner = async (partnerId: string, logoUrl: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce partenaire ?')) return;

    try {
      const urlParts = logoUrl.split('/event-partner-logos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('event-partner-logos')
          .remove([filePath]);
      }

      const { error } = await supabase
        .from('event_partners')
        .delete()
        .eq('id', partnerId);

      if (error) throw error;

      setSuccess('Partenaire supprimé avec succès');
      setTimeout(() => setSuccess(null), 3000);
      await loadPartners();
    } catch (err: any) {
      console.error('Error deleting partner:', err);
      setError(err.message);
    }
  };

  const startEditPartner = (partner: Partner) => {
    setEditingPartnerId(partner.id);
    setEditData({
      name: partner.name || '',
      website_url: partner.website_url || ''
    });
  };

  const savePartnerEdit = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from('event_partners')
        .update({
          name: editData.name.trim() || null,
          website_url: editData.website_url.trim() || null
        })
        .eq('id', partnerId);

      if (error) throw error;

      setEditingPartnerId(null);
      setSuccess('Informations mises à jour');
      setTimeout(() => setSuccess(null), 3000);
      await loadPartners();
    } catch (err: any) {
      console.error('Error updating partner:', err);
      setError(err.message);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPartners = [...partners];
    const draggedItem = newPartners[draggedIndex];
    newPartners.splice(draggedIndex, 1);
    newPartners.splice(index, 0, draggedItem);

    setPartners(newPartners);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      const updates = partners.map((partner, index) => ({
        id: partner.id,
        display_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('event_partners')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (err: any) {
      console.error('Error updating order:', err);
      setError(err.message);
    }

    setDraggedIndex(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-start">
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Ajouter des partenaires</h3>
        <label className="flex items-center justify-center w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 hover:bg-blue-50">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <span className="text-lg font-medium text-gray-700 block mb-1">
              Cliquez pour sélectionner des logos
            </span>
            <span className="text-sm text-gray-600 block mb-2">
              Vous pouvez sélectionner plusieurs fichiers à la fois
            </span>
            <p className="text-xs text-gray-500">
              Formats acceptés : PNG, JPEG, JPG • Maximum 5 Mo par fichier
            </p>
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            multiple
            onChange={handleMultipleFilesSelect}
            className="hidden"
          />
        </label>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          Partenaires de l'événement ({partners.length})
        </h3>

        {partners.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aucun partenaire ajouté pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Glissez-déposez pour réorganiser • Cliquez sur l'icône crayon pour modifier
            </p>
            {partners.map((partner, index) => (
              <div
                key={partner.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="flex items-center bg-gray-50 p-4 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
              >
                <GripVertical className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />

                <img
                  src={partner.logo_url}
                  alt={partner.name || 'Logo partenaire'}
                  className="w-16 h-16 object-contain bg-white rounded border border-gray-200 mr-4"
                />

                {editingPartnerId === partner.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      placeholder="Nom du partenaire"
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="url"
                      value={editData.website_url}
                      onChange={(e) => setEditData({ ...editData, website_url: e.target.value })}
                      placeholder="https://www.example.com"
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {partner.name || 'Sans nom'}
                    </p>
                    {partner.website_url && (
                      <a
                        href={partner.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate block"
                      >
                        {partner.website_url}
                      </a>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 ml-4">
                  {editingPartnerId === partner.id ? (
                    <>
                      <button
                        onClick={() => savePartnerEdit(partner.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Enregistrer"
                      >
                        <Save className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setEditingPartnerId(null)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Annuler"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditPartner(partner)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeletePartner(partner.id, partner.logo_url)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold">Compléter les informations des partenaires</h3>
              <p className="text-sm text-gray-600 mt-1">
                {pendingPartners.length} logo(s) sélectionné(s) • Remplissez les informations (optionnel)
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {pendingPartners.map((pending, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-4">
                      <img
                        src={pending.preview}
                        alt={`Preview ${index}`}
                        className="w-24 h-24 object-contain bg-white rounded border border-gray-200"
                      />
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom du fichier
                          </label>
                          <p className="text-sm text-gray-600 truncate">{pending.file.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom du partenaire (facultatif)
                          </label>
                          <input
                            type="text"
                            value={pending.name}
                            onChange={(e) => updatePendingPartner(index, 'name', e.target.value)}
                            placeholder="Ex: Nike, Adidas, etc."
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Site web (facultatif)
                          </label>
                          <input
                            type="url"
                            value={pending.website_url}
                            onChange={(e) => updatePendingPartner(index, 'website_url', e.target.value)}
                            placeholder="https://www.example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removePendingPartner(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Retirer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  pendingPartners.forEach(p => URL.revokeObjectURL(p.preview));
                  setPendingPartners([]);
                  setShowPendingModal(false);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={uploading}
              >
                Annuler
              </button>
              <button
                onClick={uploadPendingPartners}
                disabled={uploading || pendingPartners.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Ajouter {pendingPartners.length} partenaire(s)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Information</h4>
        <p className="text-sm text-blue-800">
          Les logos des partenaires seront affichés entre la section "À propos de l'événement"
          et la section "Lieu & Co-voiturage" sur la page publique de l'événement.
          Tous les logos sont automatiquement redimensionnés pour un rendu professionnel et uniforme.
        </p>
      </div>
    </div>
  );
}
