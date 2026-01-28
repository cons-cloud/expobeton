import { createContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

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
    // Vérifier l'état d'authentification Supabase au chargement
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        
        // Persister la session pour éviter les redirections
        if (session?.user) {
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Changement auth:', event, session?.user?.email);
        setUser(session?.user || null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('supabase.auth.token');
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
