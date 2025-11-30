import { useState, useEffect } from 'react';
import { Shield, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FFACategory {
  code: string;
  label: string;
  min_age: number;
  max_age: number | null;
  gender: string;
  display_order: number;
}

interface RaceCategoryManagerProps {
  raceId: string;
  isFfaRace: boolean;
  onFfaToggle: (isFfa: boolean) => void;
}

export default function RaceCategoryManager({ raceId, isFfaRace, onFfaToggle }: RaceCategoryManagerProps) {
  const [ffaCategories, setFfaCategories] = useState<FFACategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [raceId]);

  const loadCategories = async () => {
    try {
      const [categoriesRes, restrictionsRes] = await Promise.all([
        supabase
          .from('ffa_categories')
          .select('*')
          .order('display_order'),
        supabase
          .from('race_category_restrictions')
          .select('category_code')
          .eq('race_id', raceId)
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (restrictionsRes.error) throw restrictionsRes.error;

      setFfaCategories(categoriesRes.data || []);
      setSelectedCategories(restrictionsRes.data?.map(r => r.category_code) || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = async (categoryCode: string) => {
    const isSelected = selectedCategories.includes(categoryCode);

    if (isSelected) {
      await removeCategory(categoryCode);
    } else {
      await addCategory(categoryCode);
    }
  };

  const addCategory = async (categoryCode: string) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('race_category_restrictions')
        .insert({ race_id: raceId, category_code: categoryCode })
        .select();

      if (error) {
        console.error('Error adding category:', error);
        alert(`Erreur lors de l'ajout de la catégorie: ${error.message}`);
        return;
      }

      setSelectedCategories([...selectedCategories, categoryCode]);
    } catch (error: any) {
      console.error('Error adding category:', error);
      alert(`Erreur lors de l'ajout de la catégorie: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (categoryCode: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('race_category_restrictions')
        .delete()
        .eq('race_id', raceId)
        .eq('category_code', categoryCode);

      if (error) throw error;
      setSelectedCategories(selectedCategories.filter(c => c !== categoryCode));
    } catch (error) {
      console.error('Error removing category:', error);
      alert('Erreur lors de la suppression de la catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = async () => {
    try {
      setSaving(true);
      const categoriesToAdd = ffaCategories
        .filter(cat => !selectedCategories.includes(cat.code))
        .map(cat => ({ race_id: raceId, category_code: cat.code }));

      if (categoriesToAdd.length > 0) {
        const { error } = await supabase
          .from('race_category_restrictions')
          .insert(categoriesToAdd);

        if (error) throw error;
        setSelectedCategories(ffaCategories.map(cat => cat.code));
      }
    } catch (error) {
      console.error('Error selecting all:', error);
      alert('Erreur lors de la sélection de toutes les catégories');
    } finally {
      setSaving(false);
    }
  };

  const handleDeselectAll = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('race_category_restrictions')
        .delete()
        .eq('race_id', raceId);

      if (error) throw error;
      setSelectedCategories([]);
    } catch (error) {
      console.error('Error deselecting all:', error);
      alert('Erreur lors de la désélection de toutes les catégories');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Restrictions d'accès par catégorie</h3>
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFfaRace}
            onChange={(e) => onFfaToggle(e.target.checked)}
            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
          />
          <span className="text-sm font-medium text-gray-700">
            Course FFA (Fédération Française d'Athlétisme)
          </span>
        </label>
        <p className="mt-1 text-xs text-gray-500 ml-6">
          Activez cette option pour restreindre l'accès aux catégories FFA officielles
        </p>
      </div>

      {isFfaRace && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {selectedCategories.length === 0
                ? 'Aucune restriction (toutes les catégories autorisées)'
                : `${selectedCategories.length} catégorie${selectedCategories.length > 1 ? 's' : ''} autorisée${selectedCategories.length > 1 ? 's' : ''}`}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleSelectAll}
                disabled={saving || selectedCategories.length === ffaCategories.length}
                className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tout sélectionner
              </button>
              <button
                onClick={handleDeselectAll}
                disabled={saving || selectedCategories.length === 0}
                className="text-xs px-3 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tout désélectionner
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ffaCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.code);
              return (
                <button
                  key={category.code}
                  onClick={() => handleToggleCategory(category.code)}
                  disabled={saving}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all text-left
                    ${isSelected
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                    ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`
                          text-xs font-bold px-2 py-0.5 rounded
                          ${isSelected ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700'}
                        `}>
                          {category.code}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{category.label}</p>
                    </div>
                    {isSelected && (
                      <div className="ml-2">
                        <div className="h-5 w-5 bg-pink-600 rounded-full flex items-center justify-center">
                          <Plus className="h-3 w-3 text-white rotate-45" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedCategories.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Catégories autorisées pour cette épreuve :
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((code) => {
                  const category = ffaCategories.find(c => c.code === code);
                  return category ? (
                    <span
                      key={code}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-600 text-white"
                    >
                      {category.code} - {category.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
