import { useState, useEffect } from 'react'
import { Title, Text, Card, Button, Group, Timeline } from '@mantine/core'
import { 
  IconSend, 
  IconUsers, 
  IconTarget, 
  IconActivity,
  IconMail,
  IconRefresh,
  IconX
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import AnalyticsService from '../../services/analyticsService'

interface AnalyticsData {
  total_campaigns: number
  total_contacts: number
  total_emails_sent: number
  total_emails_received: number
  open_rate: number
  click_rate: number
  recent_activity: Array<{
    type: 'email_sent' | 'email_received' | 'campaign_created'
    message: string
    timestamp: string
  }>
  email_stats: {
    sent_today: number
    sent_this_week: number
    received_today: number
    received_this_week: number
  }
}

export function AnalyticsTab() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadAnalyticsData()
    
    // Écouter les changements en temps réel
    const unsubscribe = AnalyticsService.subscribeToChanges((data) => {
      setAnalyticsData(data)
      setLastUpdate(new Date())
      
      // Notification pour les changements importants
      if (data.total_emails_sent > (analyticsData?.total_emails_sent || 0)) {
        notifications.show({
          id: 'new-email-sent',
          title: '📧 Email envoyé',
          message: `Total: ${data.total_emails_sent} emails`,
          color: 'blue',
          autoClose: 3000,
          icon: <div style={{ width: 0 }} />
        })
      }
      
      if (data.total_emails_received > (analyticsData?.total_emails_received || 0)) {
        notifications.show({
          id: 'new-email-received',
          title: '📨 Email reçu',
          message: `Total: ${data.total_emails_received} emails`,
          color: 'green',
          autoClose: 3000,
          icon: <div style={{ width: 0 }} />
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const loadAnalyticsData = async () => {
    try {
      // Si ce n'est pas le chargement initial, utiliser isRefreshing
      if (!loading) {
        setIsRefreshing(true)
      }
      
      // Notification de début d'actualisation
      notifications.show({
        id: 'refresh-start',
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconRefresh 
              size={8} 
              color="white"
              style={{
                animation: 'spin 1s linear infinite'
              }}
            />
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>Actualisation en cours</span>
          </div>
        ),
        message: (
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem' }}>
            Chargement des dernières données...
          </div>
        ),
        color: 'blue',
        autoClose: 2000,
        style: {
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.05))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)',
          minWidth: '280px',
          maxWidth: '350px'
        },
        styles: {
          closeButton: {
            width: '12px',
            height: '12px',
            minHeight: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            '&:hover': {
              color: 'rgba(255, 255, 255, 0.8)',
              background: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        icon: <div style={{ width: 0 }} />
      })
      
      const data = await AnalyticsService.getAnalyticsData()
      setAnalyticsData(data)
      setLastUpdate(new Date())
      
      // Notification de succès avec détails
      const totalChanges = data.total_campaigns + data.total_contacts + data.total_emails_sent + data.total_emails_received
      
      notifications.show({
        id: 'refresh-success',
        title: '✅ Données actualisées',
        message: `${totalChanges} éléments synchronisés avec succès`,
        color: 'green',
        autoClose: 3000,
        styles: {
          closeButton: {
            width: '12px',
            height: '12px',
            minHeight: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            '&:hover': {
              color: 'rgba(255, 255, 255, 0.8)',
              background: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        icon: <div style={{ width: 0 }} />
      })
      
      // Notification des changements spécifiques
      if (data.total_emails_sent > 0 || data.total_emails_received > 0) {
        notifications.show({
          id: 'email-activity',
          title: '📧 Activité email',
          message: `${data.total_emails_sent} envoyés, ${data.total_emails_received} reçus`,
          color: 'blue',
          autoClose: 4000,
          styles: {
            closeButton: {
              width: '12px',
              height: '12px',
              minHeight: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': {
                color: 'rgba(255, 255, 255, 0.8)',
                background: 'rgba(255, 255, 255, 0.1)'
              }
            }
          },
          icon: <div style={{ width: 0 }} />
        })
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error)
      
      // Notification d'erreur détaillée
      notifications.show({
        id: 'refresh-error',
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconX size={6} color="#ef4444" />
            <span style={{ color: 'white', fontWeight: 600 }}>Erreur de synchronisation</span>
          </div>
        ),
        message: 'Impossible de charger les données. Vérifiez votre connexion.',
        color: 'red',
        autoClose: 5000,
        icon: <div style={{ width: 0 }} />
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email_sent':
        return <IconSend size={16} color="#3b82f6" />
      case 'email_received':
        return <IconMail size={16} color="#10b981" />
      case 'campaign_created':
        return <IconTarget size={16} color="#f59e0b" />
      default:
        return <IconActivity size={16} color="#6b7280" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email_sent':
        return '#3b82f6'
      case 'email_received':
        return '#10b981'
      case 'campaign_created':
        return '#f59e0b'
      default:
        return '#6b7280'
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(59, 130, 246, 0.2)',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <Text style={{ color: 'white', fontSize: '1.1rem' }}>
          Chargement des statistiques...
        </Text>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1.1rem' }}>
          Impossible de charger les données
        </Text>
        <Button
          onClick={loadAnalyticsData}
          leftSection={<IconRefresh size={16} />}
          style={{ marginTop: '20px' }}
        >
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {/* Header avec actualisation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <Title order={2} style={{ color: 'white', marginBottom: '8px' }}>
            📊 Tableau de bord
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
            Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
          </Text>
        </div>
        <Button
          onClick={loadAnalyticsData}
          leftSection={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconRefresh 
                size={12} 
                color="white"
                style={{
                  transition: 'transform 0.3s ease',
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                }}
              />
            </div>
          }
          variant="light"
          disabled={isRefreshing}
          style={{
            background: isRefreshing 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.2))'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.1))',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: 'white',
            fontWeight: 600,
            padding: '8px 20px',
            borderRadius: '12px',
            boxShadow: isRefreshing 
              ? '0 8px 24px rgba(59, 130, 246, 0.3)'
              : '0 4px 12px rgba(59, 130, 246, 0.2)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            opacity: isRefreshing ? 0.8 : 1,
            cursor: isRefreshing ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isRefreshing) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.2))'
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)'
              e.currentTarget.querySelector('svg')?.style.setProperty('transform', 'rotate(180deg)')
            }
          }}
          onMouseLeave={(e) => {
            if (!isRefreshing) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.1))'
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)'
              e.currentTarget.querySelector('svg')?.style.setProperty('transform', 'rotate(0deg)')
            }
          }}
        >
          {isRefreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

      {/* Cartes de statistiques principales */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        <Card style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.05))',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          minWidth: '140px',
          maxWidth: '160px'
        }}>
          <Group justify="space-between">
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                Campagnes
              </Text>
              <Text style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {analyticsData.total_campaigns}
              </Text>
            </div>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconTarget size={18} color="white" />
            </div>
          </Group>
        </Card>

        <Card style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.05))',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          minWidth: '140px',
          maxWidth: '160px'
        }}>
          <Group justify="space-between">
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                Contacts
              </Text>
              <Text style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {analyticsData.total_contacts}
              </Text>
            </div>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconUsers size={18} color="white" />
            </div>
          </Group>
        </Card>

        <Card style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.05))',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          minWidth: '140px',
          maxWidth: '160px'
        }}>
          <Group justify="space-between">
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                Emails envoyés
              </Text>
              <Text style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {analyticsData.total_emails_sent}
              </Text>
            </div>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconSend size={18} color="white" />
            </div>
          </Group>
        </Card>

        <Card style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.05))',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          minWidth: '140px',
          maxWidth: '160px'
        }}>
          <Group justify="space-between">
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                Emails reçus
              </Text>
              <Text style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {analyticsData.total_emails_received}
              </Text>
            </div>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #ef4444, #f87171)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconMail size={18} color="white" />
            </div>
          </Group>
        </Card>
      </div>

      {/* Les 3 sections sur la même ligne */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '24px',
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        {/* Taux de performance */}
        <Card style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          minWidth: '300px',
          maxWidth: '400px'
        }}>
          <Title order={3} style={{ color: 'white', marginBottom: '16px', fontSize: '1.1rem' }}>
            📈 Taux de performance
          </Title>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            gap: '16px'
          }}>
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              flex: 1
            }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                Taux d'ouverture
              </Text>
              <Text style={{ color: '#fbbf24', fontSize: '1.8rem', fontWeight: 'bold' }}>
                {analyticsData.open_rate.toFixed(1)}%
              </Text>
            </div>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              flex: 1
            }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                Taux de clic
              </Text>
              <Text style={{ color: '#f87171', fontSize: '1.8rem', fontWeight: 'bold' }}>
                {analyticsData.click_rate.toFixed(1)}%
              </Text>
            </div>
          </div>
        </Card>

        {/* Activité récente */}
        <Card style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          minWidth: '300px',
          maxWidth: '350px'
        }}>
          <Title order={3} style={{ color: 'white', marginBottom: '16px', fontSize: '1.1rem' }}>
            ⚡ Activité récente
          </Title>
          <Timeline>
            {analyticsData.recent_activity.map((activity, index) => (
              <Timeline.Item
                key={index}
                bullet={getActivityIcon(activity.type)}
                color={getActivityColor(activity.type)}
              >
                <Text style={{ color: 'white', fontSize: '0.85rem' }}>
                  {activity.message}
                </Text>
                <Text style={{ 
                  color: 'rgba(255, 255, 255, 0.5)', 
                  fontSize: '0.75rem',
                  marginTop: '4px'
                }}>
                  {new Date(activity.timestamp).toLocaleString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>

        {/* Statistiques par période */}
        <Card style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          minWidth: '300px',
          maxWidth: '400px'
        }}>
          <Title order={3} style={{ color: 'white', marginBottom: '16px', fontSize: '1.1rem' }}>
            📊 Statistiques par période
          </Title>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                Envoyés aujourd'hui
              </Text>
              <Text style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {analyticsData.email_stats.sent_today}
              </Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                Envoyés cette semaine
              </Text>
              <Text style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {analyticsData.email_stats.sent_this_week}
              </Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                Reçus aujourd'hui
              </Text>
              <Text style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {analyticsData.email_stats.received_today}
              </Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                Reçus cette semaine
              </Text>
              <Text style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {analyticsData.email_stats.received_this_week}
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
