import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, login as authLogin, LoginCredentials, saveCredentials, getSavedCredentials, clearSavedCredentials } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials, rememberMe: boolean): Promise<boolean> => {
    const loggedInUser = await authLogin(credentials);

    if (loggedInUser) {
      setUser(loggedInUser);

      if (rememberMe) {
        saveCredentials(credentials.email, '');
      } else {
        clearSavedCredentials();
      }

      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    clearSavedCredentials();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'super_admin',
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
