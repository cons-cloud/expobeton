import { Title, Text, Card, Progress, Badge } from '@mantine/core'
import { IconSend, IconCheck } from '@tabler/icons-react'

interface Campaign {
  id: string
  name: string
  subject: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  created_at: string
  content?: string
}

interface OverviewTabProps {
  campaigns: Campaign[]
}

export function OverviewTab({ campaigns }: OverviewTabProps) {
  return (
    <div style={{ padding: '20px 0' }}>
      {/* Active Campaigns */}
      <Card style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        marginBottom: '24px',
        borderRadius: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
            }}>
              <IconSend size={24} color="white" />
            </div>
            <div>
              <Title order={3} style={{ 
                color: 'white',
                marginBottom: '4px',
                fontSize: '1.4rem',
                fontWeight: 600
              }}>
                🚀 Campagnes Actives
              </Title>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.95rem'
              }}>
                {campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length} campagne(s) en cours
              </Text>
            </div>
          </div>
        </div>

        {campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length > 0 ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            {campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').map((campaign) => (
              <Card key={campaign.id} style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '20px',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                minWidth: '350px',
                maxWidth: '400px',
                flex: '1'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(5px) scale(1.02)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0) scale(1)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: campaign.status === 'sending' ? '#f59e0b' : '#3b82f6',
                    animation: campaign.status === 'sending' ? 'pulse 2s infinite' : 'none'
                  }} />
                  <Text style={{ 
                    color: 'white', 
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}>
                    {campaign.name}
                  </Text>
                </div>
                <Text style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '0.95rem',
                  marginBottom: '12px'
                }}>
                  📧 {campaign.subject}
                </Text>
                {campaign.status === 'sending' && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <Text style={{ 
                        color: 'rgba(255, 255, 255, 0.9)', 
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}>
                        Progression
                      </Text>
                      <Text style={{ 
                        color: '#3b82f6', 
                        fontSize: '1.1rem',
                        fontWeight: 700
                      }}>
                        65%
                      </Text>
                    </div>
                    <Progress
                      value={65}
                      size="md"
                      color="blue"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}
                    />
                    <Text style={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      fontSize: '0.85rem'
                    }}>
                      2,275 / 3,500 emails envoyés
                    </Text>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Text style={{ color: '#9ca3af', textAlign: 'center' }}>
            Aucune campagne active
          </Text>
        )}
      </Card>

      {/* Recent Activity */}
      <Card style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        borderRadius: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <Title order={3} style={{ 
            color: 'white', 
            marginBottom: '0px',
            fontSize: '1.3rem',
            fontWeight: 600
          }}>
            📈 Activité en Temps Réel
          </Title>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              animation: 'pulse 2s infinite'
            }} />
            <Text style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '0.9rem'
            }}>
              En direct
            </Text>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Envoi en Progression */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            minWidth: '350px',
            maxWidth: '450px',
            flex: '1'
          }}>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '4px',
              height: '100%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                flexShrink: 0,
                animation: 'pulse 2s infinite'
              }}>
                <IconSend size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <Text style={{ 
                    color: 'white', 
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}>
                    📤 Envoi en Progression
                  </Text>
                  <Badge 
                    color="blue"
                    style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    Actif
                  </Badge>
                </div>
                <Text style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '0.95rem',
                  marginBottom: '16px'
                }}>
                  🌸 Promotion Printemps • Premium
                </Text>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <Text style={{ 
                      color: 'rgba(255, 255, 255, 0.9)', 
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}>
                      Progression d'envoi
                    </Text>
                    <Text style={{ 
                      color: '#3b82f6', 
                      fontSize: '1.1rem',
                      fontWeight: 700
                    }}>
                      65%
                    </Text>
                  </div>
                  <Progress
                    value={65}
                    size="md"
                    color="blue"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Text style={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      fontSize: '0.85rem'
                    }}>
                      📊 2,275 emails envoyés
                    </Text>
                    <Text style={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      fontSize: '0.85rem'
                    }}>
                      📈 3,500 total
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campagne Terminée */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.05))',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            minWidth: '350px',
            maxWidth: '450px',
            flex: '1'
          }}>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '4px',
              height: '100%',
              background: 'linear-gradient(135deg, #10b981, #34d399)'
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                flexShrink: 0
              }}>
                <IconCheck size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <Text style={{ 
                    color: 'white', 
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}>
                    ✅ Campagne Terminée
                  </Text>
                  <Badge 
                    color="green"
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    Succès
                  </Badge>
                </div>
                <Text style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '0.95rem',
                  marginBottom: '16px'
                }}>
                  📧 Newsletter Mensuelle • Excellence
                </Text>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Text style={{ 
                      color: 'rgba(255, 255, 255, 0.9)', 
                      fontSize: '0.85rem',
                      fontWeight: 500
                    }}>
                      📊 Taux d'ouverture
                    </Text>
                    <Text style={{ 
                      color: '#10b981', 
                      fontSize: '1rem',
                      fontWeight: 700
                    }}>
                      68%
                    </Text>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Text style={{ 
                      color: 'rgba(255, 255, 255, 0.9)', 
                      fontSize: '0.85rem',
                      fontWeight: 500
                    }}>
                      📈 Performance
                    </Text>
                    <Text style={{ 
                      color: '#10b981', 
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      ↑ 12% vs mois dernier
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
