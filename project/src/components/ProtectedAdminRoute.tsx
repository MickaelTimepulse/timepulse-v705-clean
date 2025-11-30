import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  module: string;
  permission?: string;
  title?: string;
}

export default function ProtectedAdminRoute({
  children,
  module,
  permission = 'view',
  title
}: ProtectedAdminRouteProps) {
  const { user, isSuperAdmin, hasPermission, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Wait for auth to load
    if (!loading) {
      setChecking(false);
    }
  }, [loading]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    navigate('/admin/login');
    return null;
  }

  // Super admins always have access
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Check permission
  const hasAccess = hasPermission(module, permission);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accès non autorisé
            </h1>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les permissions nécessaires pour accéder à cette section
              {title && ` : ${title}`}.
            </p>

            <div className="w-full space-y-2">
              <button
                onClick={() => navigate(-1)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Accueil Admin</span>
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Besoin d'accès ?</strong><br />
                Contactez un Super Administrateur pour obtenir les permissions nécessaires.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
