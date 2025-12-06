import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, login as authLogin, LoginCredentials, saveCredentials, getSavedCredentials, clearSavedCredentials } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface Permission {
  module: string;
  permission: string;
  granted: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  permissions: Permission[];
  login: (credentials: LoginCredentials, rememberMe: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  hasPermission: (module: string, permission?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    // Check if user is already logged in from Supabase Auth
    const checkStoredAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.user_metadata) {
          const metadata = session.user.user_metadata;
          console.log('[AuthContext] Found Supabase Auth session:', metadata);

          if (metadata.admin_id && metadata.admin_email && metadata.admin_role) {
            const storedUser: User = {
              id: metadata.admin_id,
              email: metadata.admin_email,
              name: metadata.admin_name || metadata.admin_email,
              role: metadata.admin_role as 'super_admin' | 'staff' | 'organizer',
              orgId: null,
            };

            setUser(storedUser);
            await loadUserPermissions(metadata.admin_id);
            console.log('[AuthContext] ✅ User restored from Supabase Auth');
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error checking auth:', error);
      }

      setLoading(false);
    };

    checkStoredAuth();
  }, []);

  const loadUserPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('admin_get_user_permissions', { p_user_id: userId });

      if (error) {
        console.error('Error loading permissions:', error);
        return;
      }

      // La fonction retourne un objet {user: {...}, permissions: [...]}
      if (data && typeof data === 'object') {
        const permissionsData = data.permissions || [];
        console.log('Loaded permissions:', permissionsData);
        setPermissions(permissionsData);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  };

  const login = async (credentials: LoginCredentials, rememberMe: boolean): Promise<boolean> => {
    const loggedInUser = await authLogin(credentials);

    if (loggedInUser) {
      setUser(loggedInUser);

      // Load user permissions
      if (loggedInUser.id) {
        await loadUserPermissions(loggedInUser.id);
      }

      if (rememberMe) {
        saveCredentials(credentials.email, '');
      } else {
        clearSavedCredentials();
      }

      return true;
    }

    return false;
  };

  const logout = async () => {
    setUser(null);
    setPermissions([]);
    clearSavedCredentials();

    // Also sign out from Supabase Auth
    try {
      await supabase.auth.signOut();
      console.log('[AuthContext] ✅ Signed out from Supabase Auth');
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
    }
  };

  const hasPermission = (module: string, permission?: string): boolean => {
    // Super admins have all permissions
    if (user?.role === 'super_admin') {
      return true;
    }

    // If no permission specified, check if user has any permission for the module
    if (!permission) {
      return permissions.some(p => p.module === module && p.granted);
    }

    // Check specific permission
    const perm = permissions.find(
      p => p.module === module && p.permission === permission
    );

    return perm?.granted || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        permissions,
        login,
        logout,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'super_admin',
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
