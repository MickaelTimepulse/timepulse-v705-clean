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
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: organizerData } = await supabase
          .from('organizers')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (organizerData) {
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
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
