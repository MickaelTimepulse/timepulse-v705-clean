import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import FFAConnectionMonitor from './FFAConnectionMonitor';

export default function FFASettings() {
  const { user } = useAuth();
  const [ffaApiUid, setFfaApiUid] = useState('');
  const [ffaApiPassword, setFfaApiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [testConnection, setTestConnection] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      // Utiliser la fonction RPC pour bypasser RLS
      const { data, error } = await supabase.rpc('get_ffa_settings');

      if (error) {
        console.error('[FFASettings] Error loading FFA settings:', error);
        return;
      }

      if (data && Array.isArray(data)) {
        console.log('[FFASettings] Found', data.length, 'settings');
        data.forEach(setting => {
          if (setting.key === 'ffa_api_uid') {
            console.log('[FFASettings] UID found:', setting.value ? '***' : 'null');
            setFfaApiUid(setting.value || '');
          } else if (setting.key === 'ffa_api_password') {
            console.log('[FFASettings] Password found:', setting.value ? '***' : 'null');
            setFfaApiPassword(setting.value || '');
          }
        });
      } else {
        console.log('[FFASettings] No FFA credentials found');
      }
    } catch (error) {
      console.error('[FFASettings] Error loading FFA settings:', error);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('[FFASettings] Saving credentials...');

      // Utiliser la fonction RPC pour éviter les problèmes RLS
      const { error: uidError } = await supabase.rpc('update_setting_as_admin', {
        p_key: 'ffa_api_uid',
        p_value: ffaApiUid,
        p_admin_id: user.id
      });

      if (uidError) {
        console.error('[FFASettings] UID save error:', uidError);
        throw uidError;
      }

      const { error: passwordError } = await supabase.rpc('update_setting_as_admin', {
        p_key: 'ffa_api_password',
        p_value: ffaApiPassword,
        p_admin_id: user.id
      });

      if (passwordError) {
        console.error('[FFASettings] Password save error:', passwordError);
        throw passwordError;
      }

      console.log('[FFASettings] Credentials saved successfully');
      setMessage({ type: 'success', text: 'Identifiants FFA enregistrés avec succès' });

      // Déclencher un test de connexion automatique après sauvegarde
      setTestConnection(false);
      setTimeout(() => setTestConnection(true), 500);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Erreur : ${error.message || 'Erreur inconnue'}`
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configuration FFA</h3>
          <p className="text-sm text-gray-600">Identifiants SIFFA pour le webservice de vérification des licences</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="ffa-api-uid" className="block text-sm font-medium text-gray-700 mb-2">
              Identifiant SIFFA (UID) <span className="text-red-500">*</span>
            </label>
            <input
              id="ffa-api-uid"
              type="text"
              value={ffaApiUid}
              onChange={(e) => setFfaApiUid(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: FOURCHEROT"
            />
            <p className="text-xs text-gray-500 mt-1">
              Identifiant utilisateur du système SIFFA (SI-FFA)
            </p>
          </div>

          <div>
            <label htmlFor="ffa-api-password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe SIFFA <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="ffa-api-password"
                type={showPassword ? 'text' : 'password'}
                value={ffaApiPassword}
                onChange={(e) => setFfaApiPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre mot de passe SIFFA"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Mot de passe de votre compte SIFFA
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !ffaApiUid || !ffaApiPassword}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTestConnection(false);
                setTimeout(() => setTestConnection(true), 100);
              }}
              disabled={!ffaApiUid || !ffaApiPassword}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Tester la connexion</span>
            </button>
          </div>
        </div>

        <FFAConnectionMonitor autoTest={testConnection} showDetails={true} />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            À propos de l'intégration FFA
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>Webservice officiel FFA</strong> pour la vérification des licences en temps réel</li>
            <li>• Permet de vérifier automatiquement les licences, Pass J'aime Courir et Cartes de Fidélité</li>
            <li>• Vérifie la validité, le type de licence et les besoins en certificat médical</li>
            <li>• <strong>Important :</strong> Vous devez être référencé dans SIFFA et affilié aux compétitions dans CALORG</li>
            <li>• Si vous n'avez pas de compte SIFFA, contactez : <strong>informatique@athle.fr</strong></li>
            <li>• Pour tester, utilisez le code compétition <code className="bg-blue-100 px-1 rounded">000000</code></li>
            <li>• <a href="https://siffa.athle.fr" target="_blank" rel="noopener noreferrer" className="underline font-medium">Accéder au SIFFA →</a></li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
            <span>⚠️</span> Règles FFA importantes
          </h4>
          <ul className="text-xs text-amber-800 space-y-1">
            <li>• <strong>Licenciés FFA (COMP, ENTR, LOISR) :</strong> Pas de certificat médical requis</li>
            <li>• <strong>Pass J'aime Courir (TP) :</strong> Doit être tamponné par un médecin</li>
            <li>• <strong>Non-licenciés majeurs (≥18 ans) :</strong> PSP (Pass Prévention Santé) obligatoire (validité 1 an)</li>
            <li>• <strong>Non-licenciés mineurs (&lt;18 ans) :</strong> Questionnaire de santé + autorisation parentale</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
