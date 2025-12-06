import { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertTriangle, Clock, Users, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/Admin/AdminLayout';

interface RegistrationStats {
  total_attempts: number;
  successful: number;
  failed: number;
  rate_limited: number;
  quota_exceeded: number;
  success_rate: number;
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  unique_ips: number;
  unique_sessions: number;
  period_hours: number;
}

interface RaceCapacity {
  race_id: string;
  race_name: string;
  event_id: string;
  event_name: string;
  start_date: string;
  max_participants: number;
  current_registrations: number;
  places_remaining: number;
  fill_percentage: number;
  capacity_status: 'available' | 'warning' | 'critical' | 'full';
}

interface HourlyStats {
  hour: string;
  total_attempts: number;
  successful: number;
  failed: number;
  rate_limited: number;
  quota_exceeded: number;
  avg_response_time_ms: number;
}

export default function AdminMonitoring() {
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [raceCapacities, setRaceCapacities] = useState<RaceCapacity[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodHours, setPeriodHours] = useState(24);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [periodHours]);

  const loadData = async () => {
    try {
      // Charger les stats globales
      const { data: statsData, error: statsError } = await supabase.rpc('get_registration_stats', {
        p_hours: periodHours
      });

      if (statsError) throw statsError;
      setStats(statsData);

      // Charger les capacités des courses
      const { data: capacitiesData, error: capacitiesError } = await supabase
        .from('v_race_capacity_status')
        .select('*')
        .order('fill_percentage', { ascending: false })
        .limit(20);

      if (capacitiesError) throw capacitiesError;
      setRaceCapacities(capacitiesData || []);

      // Charger les stats horaires
      const { data: hourlyData, error: hourlyError } = await supabase
        .from('v_registration_stats_hourly')
        .select('*')
        .limit(24);

      if (hourlyError) throw hourlyError;
      setHourlyStats(hourlyData || []);

    } catch (error) {
      console.error('Erreur chargement données monitoring:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full': return 'bg-red-100 text-red-800';
      case 'critical': return 'bg-orange-100 text-orange-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'full': return 'Complet';
      case 'critical': return 'Critique (>90%)';
      case 'warning': return 'Attention (>70%)';
      default: return 'Disponible';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Monitoring Temps Réel</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriodHours(1)}
              className={`px-4 py-2 rounded-lg ${periodHours === 1 ? 'bg-pink-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              1h
            </button>
            <button
              onClick={() => setPeriodHours(6)}
              className={`px-4 py-2 rounded-lg ${periodHours === 6 ? 'bg-pink-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              6h
            </button>
            <button
              onClick={() => setPeriodHours(24)}
              className={`px-4 py-2 rounded-lg ${periodHours === 24 ? 'bg-pink-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              24h
            </button>
            <button
              onClick={() => setPeriodHours(168)}
              className={`px-4 py-2 rounded-lg ${periodHours === 168 ? 'bg-pink-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              7j
            </button>
          </div>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tentatives</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_attempts || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Inscriptions Réussies</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.successful || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.success_rate != null ? `${stats.success_rate}%` : '0%'} de succès
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rate Limited</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.rate_limited || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.quota_exceeded || 0} quotas dépassés</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Temps Réponse (Moy)</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.avg_response_time_ms != null ? `${stats.avg_response_time_ms}ms` : '-'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      P95: {stats.p95_response_time_ms != null ? `${stats.p95_response_time_ms}ms` : '-'}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Visiteurs Uniques
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">IPs Uniques</span>
                    <span className="text-2xl font-bold text-gray-900">{stats.unique_ips}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Sessions Uniques</span>
                    <span className="text-2xl font-bold text-gray-900">{stats.unique_sessions}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Répartition des Erreurs
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Échecs</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${(stats.failed / stats.total_attempts) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">{stats.failed}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rate Limited</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${(stats.rate_limited / stats.total_attempts) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">{stats.rate_limited}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quota Dépassé</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${(stats.quota_exceeded / stats.total_attempts) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">{stats.quota_exceeded}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">État des Capacités par Course</h3>
            <p className="text-sm text-gray-600 mt-1">Courses triées par taux de remplissage</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Événement / Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscrits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Places Restantes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remplissage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {raceCapacities.map((race) => (
                  <tr key={race.race_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{race.event_name}</div>
                        <div className="text-sm text-gray-500">{race.race_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(race.start_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {race.current_registrations} / {race.max_participants || '∞'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {!race.max_participants || race.max_participants === 0
                        ? <span className="text-green-600">Pas de limite</span>
                        : race.places_remaining}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!race.max_participants || race.max_participants === 0 ? (
                        <span className="text-sm text-gray-500">-</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                race.capacity_status === 'full' ? 'bg-red-500' :
                                race.capacity_status === 'critical' ? 'bg-orange-500' :
                                race.capacity_status === 'warning' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(race.fill_percentage || 0, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{race.fill_percentage}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(race.capacity_status)}`}>
                        {getStatusLabel(race.capacity_status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
