import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Activity, Filter, Clock, User, FileText, Calendar, TrendingUp, AlertCircle, X, ArrowLeft } from 'lucide-react';

interface ActivityLog {
  id: string;
  user_email: string;
  user_name: string;
  action: string;
  module: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
}

interface LoginSession {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  logged_in_at: string;
  logged_out_at: string | null;
  duration_seconds: number;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
}

interface Stats {
  totalActions: number;
  totalSessions: number;
  activeSessions: number;
  totalTimeSpent: number;
}

export default function AdminActivityLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalActions: 0,
    totalSessions: 0,
    activeSessions: 0,
    totalTimeSpent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'sessions'>('logs');

  const [filters, setFilters] = useState({
    module: '',
    action: '',
    userId: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadLogs(), loadSessions()]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_activity_logs', {
        p_limit: 100,
        p_offset: 0,
        p_user_id: filters.userId || null,
        p_module: filters.module || null,
        p_action: filters.action || null
      });

      if (error) throw error;

      setLogs(data.logs || []);
      setStats(prev => ({ ...prev, totalActions: data.total || 0 }));
    } catch (error) {
      console.error('Error loading logs:', error);
      setError('Erreur lors du chargement des logs d\'activité');
    }
  };

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_login_sessions', {
        p_limit: 50,
        p_user_id: filters.userId || null
      });

      if (error) throw error;

      setSessions(data || []);

      const totalSessions = data?.length || 0;
      const activeSessions = data?.filter((s: LoginSession) => s.is_active).length || 0;
      const totalTimeSpent = data?.reduce((acc: number, s: LoginSession) => acc + (s.duration_seconds || 0), 0) || 0;

      setStats(prev => ({
        ...prev,
        totalSessions,
        activeSessions,
        totalTimeSpent
      }));
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Erreur lors du chargement des sessions');
    }
  };

  const getActionBadgeColor = (action: string) => {
    const colors: { [key: string]: string } = {
      login: 'bg-green-100 text-green-800',
      logout: 'bg-gray-100 text-gray-800',
      create: 'bg-blue-100 text-blue-800',
      update: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
      export: 'bg-purple-100 text-purple-800',
      import: 'bg-indigo-100 text-indigo-800',
      send: 'bg-pink-100 text-pink-800',
      view: 'bg-gray-100 text-gray-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      login: 'Connexion',
      logout: 'Déconnexion',
      create: 'Création',
      update: 'Modification',
      delete: 'Suppression',
      export: 'Export',
      import: 'Import',
      send: 'Envoi',
      view: 'Consultation'
    };
    return labels[action] || action;
  };

  const getModuleName = (module: string) => {
    const names: { [key: string]: string } = {
      auth: 'Authentification',
      dashboard: 'Tableau de bord',
      events: 'Événements',
      organizers: 'Organisateurs',
      entries: 'Inscriptions',
      results: 'Résultats',
      finance: 'Finance',
      email: 'Emails',
      settings: 'Paramètres',
      users: 'Utilisateurs',
      pages: 'Pages',
      backups: 'Sauvegardes'
    };
    return names[module] || module;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Erreur</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Journaux d'activité</h1>
        <p className="text-gray-600">Suivez toutes les actions effectuées par votre équipe</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actions totales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalActions}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sessions totales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>
            <User className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sessions actives</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSessions}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Temps total</p>
              <p className="text-2xl font-bold text-gray-900">{formatTotalTime(stats.totalTimeSpent)}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'logs'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Logs d'activité
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'sessions'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Sessions
            </button>
          </div>
        </div>

        {activeTab === 'logs' ? (
          <div className="p-6">
            <div className="mb-4 flex gap-4">
              <select
                value={filters.module}
                onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">Tous les modules</option>
                <option value="auth">Authentification</option>
                <option value="events">Événements</option>
                <option value="organizers">Organisateurs</option>
                <option value="entries">Inscriptions</option>
                <option value="results">Résultats</option>
                <option value="finance">Finance</option>
                <option value="email">Emails</option>
                <option value="users">Utilisateurs</option>
              </select>

              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">Toutes les actions</option>
                <option value="login">Connexion</option>
                <option value="create">Création</option>
                <option value="update">Modification</option>
                <option value="delete">Suppression</option>
                <option value="export">Export</option>
                <option value="import">Import</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                        <div className="text-xs text-gray-500">{log.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getActionBadgeColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getModuleName(log.module)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Connexion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Déconnexion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Durée
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{session.user_name}</div>
                        <div className="text-xs text-gray-500">{session.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(session.logged_in_at).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.logged_out_at
                          ? new Date(session.logged_out_at).toLocaleString('fr-FR')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(session.duration_seconds)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            session.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {session.is_active ? 'Active' : 'Terminée'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
