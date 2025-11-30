import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle, Calendar, User, Mail, Phone, MapPin, FileText } from 'lucide-react';

interface EntryData {
  id: string;
  management_code: string;
  registration_status: 'confirmed' | 'pending_documents' | 'documents_invalid';
  status_message: string | null;
  bib_number: string | null;
  athlete_id: string;
  race_id: string;
  event_id: string;
  payment_status: string;
  amount: number | null;
  created_at: string;
  last_modified_at: string;
  psp_expiry_warning_sent: boolean;
  athlete: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    birthdate: string;
    gender: string;
    license_type: string;
    license_id: string;
    license_club: string;
    psp_number: string;
    psp_expiry_date: string;
    medical_doc_url: string | null;
    license_doc_url: string | null;
    psp_doc_url: string | null;
  };
  race: {
    name: string;
  };
  event: {
    name: string;
    organizer_id: string;
    start_date: string;
  };
}

export default function ModifyRegistration() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<EntryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      loadEntry();
    }
  }, [code]);

  const loadEntry = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('entries')
        .select(`
          *,
          athlete:athletes(*),
          race:races(name),
          event:events(name, organizer_id, start_date)
        `)
        .eq('management_code', code)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Code de gestion invalide ou inscription introuvable.');
        return;
      }

      setEntry(data as unknown as EntryData);
    } catch (err: any) {
      console.error('Erreur chargement inscription:', err);
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre inscription...</p>
        </div>
      </div>
    );
  }

  if (error && !entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inscription introuvable</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!entry) return null;

  const daysUntilRace = Math.ceil((new Date(entry.event.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Gérer mon inscription</h1>
            <p className="text-blue-100">Code : {entry.management_code}</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informations de l'événement</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">{entry.event.name}</p>
                    <p className="text-sm text-gray-600">{entry.race.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(entry.event.start_date).toLocaleDateString('fr-FR')}
                      {daysUntilRace > 0 && <span className="text-blue-600 font-medium"> (J-{daysUntilRace})</span>}
                    </p>
                  </div>
                </div>
                {entry.bib_number && (
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Dossard</p>
                      <p className="text-2xl font-bold text-blue-600">#{entry.bib_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6 pb-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informations personnelles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">{entry.athlete.first_name} {entry.athlete.last_name}</p>
                    <p className="text-sm text-gray-600">Né(e) le {new Date(entry.athlete.birthdate).toLocaleDateString('fr-FR')}</p>
                    <p className="text-sm text-gray-600">{entry.athlete.license_type}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {entry.athlete.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{entry.athlete.email}</p>
                    </div>
                  )}
                  {entry.athlete.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{entry.athlete.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Statut de l'inscription</h2>
                {entry.registration_status === 'confirmed' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirmée
                  </span>
                )}
                {entry.registration_status === 'pending_documents' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Documents en attente
                  </span>
                )}
                {entry.registration_status === 'documents_invalid' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Documents invalides
                  </span>
                )}
              </div>

              {entry.status_message && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">{entry.status_message}</p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Inscription validée
                  </h3>
                  <p className="text-sm text-blue-800">
                    Votre inscription a été confirmée et votre {entry.athlete.license_type?.includes('FFA') ? 'licence FFA' : 'Pass Prévention Santé (PPS)'} a été validée automatiquement via l'API FFA.
                  </p>
                  {entry.bib_number && (
                    <p className="text-sm text-blue-800 mt-2">
                      <strong>Votre dossard :</strong> {entry.bib_number}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 underline"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}
