import { useState, useEffect } from 'react'
import { Badge, ActionIcon, Tooltip, Popover, Text, ScrollArea, Button, Group } from '@mantine/core'
import { IconBell, IconBellRinging, IconCheck, IconX } from '@tabler/icons-react'
import { notificationService } from '../lib/notificationService'
import { type Notification } from '../lib/emailReceptionService'

interface NotificationBadgeProps {
  onNotificationClick?: (notification: Notification) => void
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ onNotificationClick }) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [opened, setOpened] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Initialiser le service de notifications
    const initNotifications = async () => {
      try {
        await notificationService.requestPermission()
        notificationService.startAutoSync(15000) // Vérifier toutes les 15 secondes
        
        // Charger les notifications initiales
        await notificationService.syncWithDatabase()
        updateNotificationData()
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des notifications:', error)
        // En cas d'erreur, utiliser des données simulées
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'email_received',
            title: 'Nouvel email reçu',
            message: 'contact@entreprise-abc.com vous a envoyé un message',
            data: {},
            is_read: false,
            is_important: true,
            created_at: new Date().toISOString(),
            time_category: 'new'
          }
        ]
        setNotifications(mockNotifications)
        setUnreadCount(mockNotifications.filter(n => !n.is_read).length)
      }
    }

    initNotifications()

    // Écouter les changements de notifications
    const interval = setInterval(updateNotificationData, 5000)

    return () => clearInterval(interval)
  }, [])

  const updateNotificationData = () => {
    try {
      const count = notificationService.getUnreadCount()
      const allNotifications = notificationService.getAllNotifications()
      
      setUnreadCount(count)
      setNotifications(allNotifications.slice(0, 10)) // Limiter à 10 notifications récentes

      // Animer le badge si de nouvelles notifications
      if (count > 0 && !isAnimating) {
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 3000)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lue via le service
    notificationService.markAsRead(notification.id)
    
    // Appeler le callback externe
    if (onNotificationClick) {
      onNotificationClick(notification)
    }
    
    // Mettre à jour l'état local
    updateNotificationData()
  }

  const handleMarkAllAsRead = () => {
    notifications.forEach(notification => {
      notificationService.markAsRead(notification.id)
    })
    updateNotificationData()
  }

  const handleClearAll = () => {
    notificationService.clearAllNotifications()
    updateNotificationData()
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`
    return `Il y a ${Math.floor(diffMins / 1440)}j`
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'email_received':
        return '📧'
      case 'email_replied':
        return '↩️'
      case 'campaign_update':
        return '📊'
      case 'system':
        return '⚙️'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'email_received':
        return 'blue'
      case 'email_replied':
        return 'green'
      case 'campaign_update':
        return 'orange'
      case 'system':
        return 'gray'
      default:
        return 'gray'
    }
  }

  return (
    <Popover
      width={350}
      position="bottom-end"
      withArrow
      shadow="md"
      opened={opened}
      onChange={setOpened}
    >
      <Popover.Target>
        <Tooltip label="Notifications">
          <ActionIcon
            size="xl"
            variant="light"
            style={{
              position: 'relative',
              transition: 'all 0.3s ease',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '16px',
              width: '56px',
              height: '56px',
              boxShadow: unreadCount > 0 ? '0 8px 24px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = unreadCount > 0 ? '0 8px 24px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            {isAnimating ? (
              <IconBellRinging size={24} color="#3b82f6" />
            ) : (
              <IconBell size={24} color={unreadCount > 0 ? '#3b82f6' : '#9ca3af'} />
            )}
            
            {unreadCount > 0 && (
              <Badge
                size="sm"
                color="red"
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 24,
                  height: 24,
                  fontSize: 11,
                  fontWeight: 'bold',
                  animation: 'pulse 2s infinite',
                  background: 'linear-gradient(135deg, #ef4444, #f87171)',
                  border: '2px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </ActionIcon>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <div style={{ borderBottom: '1px solid #eee', padding: '12px 16px' }}>
          <Group justify="space-between">
            <Text fw={600}>Notifications</Text>
            <Group gap={8}>
              {unreadCount > 0 && (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconCheck size={12} />}
                  onClick={handleMarkAllAsRead}
                >
                  Tout lire
                </Button>
              )}
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<IconX size={8} />}
                onClick={handleClearAll}
              >
                Effacer
              </Button>
            </Group>
          </Group>
        </div>

        <ScrollArea h={300} w={350}>
          {notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Text c="dimmed">Aucune notification</Text>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  backgroundColor: notification.is_read ? 'transparent' : '#f8f9fa'
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <Group gap={12}>
                  <Text size="xl">{getNotificationIcon(notification.type)}</Text>
                  <div style={{ flex: 1 }}>
                    <Group justify="space-between" mb={4}>
                      <Text
                        size="sm"
                        fw={notification.is_read ? 'normal' : 'bold'}
                        color={notification.is_important ? 'red' : 'black'}
                      >
                        {notification.title}
                      </Text>
                      <Badge
                        size="xs"
                        color={getNotificationColor(notification.type)}
                        variant="light"
                      >
                        {notification.type}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mb={4}>
                      {notification.message}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatTime(notification.created_at)}
                    </Text>
                  </div>
                  {!notification.is_read && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#228be6'
                      }}
                    />
                  )}
                </Group>
              </div>
            ))
          )}
        </ScrollArea>

        <div style={{ borderTop: '1px solid #eee', padding: '8px 16px' }}>
          <Button
            variant="light"
            size="sm"
            fullWidth
            onClick={() => {
              // Naviguer vers la page des notifications
              window.location.hash = '#/notifications'
              setOpened(false)
            }}
          >
            Voir toutes les notifications
          </Button>
        </div>
      </Popover.Dropdown>
    </Popover>
  )
}

// Styles CSS pour l'animation
const style = document.createElement('style')
style.textContent = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .notification-bell-animate {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }
`

if (!document.head.querySelector('style[data-notification-badge]')) {
  style.setAttribute('data-notification-badge', 'true')
  document.head.appendChild(style)
}
