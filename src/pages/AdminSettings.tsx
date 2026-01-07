import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute';
import { Settings as SettingsIcon, Lock, User, Save, Sparkles, Eye, EyeOff, Mail, ArrowRight, Youtube, Power, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updatePassword } from '../lib/auth';
import { supabase } from '../lib/supabase';
import FFASettings from '../components/Admin/FFASettings';

export default function AdminSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [apiKeyMessage, setApiKeyMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [oximailingUser, setOximailingUser] = useState('');
  const [oximailingPassword, setOximailingPassword] = useState('');
  const [oximailingFrom, setOximailingFrom] = useState('');
  const [oximailingFromName, setOximailingFromName] = useState('');
  const [showOximailingPassword, setShowOximailingPassword] = useState(false);
  const [savingOximailing, setSavingOximailing] = useState(false);
  const [oximailingMessage, setOximailingMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);
  const [savingYoutube, setSavingYoutube] = useState(false);
  const [youtubeMessage, setYoutubeMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [maintenanceStatusMessage, setMaintenanceStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'openai_api_key',
          'oximailing_api_user',
          'oximailing_api_password',
          'oximailing_default_from',
          'oximailing_default_from_name',
          'youtube_api_key',
          'maintenance_mode',
          'maintenance_message'
        ]);

      if (data) {
        data.forEach(setting => {
          switch (setting.key) {
            case 'openai_api_key':
              setOpenaiApiKey(setting.value || '');
              break;
            case 'oximailing_api_user':
              setOximailingUser(setting.value || '');
              break;
            case 'oximailing_api_password':
              setOximailingPassword(setting.value || '');
              break;
            case 'oximailing_default_from':
              setOximailingFrom(setting.value || '');
              break;
            case 'oximailing_default_from_name':
              setOximailingFromName(setting.value || '');
              break;
            case 'youtube_api_key':
              setYoutubeApiKey(setting.value || '');
              break;
            case 'maintenance_mode':
              setMaintenanceMode(setting.value === 'true');
              break;
            case 'maintenance_message':
              setMaintenanceMessage(setting.value || 'Nous effectuons actuellement une maintenance programmée pour améliorer votre expérience. Le site sera de nouveau disponible très prochainement.');
              break;
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function handleSaveApiKey() {
    setSavingApiKey(true);
    setApiKeyMessage(null);

    try {
      const { error } = await supabase
        .from('settings')
        .update({ value: openaiApiKey })
        .eq('key', 'openai_api_key');

      if (error) throw error;

      setApiKeyMessage({ type: 'success', text: 'Clé API enregistrée avec succès' });
    } catch (error) {
      console.error('Error saving API key:', error);
      setApiKeyMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement de la clé API' });
    } finally {
      setSavingApiKey(false);
    }
  }

  async function handleSaveOximailing() {
    setSavingOximailing(true);
    setOximailingMessage(null);

    try {
      console.log('🔧 Saving Oximailing settings...');
      console.log('📧 User:', oximailingUser);
      console.log('📧 From:', oximailingFrom);
      console.log('📧 From Name:', oximailingFromName);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const settings = [
        { key: 'oximailing_api_user', value: oximailingUser },
        { key: 'oximailing_api_password', value: oximailingPassword },
        { key: 'oximailing_default_from', value: oximailingFrom },
        { key: 'oximailing_default_from_name', value: oximailingFromName }
      ];

      for (const setting of settings) {
        console.log(`Updating ${setting.key}...`);
        const { data, error } = await supabase.rpc('update_setting_as_admin', {
          p_key: setting.key,
          p_value: setting.value,
          p_admin_id: user.id
        });

        if (error) {
          console.error(`❌ Error updating ${setting.key}:`, error);
          throw error;
        }
        console.log(`✅ Updated ${setting.key}:`, data);
      }

      setOximailingMessage({ type: 'success', text: 'Configuration Oximailing enregistrée avec succès' });
    } catch (error: any) {
      console.error('❌ Error saving Oximailing settings:', error);
      setOximailingMessage({
        type: 'error',
        text: `Erreur : ${error.message || 'Erreur inconnue'}`
      });
    } finally {
      setSavingOximailing(false);
    }
  }

  async function handleSaveYoutube() {
    setSavingYoutube(true);
    setYoutubeMessage(null);

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'youtube_api_key',
          value: youtubeApiKey,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setYoutubeMessage({ type: 'success', text: 'Clé API YouTube enregistrée avec succès' });
    } catch (error: any) {
      console.error('Error saving YouTube API key:', error);
      setYoutubeMessage({ type: 'error', text: `Erreur : ${error.message}` });
    } finally {
      setSavingYoutube(false);
    }
  }

  async function handleToggleMaintenance() {
    setSavingMaintenance(true);
    setMaintenanceStatusMessage(null);

    try {
      const newMode = !maintenanceMode;

      // Mettre à jour le mode maintenance
      const { error: modeError } = await supabase
        .from('settings')
        .update({ value: String(newMode) })
        .eq('key', 'maintenance_mode');

      if (modeError) throw modeError;

      // Mettre à jour le message si modifié
      if (maintenanceMessage) {
        const { error: messageError } = await supabase
          .from('settings')
          .update({ value: maintenanceMessage })
          .eq('key', 'maintenance_message');

        if (messageError) throw messageError;
      }

      setMaintenanceMode(newMode);
      setMaintenanceStatusMessage({
        type: 'success',
        text: newMode
          ? '🔴 Mode maintenance ACTIVÉ - Le site affiche maintenant la page de maintenance'
          : '🟢 Mode maintenance DÉSACTIVÉ - Le site est de nouveau accessible'
      });

      // Recharger la page après 2 secondes si on active la maintenance
      if (newMode) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error toggling maintenance mode:', error);
      setMaintenanceStatusMessage({
        type: 'error',
        text: `Erreur : ${error.message}`
      });
    } finally {
      setSavingMaintenance(false);
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }

    setLoading(true);

    try {
      if (user?.id) {
        const success = await updatePassword(user.id, newPassword);

        if (success) {
          setMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          setMessage({ type: 'error', text: 'Erreur lors de la modification du mot de passe' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Une erreur est survenue' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedAdminRoute module="settings" permission="view" title="Paramètres">
      <AdminLayout title="Paramètres">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-1">Gérez vos paramètres et votre compte</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{user?.name || 'Admin'}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                  {user?.role === 'super_admin' ? 'Super Admin' : user?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Mode Maintenance */}
            <div className="bg-white rounded-lg shadow p-6 border-2 border-orange-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  maintenanceMode ? 'bg-red-100' : 'bg-orange-100'
                }`}>
                  <Power className={`w-5 h-5 ${maintenanceMode ? 'text-red-600' : 'text-orange-600'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Mode Maintenance</h3>
                  <p className="text-sm text-gray-600">
                    {maintenanceMode
                      ? '🔴 Le site est actuellement en maintenance'
                      : 'Activer le mode maintenance pour bloquer l\'accès public'}
                  </p>
                </div>
              </div>

              {maintenanceStatusMessage && (
                <div className={`mb-4 p-4 rounded-lg ${
                  maintenanceStatusMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {maintenanceStatusMessage.text}
                </div>
              )}

              {maintenanceMode && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">Le site est actuellement en maintenance</p>
                    <p>Les visiteurs voient une page de maintenance avec le message ci-dessous. Seuls les administrateurs peuvent accéder à l'interface d'administration.</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="maintenance-message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message de maintenance
                  </label>
                  <textarea
                    id="maintenance-message"
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Message affiché sur la page de maintenance..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ce message sera affiché aux visiteurs pendant la maintenance
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMaintenance}
                  disabled={savingMaintenance}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    maintenanceMode
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
                  }`}
                >
                  <Power className="w-5 h-5" />
                  <span>
                    {savingMaintenance
                      ? 'Modification en cours...'
                      : maintenanceMode
                        ? '🟢 Désactiver la maintenance'
                        : '🔴 Activer la maintenance'}
                  </span>
                </button>

                <div className={`border rounded-lg p-4 ${
                  maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                }`}>
                  <h4 className="text-sm font-semibold mb-2 ${maintenanceMode ? 'text-red-900' : 'text-orange-900'}">
                    À propos du mode maintenance
                  </h4>
                  <ul className={`text-xs space-y-1 ${maintenanceMode ? 'text-red-800' : 'text-orange-800'}`}>
                    <li>• Active une page de maintenance professionnelle avec l'image Tour Eiffel</li>
                    <li>• Bloque l'accès public au site (sauf administrateurs)</li>
                    <li>• Les admins peuvent toujours accéder à l'interface d'administration</li>
                    <li>• Le message personnalisé s'affiche sur la page de maintenance</li>
                    <li>• Design moderne avec animations et bouton de rafraîchissement</li>
                    <li>• Idéal pour les mises à jour, migrations ou interventions techniques</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Configuration OpenAI</h3>
                  <p className="text-sm text-gray-600">Clé API pour la génération de contenu IA</p>
                </div>
              </div>

              {apiKeyMessage && (
                <div className={`mb-4 p-4 rounded-lg ${
                  apiKeyMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {apiKeyMessage.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="openai-api-key" className="block text-sm font-medium text-gray-700 mb-2">
                    Clé API OpenAI
                  </label>
                  <div className="relative">
                    <input
                      id="openai-api-key"
                      type={showApiKey ? 'text' : 'password'}
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="sk-..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Votre clé API ChatGPT Pro.
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 ml-1"
                    >
                      Obtenir une clé →
                    </a>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  disabled={savingApiKey || !openaiApiKey}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingApiKey ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2">
                    💡 À propos de la clé API
                  </h4>
                  <ul className="text-xs text-purple-800 space-y-1">
                    <li>• Utilisée pour générer automatiquement des titres et descriptions SEO optimisés</li>
                    <li>• Génération de contenu pour les pages de service avec l'IA</li>
                    <li>• Votre clé est stockée de manière sécurisée dans la base de données</li>
                    <li>• Vous pouvez la modifier à tout moment</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Configuration Oximailing</h3>
                    <p className="text-sm text-gray-600">Paramètres d'envoi d'emails</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin/email-templates')}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Templates d'emails
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {oximailingMessage && (
                <div className={`mb-4 p-4 rounded-lg ${
                  oximailingMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {oximailingMessage.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="oximailing-user" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom d'utilisateur API
                  </label>
                  <input
                    id="oximailing-user"
                    type="text"
                    value={oximailingUser}
                    onChange={(e) => setOximailingUser(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="votre_utilisateur"
                  />
                </div>

                <div>
                  <label htmlFor="oximailing-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe API
                  </label>
                  <div className="relative">
                    <input
                      id="oximailing-password"
                      type={showOximailingPassword ? 'text' : 'password'}
                      value={oximailingPassword}
                      onChange={(e) => setOximailingPassword(e.target.value)}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOximailingPassword(!showOximailingPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showOximailingPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="oximailing-from" className="block text-sm font-medium text-gray-700 mb-2">
                    Email expéditeur par défaut
                  </label>
                  <input
                    id="oximailing-from"
                    type="email"
                    value={oximailingFrom}
                    onChange={(e) => setOximailingFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="noreply@timepulse.fr"
                  />
                </div>

                <div>
                  <label htmlFor="oximailing-from-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom expéditeur par défaut
                  </label>
                  <input
                    id="oximailing-from-name"
                    type="text"
                    value={oximailingFromName}
                    onChange={(e) => setOximailingFromName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Timepulse"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveOximailing}
                  disabled={savingOximailing || !oximailingUser || !oximailingPassword}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingOximailing ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>

                {oximailingMessage && (
                  <div className={`p-4 rounded-lg ${oximailingMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {oximailingMessage.text}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    À propos d'Oximailing
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Service d'envoi d'emails transactionnels et notifications</li>
                    <li>• Utilisé pour les confirmations d'inscription, alertes, etc.</li>
                    <li>• Vos identifiants sont stockés de manière sécurisée</li>
                    <li>• Documentation : <a href="https://api.oximailing.com" target="_blank" rel="noopener noreferrer" className="underline">api.oximailing.com</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <FFASettings />

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Youtube className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">API YouTube</h3>
                  <p className="text-sm text-gray-600">Configuration pour l'import automatique de vidéos</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="youtube-api-key" className="block text-sm font-medium text-gray-700 mb-2">
                    Clé API YouTube Data v3
                  </label>
                  <div className="relative">
                    <input
                      id="youtube-api-key"
                      type={showYoutubeKey ? 'text' : 'password'}
                      value={youtubeApiKey}
                      onChange={(e) => setYoutubeApiKey(e.target.value)}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="AIza..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showYoutubeKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveYoutube}
                  disabled={savingYoutube || !youtubeApiKey}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingYoutube ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>

                {youtubeMessage && (
                  <div className={`p-4 rounded-lg ${youtubeMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {youtubeMessage.text}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Comment obtenir une clé API YouTube ?
                  </h4>
                  <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Allez sur <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                    <li>Créez un nouveau projet ou sélectionnez-en un existant</li>
                    <li>Activez l'API "YouTube Data API v3"</li>
                    <li>Créez des identifiants (Clé API)</li>
                    <li>Copiez la clé API et collez-la ci-dessus</li>
                  </ol>
                  <p className="text-xs text-blue-700 mt-3">
                    <strong>Note:</strong> Cette clé permet d'importer automatiquement les vidéos depuis votre chaîne YouTube.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h3>
                  <p className="text-sm text-gray-600">Modifiez votre mot de passe de connexion</p>
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

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe actuel
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
    </ProtectedAdminRoute>
  );
}
