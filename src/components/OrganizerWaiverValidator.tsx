import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Eye, Download, AlertCircle, FileText, Clock } from 'lucide-react';

interface LiabilityWaiver {
  id: string;
  athlete_id: string;
  entry_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  validated_at: string | null;
  uploaded_at: string;
  athletes: {
    first_name: string;
    last_name: string;
    email: string;
  };
  entries: {
    races: {
      name: string;
      events: {
        name: string;
      };
    };
  };
}

interface OrganizerWaiverValidatorProps {
  eventId?: string;
  raceId?: string;
  organizerId: string;
}

export default function OrganizerWaiverValidator({
  eventId,
  raceId,
  organizerId
}: OrganizerWaiverValidatorProps) {
  const [waivers, setWaivers] = useState<LiabilityWaiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWaiver, setSelectedWaiver] = useState<LiabilityWaiver | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadWaivers();

    const channel = supabase
      .channel('waivers-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'liability_waivers'
      }, () => {
        loadWaivers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, raceId, filterStatus]);

  async function loadWaivers() {
    try {
      let query = supabase
        .from('liability_waivers')
        .select(`
          *,
          athletes (first_name, last_name, email),
          entries (
            races (
              name,
              events (name)
            )
          )
        `)
        .order('uploaded_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (eventId) {
        query = query.eq('entries.races.events.id', eventId);
      }

      if (raceId) {
        query = query.eq('entries.race_id', raceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWaivers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des décharges:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approveWaiver(waiverId: string) {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('liability_waivers')
        .update({
          status: 'approved',
          validated_by: user.id,
          validated_at: new Date().toISOString()
        })
        .eq('id', waiverId);

      if (error) throw error;

      setSelectedWaiver(null);
      await loadWaivers();
    } catch (error: any) {
      console.error('Erreur lors de l\'approbation:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setProcessing(false);
    }
  }

  async function rejectWaiver(waiverId: string, entryId: string) {
    if (!rejectReason.trim()) {
      alert('Veuillez indiquer la raison du rejet');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error: waiverError } = await supabase
        .from('liability_waivers')
        .update({
          status: 'rejected',
          rejection_reason: rejectReason,
          validated_by: user.id,
          validated_at: new Date().toISOString()
        })
        .eq('id', waiverId);

      if (waiverError) throw waiverError;

      const { error: rejectionError } = await supabase
        .from('registration_rejections')
        .insert({
          entry_id: entryId,
          rejected_by: user.id,
          reason: rejectReason,
          requires_new_waiver: true
        });

      if (rejectionError) throw rejectionError;

      setSelectedWaiver(null);
      setRejectReason('');
      await loadWaivers();
    } catch (error: any) {
      console.error('Erreur lors du rejet:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setProcessing(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const statusCounts = {
    all: waivers.length,
    pending: waivers.filter(w => w.status === 'pending').length,
    approved: waivers.filter(w => w.status === 'approved').length,
    rejected: waivers.filter(w => w.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Validation des décharges de responsabilité
        </h2>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' && `Toutes (${statusCounts.all})`}
              {status === 'pending' && `En attente (${statusCounts.pending})`}
              {status === 'approved' && `Validées (${statusCounts.approved})`}
              {status === 'rejected' && `Rejetées (${statusCounts.rejected})`}
            </button>
          ))}
        </div>
      </div>

      {waivers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucune décharge à valider</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {waivers.map((waiver) => (
            <div
              key={waiver.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                waiver.status === 'pending'
                  ? 'border-yellow-300 bg-yellow-50'
                  : waiver.status === 'approved'
                  ? 'border-green-300 bg-green-50'
                  : 'border-red-300 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {waiver.athletes.first_name} {waiver.athletes.last_name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">{waiver.athletes.email}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  waiver.status === 'pending'
                    ? 'bg-yellow-200 text-yellow-800'
                    : waiver.status === 'approved'
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
                }`}>
                  {waiver.status === 'pending' && <Clock className="w-3 h-3 inline mr-1" />}
                  {waiver.status === 'approved' && <Check className="w-3 h-3 inline mr-1" />}
                  {waiver.status === 'rejected' && <X className="w-3 h-3 inline mr-1" />}
                  {waiver.status === 'pending' && 'En attente'}
                  {waiver.status === 'approved' && 'Validée'}
                  {waiver.status === 'rejected' && 'Rejetée'}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p className="truncate">
                  <strong>Course:</strong> {waiver.entries?.races?.name}
                </p>
                <p className="truncate">
                  <strong>Fichier:</strong> {waiver.file_name}
                </p>
                <p>
                  <strong>Taille:</strong> {formatFileSize(waiver.file_size)}
                </p>
                <p>
                  <strong>Uploadée le:</strong> {formatDate(waiver.uploaded_at)}
                </p>
              </div>

              {waiver.rejection_reason && (
                <div className="mb-4 p-2 bg-red-100 border border-red-300 rounded">
                  <p className="text-xs text-red-800">
                    <strong>Raison du rejet:</strong> {waiver.rejection_reason}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedWaiver(waiver)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  Voir
                </button>
                <a
                  href={waiver.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedWaiver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Décharge de {selectedWaiver.athletes.first_name} {selectedWaiver.athletes.last_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedWaiver.entries?.races?.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedWaiver(null);
                    setRejectReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                {selectedWaiver.mime_type.startsWith('image/') ? (
                  <img
                    src={selectedWaiver.file_url}
                    alt="Décharge de responsabilité"
                    className="w-full rounded-lg border"
                  />
                ) : (
                  <iframe
                    src={selectedWaiver.file_url}
                    className="w-full h-[600px] border rounded-lg"
                    title="Décharge de responsabilité"
                  />
                )}
              </div>

              {selectedWaiver.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raison du rejet (si applicable)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Ex: Document illisible, signature manquante, etc."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => approveWaiver(selectedWaiver.id)}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <Check className="w-5 h-5" />
                      Valider la décharge
                    </button>
                    <button
                      onClick={() => rejectWaiver(selectedWaiver.id, selectedWaiver.entry_id)}
                      disabled={processing || !rejectReason.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <X className="w-5 h-5" />
                      Rejeter la décharge
                    </button>
                  </div>
                </div>
              )}

              {selectedWaiver.status === 'approved' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Décharge validée le {formatDate(selectedWaiver.validated_at!)}
                  </p>
                </div>
              )}

              {selectedWaiver.status === 'rejected' && selectedWaiver.rejection_reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>
                      <strong>Rejetée le {formatDate(selectedWaiver.validated_at!)}:</strong>
                      <br />
                      {selectedWaiver.rejection_reason}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
