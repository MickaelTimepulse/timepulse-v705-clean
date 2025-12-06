import { useState, useEffect } from 'react';
import { Users, AlertCircle, Check } from 'lucide-react';

interface TeamRules {
  min_men?: number;
  max_men?: number;
  min_women?: number;
  max_women?: number;
  team_types: ('homme' | 'femme' | 'mixte')[];
}

interface RaceTeamRulesConfigProps {
  teamSize: number;
  initialRules?: TeamRules | null;
  onChange: (rules: TeamRules) => void;
}

export default function RaceTeamRulesConfig({
  teamSize,
  initialRules,
  onChange,
}: RaceTeamRulesConfigProps) {
  const [rules, setRules] = useState<TeamRules>(
    initialRules || {
      team_types: ['homme', 'femme', 'mixte'],
    }
  );

  const [preset, setPreset] = useState<'custom' | 'homme' | 'femme' | 'mixte' | 'libre'>('libre');

  useEffect(() => {
    onChange(rules);
  }, [rules]);

  const applyPreset = (presetType: typeof preset) => {
    setPreset(presetType);

    switch (presetType) {
      case 'homme':
        setRules({
          min_men: teamSize,
          max_men: teamSize,
          team_types: ['homme'],
        });
        break;

      case 'femme':
        setRules({
          min_women: teamSize,
          max_women: teamSize,
          team_types: ['femme'],
        });
        break;

      case 'mixte':
        setRules({
          min_men: 1,
          max_men: teamSize - 1,
          min_women: 1,
          max_women: teamSize - 1,
          team_types: ['mixte'],
        });
        break;

      case 'libre':
        setRules({
          team_types: ['homme', 'femme', 'mixte'],
        });
        break;

      case 'custom':
        break;
    }
  };

  const updateRule = (key: keyof TeamRules, value: any) => {
    setPreset('custom');
    setRules({ ...rules, [key]: value });
  };

  const toggleTeamType = (type: 'homme' | 'femme' | 'mixte') => {
    setPreset('custom');
    const newTypes = rules.team_types.includes(type)
      ? rules.team_types.filter(t => t !== type)
      : [...rules.team_types, type];

    if (newTypes.length === 0) return;

    setRules({ ...rules, team_types: newTypes });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Règles de composition des équipes
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Définissez les règles qui détermineront automatiquement si une équipe est <strong>Homme</strong>, <strong>Femme</strong> ou <strong>Mixte</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🎯 Choisissez un modèle prédéfini ou personnalisez
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => applyPreset('homme')}
            className={`p-5 border-2 rounded-lg transition text-left ${
              preset === 'homme'
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-300 hover:border-blue-300 hover:shadow'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {preset === 'homme' && <Check className="w-5 h-5 text-blue-600" />}
              <div className="font-bold text-lg text-blue-900">👨 Équipe HOMME uniquement</div>
            </div>
            <div className="text-sm text-gray-700 mb-2">
              L'équipe ne peut être composée QUE d'hommes
            </div>
            <div className="text-xs bg-white rounded px-2 py-1 inline-block">
              ✓ {teamSize} hommes obligatoires • 0 femme autorisée
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('femme')}
            className={`p-5 border-2 rounded-lg transition text-left ${
              preset === 'femme'
                ? 'border-pink-600 bg-pink-50 shadow-md'
                : 'border-gray-300 hover:border-pink-300 hover:shadow'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {preset === 'femme' && <Check className="w-5 h-5 text-pink-600" />}
              <div className="font-bold text-lg text-pink-900">👩 Équipe FEMME uniquement</div>
            </div>
            <div className="text-sm text-gray-700 mb-2">
              L'équipe ne peut être composée QUE de femmes
            </div>
            <div className="text-xs bg-white rounded px-2 py-1 inline-block">
              ✓ {teamSize} femmes obligatoires • 0 homme autorisé
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('mixte')}
            className={`p-5 border-2 rounded-lg transition text-left ${
              preset === 'mixte'
                ? 'border-purple-600 bg-purple-50 shadow-md'
                : 'border-gray-300 hover:border-purple-300 hover:shadow'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {preset === 'mixte' && <Check className="w-5 h-5 text-purple-600" />}
              <div className="font-bold text-lg text-purple-900">👥 Équipe MIXTE obligatoire</div>
            </div>
            <div className="text-sm text-gray-700 mb-2">
              L'équipe DOIT avoir au moins 1 homme ET 1 femme
            </div>
            <div className="text-xs bg-white rounded px-2 py-1 inline-block">
              ✓ Minimum 1 homme ET minimum 1 femme
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('libre')}
            className={`p-5 border-2 rounded-lg transition text-left ${
              preset === 'libre'
                ? 'border-green-600 bg-green-50 shadow-md'
                : 'border-gray-300 hover:border-green-300 hover:shadow'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {preset === 'libre' && <Check className="w-5 h-5 text-green-600" />}
              <div className="font-bold text-lg text-green-900">🔓 LIBRE (tous types acceptés)</div>
            </div>
            <div className="text-sm text-gray-700 mb-2">
              Les équipes peuvent être Homme, Femme ou Mixte
            </div>
            <div className="text-xs bg-white rounded px-2 py-1 inline-block">
              ✓ Aucune restriction de genre
            </div>
          </button>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ⚙️ Configuration personnalisée (Avancé)
            {preset === 'custom' && <span className="ml-2 text-blue-600 font-bold">← Actuellement utilisé</span>}
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Si les modèles prédéfinis ne conviennent pas, configurez vos propres règles ici
          </p>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Important :</strong> Ces champs déterminent quels types d'équipes sont acceptés :
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li><strong>Équipe HOMME</strong> = 100% d'hommes (0 femme)</li>
                <li><strong>Équipe FEMME</strong> = 100% de femmes (0 homme)</li>
                <li><strong>Équipe MIXTE</strong> = Mélange hommes + femmes</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quels types d'équipes voulez-vous AUTORISER ? *
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                rules.team_types.includes('homme')
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={rules.team_types.includes('homme')}
                  onChange={() => toggleTeamType('homme')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-bold text-blue-900">👨 Équipe Homme</span>
              </div>
              <div className="text-xs text-gray-600 ml-6">6 hommes / 0 femme</div>
            </label>

            <label
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                rules.team_types.includes('femme')
                  ? 'border-pink-600 bg-pink-50'
                  : 'border-gray-300 hover:border-pink-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={rules.team_types.includes('femme')}
                  onChange={() => toggleTeamType('femme')}
                  className="w-4 h-4 text-pink-600"
                />
                <span className="font-bold text-pink-900">👩 Équipe Femme</span>
              </div>
              <div className="text-xs text-gray-600 ml-6">0 homme / 6 femmes</div>
            </label>

            <label
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                rules.team_types.includes('mixte')
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={rules.team_types.includes('mixte')}
                  onChange={() => toggleTeamType('mixte')}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="font-bold text-purple-900">👥 Équipe Mixte</span>
              </div>
              <div className="text-xs text-gray-600 ml-6">H + F mélangés</div>
            </label>
          </div>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-semibold text-blue-900 mb-2">
            📋 Configuration fine des quotas (optionnel)
          </div>
          <p className="text-sm text-blue-800 mb-3">
            Ces champs permettent d'affiner les règles. <strong>Laisser vide = aucune restriction.</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👨 Minimum d'hommes dans l'équipe
            </label>
            <input
              type="number"
              min="0"
              max={teamSize}
              value={rules.min_men ?? ''}
              onChange={(e) => updateRule('min_men', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Aucun minimum (laisser vide)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Ex: 3 = l'équipe doit avoir AU MOINS 3 hommes</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👨 Maximum d'hommes dans l'équipe
            </label>
            <input
              type="number"
              min="0"
              max={teamSize}
              value={rules.max_men ?? ''}
              onChange={(e) => updateRule('max_men', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Aucun maximum (laisser vide)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Ex: 4 = l'équipe peut avoir AU MAX 4 hommes</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👩 Minimum de femmes dans l'équipe
            </label>
            <input
              type="number"
              min="0"
              max={teamSize}
              value={rules.min_women ?? ''}
              onChange={(e) => updateRule('min_women', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Aucun minimum (laisser vide)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Ex: 2 = l'équipe doit avoir AU MOINS 2 femmes</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👩 Maximum de femmes dans l'équipe
            </label>
            <input
              type="number"
              min="0"
              max={teamSize}
              value={rules.max_women ?? ''}
              onChange={(e) => updateRule('max_women', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Aucun maximum (laisser vide)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Ex: 4 = l'équipe peut avoir AU MAX 4 femmes</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg text-green-900 mb-3">✅ Règles ACTIVES pour vos inscriptions</h4>

            <div className="space-y-3">
              {rules.team_types.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="font-semibold text-green-900 mb-2">Types d'équipes ACCEPTÉS :</div>
                  <div className="flex flex-wrap gap-2">
                    {rules.team_types.map((type) => (
                      <span
                        key={type}
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          type === 'homme' ? 'bg-blue-100 text-blue-900' :
                          type === 'femme' ? 'bg-pink-100 text-pink-900' :
                          'bg-purple-100 text-purple-900'
                        }`}
                      >
                        {type === 'homme' && '👨 Équipe Homme'}
                        {type === 'femme' && '👩 Équipe Femme'}
                        {type === 'mixte' && '👥 Équipe Mixte'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(rules.min_men || rules.max_men || rules.min_women || rules.max_women) ? (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="font-semibold text-green-900 mb-2">Quotas de composition :</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {rules.min_men && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-gray-800">👨 Min. {rules.min_men} homme(s)</span>
                      </div>
                    )}
                    {rules.max_men && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-gray-800">👨 Max. {rules.max_men} homme(s)</span>
                      </div>
                    )}
                    {rules.min_women && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-gray-800">👩 Min. {rules.min_women} femme(s)</span>
                      </div>
                    )}
                    {rules.max_women && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-gray-800">👩 Max. {rules.max_women} femme(s)</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Aucun quota spécifique (composition libre selon types autorisés)</span>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-300">
                <div className="text-xs font-semibold text-yellow-900 mb-2">💡 Exemples d'équipes qui seront ACCEPTÉES :</div>
                <div className="text-xs text-yellow-800 space-y-1">
                  {rules.team_types.includes('homme') && (
                    <div>• Équipe de 6 hommes → <strong>Équipe HOMME</strong></div>
                  )}
                  {rules.team_types.includes('femme') && (
                    <div>• Équipe de 6 femmes → <strong>Équipe FEMME</strong></div>
                  )}
                  {rules.team_types.includes('mixte') && (
                    <div>• Équipe de 3 hommes + 3 femmes → <strong>Équipe MIXTE</strong></div>
                  )}
                  {!rules.team_types.includes('homme') && !rules.team_types.includes('femme') && !rules.team_types.includes('mixte') && (
                    <div className="text-red-600 font-bold">⚠️ ATTENTION : Aucun type autorisé ! Cochez au moins un type.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
