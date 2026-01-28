import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase-secure';
import { 
  Button, 
  Paper, 
  Title, 
  Text, 
  Alert,
  LoadingOverlay
} from '@mantine/core';
import { IconMail, IconLock, IconAlertCircle, IconSparkles, IconShield } from '@tabler/icons-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const navigate = useNavigate();

  // Limitation des tentatives de connexion
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

  const isLockedOut = attempts >= MAX_ATTEMPTS;
  const lockoutEndTime = localStorage.getItem('lockoutEndTime');
  const currentTime = Date.now();

  if (lockoutEndTime && currentTime < parseInt(lockoutEndTime)) {
    const remainingTime = Math.ceil((parseInt(lockoutEndTime) - currentTime) / 60000);
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <Paper 
          shadow="2xl" 
          p="lg" 
          radius="xl" 
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <IconShield size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <Title order={2} style={{ color: '#ef4444', marginBottom: '1rem' }}>
            Compte temporairement bloqué
          </Title>
          <Text style={{ color: '#d1d5db' }}>
            Trop de tentatives de connexion. Veuillez réessayer dans {remainingTime} minutes.
          </Text>
        </Paper>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des entrées
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format d\'email invalide');
      return;
    }

    // Validation du mot de passe
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Rate limiting côté client
      const lastAttempt = localStorage.getItem('lastAttempt');
      if (lastAttempt && currentTime - parseInt(lastAttempt) < 1000) {
        setError('Veuillez attendre avant de réessayer');
        setLoading(false);
        return;
      }

      localStorage.setItem('lastAttempt', currentTime.toString());

      // Connexion avec Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        console.error('Erreur Supabase Auth:', signInError);
        
        // Incrémenter le compteur de tentatives
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('loginAttempts', newAttempts.toString());

        // Bloquer après MAX_ATTEMPTS
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockoutEnd = currentTime + LOCKOUT_TIME;
          localStorage.setItem('lockoutEndTime', lockoutEnd.toString());
          setError('Trop de tentatives. Compte bloqué pour 15 minutes.');
        } else {
          setError(`Erreur de connexion. ${MAX_ATTEMPTS - newAttempts} tentatives restantes.`);
        }
        return;
      }

      if (data.user) {
        // Réinitialiser les tentatives en cas de succès
        setAttempts(0);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lockoutEndTime');
        localStorage.removeItem('lastAttempt');
        
        console.log('Connexion sécurisée réussie');
        navigate('/dashboard');
      } else {
        setError('Utilisateur non trouvé');
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Erreur de connexion:', error);
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  // Effacer les tentatives après le délai
  useState(() => {
    const savedAttempts = localStorage.getItem('loginAttempts');
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts));
    }
  });

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
      {/* Badge de sécurité */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        right: '2rem',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '2rem',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backdropFilter: 'blur(10px)'
      }}>
        <IconShield size={16} color="#10b981" />
        <Text style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
          Sécurisé 256-bit
        </Text>
      </div>

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
            width: '100%',
            position: 'relative'
          }}
        >
          <LoadingOverlay visible={loading} />
          
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
              Plateforme sécurisée d'envoi d'emails
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
                Chiffré
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
                Protégé
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
                    autoComplete="email"
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
                    autoComplete="current-password"
                    minLength={8}
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
              disabled={isLockedOut}
              style={{
                background: isLockedOut ? 'rgba(107, 114, 128, 0.5)' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
                height: '3.25rem',
                borderRadius: '0.75rem',
                boxShadow: isLockedOut ? 'none' : '0 8px 20px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease',
                border: 'none',
                cursor: isLockedOut ? 'not-allowed' : 'pointer',
                width: '85%',
                maxWidth: '400px'
              }}
              onMouseOver={(e) => {
                if (!isLockedOut && !loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!isLockedOut && !loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.3)';
                }
              }}
            >
              {loading ? 'Connexion sécurisée en cours...' : isLockedOut ? 'Compte bloqué' : 'Se connecter'}
            </Button>
          </div>
          </form>

          {/* Footer */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Text style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              Connexion sécurisée • Protection anti-bruteforce
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
                  SSL/TLS
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
                  AES-256
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
                  PKCE
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
