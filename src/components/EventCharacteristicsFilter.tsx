import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Award, Trophy, TrendingUp, RefreshCw, Mountain, Trees, PartyPopper,
  Zap, Footprints, CheckCircle, RouteIcon, Filter, X
} from 'lucide-react';

interface CharacteristicType {
  id: string;
  code: string;
  name: string;
  category: string;
  icon: string;
  color: string;
}

interface EventCharacteristicsFilterProps {
  selectedFilters: string[];
  onChange: (filters: string[]) => void;
}

const ICON_MAP: Record<string, any> = {
  Award,
  Trophy,
  TrendingUp,
  RefreshCw,
  Mountain,
  Trees,
  PartyPopper,
  Zap,
  Footprints,
  RouteIcon,
  CheckCircle,
};

const CATEGORY_LABELS: Record<string, string> = {
  certification: 'Certifications',
  terrain: 'Terrain',
  style: 'Style',
  trail_distance: 'Distance Trail',
};

export default function EventCharacteristicsFilter({
  selectedFilters,
  onChange
}: EventCharacteristicsFilterProps) {
  const [characteristics, setCharacteristics] = useState<CharacteristicType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadCharacteristics();
  }, []);

  const loadCharacteristics = async () => {
    try {
      const { data, error } = await supabase
        .from('event_characteristic_types')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;
      setCharacteristics(data || []);
    } catch (err) {
      console.error('Error loading characteristics:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (id: string) => {
    if (selectedFilters.includes(id)) {
      onChange(selectedFilters.filter(f => f !== id));
    } else {
      onChange([...selectedFilters, id]);
    }
  };

  const clearFilters = () => {
    onChange([]);
  };

  const groupedCharacteristics = characteristics.reduce((acc, char) => {
    if (!acc[char.category]) {
      acc[char.category] = [];
    }
    acc[char.category].push(char);
    return acc;
  }, {} as Record<string, CharacteristicType[]>);

  if (loading) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all border-2 shadow-sm
          ${selectedFilters.length > 0
            ? 'bg-blue-50 border-blue-500 text-blue-700'
            : 'bg-white border-blue-300 text-gray-700 hover:border-blue-400'
          }
        `}
      >
        <Filter className="w-4 h-4" />
        Filtrer par caractéristiques
        {selectedFilters.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
            {selectedFilters.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 z-[110] max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filtrer les événements</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {Object.entries(groupedCharacteristics).map(([category, chars]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {CATEGORY_LABELS[category] || category}
                  </h4>

                  <div className="space-y-1">
                    {chars.map((char) => {
                      const Icon = ICON_MAP[char.icon] || CheckCircle;
                      const isSelected = selectedFilters.includes(char.id);

                      return (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => toggleFilter(char.id)}
                          className={`
                            w-full flex items-center gap-3 p-2 rounded-lg transition-all
                            ${isSelected
                              ? 'bg-blue-50 border-2 border-blue-500'
                              : 'bg-white border-2 border-transparent hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className={`
                            flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                            ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
                          `}>
                            <Icon
                              className="w-4 h-4"
                              style={{ color: isSelected ? char.color : '#6b7280' }}
                            />
                          </div>

                          <span className={`text-sm ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                            {char.name}
                          </span>

                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {selectedFilters.length > 0 && (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Effacer tous les filtres
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
