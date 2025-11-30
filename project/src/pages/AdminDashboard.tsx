import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  CreditCard,
  Trophy,
  Image,
  Mail,
  Settings,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import AdminLayout from '../components/Admin/AdminLayout';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    events: { total: 0, published: 0, draft: 0 },
    organizers: { total: 0, active: 0 },
    registrations: { total: 0, confirmed: 0, pending: 0, cancelled: 0 },
    revenue: { total: 0, thisMonth: 0 }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      const { data: statsData, error: statsError } = await supabase
        .rpc('admin_get_dashboard_stats');

      if (statsError) {
        console.error('Error loading stats:', statsError);
        throw statsError;
      }

      console.log('Stats data received:', statsData);

      if (statsData) {
        setStats({
          events: statsData.events || { total: 0, published: 0, draft: 0 },
          organizers: statsData.organizers || { total: 0, active: 0 },
          registrations: statsData.entries || { total: 0, confirmed: 0, pending: 0, cancelled: 0 },
          revenue: statsData.revenue || { total: 0, thisMonth: 0 }
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin/dashboard', color: 'from-blue-500 to-blue-600' },
    { icon: Users, label: 'Organisateurs', path: '/admin/organizers', color: 'from-green-500 to-green-600' },
    { icon: Calendar, label: 'Événements', path: '/admin/events', color: 'from-purple-500 to-purple-600' },
    { icon: FileText, label: 'Inscriptions', path: '/admin/entries', color: 'from-pink-500 to-pink-600' },
    { icon: CreditCard, label: 'Finance', path: '/admin/finance', color: 'from-yellow-500 to-yellow-600' },
    { icon: Trophy, label: 'Chrono/Résultats', path: '/admin/results', color: 'from-red-500 to-red-600' },
    { icon: Image, label: 'Assets Emails', path: '/admin/email-assets', color: 'from-orange-500 to-orange-600' },
    { icon: Mail, label: 'Emails', path: '/admin/email-manager', color: 'from-teal-500 to-teal-600' },
    { icon: Settings, label: 'Paramètres', path: '/admin/settings', color: 'from-gray-500 to-gray-600' },
  ];

  const dashboardStats = [
    {
      label: 'Événements actifs',
      value: stats.events.published.toString(),
      subtext: `${stats.events.total} total (${stats.events.draft} brouillons)`,
      color: 'bg-blue-500',
      icon: Calendar
    },
    {
      label: 'Inscriptions ce mois',
      value: stats.registrations.total.toString(),
      subtext: `${stats.registrations.confirmed} confirmées`,
      color: 'bg-green-500',
      icon: FileText
    },
    {
      label: 'CA ce mois',
      value: `${stats.revenue.thisMonth.toFixed(0)} €`,
      subtext: `${stats.revenue.total.toFixed(0)} € total`,
      color: 'bg-purple-500',
      icon: CreditCard
    },
    {
      label: 'Organisateurs actifs',
      value: stats.organizers.active.toString(),
      subtext: `${stats.organizers.total} total`,
      color: 'bg-pink-500',
      icon: Users
    },
  ];

  return (
    <ProtectedAdminRoute module="dashboard" permission="view" title="Tableau de bord">
      <AdminLayout title="Tableau de bord">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue, {user?.name || 'Admin'}
          </h2>
          <p className="text-gray-600">
            Vue d'ensemble de votre plateforme Timepulse
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-xs text-gray-500">{stat.subtext}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Alertes & Infos
                </h3>
                <div className="space-y-4">
                  {stats.registrations.pending > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">
                        {stats.registrations.pending} paiement{stats.registrations.pending > 1 ? 's' : ''} en attente
                      </p>
                      <button
                        onClick={() => navigate('/admin/entries')}
                        className="text-xs text-yellow-600 hover:text-yellow-800 mt-1"
                      >
                        Voir les détails →
                      </button>
                    </div>
                  )}

                  {stats.events.draft > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">
                        {stats.events.draft} événement{stats.events.draft > 1 ? 's' : ''} en brouillon
                      </p>
                      <button
                        onClick={() => navigate('/admin/events')}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Gérer les événements →
                      </button>
                    </div>
                  )}

                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Système opérationnel
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Tous les services fonctionnent normalement
                    </p>
                  </div>
                </div>
              </div>
          </>
        )}

        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Accès rapide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-left group"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${item.color} rounded-lg mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.label}</h4>
                <p className="text-sm text-gray-600">
                  Gérer et consulter {item.label.toLowerCase()}
                </p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
    </ProtectedAdminRoute>
  );
}
