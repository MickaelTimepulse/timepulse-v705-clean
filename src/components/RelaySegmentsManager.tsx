import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, GripVertical, PersonStanding, Bike, Waves, Sailboat, Star } from 'lucide-react';

interface RelaySegment {
  id: string;
  race_id: string;
  segment_order: number;
  name: string;
  distance: number;
  discipline: 'running' | 'cycling' | 'swimming' | 'canoe' | 'custom';
  custom_discipline?: string;
  icon: string;
  color: string;
  description?: string;
}

interface RelaySegmentsManagerProps {
  raceId: string;
  isTeamRace: boolean;
}

const DISCIPLINES = [
  { value: 'running', label: 'Course à pied', icon: PersonStanding, color: '#10b981' },
  { value: 'cycling', label: 'Vélo', icon: Bike, color: '#f59e0b' },
  { value: 'swimming', label: 'Natation', icon: Waves, color: '#0ea5e9' },
  { value: 'canoe', label: 'Canoë', icon: Sailboat, color: '#8b5cf6' },
  { value: 'custom', label: 'Autre (à préciser)', icon: Star, color: '#ec4899' },
];

export default function RelaySegmentsManager({ raceId, isTeamRace }: RelaySegmentsManagerProps) {
  const [segments, setSegments] = useState<RelaySegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isTeamRace) {
      loadSegments();
    }
  }, [raceId, isTeamRace]);

  const loadSegments = async () => {
    try {
      const { data, error } = await supabase
        .from('relay_segments')
        .select('*')
        .eq('race_id', raceId)
        .order('segment_order', { ascending: true });

      if (error) throw error;
      setSegments(data || []);
    } catch (error) {
      console.error('Error loading segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSegment = () => {
    const newOrder = segments.length + 1;
    const newSegment: RelaySegment = {
      id: `temp-${Date.now()}`, // Temporary ID for new segments
      race_id: raceId,
      segment_order: newOrder,
      name: `Relais ${newOrder}`,
      distance: 5.0,
      discipline: 'running',
      icon: 'PersonStanding',
      color: '#10b981',
    };

    setSegments([...segments, newSegment]);
  };

  const updateSegment = (index: number, field: keyof RelaySegment, value: any) => {
    const updated = [...segments];
    updated[index] = { ...updated[index], [field]: value };

    // Update icon and color based on discipline
    if (field === 'discipline') {
      const disc = DISCIPLINES.find(d => d.value === value);
      if (disc) {
        // Get the icon component name
        const iconName = disc.icon.displayName || disc.icon.name || 'Flag';
        updated[index].icon = iconName;
        updated[index].color = disc.color;
      }
    }

    setSegments(updated);
  };

  const removeSegment = (index: number) => {
    const updated = segments.filter((_, i) => i !== index);
    // Reorder
    updated.forEach((seg, i) => {
      seg.segment_order = i + 1;
    });
    setSegments(updated);
  };

  const saveSegments = async () => {
    setSaving(true);
    try {
      // Delete all existing segments
      const { error: deleteError } = await supabase
        .from('relay_segments')
        .delete()
        .eq('race_id', raceId);

      if (deleteError) {
        console.error('Error deleting segments:', deleteError);
        throw deleteError;
      }

      // Insert new segments
      if (segments.length > 0) {
        const segmentsToInsert = segments.map(seg => ({
          race_id: raceId,
          segment_order: seg.segment_order,
          name: seg.name,
          distance: parseFloat(seg.distance.toString()),
          discipline: seg.discipline,
          custom_discipline: seg.custom_discipline || null,
          icon: seg.icon,
          color: seg.color,
          description: seg.description || null,
        }));

        const { error: insertError } = await supabase
          .from('relay_segments')
          .insert(segmentsToInsert);

        if (insertError) {
          console.error('Error inserting segments:', insertError);
          throw insertError;
        }
      }

      alert('Segments de relais enregistrés avec succès !');
      await loadSegments();
    } catch (error: any) {
      console.error('Error saving segments:', error);
      alert(`Erreur lors de l'enregistrement des segments: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const getTotalDistance = () => {
    return segments.reduce((sum, seg) => sum + (parseFloat(seg.distance?.toString() || '0')), 0);
  };

  if (!isTeamRace) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configuration des segments de relais</h3>
          <p className="text-sm text-gray-600 mt-1">
            Définissez chaque segment du relais avec sa distance et sa discipline
          </p>
        </div>
        <button
          onClick={addSegment}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un segment
        </button>
      </div>

      {segments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Aucun segment défini. Cliquez sur "Ajouter un segment" pour commencer.</p>
          <p className="text-sm mt-2">Exemple : Pour un Ekiden classique, ajoutez 6 segments.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {segments.map((segment, index) => {
            const DisciplineIcon = DISCIPLINES.find(d => d.value === segment.discipline)?.icon || Star;

            return (
              <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-shrink-0 mt-2">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Nom du segment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du segment
                    </label>
                    <input
                      type="text"
                      value={segment.name}
                      onChange={(e) => updateSegment(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Relais 1"
                    />
                  </div>

                  {/* Distance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={segment.distance}
                      onChange={(e) => updateSegment(index, 'distance', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5.0"
                    />
                  </div>

                  {/* Discipline */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discipline
                    </label>
                    <div className="relative">
                      <select
                        value={segment.discipline}
                        onChange={(e) => updateSegment(index, 'discipline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        {DISCIPLINES.map(disc => (
                          <option key={disc.value} value={disc.value}>
                            {disc.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <DisciplineIcon className="w-5 h-5" style={{ color: segment.color }} />
                      </div>
                    </div>
                  </div>

                  {/* Discipline personnalisée */}
                  {segment.discipline === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de la discipline
                      </label>
                      <input
                        type="text"
                        value={segment.custom_discipline || ''}
                        onChange={(e) => updateSegment(index, 'custom_discipline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Roller, Trottinette..."
                      />
                    </div>
                  )}
                </div>

                {/* Bouton supprimer */}
                <button
                  onClick={() => removeSegment(index)}
                  className="flex-shrink-0 mt-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer ce segment"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}

          {/* Total */}
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="font-semibold text-gray-900">Distance totale du relais</span>
            <span className="text-2xl font-bold text-blue-600">
              {getTotalDistance().toFixed(3)} km
            </span>
          </div>

          {/* Bouton enregistrer */}
          <div className="flex justify-end">
            <button
              onClick={saveSegments}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les segments'}
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>💡 Conseil :</strong> Pour un Ekiden classique de 42,195 km, vous pouvez créer 6 segments :
          5 km, 10 km, 5 km, 10 km, 5 km, et 7,195 km.
        </p>
      </div>
    </div>
  );
}
