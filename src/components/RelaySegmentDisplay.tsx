import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PersonStanding, Bike, Waves, Sailboat, Star, Flag } from 'lucide-react';

interface RelaySegment {
  id: string;
  segment_order: number;
  name: string;
  distance: number;
  discipline: 'running' | 'cycling' | 'swimming' | 'canoe' | 'custom';
  custom_discipline?: string;
  icon: string;
  color: string;
  description?: string;
}

interface RelaySegmentDisplayProps {
  raceId: string;
}

const DISCIPLINE_ICONS: Record<string, any> = {
  running: PersonStanding,
  cycling: Bike,
  swimming: Waves,
  canoe: Sailboat,
  custom: Star,
  default: Flag,
};

const DISCIPLINE_LABELS: Record<string, string> = {
  running: 'Course à pied',
  cycling: 'Vélo',
  swimming: 'Natation',
  canoe: 'Canoë',
};

export default function RelaySegmentDisplay({ raceId }: RelaySegmentDisplayProps) {
  const [segments, setSegments] = useState<RelaySegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSegments();
  }, [raceId]);

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

  if (loading || segments.length === 0) {
    return null;
  }

  const getTotalDistance = () => {
    return segments.reduce((sum, seg) => sum + parseFloat(seg.distance.toString()), 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Composition du Relais</h3>
        <div className="text-right">
          <div className="text-sm text-gray-600">Distance totale</div>
          <div className="text-2xl font-bold text-blue-600">
            {getTotalDistance().toFixed(3)} km
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map((segment, index) => {
          const IconComponent = DISCIPLINE_ICONS[segment.discipline] || DISCIPLINE_ICONS.default;
          const disciplineLabel = segment.discipline === 'custom'
            ? segment.custom_discipline
            : DISCIPLINE_LABELS[segment.discipline] || 'Relais';

          return (
            <div
              key={segment.id}
              className="relative bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-gray-200 p-4 hover:shadow-lg transition-shadow"
              style={{ borderColor: segment.color }}
            >
              {/* Numéro du segment */}
              <div
                className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                style={{ backgroundColor: segment.color }}
              >
                {segment.segment_order}
              </div>

              {/* Icône de discipline */}
              <div className="flex items-center justify-center mb-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${segment.color}20` }}
                >
                  <IconComponent
                    className="w-8 h-8"
                    style={{ color: segment.color }}
                  />
                </div>
              </div>

              {/* Nom du segment */}
              <h4 className="text-center font-semibold text-gray-900 mb-1">
                {segment.name}
              </h4>

              {/* Type de discipline */}
              <p className="text-center text-sm text-gray-600 mb-2">
                {disciplineLabel}
              </p>

              {/* Distance */}
              <div className="text-center">
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {parseFloat(segment.distance.toString()).toFixed(3)} km
                </div>
              </div>

              {/* Description optionnelle */}
              {segment.description && (
                <p className="mt-3 text-xs text-gray-500 text-center border-t border-gray-200 pt-2">
                  {segment.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Info supplémentaire */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>ℹ️ Information :</strong> Ce relais se compose de {segments.length} segments.
          Chaque membre de l'équipe effectuera un segment.
        </p>
      </div>
    </div>
  );
}
