import { useState, useEffect } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import { supabase } from '../lib/supabase';
import {
  Search,
  Users,
  Award,
  TrendingUp,
  Filter,
  Download,
  Upload,
  Edit,
  Eye,
  Trash2,
  RefreshCw,
  Trophy,
  Calendar,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  ExternalLink,
  Info
} from 'lucide-react';

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  gender: string;
  email: string | null;
  slug: string | null;
  is_public: boolean;
  timepulse_index: number;
  has_user_account: boolean;
  total_races: number;
  total_podiums: number;
  last_race_date: string | null;
  created_at: string;
}

interface Stats {
  total_athletes: number;
  with_user_account: number;
  public_profiles: number;
  with_results: number;
  recent_signups: number;
}

export default function AdminAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string | null>(null);
  const [hasAccountFilter, setHasAccountFilter] = useState<boolean | null>(null);
  const [isPublicFilter, setIsPublicFilter] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showIndexInfo, setShowIndexInfo] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const pageSize = 50;

  useEffect(() => {
    loadStats();
    loadAthletes();
  }, [search, genderFilter, hasAccountFilter, isPublicFilter, currentPage]);

  const loadStats = async () => {
    try {
      // Utiliser directement les queries Supabase au lieu de RPC
      const [
        { count: total },
        { count: withAccount },
        { count: publicProfiles },
        { count: withResults }
      ] = await Promise.all([
        supabase.from('athletes').select('*', { count: 'exact', head: true }),
        supabase.from('athletes').select('*', { count: 'exact', head: true }).not('user_id', 'is', null),
        supabase.from('athletes').select('*', { count: 'exact', head: true }).eq('is_public', true),
        supabase.from('results').select('athlete_id', { count: 'exact', head: true }).not('athlete_id', 'is', null)
      ]);

      setStats({
        total_athletes: total || 0,
        with_user_account: withAccount || 0,
        public_profiles: publicProfiles || 0,
        with_results: withResults || 0,
        recent_signups: 0
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const loadAthletes = async () => {
    setLoading(true);
    try {
      // Utiliser la vue athlete_stats qui inclut déjà les statistiques
      let query = supabase
        .from('athlete_stats')
        .select('*')
        .order('last_name', { ascending: true })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (genderFilter) {
        query = query.eq('gender', genderFilter);
      }
      if (hasAccountFilter !== null) {
        query = query.eq('has_user_account', hasAccountFilter);
      }
      if (isPublicFilter !== null) {
        query = query.eq('is_public', isPublicFilter);
      }

      const { data: athletesData, error } = await query;

      if (error) throw error;

      // Mapper directement les données depuis la vue
      setAthletes((athletesData || []).map(a => ({
        id: a.id,
        first_name: a.first_name,
        last_name: a.last_name,
        birthdate: a.birthdate,
        gender: a.gender,
        email: a.email,
        slug: a.slug,
        is_public: a.is_public || false,
        timepulse_index: a.timepulse_index || 0,
        has_user_account: a.has_user_account || false,
        total_races: a.total_races || 0,
        total_podiums: a.total_podiums || 0,
        last_race_date: a.last_race_date || null,
        created_at: a.created_at
      })));
    } catch (error) {
      console.error('Erreur chargement athlètes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateIndex = async (athleteId: string) => {
    try {
      const { data, error } = await supabase.rpc('admin_recalculate_athlete_index', {
        p_athlete_id: athleteId
      });

      if (error) throw error;
      alert(`Indice recalculé : ${data}`);
      loadAthletes();
    } catch (error: any) {
      alert('Erreur : ' + error.message);
    }
  };

  const handleTogglePublic = async (athlete: Athlete) => {
    try {
      const { error } = await supabase.rpc('admin_update_athlete', {
        p_athlete_id: athlete.id,
        p_is_public: !athlete.is_public
      });

      if (error) throw error;
      loadAthletes();
    } catch (error: any) {
      alert('Erreur : ' + error.message);
    }
  };

  const handleEditAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setEditForm({
      first_name: athlete.first_name,
      last_name: athlete.last_name,
      birthdate: athlete.birthdate,
      gender: athlete.gender,
      email: athlete.email || '',
      is_public: athlete.is_public
    });
  };

  const handleSaveAthlete = async () => {
    if (!selectedAthlete) return;

    setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_update_athlete', {
        p_athlete_id: selectedAthlete.id,
        p_first_name: editForm.first_name,
        p_last_name: editForm.last_name,
        p_birthdate: editForm.birthdate,
        p_gender: editForm.gender,
        p_email: editForm.email || null,
        p_is_public: editForm.is_public
      });

      if (error) throw error;

      setSelectedAthlete(null);
      setEditForm({});
      loadAthletes();
      alert('Athlète modifié avec succès !');
    } catch (error: any) {
      alert('Erreur : ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Gestion des Athlètes">
      <div className="space-y-6">
        {/* Méthode de calcul de l'Indice Timepulse */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm border border-blue-200 overflow-hidden">
          <button
            onClick={() => setShowIndexInfo(!showIndexInfo)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Méthode de Calcul de l'Indice Timepulse™</h3>
                <p className="text-sm text-gray-600">Comprendre comment l'indice est calculé pour chaque athlète</p>
              </div>
            </div>
            <div className={`transform transition-transform ${showIndexInfo ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showIndexInfo && (
            <div className="px-6 pb-6 space-y-4 border-t border-blue-200 bg-white">
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Formule globale (échelle 0-100)</h4>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 font-mono text-sm">
                  Indice = (Performance × 40%) + (Progression × 25%) + (Régularité × 20%) + (Polyvalence × 10%) + (Podiums × 5%)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h5 className="font-semibold text-gray-900">1. Performance (40%)</h5>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Meilleur temps sur 10km comparé aux références</p>
                  <ul className="text-xs text-gray-500 space-y-1 pl-4">
                    <li>• 35 min = 100 points</li>
                    <li>• 60 min = 0 points</li>
                    <li>• Score par défaut : 30 points si pas de 10km</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h5 className="font-semibold text-gray-900">2. Progression (25%)</h5>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Amélioration sur 6 mois</p>
                  <ul className="text-xs text-gray-500 space-y-1 pl-4">
                    <li>• Compare les 3 derniers mois vs 3 mois précédents</li>
                    <li>• -10% = 0 pts, 0% = 50 pts, +10% = 100 pts</li>
                    <li>• Score neutre : 50 points si données insuffisantes</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <h5 className="font-semibold text-gray-900">3. Régularité (20%)</h5>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Nombre de courses sur 12 mois</p>
                  <ul className="text-xs text-gray-500 space-y-1 pl-4">
                    <li>• 0-5 courses = 20 points</li>
                    <li>• 6-10 courses = 50 points</li>
                    <li>• 11-20 courses = 80 points</li>
                    <li>• 20+ courses = 100 points</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <h5 className="font-semibold text-gray-900">4. Polyvalence (10%)</h5>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Nombre de disciplines pratiquées</p>
                  <ul className="text-xs text-gray-500 space-y-1 pl-4">
                    <li>• 1 discipline = 30 points</li>
                    <li>• 2 disciplines = 60 points</li>
                    <li>• 3+ disciplines = 100 points</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <h5 className="font-semibold text-gray-900">5. Podiums (5%)</h5>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Classements top 3</p>
                  <ul className="text-xs text-gray-500 space-y-1 pl-4">
                    <li>• 0 podium = 0 points</li>
                    <li>• 1-3 podiums = 40 points</li>
                    <li>• 4-10 podiums = 70 points</li>
                    <li>• 10+ podiums = 100 points</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <h5 className="font-semibold text-gray-900">Recalcul</h5>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Automatique après chaque nouveau résultat</li>
                    <li>• Historique conservé dans timepulse_index_history</li>
                    <li>• Possibilité de recalcul manuel par athlète</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Note importante :</strong> L'indice est conçu pour évoluer dans le temps et refléter la forme actuelle de l'athlète,
                    pas seulement ses performances passées. Un athlète régulier et en progression aura un meilleur indice qu'un athlète
                    performant mais irrégulier.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              icon={Users}
              label="Total Athlètes"
              value={stats.total_athletes}
              color="bg-blue-500"
            />
            <StatCard
              icon={CheckCircle}
              label="Avec Compte"
              value={stats.with_user_account}
              color="bg-green-500"
            />
            <StatCard
              icon={Eye}
              label="Profils Publics"
              value={stats.public_profiles}
              color="bg-purple-500"
            />
            <StatCard
              icon={Trophy}
              label="Avec Résultats"
              value={stats.with_results}
              color="bg-orange-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Nouveaux (30j)"
              value={stats.recent_signups}
              color="bg-pink-500"
            />
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(0);
                  }}
                  placeholder="Rechercher par nom, prénom, email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5" />
              <span>Filtres</span>
            </button>

            <button
              onClick={loadAthletes}
              className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Actualiser</span>
            </button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre
                </label>
                <select
                  value={genderFilter || ''}
                  onChange={(e) => {
                    setGenderFilter(e.target.value || null);
                    setCurrentPage(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Tous</option>
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compte utilisateur
                </label>
                <select
                  value={hasAccountFilter === null ? '' : hasAccountFilter.toString()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHasAccountFilter(val === '' ? null : val === 'true');
                    setCurrentPage(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Tous</option>
                  <option value="true">Avec compte</option>
                  <option value="false">Sans compte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibilité
                </label>
                <select
                  value={isPublicFilter === null ? '' : isPublicFilter.toString()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIsPublicFilter(val === '' ? null : val === 'true');
                    setCurrentPage(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Tous</option>
                  <option value="true">Public</option>
                  <option value="false">Privé</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Liste des athlètes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Athlète
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Naissance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Indice TP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                      Chargement...
                    </td>
                  </tr>
                ) : athletes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Aucun athlète trouvé
                    </td>
                  </tr>
                ) : (
                  athletes.map((athlete) => (
                    <tr key={athlete.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {athlete.first_name[0]}{athlete.last_name[0]}
                          </div>
                          <div className="ml-4">
                            <a
                              href={`/athlete/${athlete.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-pink-600 hover:text-pink-900 hover:underline"
                            >
                              {athlete.first_name} {athlete.last_name}
                            </a>
                            <div className="text-sm text-gray-500">
                              {athlete.gender === 'M' ? '👨' : '👩'} {athlete.gender}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(athlete.birthdate).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {athlete.email ? (
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {athlete.email}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Non renseigné</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-2 text-yellow-500" />
                          <span className="text-lg font-bold text-gray-900">
                            {athlete.timepulse_index}
                          </span>
                          <button
                            onClick={() => handleRecalculateIndex(athlete.id)}
                            className="ml-2 p-1 hover:bg-gray-100 rounded"
                            title="Recalculer l'indice"
                          >
                            <RefreshCw className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center text-gray-900">
                            <Trophy className="w-4 h-4 mr-1 text-orange-500" />
                            {athlete.total_races} courses
                          </div>
                          {athlete.total_podiums > 0 && (
                            <div className="flex items-center text-gray-600">
                              🏆 {athlete.total_podiums} podiums
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {athlete.has_user_account && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Compte
                            </span>
                          )}
                          {athlete.is_public ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Eye className="w-3 h-3 mr-1" />
                              Public
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Privé
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {athlete.slug && (
                            <a
                              href={`/athlete/${athlete.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                              title="Voir le profil public"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleTogglePublic(athlete)}
                            className={`p-2 rounded-lg ${
                              athlete.is_public
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            }`}
                            title={athlete.is_public ? 'Rendre privé' : 'Rendre public'}
                          >
                            {athlete.is_public ? <XCircle className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleEditAthlete(athlete)}
                            className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200"
                            title="Modifier"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {currentPage + 1}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={athletes.length < pageSize}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>

        {/* Modal d'édition */}
        {selectedAthlete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Modifier l'athlète
                </h3>
                <button
                  onClick={() => {
                    setSelectedAthlete(null);
                    setEditForm({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={editForm.first_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={editForm.last_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Date de naissance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={editForm.birthdate || ''}
                    onChange={(e) => setEditForm({ ...editForm, birthdate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <select
                    value={editForm.gender || ''}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>

                {/* Visibilité */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="edit-is-public"
                    checked={editForm.is_public || false}
                    onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <label htmlFor="edit-is-public" className="text-sm font-medium text-gray-700">
                    Profil public
                  </label>
                </div>

                {/* Informations supplémentaires */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Informations</p>
                      <ul className="space-y-1 text-xs">
                        <li>• ID: {selectedAthlete.id}</li>
                        <li>• Indice Timepulse: {selectedAthlete.timepulse_index}</li>
                        <li>• Courses: {selectedAthlete.total_races}</li>
                        <li>• Podiums: {selectedAthlete.total_podiums}</li>
                        <li>• Compte: {selectedAthlete.has_user_account ? 'Oui' : 'Non'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedAthlete(null);
                    setEditForm({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveAthlete}
                  disabled={saving}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
