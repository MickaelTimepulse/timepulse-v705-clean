import { useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Target,
  FileText,
  Database,
  Shield,
  Zap,
  Users,
  Calendar,
  Mail,
  CreditCard,
  Trophy,
  Search,
  Filter
} from 'lucide-react';

interface Task {
  id: string;
  category: string;
  name: string;
  status: 'done' | 'testing' | 'pending' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  progress: number;
  assignedTo?: string;
  deadline?: string;
  notes?: string;
}

export default function AdminProjectTracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const tasks: Task[] = [
    // AUTHENTIFICATION
    { id: '1', category: 'auth', name: 'Connexion Admin', status: 'done', priority: 'critical', progress: 100 },
    { id: '2', category: 'auth', name: 'Connexion Organisateur', status: 'done', priority: 'critical', progress: 100 },
    { id: '3', category: 'auth', name: 'Connexion Athlète', status: 'testing', priority: 'critical', progress: 90, notes: 'API FFA à tester' },
    { id: '4', category: 'auth', name: 'Récupération mot de passe', status: 'pending', priority: 'medium', progress: 0, notes: 'Pour organisateurs' },

    // ADMIN
    { id: '5', category: 'admin', name: 'Dashboard Admin', status: 'testing', priority: 'critical', progress: 95 },
    { id: '6', category: 'admin', name: 'Gestion Utilisateurs', status: 'testing', priority: 'critical', progress: 90 },
    { id: '7', category: 'admin', name: 'Gestion Organisateurs', status: 'testing', priority: 'critical', progress: 90 },
    { id: '8', category: 'admin', name: 'Gestion Événements', status: 'testing', priority: 'critical', progress: 90 },
    { id: '9', category: 'admin', name: 'Gestion Inscriptions', status: 'testing', priority: 'critical', progress: 85 },
    { id: '10', category: 'admin', name: 'Gestion Résultats', status: 'testing', priority: 'critical', progress: 85 },
    { id: '11', category: 'admin', name: 'Gestion Athlètes', status: 'testing', priority: 'medium', progress: 80 },
    { id: '12', category: 'admin', name: 'Finance & Commission', status: 'testing', priority: 'high', progress: 85 },
    { id: '13', category: 'admin', name: 'Système Email', status: 'testing', priority: 'critical', progress: 80, notes: 'Templates à valider' },
    { id: '14', category: 'admin', name: 'Paramètres Globaux', status: 'testing', priority: 'critical', progress: 90 },

    // ORGANISATEUR
    { id: '15', category: 'organizer', name: 'Dashboard Organisateur', status: 'testing', priority: 'critical', progress: 90 },
    { id: '16', category: 'organizer', name: 'Création Événement', status: 'testing', priority: 'critical', progress: 85, notes: 'Tarification à tester' },
    { id: '17', category: 'organizer', name: 'Gestion Inscriptions', status: 'testing', priority: 'critical', progress: 85 },
    { id: '18', category: 'organizer', name: 'Import Résultats CSV', status: 'pending', priority: 'high', progress: 70, notes: 'Mapper à tester' },
    { id: '19', category: 'organizer', name: 'Export Excel', status: 'testing', priority: 'high', progress: 90 },
    { id: '20', category: 'organizer', name: 'Statistiques', status: 'testing', priority: 'medium', progress: 85 },
    { id: '21', category: 'organizer', name: 'Bourse aux Dossards', status: 'testing', priority: 'medium', progress: 80 },
    { id: '22', category: 'organizer', name: 'Covoiturage', status: 'testing', priority: 'medium', progress: 80 },
    { id: '23', category: 'organizer', name: 'Bénévoles', status: 'testing', priority: 'medium', progress: 75 },

    // PUBLIC
    { id: '24', category: 'public', name: 'Page Accueil', status: 'testing', priority: 'critical', progress: 90 },
    { id: '25', category: 'public', name: 'Recherche Événements', status: 'testing', priority: 'critical', progress: 85 },
    { id: '26', category: 'public', name: 'Détail Événement', status: 'testing', priority: 'critical', progress: 90 },
    { id: '27', category: 'public', name: 'Inscription en Ligne', status: 'testing', priority: 'critical', progress: 80, notes: 'Paiement à tester' },
    { id: '28', category: 'public', name: 'Consultation Résultats', status: 'testing', priority: 'high', progress: 85 },
    { id: '29', category: 'public', name: 'Modification Inscription', status: 'testing', priority: 'medium', progress: 75 },

    // ATHLÈTE
    { id: '30', category: 'athlete', name: 'Profil Athlète', status: 'testing', priority: 'medium', progress: 60, notes: 'Incomplet' },
    { id: '31', category: 'athlete', name: 'Historique Résultats', status: 'pending', priority: 'low', progress: 40 },
    { id: '32', category: 'athlete', name: 'Timepulse Index', status: 'testing', priority: 'low', progress: 70 },

    // API & INTÉGRATIONS
    { id: '33', category: 'api', name: 'API FFA - Vérification', status: 'pending', priority: 'critical', progress: 80, notes: 'Tests avec vraies licences nécessaires' },
    { id: '34', category: 'api', name: 'API FFTri - Vérification', status: 'pending', priority: 'critical', progress: 80, notes: 'Tests avec vraies licences nécessaires' },
    { id: '35', category: 'api', name: 'Lyra Payment - Test', status: 'pending', priority: 'critical', progress: 70, notes: 'Mode test puis prod' },
    { id: '36', category: 'api', name: 'Lyra Payment - Production', status: 'pending', priority: 'critical', progress: 0, notes: 'Après validation test' },
    { id: '37', category: 'api', name: 'OxiMailing', status: 'pending', priority: 'medium', progress: 60 },
    { id: '38', category: 'api', name: 'Service SMS', status: 'pending', priority: 'low', progress: 40, notes: 'Provider à choisir' },

    // EMAILS
    { id: '39', category: 'email', name: 'Template Confirmation Inscription', status: 'pending', priority: 'critical', progress: 90, notes: 'À tester en prod' },
    { id: '40', category: 'email', name: 'Template Confirmation Paiement', status: 'pending', priority: 'critical', progress: 90, notes: 'À tester en prod' },
    { id: '41', category: 'email', name: 'Template Rappel Événement', status: 'pending', priority: 'high', progress: 85, notes: 'À tester en prod' },
    { id: '42', category: 'email', name: 'Délivrabilité Emails', status: 'pending', priority: 'critical', progress: 70, notes: 'Configuration SPF/DKIM' },

    // SÉCURITÉ
    { id: '43', category: 'security', name: 'RLS Supabase', status: 'done', priority: 'critical', progress: 100 },
    { id: '44', category: 'security', name: 'Validation Inputs', status: 'done', priority: 'critical', progress: 100 },
    { id: '45', category: 'security', name: 'Audit Sécurité', status: 'pending', priority: 'critical', progress: 0, notes: 'Audit externe recommandé' },
    { id: '46', category: 'security', name: 'Pen Testing', status: 'pending', priority: 'high', progress: 0 },
    { id: '47', category: 'security', name: 'RGPD Complet', status: 'pending', priority: 'critical', progress: 30, notes: 'CGU, CGV, mentions légales' },

    // PERFORMANCE
    { id: '48', category: 'performance', name: 'Optimisation Bundle', status: 'done', priority: 'medium', progress: 100 },
    { id: '49', category: 'performance', name: 'Tests de Charge', status: 'pending', priority: 'high', progress: 0 },
    { id: '50', category: 'performance', name: 'CDN Configuration', status: 'pending', priority: 'medium', progress: 0 },
    { id: '51', category: 'performance', name: 'Cache Stratégie', status: 'pending', priority: 'medium', progress: 20 },
    { id: '52', category: 'performance', name: 'Lighthouse Score', status: 'pending', priority: 'medium', progress: 50 },

    // CONTENU
    { id: '53', category: 'content', name: 'CGU/CGV', status: 'pending', priority: 'critical', progress: 0 },
    { id: '54', category: 'content', name: 'Mentions Légales', status: 'pending', priority: 'critical', progress: 0 },
    { id: '55', category: 'content', name: 'Politique Confidentialité', status: 'pending', priority: 'critical', progress: 0 },
    { id: '56', category: 'content', name: 'FAQ', status: 'pending', priority: 'high', progress: 0 },
    { id: '57', category: 'content', name: 'Guides Utilisateur', status: 'pending', priority: 'medium', progress: 0 },

    // SEO
    { id: '58', category: 'seo', name: 'Meta Tags', status: 'done', priority: 'high', progress: 100 },
    { id: '59', category: 'seo', name: 'Sitemap.xml', status: 'pending', priority: 'high', progress: 0 },
    { id: '60', category: 'seo', name: 'Robots.txt', status: 'pending', priority: 'high', progress: 0 },
    { id: '61', category: 'seo', name: 'Google Analytics', status: 'pending', priority: 'high', progress: 0 },
    { id: '62', category: 'seo', name: 'Search Console', status: 'pending', priority: 'medium', progress: 0 },
  ];

  const categories = [
    { id: 'all', name: 'Toutes', icon: Target, color: 'gray' },
    { id: 'auth', name: 'Authentification', icon: Shield, color: 'blue' },
    { id: 'admin', name: 'Admin', icon: Users, color: 'purple' },
    { id: 'organizer', name: 'Organisateur', icon: Calendar, color: 'green' },
    { id: 'public', name: 'Public', icon: Target, color: 'pink' },
    { id: 'athlete', name: 'Athlète', icon: Trophy, color: 'orange' },
    { id: 'api', name: 'API', icon: Zap, color: 'yellow' },
    { id: 'email', name: 'Emails', icon: Mail, color: 'cyan' },
    { id: 'security', name: 'Sécurité', icon: Shield, color: 'red' },
    { id: 'performance', name: 'Performance', icon: TrendingUp, color: 'indigo' },
    { id: 'content', name: 'Contenu', icon: FileText, color: 'teal' },
    { id: 'seo', name: 'SEO', icon: Search, color: 'lime' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'testing': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-400" />;
      case 'blocked': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done': return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Terminé</span>;
      case 'testing': return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">En test</span>;
      case 'pending': return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">À faire</span>;
      case 'blocked': return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Bloqué</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">🔴 Critique</span>;
      case 'high': return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">🟡 Haute</span>;
      case 'medium': return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">🟢 Moyenne</span>;
      case 'low': return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">⚪ Basse</span>;
      default: return null;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    testing: tasks.filter(t => t.status === 'testing').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    critical: tasks.filter(t => t.priority === 'critical').length,
    overall: Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length)
  };

  return (
    <AdminLayout title="Suivi du Projet">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Suivi du Projet Timepulse</h1>
          <p className="text-blue-100">État d'avancement global avant le lancement</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Progression Globale</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.overall}%</p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.overall}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Tâches</span>
              <Target className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.done} terminées · {stats.testing} en test · {stats.pending} à faire
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Tâches Critiques</span>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.critical}</p>
            <p className="text-sm text-red-600 mt-1">Priorité absolue</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">En Test</span>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.testing}</p>
            <p className="text-sm text-yellow-600 mt-1">Validation nécessaire</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Filtres</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes</option>
                {categories.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous</option>
                <option value="done">Terminé</option>
                <option value="testing">En test</option>
                <option value="pending">À faire</option>
                <option value="blocked">Bloqué</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes</option>
                <option value="critical">Critique</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Tâches ({filteredTasks.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tâche
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progression
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(task.status)}
                        <span className="ml-3 text-sm font-medium text-gray-900">{task.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {categories.find(c => c.id === task.category)?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              task.progress === 100 ? 'bg-green-600' :
                              task.progress >= 80 ? 'bg-yellow-600' :
                              'bg-blue-600'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{task.notes || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.filter(c => c.id !== 'all').map((category) => {
            const categoryTasks = tasks.filter(t => t.category === category.id);
            const categoryProgress = categoryTasks.length > 0
              ? Math.round(categoryTasks.reduce((acc, t) => acc + t.progress, 0) / categoryTasks.length)
              : 0;
            const Icon = category.icon;

            return (
              <div key={category.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Icon className="w-6 h-6 text-gray-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{categoryProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${categoryProgress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{categoryTasks.filter(t => t.status === 'done').length}/{categoryTasks.length} terminées</span>
                  <span>{categoryTasks.filter(t => t.status === 'testing').length} en test</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
