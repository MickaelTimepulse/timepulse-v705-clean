import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

interface Federation {
  id: string;
  code: string;
  name: string;
  short_name: string;
  description: string;
  logo_url: string | null;
  requires_license: boolean;
  requires_liability_waiver: boolean;
}

interface FederationSelectorProps {
  value: string | null;
  onChange: (federationId: string | null) => void;
  disabled?: boolean;
  required?: boolean;
  showRequirements?: boolean;
}

export default function FederationSelector({
  value,
  onChange,
  disabled = false,
  required = false,
  showRequirements = true
}: FederationSelectorProps) {
  const [federations, setFederations] = useState<Federation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFederation, setSelectedFederation] = useState<Federation | null>(null);

  useEffect(() => {
    loadFederations();
  }, []);

  useEffect(() => {
    if (value && federations.length > 0) {
      const fed = federations.find(f => f.id === value);
      setSelectedFederation(fed || null);
    } else {
      setSelectedFederation(null);
    }
  }, [value, federations]);

  async function loadFederations() {
    try {
      const { data, error } = await supabase
        .from('federations')
        .select('*')
        .eq('active', true)
        .order('short_name');

      if (error) throw error;
      setFederations(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des fédérations:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = e.target.value || null;
    onChange(newValue);
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Fédération de rattachement {required && <span className="text-red-500">*</span>}
      </label>

      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">Sélectionnez une fédération</option>
        {federations.map((federation) => (
          <option key={federation.id} value={federation.id}>
            {federation.short_name} - {federation.name}
          </option>
        ))}
      </select>

      {selectedFederation && showRequirements && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">Exigences de cette fédération</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {selectedFederation.requires_license && (
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Licence obligatoire</span>
                  </li>
                )}
                {selectedFederation.requires_liability_waiver && (
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Décharge de responsabilité obligatoire</span>
                  </li>
                )}
                {!selectedFederation.requires_license && !selectedFederation.requires_liability_waiver && (
                  <li className="text-gray-600">Aucune exigence particulière</li>
                )}
              </ul>
              {selectedFederation.description && (
                <p className="text-sm text-blue-700 mt-2">{selectedFederation.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedFederation?.requires_liability_waiver && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Les participants devront uploader une décharge de responsabilité signée lors de leur inscription.
          </p>
        </div>
      )}
    </div>
  );
}
