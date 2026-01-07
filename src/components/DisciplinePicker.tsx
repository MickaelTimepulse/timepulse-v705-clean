import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Award } from 'lucide-react';

interface SportIcon {
  id: string;
  name: string;
  slug: string;
  icon_url: string;
  category: string;
  display_order: number;
}

interface Discipline {
  id: string;
  name: string;
  slug: string;
  sport_icon_id: string;
  description: string | null;
  sport_icon?: SportIcon;
}

interface DisciplinePickerProps {
  value: string | null;
  onChange: (disciplineId: string | null) => void;
  disabled?: boolean;
  required?: boolean;
  showCategories?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  running: 'Course à pied',
  cycling: 'Cyclisme',
  swimming: 'Natation',
  triathlon: 'Triathlon & Multi-sports',
  team_sports: 'Sports d\'équipe',
  other: 'Autres'
};

const CATEGORY_COLORS: Record<string, string> = {
  running: 'bg-orange-100 text-orange-800 border-orange-200',
  cycling: 'bg-blue-100 text-blue-800 border-blue-200',
  swimming: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  triathlon: 'bg-purple-100 text-purple-800 border-purple-200',
  team_sports: 'bg-green-100 text-green-800 border-green-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function DisciplinePicker({
  value,
  onChange,
  disabled = false,
  required = false,
  showCategories = true
}: DisciplinePickerProps) {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [sportIcons, setSportIcons] = useState<SportIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [iconsResult, disciplinesResult] = await Promise.all([
        supabase
          .from('sport_icons')
          .select('*')
          .eq('active', true)
          .order('display_order'),
        supabase
          .from('disciplines')
          .select('*, sport_icons(*)')
          .eq('active', true)
          .order('name')
      ]);

      if (iconsResult.error) throw iconsResult.error;
      if (disciplinesResult.error) throw disciplinesResult.error;

      setSportIcons(iconsResult.data || []);
      setDisciplines(disciplinesResult.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = [...new Set(sportIcons.map(icon => icon.category))];

  const filteredDisciplines = disciplines.filter(discipline => {
    const matchesCategory = !selectedCategory ||
      discipline.sport_icons?.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      discipline.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedByIcon = filteredDisciplines.reduce((acc, discipline) => {
    const iconId = discipline.sport_icon_id;
    if (!acc[iconId]) acc[iconId] = [];
    acc[iconId].push(discipline);
    return acc;
  }, {} as Record<string, Discipline[]>);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Discipline sportive {required && <span className="text-red-500">*</span>}
        </label>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une discipline..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        />
      </div>

      {showCategories && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            disabled={disabled}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
              !selectedCategory
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Toutes
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              disabled={disabled}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                selectedCategory === category
                  ? CATEGORY_COLORS[category]
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {CATEGORY_LABELS[category] || category}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
        {Object.entries(groupedByIcon).map(([iconId, iconDisciplines]) => {
          const icon = sportIcons.find(i => i.id === iconId);
          if (!icon) return null;

          return (
            <div key={iconId} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 px-2">
                {icon.icon_url ? (
                  <img src={icon.icon_url} alt={icon.name} className="w-5 h-5" />
                ) : (
                  <Activity className="w-5 h-5" />
                )}
                <span>{icon.name}</span>
              </div>
              <div className="space-y-1">
                {iconDisciplines.map((discipline) => (
                  <button
                    key={discipline.id}
                    type="button"
                    onClick={() => onChange(discipline.id)}
                    disabled={disabled}
                    className={`w-full px-3 py-2 text-left text-sm rounded-lg border transition-all ${
                      value === discipline.id
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-200'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{discipline.name}</span>
                      {value === discipline.id && (
                        <Award className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    {discipline.description && (
                      <p className="text-xs text-gray-500 mt-1">{discipline.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredDisciplines.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Aucune discipline trouvée</p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:underline text-sm mt-2"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      )}
    </div>
  );
}
