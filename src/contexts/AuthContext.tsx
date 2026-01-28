import { createContext, useEffect, useState } from 'react';

type User = {
  email: string;
  id: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export { AuthContext };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'état d'authentification au chargement
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const userEmail = localStorage.getItem('userEmail');

      if (isAuthenticated && userEmail) {
        setUser({ email: userEmail, id: 'local-user' });
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    setUser(null);
    // Utiliser window.location au lieu de useNavigate
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
