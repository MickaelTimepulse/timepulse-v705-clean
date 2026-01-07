import { useAuth } from '../../contexts/AuthContext';
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
  LogOut,
  Shield,
  Menu,
  FileCode,
  DollarSign,
  Database,
  Activity,
  UserCog,
  BarChart3,
  Rocket,
  Home,
  Paintbrush,
  MailOpen,
  LineChart,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Target,
  Layout,
  Video,
  ArrowLeft,
  ShoppingCart,
  Download,
  Award
} from 'lucide-react';
// Force rebuild 2024-11-12
import { useState, useEffect } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const STORAGE_KEY = 'admin_menu_expanded_sections';

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, logout, isSuperAdmin, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set(['overview', 'events', 'finance', 'communication', 'website', 'system']);
    } catch {
      return new Set(['overview', 'events', 'finance', 'communication', 'website', 'system']);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(expandedSections)));
    } catch (error) {
      console.error('Failed to save menu state:', error);
    }
  }, [expandedSections]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const menuItems = [
    // Vue d'ensemble
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin/dashboard', section: 'overview', module: 'dashboard', permission: 'view' },
    { icon: BarChart3, label: 'Monitoring', path: '/admin/monitoring', section: 'overview', module: 'dashboard', permission: 'view' },
    { icon: Target, label: 'Suivi du Projet', path: '/admin/project-tracking', section: 'overview', module: 'dashboard', permission: 'view' },

    // Gestion des événements
    { icon: Users, label: 'Organisateurs', path: '/admin/organizers', section: 'events', module: 'organizers', permission: 'view' },
    { icon: Calendar, label: 'Événements', path: '/admin/events', section: 'events', module: 'events', permission: 'view' },
    { icon: FileText, label: 'Inscriptions', path: '/admin/entries', section: 'events', module: 'entries', permission: 'view' },
    { icon: ShoppingCart, label: 'Paniers', path: '/admin/carts', section: 'events', module: 'entries', permission: 'view' },
    { icon: Trophy, label: 'Résultats', path: '/admin/results', section: 'events', module: 'results', permission: 'view' },
    { icon: Database, label: 'Résultats Externes', path: '/admin/external-results', section: 'events', module: 'results', permission: 'view' },
    { icon: Download, label: 'Import Timepulse.fr', path: '/admin/timepulse-import', section: 'events', module: 'entries', permission: 'manage' },
    { icon: UserCog, label: 'Athlètes', path: '/admin/athletes', section: 'events', module: 'entries', permission: 'view' },

    // Finance
    { icon: CreditCard, label: 'Finance', path: '/admin/finance', section: 'finance', module: 'finance', permission: 'view' },
    { icon: DollarSign, label: 'Commission', path: '/admin/commission', section: 'finance', module: 'finance', permission: 'manage' },

    // Communication
    { icon: Paintbrush, label: 'Gestionnaire d\'Emails', path: '/admin/email-manager', section: 'communication', module: 'email', permission: 'view' },
    { icon: BookOpen, label: 'Variables', path: '/admin/email-variables', section: 'communication', module: 'email', permission: 'send' },
    { icon: Image, label: 'Assets', path: '/admin/email-assets', section: 'communication', module: 'email', permission: 'view' },
    { icon: LineChart, label: 'Monitoring Emails', path: '/admin/email-monitoring', section: 'communication', module: 'email', permission: 'view' },
    { icon: Award, label: 'Diplômes', path: '/admin/certificates', section: 'communication', module: 'email', permission: 'view' },

    // Contenu du site
    { icon: FileCode, label: 'Pages Services', path: '/admin/services', section: 'website', module: 'pages', permission: 'view' },
    { icon: Shield, label: 'Page d\'Accueil', path: '/admin/homepage-features', section: 'website', module: 'pages', permission: 'view' },
    { icon: FileText, label: 'Pages statiques', path: '/admin/static-pages', section: 'website', module: 'pages', permission: 'view' },
    { icon: FileText, label: 'Formulaires', path: '/admin/custom-forms', section: 'website', module: 'pages', permission: 'view' },
    { icon: Video, label: 'Vidéos', path: '/admin/videos', section: 'website', module: 'pages', permission: 'view' },

    // Administration système
    { icon: UserCog, label: 'Utilisateurs Admin', path: '/admin/users', section: 'system', module: 'users', permission: 'view' },
    { icon: Shield, label: 'Journal d\'Audit', path: '/admin/audit-logs', section: 'system', module: 'logs', permission: 'view' },
    { icon: Database, label: 'Sauvegardes', path: '/admin/backups', section: 'system', module: 'backups', permission: 'view' },
    { icon: Settings, label: 'Paramètres', path: '/admin/settings', section: 'system', module: 'settings', permission: 'view' },
    { icon: Layout, label: 'Footer du site', path: '/admin/footer-settings', section: 'system', module: 'settings', permission: 'view' },
    { icon: Rocket, label: 'Déploiement', path: '/admin/deployment', section: 'system', superAdminOnly: true, module: 'settings', permission: 'edit' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <img
              src="/time.png"
              alt="Timepulse"
              className="h-8 w-auto"
            />
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg ml-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
              <p className="text-sm text-gray-600">{title || 'Back-office de gestion'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              title="Retour à la page précédente"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg transition-colors"
              title="Retour au tableau de bord admin"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Accueil Admin</span>
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-600">
                {isSuperAdmin ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Super Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {user?.role}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:sticky top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white shadow-lg transition-transform duration-300 ease-in-out overflow-y-auto`}
        >
          <nav className="p-4 space-y-1">
            {(() => {
              const sections = {
                overview: { title: 'Vue d\'ensemble', color: 'text-blue-700', bgColor: 'bg-blue-50', hoverBg: 'hover:bg-blue-100' },
                events: { title: 'Gestion', color: 'text-green-700', bgColor: 'bg-green-50', hoverBg: 'hover:bg-green-100' },
                finance: { title: 'Finance', color: 'text-orange-700', bgColor: 'bg-orange-50', hoverBg: 'hover:bg-orange-100' },
                communication: { title: 'Communication', color: 'text-purple-700', bgColor: 'bg-purple-50', hoverBg: 'hover:bg-purple-100' },
                website: { title: 'Site Web', color: 'text-cyan-700', bgColor: 'bg-cyan-50', hoverBg: 'hover:bg-cyan-100' },
                system: { title: 'Administration', color: 'text-red-700', bgColor: 'bg-red-50', hoverBg: 'hover:bg-red-100' }
              };

              // Compter les items par section
              const sectionCounts = menuItems.reduce((acc, item) => {
                if (item.superAdminOnly && !isSuperAdmin) return acc;
                // Check permission
                if (item.module && item.permission && !hasPermission(item.module, item.permission)) {
                  return acc;
                }
                if (item.section) {
                  acc[item.section] = (acc[item.section] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>);

              let currentSection = '';
              return menuItems.map((item, index) => {
                if (item.superAdminOnly && !isSuperAdmin) return null;

                // Check permission for this item
                if (item.module && item.permission && !hasPermission(item.module, item.permission)) {
                  return null;
                }

                const showSectionTitle = item.section !== currentSection;
                const itemSection = item.section || '';
                currentSection = itemSection;
                const isExpanded = expandedSections.has(itemSection);
                const sectionConfig = sections[itemSection];
                const itemCount = sectionCounts[itemSection] || 0;

                return (
                  <div key={index}>
                    {showSectionTitle && itemSection && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleSection(itemSection);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 mt-2 rounded-lg transition-all ${sectionConfig?.bgColor || 'bg-gray-50'} ${sectionConfig?.hoverBg || 'hover:bg-gray-100'} group`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold uppercase tracking-wider ${sectionConfig?.color || 'text-gray-600'}`}>
                            {sectionConfig?.title || itemSection}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${sectionConfig?.bgColor || 'bg-gray-100'} ${sectionConfig?.color || 'text-gray-600'} font-semibold`}>
                            {itemCount}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className={`w-4 h-4 ${sectionConfig?.color || 'text-gray-600'} transition-transform`} />
                        ) : (
                          <ChevronRight className={`w-4 h-4 ${sectionConfig?.color || 'text-gray-600'} transition-transform`} />
                        )}
                      </button>
                    )}
                    {isExpanded && (
                      <div className="animate-fadeIn">
                        <button
                          onClick={() => {
                            navigate(item.path);
                            setSidebarOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:text-pink-600 rounded-lg transition-colors group"
                        >
                          <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">{item.label}</span>
                          {item.superAdminOnly && (
                            <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              Super Admin
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
