import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface OrganizerProtectedRouteProps {
  children: React.ReactNode;
}

export default function OrganizerProtectedRoute({ children }: OrganizerProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('[OrganizerProtectedRoute] Component mounted');
    console.log('[OrganizerProtectedRoute] localStorage keys:', Object.keys(localStorage));
    console.log('[OrganizerProtectedRoute] adminId:', localStorage.getItem('adminId'));
    console.log('[OrganizerProtectedRoute] adminEmail:', localStorage.getItem('adminEmail'));
    console.log('[OrganizerProtectedRoute] adminRole:', localStorage.getItem('adminRole'));
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Vérifier d'abord si c'est un admin connecté via Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();

      console.log('[OrganizerProtectedRoute] Checking Supabase Auth session...');

      if (session?.user?.user_metadata) {
        const metadata = session.user.user_metadata;
        console.log('[OrganizerProtectedRoute] Found session metadata:', metadata);

        const adminId = metadata.admin_id;
        const adminRole = metadata.admin_role;

        if (adminId && adminRole) {
          console.log('[OrganizerProtectedRoute] Admin detected from Supabase Auth:', adminId, 'Role:', adminRole);

          // Trust Supabase Auth metadata - it was set during login after password verification
          // Super admin has all rights
          if (adminRole === 'super_admin') {
            console.log('[OrganizerProtectedRoute] ✅ Super admin authenticated');
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }

          // For other admins, check permissions
          const { data: permissions, error: permError } = await supabase.rpc('admin_get_user_permissions', {
            p_user_id: adminId
          });

          console.log('[OrganizerProtectedRoute] Permissions:', permissions, 'Error:', permError);

          if (permissions?.permissions) {
            const hasEventPermission = permissions.permissions.some(
              (p: any) =>
                p.module === 'events' &&
                (p.permission === 'edit' || p.permission === 'view') &&
                p.granted === true
            );

            console.log('[OrganizerProtectedRoute] Has event permission:', hasEventPermission);

            if (hasEventPermission) {
              console.log('[OrganizerProtectedRoute] ✅ Admin with event permission authenticated');
              setIsAuthenticated(true);
              setLoading(false);
              return;
            }
          }
        }
      }

      // Check if it's a regular organizer (not admin)
      if (session?.user) {
        console.log('[OrganizerProtectedRoute] Checking if regular organizer...');

        // Vérifier si c'est un organisateur
        const { data: organizerData } = await supabase
          .from('organizers')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        console.log('[OrganizerProtectedRoute] Organizer data:', organizerData);

        if (organizerData) {
          console.log('[OrganizerProtectedRoute] ✅ Organizer authenticated');
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
      } else {
        console.log('[OrganizerProtectedRoute] No Supabase session');
      }

      console.log('[OrganizerProtectedRoute] ❌ Authentication failed - redirecting to login');
    } catch (error) {
      console.error('[OrganizerProtectedRoute] Auth check error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/organizer/login" replace />;
  }

  return <>{children}</>;
}
