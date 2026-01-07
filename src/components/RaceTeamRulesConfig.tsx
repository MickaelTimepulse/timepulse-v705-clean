import { useState, useEffect } from 'react';
import { Users, Check, Settings } from 'lucide-react';

interface TeamRules {
  min_men?: number;
  max_men?: number;
  min_women?: number;
  max_women?: number;
  team_types: ('homme' | 'femme' | 'mixte')[];
  category_quotas?: {
    homme?: { min_men: number; max_men: number; min_women: number; max_women: number };
    femme?: { min_men: number; max_men: number; min_women: number; max_women: number };
    mixte?: { min_men: number; max_men: number; min_women: number; max_women: number };
  };
}

interface RaceTeamRulesConfigProps {
  teamSize: number;
  initialRules?: TeamRules | null;
  onChange: (rules: TeamRules) => void;
}

interface TeamTypeConfig {
  enabled: boolean;
  minMen: number;
  maxMen: number;
  minWomen: number;
  maxWomen: number;
}

export default function RaceTeamRulesConfig({
  teamSize,
  initialRules,
  onChange,
}: RaceTeamRulesConfigProps) {
  const getInitialConfig = () => {
    const hasHomme = initialRules?.team_types.includes('homme') ?? true;
    const hasFemme = initialRules?.team_types.includes('femme') ?? true;
    const hasMixte = initialRules?.team_types.includes('mixte') ?? true;

    const savedQuotas = initialRules?.category_quotas;

    return {
      homme: {
        enabled: hasHomme,
        minMen: savedQuotas?.homme?.min_men ?? teamSize,
        maxMen: savedQuotas?.homme?.max_men ?? teamSize,
        minWomen: savedQuotas?.homme?.min_women ?? 0,
        maxWomen: savedQuotas?.homme?.max_women ?? 0,
      },
      femme: {
        enabled: hasFemme,
        minMen: savedQuotas?.femme?.min_men ?? 0,
        maxMen: savedQuotas?.femme?.max_men ?? 0,
        minWomen: savedQuotas?.femme?.min_women ?? teamSize,
        maxWomen: savedQuotas?.femme?.max_women ?? teamSize,
      },
      mixte: {
        enabled: hasMixte,
        minMen: savedQuotas?.mixte?.min_men ?? 1,
        maxMen: savedQuotas?.mixte?.max_men ?? teamSize - 1,
        minWomen: savedQuotas?.mixte?.min_women ?? 1,
        maxWomen: savedQuotas?.mixte?.max_women ?? teamSize - 1,
      },
    };
  };

  const [config, setConfig] = useState<{
    homme: TeamTypeConfig;
    femme: TeamTypeConfig;
    mixte: TeamTypeConfig;
  }>(getInitialConfig);

  useEffect(() => {
    if (!initialRules) return;

    const newConfig = getInitialConfig();

    const hasChanged =
      config.homme.minMen !== newConfig.homme.minMen ||
      config.homme.maxMen !== newConfig.homme.maxMen ||
      config.homme.minWomen !== newConfig.homme.minWomen ||
      config.homme.maxWomen !== newConfig.homme.maxWomen ||
      config.femme.minMen !== newConfig.femme.minMen ||
      config.femme.maxMen !== newConfig.femme.maxMen ||
      config.femme.minWomen !== newConfig.femme.minWomen ||
      config.femme.maxWomen !== newConfig.femme.maxWomen ||
      config.mixte.minMen !== newConfig.mixte.minMen ||
      config.mixte.maxMen !== newConfig.mixte.maxMen ||
      config.mixte.minWomen !== newConfig.mixte.minWomen ||
      config.mixte.maxWomen !== newConfig.mixte.maxWomen ||
      config.homme.enabled !== newConfig.homme.enabled ||
      config.femme.enabled !== newConfig.femme.enabled ||
      config.mixte.enabled !== newConfig.mixte.enabled;

    if (hasChanged) {
      setConfig(newConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRules, teamSize]);

  useEffect(() => {
    const selectedTypes: ('homme' | 'femme' | 'mixte')[] = [];
    const rules: TeamRules = { team_types: [], category_quotas: {} };

    if (config.homme.enabled) selectedTypes.push('homme');
    if (config.femme.enabled) selectedTypes.push('femme');
    if (config.mixte.enabled) selectedTypes.push('mixte');

    rules.team_types = selectedTypes;

    // Sauvegarder les quotas spécifiques de chaque catégorie
    rules.category_quotas = {
      homme: config.homme.enabled ? {
        min_men: config.homme.minMen,
        max_men: config.homme.maxMen,
        min_women: config.homme.minWomen,
        max_women: config.homme.maxWomen,
      } : undefined,
      femme: config.femme.enabled ? {
        min_men: config.femme.minMen,
        max_men: config.femme.maxMen,
        min_women: config.femme.minWomen,
        max_women: config.femme.maxWomen,
      } : undefined,
      mixte: config.mixte.enabled ? {
        min_men: config.mixte.minMen,
        max_men: config.mixte.maxMen,
        min_women: config.mixte.minWomen,
        max_women: config.mixte.maxWomen,
      } : undefined,
    };

    // Calculer aussi les contraintes globales pour rétrocompatibilité
    if (selectedTypes.length === 1) {
      const singleType = selectedTypes[0];
      rules.min_men = config[singleType].minMen;
      rules.max_men = config[singleType].maxMen;
      rules.min_women = config[singleType].minWomen;
      rules.max_women = config[singleType].maxWomen;
    } else if (selectedTypes.length > 1) {
      const allConfigs = selectedTypes.map(type => config[type]);
      rules.min_men = Math.min(...allConfigs.map(c => c.minMen));
      rules.max_men = Math.max(...allConfigs.map(c => c.maxMen));
      rules.min_women = Math.min(...allConfigs.map(c => c.minWomen));
      rules.max_women = Math.max(...allConfigs.map(c => c.maxWomen));
    }

    onChange(rules);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const toggleType = (type: 'homme' | 'femme' | 'mixte') => {
    const enabledCount = [config.homme.enabled, config.femme.enabled, config.mixte.enabled].filter(Boolean).length;

    if (config[type].enabled && enabledCount === 1) {
      return;
    }

    setConfig(prev => ({
      ...prev,
      [type]: { ...prev[type], enabled: !prev[type].enabled }
    }));
  };

  const updateQuota = (type: 'homme' | 'femme' | 'mixte', field: 'minMen' | 'maxMen' | 'minWomen' | 'maxWomen', value: string) => {
    const numValue = Math.max(0, Math.min(teamSize, parseInt(value) || 0));
    setConfig(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: numValue }
    }));
  };

  const selectAll = () => {
    setConfig(prev => ({
      homme: { ...prev.homme, enabled: true },
      femme: { ...prev.femme, enabled: true },
      mixte: { ...prev.mixte, enabled: true },
    }));
  };

  const isAllSelected = config.homme.enabled && config.femme.enabled && config.mixte.enabled;
  const enabledCount = [config.homme.enabled, config.femme.enabled, config.mixte.enabled].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Catégories d'équipes autorisées
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choisissez quel(s) type(s) d'équipes peuvent s'inscrire à cette course manuellement
        </p>
      </div>

      <div>
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={selectAll}
            disabled={isAllSelected}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isAllSelected ? '✓ Toutes sélectionnées' : 'Tout sélectionner'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Équipe HOMME */}
          <div
            className={`border-2 rounded-xl transition ${
              config.homme.enabled
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleType('homme')}
              className="w-full p-6 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="font-bold text-xl text-blue-900">👨 Équipe HOMME</div>
                  {config.homme.enabled && <Check className="w-6 h-6 text-blue-600" />}
                </div>
              </div>
              <div className="text-sm text-gray-700 mt-2">
                Définissez la composition de cette catégorie
              </div>
            </button>
            {config.homme.enabled && (
              <div className="px-6 pb-6">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-900 text-sm">
                      Configurez les quotas pour cette catégorie :
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="font-medium text-sm text-gray-900">👨 Hommes</div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="0"
                          max={teamSize}
                          value={config.homme.minMen}
                          onChange={(e) => updateQuota('homme', 'minMen', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="0"
                          max={teamSize}
                          value={config.homme.maxMen}
                          onChange={(e) => updateQuota('homme', 'maxMen', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="font-medium text-sm text-gray-900">👩 Femmes</div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="0"
                          max={teamSize}
                          value={config.homme.minWomen}
                          onChange={(e) => updateQuota('homme', 'minWomen', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="0"
                          max={teamSize}
                          value={config.homme.maxWomen}
                          onChange={(e) => updateQuota('homme', 'maxWomen', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                    ⚠️ Le total hommes + femmes doit égaler {teamSize} coureurs
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Équipe FEMME */}
          <div
            className={`border-2 rounded-xl transition ${
              config.femme.enabled
                ? 'border-pink-600 bg-pink-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleType('femme')}
              className="w-full p-6 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="font-bold text-xl text-pink-900">👩 Équipe FEMME</div>
                  {config.femme.enabled && <Check className="w-6 h-6 text-pink-600" />}
                </div>
              </div>
              <div className="text-sm text-gray-700 mt-2">
                Définissez la composition de cette catégorie
              </div>
            </button>
            {config.femme.enabled && (
              <div className="px-6 pb-6">
                <div className="bg-white rounded-lg p-4 border border-pink-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-4 h-4 text-pink-600" />
                    <span className="font-semibold text-pink-900 text-sm">
                      Configurez les quotas pour cette catégorie :
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="font-medium text-sm text-gray-900">👨 Hommes</div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="0"
                          max={teamSize}
                          value={config.femme.minMen}
                          onChange={(e) => updateQuota('femme', 'minMen', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="0"
                          max={teamSize}
                          value={config.femme.maxMen}
                          onChange={(e) => updateQuota('femme', 'maxMen', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="font-medium text-sm text-gray-900">👩 Femmes</div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="0"
                          max={teamSize}
                          value={config.femme.minWomen}
                          onChange={(e) => updateQuota('femme', 'minWomen', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="0"
                          max={teamSize}
                          value={config.femme.maxWomen}
                          onChange={(e) => updateQuota('femme', 'maxWomen', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-pink-50 rounded-lg text-xs text-pink-800">
                    ⚠️ Le total hommes + femmes doit égaler {teamSize} coureurs
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Équipe MIXTE */}
          <div
            className={`border-2 rounded-xl transition ${
              config.mixte.enabled
                ? 'border-orange-600 bg-orange-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleType('mixte')}
              className="w-full p-6 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="font-bold text-xl text-orange-900">👥 Équipe MIXTE</div>
                  {config.mixte.enabled && <Check className="w-6 h-6 text-orange-600" />}
                </div>
              </div>
              <div className="text-sm text-gray-700 mt-2">
                L'équipe DOIT contenir au moins 1 homme ET 1 femme
              </div>
            </button>
            {config.mixte.enabled && (
              <div className="px-6 pb-6">
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-orange-900 text-sm">
                      Configurez les quotas pour cette catégorie :
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Quotas HOMMES */}
                    <div className="space-y-3">
                      <div className="font-medium text-sm text-gray-900">👨 Hommes</div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="0"
                          max={teamSize}
                          value={config.mixte.minMen}
                          onChange={(e) => updateQuota('mixte', 'minMen', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="0"
                          max={teamSize}
                          value={config.mixte.maxMen}
                          onChange={(e) => updateQuota('mixte', 'maxMen', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Quotas FEMMES */}
                    <div className="space-y-3">
                      <div className="font-medium text-sm text-gray-900">👩 Femmes</div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="0"
                          max={teamSize}
                          value={config.mixte.minWomen}
                          onChange={(e) => updateQuota('mixte', 'minWomen', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="0"
                          max={teamSize}
                          value={config.mixte.maxWomen}
                          onChange={(e) => updateQuota('mixte', 'maxWomen', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-orange-50 rounded-lg text-xs text-orange-800">
                    ⚠️ Le total hommes + femmes doit égaler {teamSize} coureurs
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Récapitulatif visuel */}
      {enabledCount > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg text-blue-900 mb-3">
                {enabledCount === 3 && '🔓 Toutes les catégories autorisées'}
                {enabledCount === 1 && config.homme.enabled && '👨 Équipe HOMME uniquement'}
                {enabledCount === 1 && config.femme.enabled && '👩 Équipe FEMME uniquement'}
                {enabledCount === 1 && config.mixte.enabled && '👥 Équipe MIXTE uniquement'}
                {enabledCount === 2 && `${enabledCount} catégories sélectionnées`}
              </h4>

              <div className="bg-white rounded-lg p-4 text-sm space-y-3">
                <div className="flex flex-wrap gap-2">
                  {config.homme.enabled && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full font-medium text-sm">
                      👨 Équipe HOMME
                    </span>
                  )}
                  {config.femme.enabled && (
                    <span className="px-3 py-1 bg-pink-100 text-pink-900 rounded-full font-medium text-sm">
                      👩 Équipe FEMME
                    </span>
                  )}
                  {config.mixte.enabled && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-900 rounded-full font-medium text-sm">
                      👥 Équipe MIXTE
                    </span>
                  )}
                </div>

                <div className="border-t pt-3">
                  <p className="font-medium text-gray-900 mb-2">Ces équipes pourront s'inscrire :</p>
                  <div className="space-y-2 text-gray-700">
                    {config.homme.enabled && (
                      <div className="bg-blue-50 p-2 rounded">
                        <span className="font-medium">👨 Équipe HOMME :</span> {config.homme.minMen}-{config.homme.maxMen} hommes, {config.homme.minWomen}-{config.homme.maxWomen} femmes
                      </div>
                    )}
                    {config.femme.enabled && (
                      <div className="bg-pink-50 p-2 rounded">
                        <span className="font-medium">👩 Équipe FEMME :</span> {config.femme.minMen}-{config.femme.maxMen} hommes, {config.femme.minWomen}-{config.femme.maxWomen} femmes
                      </div>
                    )}
                    {config.mixte.enabled && (
                      <div className="bg-orange-50 p-2 rounded">
                        <span className="font-medium">👥 Équipe MIXTE :</span> {config.mixte.minMen}-{config.mixte.maxMen} hommes, {config.mixte.minWomen}-{config.mixte.maxWomen} femmes
                      </div>
                    )}
                  </div>
                </div>

                {enabledCount === 3 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg text-xs text-green-800">
                    💡 Toutes les compositions d'équipes sont acceptées (recommandé pour maximum de flexibilité)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
