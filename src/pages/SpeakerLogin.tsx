import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SpeakerLogin() {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessCode || accessCode.length !== 8) {
      setError('Le code doit contenir exactement 8 caractères');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('[SpeakerLogin] Attempting login with code:', accessCode);

      // Verify access code and get speaker access details
      const { data: speakerAccess, error: accessError } = await supabase
        .from('speaker_access')
        .select(`
          *,
          events:event_id (
            id,
            name,
            start_date,
            end_date,
            city
          ),
          organizers:organizer_id (
            organization_name
          )
        `)
        .eq('access_code', accessCode.toUpperCase())
        .maybeSingle();

      console.log('[SpeakerLogin] Query result:', { speakerAccess, accessError });

      if (accessError) {
        console.error('[SpeakerLogin] Database error:', accessError);
        setError('Erreur lors de la vérification du code. Réessayez.');
        setLoading(false);
        return;
      }

      if (!speakerAccess) {
        console.warn('[SpeakerLogin] No access found for code');
        setError('Code d\'accès invalide. Vérifiez le code fourni par l\'organisateur.');
        setLoading(false);
        return;
      }

      // Check if access is enabled
      console.log('[SpeakerLogin] Access enabled:', speakerAccess.is_enabled);
      if (!speakerAccess.is_enabled) {
        setError('L\'accès speaker a été désactivé par l\'organisateur.');
        setLoading(false);
        return;
      }

      // Check if access is within valid dates
      const now = new Date();
      const startDate = new Date(speakerAccess.start_date);
      const endDate = new Date(speakerAccess.end_date);

      if (now < startDate) {
        setError(`L'accès sera disponible à partir du ${startDate.toLocaleDateString('fr-FR')}`);
        setLoading(false);
        return;
      }

      if (now > endDate) {
        setError('La période d\'accès est expirée. Contactez l\'organisateur.');
        setLoading(false);
        return;
      }

      // Log the connection
      await supabase
        .from('speaker_activity_log')
        .insert({
          speaker_access_id: speakerAccess.id,
          action: 'Connexion réussie',
          details: {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
          }
        });

      // Store access in sessionStorage
      const accessData = {
        id: speakerAccess.id,
        event_id: speakerAccess.event_id,
        access_code: speakerAccess.access_code,
        speaker_name: speakerAccess.speaker_name,
        event: speakerAccess.events,
        organizer: speakerAccess.organizers,
        permissions: {
          show_reference_times: speakerAccess.show_reference_times,
          show_timepulse_index: speakerAccess.show_timepulse_index,
          show_betrail_index: speakerAccess.show_betrail_index,
          show_utmb_index: speakerAccess.show_utmb_index,
          show_history: speakerAccess.show_history,
          show_statistics: speakerAccess.show_statistics,
        },
        custom_notes: speakerAccess.custom_notes,
      };

      console.log('[SpeakerLogin] Storing in sessionStorage:', accessData);
      sessionStorage.setItem('speaker_access', JSON.stringify(accessData));

      setSuccess('Connexion réussie ! Redirection...');
      console.log('[SpeakerLogin] Navigating to:', `/speaker/dashboard/${speakerAccess.event_id}`);

      setTimeout(() => {
        navigate(`/speaker/dashboard/${speakerAccess.event_id}`);
      }, 1500);

    } catch (err: any) {
      console.error('Login error:', err);
      setError('Erreur lors de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-2 rounded-lg">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Module Speaker</h1>
                <p className="text-xs text-gray-600">Timepulse</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Mic className="w-12 h-12 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Connexion Speaker
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Accédez aux données des participants pour préparer vos commentaires
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="access-code" className="block text-sm font-medium text-gray-700 mb-2">
                  Code d'accès
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="access-code"
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono font-bold tracking-widest uppercase focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="XXXXXXXX"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Saisissez le code à 8 caractères fourni par l'organisateur
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !accessCode}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg hover:from-rose-700 hover:to-pink-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Vérification...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Respect de la confidentialité</p>
                <p>
                  En vous connectant, vous accédez à des données personnelles limitées des participants.
                  Ces informations doivent rester confidentielles et être utilisées uniquement dans le cadre
                  de votre mission de commentateur.
                </p>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Vous n'avez pas de code d'accès ?{' '}
              <a href="mailto:contact@timepulse.fr" className="text-rose-600 hover:text-rose-700 font-medium">
                Contactez l'organisateur
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500">
            Module Speaker by Timepulse - Tous droits réservés © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
