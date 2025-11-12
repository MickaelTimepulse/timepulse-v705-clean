import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Calendar,
  MapPin,
  Mail,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EventStats {
  totalEntries: number;
  confirmedEntries: number;
  pendingEntries: number;
  totalRevenue: number;
  averagePrice: number;
  entriesByDay: Array<{ date: string; count: number }>;
  entriesByRace: Array<{ raceName: string; count: number }>;
  entriesByGender: Array<{ gender: string; count: number }>;
  entriesByCategory: Array<{ category: string; count: number }>;
  recentEntries: Array<{
    id: string;
    athleteName: string;
    raceName: string;
    createdAt: string;
    status: string;
  }>;
}

export default function OrganizerStats() {
  const { eventId } = useParams<{ eventId: string }>();
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    if (eventId) {
      loadStats();
    }
  }, [eventId, timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Total des inscriptions
      const { count: totalEntries } = await supabase
        .from('entries')
        .select('*', { count: 'exact', head: true })
        .eq('race_id', eventId);

      // Inscriptions confirmées
      const { count: confirmedEntries } = await supabase
        .from('entries')
        .select('*', { count: 'exact', head: true })
        .eq('race_id', eventId)
        .eq('status', 'confirmed');

      // Inscriptions en attente
      const { count: pendingEntries } = await supabase
        .from('entries')
        .select('*', { count: 'exact', head: true })
        .eq('race_id', eventId)
        .eq('status', 'pending');

      // Revenus totaux (calculés côté client pour l'exemple)
      const { data: entries } = await supabase
        .from('entries')
        .select('price_paid')
        .eq('race_id', eventId)
        .eq('status', 'confirmed');

      const totalRevenue = entries?.reduce((sum, e) => sum + (e.price_paid || 0), 0) || 0;
      const averagePrice = confirmedEntries ? totalRevenue / confirmedEntries : 0;

      // Inscriptions par jour (30 derniers jours)
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: dailyEntries } = await supabase
        .from('entries')
        .select('created_at')
        .eq('race_id', eventId)
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      const entriesByDay = groupByDay(dailyEntries || []);

      // Inscriptions par course
      const { data: raceEntries } = await supabase
        .from('entries')
        .select(`
          race:races(name),
          id
        `)
        .eq('race_id', eventId);

      const entriesByRace = groupByField(raceEntries || [], 'race.name');

      // Inscriptions par genre
      const { data: athleteData } = await supabase
        .from('entries')
        .select(`
          athlete:athletes(gender)
        `)
        .eq('race_id', eventId);

      const entriesByGender = groupByField(athleteData || [], 'athlete.gender');

      // Inscriptions par catégorie
      const { data: categoryData } = await supabase
        .from('entries')
        .select('category')
        .eq('race_id', eventId);

      const entriesByCategory = groupByField(categoryData || [], 'category');

      // Inscriptions récentes (10 dernières)
      const { data: recentEntries } = await supabase
        .from('entries')
        .select(`
          id,
          status,
          created_at,
          athlete:athletes(first_name, last_name),
          race:races(name)
        `)
        .eq('race_id', eventId)
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalEntries: totalEntries || 0,
        confirmedEntries: confirmedEntries || 0,
        pendingEntries: pendingEntries || 0,
        totalRevenue,
        averagePrice,
        entriesByDay,
        entriesByRace,
        entriesByGender,
        entriesByCategory,
        recentEntries: recentEntries?.map(e => ({
          id: e.id,
          athleteName: `${e.athlete?.first_name} ${e.athlete?.last_name}`,
          raceName: e.race?.name || 'N/A',
          createdAt: e.created_at,
          status: e.status,
        })) || [],
      });

    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByDay = (entries: Array<{ created_at: string }>) => {
    const grouped: Record<string, number> = {};

    entries.forEach(entry => {
      const date = new Date(entry.created_at).toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const groupByField = (data: any[], field: string) => {
    const grouped: Record<string, number> = {};

    data.forEach(item => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], item) || 'Non défini';
      grouped[value] = (grouped[value] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([name, count]) => ({ [field.split('.').pop()!]: name, count }))
      .sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-600 mt-1">Analyse des inscriptions et revenus</p>
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
          <option value="all">Tout</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Inscrits</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEntries}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-green-600 font-medium">
              {stats.confirmedEntries} confirmés
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-orange-600">
              {stats.pendingEntries} en attente
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenus Totaux</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalRevenue.toFixed(2)} €
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Moyenne: {stats.averagePrice.toFixed(2)} € / inscription
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux de Conversion</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalEntries > 0
                  ? ((stats.confirmedEntries / stats.totalEntries) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {stats.confirmedEntries} / {stats.totalEntries} inscriptions
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inscriptions / Jour</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.entriesByDay.length > 0
                  ? (stats.totalEntries / stats.entriesByDay.length).toFixed(1)
                  : 0}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Sur {stats.entriesByDay.length} jours
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inscriptions par jour */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Inscriptions par Jour
          </h3>
          <div className="space-y-2">
            {stats.entriesByDay.slice(-10).map((day, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24">
                  {new Date(day.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full flex items-center justify-end pr-2"
                    style={{
                      width: `${(day.count / Math.max(...stats.entriesByDay.map(d => d.count))) * 100}%`,
                    }}
                  >
                    <span className="text-xs font-medium text-white">{day.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inscriptions par course */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Inscriptions par Course
          </h3>
          <div className="space-y-2">
            {stats.entriesByRace.map((race: any, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 flex-1 truncate">
                  {race.raceName || 'N/A'}
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-green-600 h-full rounded-full flex items-center justify-end pr-2"
                    style={{
                      width: `${(race.count / stats.totalEntries) * 100}%`,
                    }}
                  >
                    <span className="text-xs font-medium text-white">{race.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par genre */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Répartition par Genre
          </h3>
          <div className="space-y-4">
            {stats.entriesByGender.map((item: any, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {item.gender === 'M' ? 'Hommes' : item.gender === 'F' ? 'Femmes' : 'Autre'}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.count} ({((item.count / stats.totalEntries) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.gender === 'M' ? 'bg-blue-600' : 'bg-pink-600'
                    }`}
                    style={{ width: `${(item.count / stats.totalEntries) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inscriptions récentes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Inscriptions Récentes
          </h3>
          <div className="space-y-3">
            {stats.recentEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{entry.athleteName}</p>
                  <p className="text-xs text-gray-600">{entry.raceName}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                    entry.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {entry.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(entry.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
