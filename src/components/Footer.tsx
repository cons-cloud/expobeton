import { Text, Anchor, Container } from '@mantine/core';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'rgba(10, 10, 10, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(99, 102, 241, 0.2)',
      padding: '2rem 0',
      marginTop: 'auto',
    }}>
      <Container size="xl">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          {/* Ligne principale */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            {/* Copyright */}
            <div>
              <Text 
                size="sm" 
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  color: '#b0b0b0',
                  fontWeight: 500,
                }}
              >
                © {currentYear} Expobeton Email. Tous droits réservés.
              </Text>
            </div>
          </div>
          
          {/* Ligne secondaire */}
          <div style={{
            textAlign: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(99, 102, 241, 0.1)',
          }}>
            <Text 
              size="xs" 
              style={{ 
                fontFamily: 'Inter, sans-serif',
                color: '#808080',
                lineHeight: 1.5,
              }}
            >
              Propulsé par{' '}
              <Anchor
                href="https://webconsulting.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#818cf8',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#a5b4fc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#818cf8';
                }}
              >
                WebConsulting
              </Anchor>
              {' '}— Développement web moderne et innovant
            </Text>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
