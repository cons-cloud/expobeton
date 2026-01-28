import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Button, 
  Paper, 
  Title, 
  Text, 
  Alert
} from '@mantine/core';
import { IconMail, IconLock, IconAlertCircle, IconSparkles } from '@tabler/icons-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Tentative de connexion Supabase avec:', { email, password: '***' });

    try {
      // Connexion avec Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Erreur Supabase Auth:', signInError);
        setError(signInError.message || 'Erreur de connexion Supabase');
        return;
      }

      if (data.user) {
        console.log('Connexion Supabase réussie:', data.user.email);
        console.log('Redirection vers dashboard...');
        navigate('/dashboard');
      } else {
        setError('Utilisateur non trouvé');
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Erreur de connexion:', error);
      setError(error.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background animated elements */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '24rem',
          height: '24rem',
          background: 'rgba(139, 92, 246, 0.2)',
          borderRadius: '50%',
          filter: 'blur(3rem)',
          animation: 'pulse 4s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '24rem',
          height: '24rem',
          background: 'rgba(236, 72, 153, 0.2)',
          borderRadius: '50%',
          filter: 'blur(3rem)',
          animation: 'pulse 4s ease-in-out infinite',
          animationDelay: '2s'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '16rem',
          height: '16rem',
          background: 'rgba(34, 197, 94, 0.1)',
          borderRadius: '50%',
          filter: 'blur(2rem)',
          animation: 'pulse 4s ease-in-out infinite',
          animationDelay: '1s',
          transform: 'translate(-50%, -50%)'
        }}></div>
      </div>
      
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '28rem',
        margin: '0 auto'
      }}>
        <Paper 
          shadow="2xl" 
          p="lg" 
          radius="xl" 
          style={{
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            padding: '2rem',
            width: '100%'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              position: 'relative', 
              display: 'inline-block', 
              marginBottom: '1rem' 
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                borderRadius: '1rem',
                animation: 'pulse 2s ease-in-out infinite'
              }}></div>
              <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)'
              }}>
                <IconMail size={24} style={{ color: 'white' }} />
              </div>
              <div style={{
                position: 'absolute',
                top: '-0.5rem',
                right: '-0.5rem'
              }}>
                <IconSparkles size={20} style={{ color: '#fbbf24', animation: 'spin 2s linear infinite' }} />
              </div>
            </div>
            
            <Title 
              order={1} 
              style={{
                color: 'white',
                fontSize: '2.5rem',
                fontWeight: 700,
                marginBottom: '0.5rem'
              }}
            >
              Expobeton Email
            </Title>
            
            <Text style={{
              color: '#d1d5db',
              fontSize: '1.125rem',
              fontWeight: 500,
              marginBottom: 0
            }}>
              Plateforme d'envoi d'emails professionnelle
            </Text>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginTop: '1rem'
            }}>
              <div style={{ 
                width: '0.75rem', 
                height: '0.75rem', 
                background: '#10b981', 
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite'
              }}></div>
              <Text style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 500 }}>
                Sécurisé
              </Text>
              <div style={{ 
                width: '0.75rem', 
                height: '0.75rem', 
                background: '#3b82f6', 
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite',
                animationDelay: '0.5s'
              }}></div>
              <Text style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: 500 }}>
                Rapide
              </Text>
              <div style={{ 
                width: '0.75rem', 
                height: '0.75rem', 
                background: '#8b5cf6', 
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite',
                animationDelay: '1s'
              }}></div>
              <Text style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: 500 }}>
                Efficace
              </Text>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{ marginBottom: '2rem' }}>
              <Alert 
                icon={<IconAlertCircle size={20} />} 
                color="red" 
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '0.75rem',
                  backdropFilter: 'blur(4px)'
                }}
              >
                {error}
              </Alert>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '85%' }}>
                <label style={{
                  display: 'block',
                  color: '#d1d5db',
                  fontWeight: 500,
                  marginBottom: '0.75rem',
                  fontSize: '1.125rem',
                  textAlign: 'center'
                }}>
                  Email
                </label>
                <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <IconMail 
                    size={14} 
                    style={{ 
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      zIndex: 1
                    }} 
                  />
                  <input
                    type="email"
                    placeholder="Entrez votre email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      height: '3rem',
                      fontSize: '1rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      borderRadius: '0.75rem',
                      paddingLeft: '3rem',
                      paddingRight: '1rem',
                      textAlign: 'center',
                      width: '100%',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '85%' }}>
                <label style={{
                  display: 'block',
                  color: '#d1d5db',
                  fontWeight: 500,
                  marginBottom: '0.75rem',
                  fontSize: '1.125rem',
                  textAlign: 'center'
                }}>
                  Mot de passe
                </label>
                <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <IconLock 
                    size={18} 
                    style={{ 
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      zIndex: 1
                    }} 
                  />
                  <input
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      height: '3rem',
                      fontSize: '1rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      borderRadius: '0.75rem',
                      paddingLeft: '3rem',
                      paddingRight: '1rem',
                      textAlign: 'center',
                      width: '100%',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '1rem' }}>
            <Button 
              type="submit" 
              loading={loading}
              size="lg"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
                height: '3.25rem',
                borderRadius: '0.75rem',
                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease',
                border: 'none',
                cursor: 'pointer',
                width: '85%',
                maxWidth: '400px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.3)';
              }}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </div>
          </form>

          {/* Footer */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Text style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              Accès sécurisé • Identifiants uniques
            </Text>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2rem',
              marginTop: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '0.5rem', 
                  height: '0.5rem', 
                  background: '#10b981', 
                  borderRadius: '50%'
                }}></div>
                <Text style={{ color: '#10b981', fontSize: '0.75rem' }}>
                  SSL Secured
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '0.5rem', 
                  height: '0.5rem', 
                  background: '#3b82f6', 
                  borderRadius: '50%'
                }}></div>
                <Text style={{ color: '#3b82f6', fontSize: '0.75rem' }}>
                  Encrypted
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '0.5rem', 
                  height: '0.5rem', 
                  background: '#8b5cf6', 
                  borderRadius: '50%'
                }}></div>
                <Text style={{ color: '#8b5cf6', fontSize: '0.75rem' }}>
                  Protected
                </Text>
              </div>
            </div>
          </div>
        </Paper>
      </div>
    </div>
  );
};

export default Login;
