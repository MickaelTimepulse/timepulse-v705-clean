import { useState, useEffect } from 'react';
import { Users, Settings, Calendar, CreditCard, Hash, AlertCircle } from 'lucide-react';
import RelaySegmentsManager from './RelaySegmentsManager';
import RaceTeamRulesConfig from './RaceTeamRulesConfig';

interface TeamConfig {
  enabled: boolean;
  min_members: number;
  max_members: number;
  team_types: string[];
  allow_mixed_gender: boolean;
  require_full_team: boolean;
  payment_mode: 'team' | 'individual' | 'flexible';
  allow_individual_payment: boolean;
  modify_deadline_days: number;
  allow_multi_registration: boolean;
  bib_format: 'sequential' | 'suffix';
  auto_assign_bibs: boolean;
  team_rules?: {
    min_men?: number;
    max_men?: number;
    min_women?: number;
    max_women?: number;
    team_types: ('homme' | 'femme' | 'mixte')[];
  } | null;
}

interface RaceTeamConfigProps {
  raceId: string;
  isTeamRace: boolean;
  teamConfig: TeamConfig;
  onChange: (isTeamRace: boolean, config: TeamConfig) => void;
}

const DEFAULT_CONFIG: TeamConfig = {
  enabled: false,
  min_members: 2,
  max_members: 6,
  team_types: ['mixte'],
  allow_mixed_gender: true,
  require_full_team: false,
  payment_mode: 'team',
  allow_individual_payment: true,
  modify_deadline_days: 7,
  allow_multi_registration: false,
  bib_format: 'suffix',
  auto_assign_bibs: true,
};

const TEAM_TYPES = [
  { value: 'mixte', label: 'Mixte' },
  { value: 'hommes', label: 'Hommes' },
  { value: 'femmes', label: 'Femmes' },
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'club', label: 'Club / Association' },
  { value: 'libre', label: 'Libre' },
];

export default function RaceTeamConfig({ raceId, isTeamRace, teamConfig, onChange }: RaceTeamConfigProps) {
  const [config, setConfig] = useState<TeamConfig>(teamConfig || DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  useEffect(() => {
    if (teamConfig) {
      setConfig(teamConfig);
    }
  }, [teamConfig]);

  const updateConfig = async (updates: Partial<TeamConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    setSaving(true);
    setSaveMessage('');
    try {
      await onChange(isTeamRace, newConfig);
      setSaveMessage('✅ Configuration sauvegardée');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const toggleTeamRace = async (enabled: boolean) => {
    setSaving(true);
    setSaveMessage('');
    try {
      await onChange(enabled, config);
      setSaveMessage(enabled ? '✅ Course par équipes activée' : '✅ Course par équipes désactivée');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const toggleTeamType = (type: string) => {
    const currentTypes = config.team_types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];

    updateConfig({ team_types: newTypes });
  };

  return (
    <div className="space-y-6">
      {/* Save Status Message */}
      {saveMessage && (
        <div className={`p-3 rounded-lg border ${
          saveMessage.includes('✅')
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="text-sm font-medium">{saveMessage}</p>
        </div>
      )}

      {/* Enable Team Race Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Users className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Course par Équipes</h3>
              <p className="text-sm text-gray-600 mt-1">
                Activez cette option pour permettre les inscriptions par équipes (relais, ekiden, etc.)
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isTeamRace}
              onChange={(e) => toggleTeamRace(e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
          </label>
        </div>
        {saving && (
          <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Enregistrement en cours...
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      {isTeamRace && (
        <div className="space-y-6">
          {/* Relay Segments Configuration */}
          <RelaySegmentsManager raceId={raceId} isTeamRace={isTeamRace} />

          {/* Team Size Configuration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-5 h-5 text-gray-700" />
              <h4 className="font-semibold text-gray-900">Taille des Équipes</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre minimum de membres
                </label>
                <input
                  type="number"
                  min="2"
                  max={config.max_members}
                  value={config.min_members}
                  onChange={(e) => updateConfig({ min_members: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre maximum de membres
                </label>
                <input
                  type="number"
                  min={config.min_members}
                  max="20"
                  value={config.max_members}
                  onChange={(e) => updateConfig({ max_members: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.require_full_team}
                  onChange={(e) => updateConfig({ require_full_team: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Exiger une équipe complète (nombre maximum atteint)
                </span>
              </label>
            </div>
          </div>

          {/* Team Types */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-gray-700" />
              <h4 className="font-semibold text-gray-900">Types d'Équipes Autorisés</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TEAM_TYPES.map((type) => (
                <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.team_types?.includes(type.value)}
                    onChange={() => toggleTeamType(type.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.allow_mixed_gender}
                  onChange={(e) => updateConfig({ allow_mixed_gender: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Autoriser les équipes mixtes (hommes et femmes)
                </span>
              </label>
            </div>
          </div>

          {/* Team Composition Rules (Gender-based) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <RaceTeamRulesConfig
              teamSize={config.max_members}
              initialRules={config.team_rules}
              onChange={(rules) => updateConfig({ team_rules: rules })}
            />
          </div>

          {/* Payment Configuration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="w-5 h-5 text-gray-700" />
              <h4 className="font-semibold text-gray-900">Mode de Paiement</h4>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment_mode"
                  value="team"
                  checked={config.payment_mode === 'team'}
                  onChange={(e) => updateConfig({ payment_mode: e.target.value as 'team' })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Paiement par équipe</div>
                  <div className="text-xs text-gray-500">Le capitaine paie pour toute l'équipe</div>
                </div>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment_mode"
                  value="individual"
                  checked={config.payment_mode === 'individual'}
                  onChange={(e) => updateConfig({ payment_mode: e.target.value as 'individual' })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Paiement individuel</div>
                  <div className="text-xs text-gray-500">Chaque membre paie son inscription</div>
                </div>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment_mode"
                  value="flexible"
                  checked={config.payment_mode === 'flexible'}
                  onChange={(e) => updateConfig({ payment_mode: e.target.value as 'flexible' })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Flexible</div>
                  <div className="text-xs text-gray-500">Le capitaine choisit lors de l'inscription</div>
                </div>
              </label>
            </div>
          </div>

          {/* Modification Deadline */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-700" />
              <h4 className="font-semibold text-gray-900">Délai de Modification</h4>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de jours avant la course pour modifier l'équipe
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={config.modify_deadline_days}
                onChange={(e) => updateConfig({ modify_deadline_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Les équipes pourront être modifiées jusqu'à {config.modify_deadline_days} jour(s) avant la course
              </p>
            </div>
          </div>

          {/* Bib Number Configuration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Hash className="w-5 h-5 text-gray-700" />
              <h4 className="font-semibold text-gray-900">Numérotation des Dossards</h4>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="bib_format"
                  value="suffix"
                  checked={config.bib_format === 'suffix'}
                  onChange={(e) => updateConfig({ bib_format: e.target.value as 'suffix' })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Avec suffixe</div>
                  <div className="text-xs text-gray-500">Ex: 1001-A, 1001-B, 1001-C...</div>
                </div>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="bib_format"
                  value="sequential"
                  checked={config.bib_format === 'sequential'}
                  onChange={(e) => updateConfig({ bib_format: e.target.value as 'sequential' })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Séquentiel</div>
                  <div className="text-xs text-gray-500">Ex: 1001, 1002, 1003...</div>
                </div>
              </label>
            </div>

            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.auto_assign_bibs}
                  onChange={(e) => updateConfig({ auto_assign_bibs: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Attribution automatique des dossards à la validation de l'équipe
                </span>
              </label>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-5 h-5 text-gray-700" />
              <h4 className="font-semibold text-gray-900">Options Avancées</h4>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.allow_multi_registration}
                  onChange={(e) => updateConfig({ allow_multi_registration: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Autoriser les inscriptions multiples
                  </div>
                  <div className="text-xs text-gray-500">
                    Un même coureur peut s'inscrire dans plusieurs équipes
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Summary Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Configuration Résumée</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Équipes de {config.min_members} à {config.max_members} membres</li>
                  <li>Types autorisés : {config.team_types?.join(', ') || 'Aucun'}</li>
                  <li>Mode de paiement : {config.payment_mode === 'team' ? 'Par équipe' : config.payment_mode === 'individual' ? 'Individuel' : 'Flexible'}</li>
                  <li>Modification possible jusqu'à {config.modify_deadline_days} jour(s) avant</li>
                  <li>Format dossards : {config.bib_format === 'suffix' ? 'Avec suffixe' : 'Séquentiel'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
