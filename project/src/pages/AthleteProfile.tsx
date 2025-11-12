import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  User, Award, Trophy, Calendar, MapPin, Mail, Eye, EyeOff,
  TrendingUp, Activity, Clock, Medal, LogOut, ExternalLink, Shield, ArrowLeft
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

interface AthleteProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  birthdate: string;
  gender: string;
  city: string;
  nationality: string;
  is_public: boolean;
  timepulse_index: number;
  total_races: number;
  total_podiums: number;
  license_number?: string;
  license_club?: string;
}

interface Result {
  id: string;
  race_id: string;
  overall_rank: number;
  category_rank: number;
  gender_rank: number;
  finish_time: string;
  gun_time: string;
  status: string;
  bib_number: number;
  race: {
    name: string;
    distance: number;
    event: {
      name: string;
      slug: string;
      start_date: string;
      city: string;
    };
  };
}

export default function AthleteProfile() {
  const navigate = useNavigate();
  const { athleteId } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    loadProfile();
    loadResults();
  }, [athleteId]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Si un athleteId est fourni (mode admin)
      if (athleteId) {
        // Vérifier que l'utilisateur est admin
        if (user) {
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (!adminUser) {
            navigate('/');
            return;
          }
          setIsAdmin(true);
        }

        // Charger le profil de l'athlète spécifique
        const { data, error } = await supabase
          .from('athlete_stats')
          .select('*')
          .eq('id', athleteId)
          .single();

        if (error) throw error;
        setProfile(data);
        setIsOwnProfile(false);
      } else {
        // Mode normal : profil de l'utilisateur connecté
        if (!user) {
          navigate('/athlete/login');
          return;
        }

        const { data, error } = await supabase
          .from('athlete_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        setIsOwnProfile(true);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      // Utiliser l'athleteId si fourni, sinon charger pour l'utilisateur connecté
      let targetAthleteId = athleteId;

      if (!targetAthleteId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: athlete } = await supabase
          .from('athletes')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!athlete) return;
        targetAthleteId = athlete.id;
      }

      const { data, error } = await supabase
        .from('results')
        .select(`
          id,
          race_id,
          overall_rank,
          category_rank,
          gender_rank,
          finish_time,
          gun_time,
          status,
          bib_number,
          races:race_id (
            name,
            distance,
            events:event_id (
              name,
              slug,
              start_date,
              city
            )
          )
        `)
        .eq('athlete_id', targetAthleteId)
        .eq('status', 'finished')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Erreur chargement résultats:', error);
    }
  };

  const handleToggleVisibility = async () => {
    if (!profile) return;

    setSavingVisibility(true);
    try {
      const { error } = await supabase
        .from('athletes')
        .update({ is_public: !profile.is_public })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, is_public: !profile.is_public });
    } catch (error: any) {
      alert('Erreur : ' + error.message);
    } finally {
      setSavingVisibility(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    const match = time.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, hours, minutes, seconds] = match;
      return `${hours}h${minutes}m${seconds}s`;
    }
    return time;
  };

  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          <p className="mt-4 text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Aucun profil athlète trouvé</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Admin Badge & Back Button */}
        {isAdmin && (
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => navigate('/admin/athletes')}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la liste</span>
            </button>
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg border border-blue-200">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Mode Administrateur</span>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg shadow-xl p-8 text-white mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-pink-600">
                  {profile.first_name[0]}{profile.last_name[0]}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {profile.first_name} {profile.last_name}
                </h1>
                <div className="flex items-center space-x-4 text-pink-100">
                  {profile.city && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {profile.city}
                    </div>
                  )}
                  {profile.birthdate && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {calculateAge(profile.birthdate)} ans
                    </div>
                  )}
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {profile.email}
                  </div>
                </div>
              </div>
            </div>
            {isOwnProfile && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Indice Timepulse</p>
                <p className="text-3xl font-bold text-pink-600">{profile.timepulse_index}</p>
              </div>
              <Award className="w-12 h-12 text-pink-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Courses</p>
                <p className="text-3xl font-bold text-gray-900">{profile.total_races}</p>
              </div>
              <Activity className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Podiums</p>
                <p className="text-3xl font-bold text-yellow-600">{profile.total_podiums}</p>
              </div>
              <Trophy className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            {isOwnProfile ? (
              <button
                onClick={handleToggleVisibility}
                disabled={savingVisibility}
                className="w-full h-full flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 rounded-lg transition"
              >
                {profile.is_public ? (
                  <>
                    <Eye className="w-12 h-12 text-green-500" />
                    <p className="text-sm font-medium text-green-600">Profil Public</p>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-12 h-12 text-gray-400" />
                    <p className="text-sm font-medium text-gray-600">Profil Privé</p>
                  </>
                )}
                <p className="text-xs text-gray-500">Cliquer pour changer</p>
              </button>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
                {profile.is_public ? (
                  <>
                    <Eye className="w-12 h-12 text-green-500" />
                    <p className="text-sm font-medium text-green-600">Profil Public</p>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-12 h-12 text-gray-400" />
                    <p className="text-sm font-medium text-gray-600">Profil Privé</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* License Info */}
        {(profile.license_number || profile.license_club) && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Medal className="w-5 h-5 mr-2 text-pink-600" />
              Licence
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.license_number && (
                <div>
                  <p className="text-sm text-gray-600">Numéro de licence</p>
                  <p className="text-lg font-medium text-gray-900">{profile.license_number}</p>
                </div>
              )}
              {profile.license_club && (
                <div>
                  <p className="text-sm text-gray-600">Club</p>
                  <p className="text-lg font-medium text-gray-900">{profile.license_club}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-pink-600" />
              Historique des résultats
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Aucun résultat pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Événement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Dossard
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Classement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Temps
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {result.race?.event?.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {result.race?.event?.city}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{result.race?.name}</div>
                        <div className="text-sm text-gray-500">
                          {result.race?.distance ? `${result.race.distance}km` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          #{result.bib_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {result.overall_rank <= 3 && (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {result.overall_rank}e
                            </div>
                            <div className="text-xs text-gray-500">
                              Cat: {result.category_rank}e
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          {formatTime(result.finish_time || result.gun_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <a
                          href={`/resultats/${result.race?.event?.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-pink-600 hover:text-pink-900"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
