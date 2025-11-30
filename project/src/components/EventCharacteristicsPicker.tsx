import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Award, Trophy, TrendingUp, RefreshCw, Mountain, Trees, PartyPopper,
  Zap, Footprints, CheckCircle, RouteIcon
} from 'lucide-react';

interface CharacteristicType {
  id: string;
  code: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  description: string;
  display_order: number;
}

interface EventCharacteristicsPickerProps {
  eventId?: string;
  selectedCharacteristics: string[];
  onChange: (characteristicIds: string[]) => void;
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
  terrain: 'Type de terrain',
  style: 'Style de course',
  trail_distance: 'Catégorie Trail',
};

export default function EventCharacteristicsPicker({
  selectedCharacteristics,
  onChange
}: EventCharacteristicsPickerProps) {
  const [characteristics, setCharacteristics] = useState<CharacteristicType[]>([]);
  const [loading, setLoading] = useState(true);

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

      if (error) {
        console.error('Error loading characteristics:', error);
        throw error;
      }
      console.log('Loaded characteristics:', data);
      setCharacteristics(data || []);
    } catch (err) {
      console.error('Error loading characteristics:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCharacteristic = (id: string) => {
    if (selectedCharacteristics.includes(id)) {
      onChange(selectedCharacteristics.filter(c => c !== id));
    } else {
      onChange([...selectedCharacteristics, id]);
    }
  };

  const groupedCharacteristics = characteristics.reduce((acc, char) => {
    if (!acc[char.category]) {
      acc[char.category] = [];
    }
    acc[char.category].push(char);
    return acc;
  }, {} as Record<string, CharacteristicType[]>);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Chargement des caractéristiques...</p>
      </div>
    );
  }

  if (characteristics.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Aucune caractéristique disponible. Contactez l'administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Caractéristiques de l'événement
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Sélectionnez les caractéristiques qui décrivent votre événement. Cela aidera les participants à trouver votre course.
        </p>
      </div>

      {Object.entries(groupedCharacteristics).map(([category, chars]) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {CATEGORY_LABELS[category] || category}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chars.map((char) => {
              const Icon = ICON_MAP[char.icon] || CheckCircle;
              const isSelected = selectedCharacteristics.includes(char.id);

              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => toggleCharacteristic(char.id)}
                  className={`
                    relative flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                    ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
                  `}>
                    <Icon
                      className={`w-5 h-5 transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}
                      style={isSelected ? { color: char.color } : {}}
                    />
                  </div>

                  <div className="ml-3 flex-1 text-left">
                    <p className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {char.name}
                    </p>
                    {char.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {char.description}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 animate-in fade-in zoom-in duration-200">
                      <CheckCircle className="w-5 h-5 text-blue-600 fill-blue-100" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedCharacteristics.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{selectedCharacteristics.length}</span> caractéristique(s) sélectionnée(s)
          </p>
        </div>
      )}
    </div>
  );
}
