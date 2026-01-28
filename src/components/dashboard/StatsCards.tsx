import { Card, Text } from '@mantine/core'
import { IconSend, IconUsers, IconEye, IconTarget } from '@tabler/icons-react'

interface StatsCardsProps {
  campaigns: any[]
  contacts: any[]
  analytics: {
    open_rate: number
    click_rate: number
  }
}

export function StatsCards({ campaigns, contacts, analytics }: StatsCardsProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap',
      marginBottom: '32px'
    }}>
      <Card style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        minWidth: '200px',
        maxWidth: '250px',
        flex: '1'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconSend size={24} color="white" />
          </div>
          <div>
            <Text style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              Campagnes
            </Text>
            <Text style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>
              {campaigns.length}
            </Text>
          </div>
        </div>
      </Card>

      <Card style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        minWidth: '200px',
        maxWidth: '250px',
        flex: '1'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #10b981, #34d399)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconUsers size={24} color="white" />
          </div>
          <div>
            <Text style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              Contacts
            </Text>
            <Text style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>
              {contacts.length}
            </Text>
          </div>
        </div>
      </Card>

      <Card style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        minWidth: '200px',
        maxWidth: '250px',
        flex: '1'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconEye size={24} color="white" />
          </div>
          <div>
            <Text style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              Taux d'ouverture
            </Text>
            <Text style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>
              {analytics.open_rate.toFixed(1)}%
            </Text>
          </div>
        </div>
      </Card>

      <Card style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        minWidth: '200px',
        maxWidth: '250px',
        flex: '1'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #ef4444, #f87171)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconTarget size={24} color="white" />
          </div>
          <div>
            <Text style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              Taux de clic
            </Text>
            <Text style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>
              {analytics.click_rate.toFixed(1)}%
            </Text>
          </div>
        </div>
      </Card>
    </div>
  )
}
