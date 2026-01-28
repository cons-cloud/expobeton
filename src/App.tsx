import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, createTheme, ColorSchemeScript } from '@mantine/core';
import type { MantineColorsTuple } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';

// Pages
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';

// Configuration du thème dark moderne
const brandColors: MantineColorsTuple = [
  '#1a1a2e',
  '#16213e',
  '#0f3460',
  '#533483',
  '#6366f1',
  '#818cf8',
  '#a5b4fc',
  '#c7d2fe',
  '#e0e7ff',
  '#f0f4ff',
];

const theme = createTheme({
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  colors: {
    brand: brandColors,
  },
  primaryColor: 'brand',
  defaultRadius: 'md',
  cursorType: 'pointer',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontWeight: '700',
  },
  focusRing: 'auto',
  autoContrast: true,
  components: {
    Button: {
      defaultProps: {
        variant: 'gradient',
        gradient: { from: 'brand', to: 'indigo' },
      },
      styles: {
        root: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)',
          },
        },
      },
    },
    Paper: {
      defaultProps: {
        shadow: 'xl',
        withBorder: true,
      },
      styles: {
        root: {
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'rgba(99, 102, 241, 0.4)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    Card: {
      styles: {
        root: {
          background: 'rgba(31, 31, 31, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 25px 50px rgba(99, 102, 241, 0.2)',
            borderColor: 'rgba(99, 102, 241, 0.3)',
          },
        },
      },
    },
    TextInput: {
      styles: {
        input: {
          background: 'rgba(42, 42, 42, 0.8)',
          borderColor: 'rgba(99, 102, 241, 0.2)',
          transition: 'all 0.3s ease',
          '&:focus': {
            borderColor: '#6366f1',
            boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)',
          },
        },
      },
    },
    PasswordInput: {
      styles: {
        input: {
          background: 'rgba(42, 42, 42, 0.8)',
          borderColor: 'rgba(99, 102, 241, 0.2)',
          transition: 'all 0.3s ease',
          '&:focus': {
            borderColor: '#6366f1',
            boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)',
          },
        },
      },
    },
  },
});

// Composant de routage privé avec animation
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="dark" />
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Notifications 
          position="top-right" 
          limit={3}
          zIndex={999999}
        />
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <AuthProvider>
            <Router>
              <main style={{ flex: 1 }}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </Router>
          </AuthProvider>
        </div>
      </MantineProvider>
    </>
  );
}

export default App;
