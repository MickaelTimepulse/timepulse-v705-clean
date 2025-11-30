import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OrganizerLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function OrganizerLayout({ children, title }: OrganizerLayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [organizerName, setOrganizerName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    loadOrganizerName();
  }, []);

  async function loadOrganizerName() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Vérifier si c'est un admin via les métadonnées
        const metadata = session.user.user_metadata;

        if (metadata?.admin_id && metadata?.admin_role) {
          setIsAdmin(true);
          setAdminName(metadata.admin_name || metadata.admin_email || 'Admin');
          setOrganizerName('Mode Administration');
        } else {
          // C'est un organisateur classique
          const { data: organizerData } = await supabase
            .from('organizers')
            .select('organization_name')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (organizerData) {
            setOrganizerName(organizerData.organization_name);
          }
        }
      }
    } catch (error) {
      console.error('Error loading organizer name:', error);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/organizer/login');
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/organizer/dashboard' },
    { icon: User, label: 'Mon profil', path: '/organizer/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <img
          src="/time.png"
          alt="Timepulse"
          className="h-7 w-auto"
        />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 text-white transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-white/20">
            <img
              src="/time.png"
              alt="Timepulse"
              className="h-8 w-auto brightness-0 invert mb-2"
            />
            <div className="flex items-center gap-2">
              <p className="text-pink-100 text-sm">Espace Organisateur</p>
              {isAdmin && (
                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full">
                  <Shield className="w-3 h-3" />
                  ADMIN
                </span>
              )}
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/20">
            <div className="mb-4">
              {isAdmin ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-yellow-400" />
                    <p className="text-sm text-yellow-400 font-semibold">Administrateur</p>
                  </div>
                  <p className="font-medium truncate text-white">{adminName}</p>
                  <p className="text-xs text-pink-100 mt-1">Mode gestion organisateur</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-pink-100">Connecté en tant que</p>
                  <p className="font-medium truncate">{organizerName || 'Chargement...'}</p>
                </>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6">
          {isAdmin && (
            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Mode Administrateur</p>
                  <p className="text-xs text-yellow-700">Vous consultez cette page en tant qu'administrateur avec tous les droits d'accès.</p>
                </div>
              </div>
            </div>
          )}
          {title && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
