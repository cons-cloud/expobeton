import { EmailReceptionService, type Notification } from './emailReceptionService'

// Interface pour les notifications natives
export interface NativeNotification {
  id: string
  title: string
  body: string
  icon?: string
  badge?: number
  timestamp: number
}

export class NotificationService {
  private static instance: NotificationService
  private notificationCount: number = 0
  private notifications: Map<string, Notification> = new Map()
  private notificationPermission: NotificationPermission = 'default'
  private swRegistration: ServiceWorkerRegistration | null = null

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  constructor() {
    this.initializeNotifications()
  }

  // Initialiser le système de notifications
  private async initializeNotifications() {
    // Vérifier la permission de notification
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission()
    }

    // Enregistrer le service worker si disponible
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js')
      } catch (error) {
        console.log('Service Worker non disponible:', error)
      }
    }
  }

  // Demander la permission de notification
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Les notifications ne sont pas supportées')
      return false
    }

    const permission = await Notification.requestPermission()
    this.notificationPermission = permission
    return permission === 'granted'
  }

  // Créer une notification native
  async createNativeNotification(notification: {
    title: string
    body: string
    icon?: string
    tag?: string
    requireInteraction?: boolean
  }): Promise<void> {
    if (this.notificationPermission !== 'granted') {
      console.warn('Permission de notification non accordée')
      return
    }

    try {
      const nativeNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/favicon.ico',
        tag: notification.tag,
        requireInteraction: notification.requireInteraction || false,
        badge: '/favicon.ico'
      })

      // Gérer les clics sur la notification
      nativeNotification.onclick = () => {
        window.focus()
        nativeNotification.close()
        this.handleNotificationClick(notification.tag)
      }

      // Auto-dismiss après 5 secondes
      setTimeout(() => {
        nativeNotification.close()
      }, 5000)

    } catch (error) {
      console.error('Erreur lors de la création de la notification native:', error)
    }
  }

  // Gérer le clic sur une notification
  private handleNotificationClick(tag?: string) {
    if (tag) {
      // Naviguer vers la section appropriée
      if (tag.includes('email_received')) {
        // Naviguer vers la boîte de réception
        window.location.hash = '#/inbox'
      } else if (tag.includes('email_replied')) {
        // Naviguer vers les emails envoyés
        window.location.hash = '#/sent'
      }
    }
  }

  // Mettre à jour le badge de l'icône
  updateBadge(count: number) {
    this.notificationCount = count

    // Mettre à jour le badge du service worker
    if (this.swRegistration) {
      this.swRegistration.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close())
      })
    }

    // Mettre à jour le favicon avec badge
    this.updateFaviconBadge(count)

    // Envoyer au service worker pour le badge de l'application
    if (this.swRegistration) {
      this.swRegistration.active?.postMessage({
        type: 'UPDATE_BADGE',
        count: count
      })
    }
  }

  // Mettre à jour le favicon avec un badge
  private updateFaviconBadge(count: number) {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Charger le favicon original
    const img = new Image()
    img.onload = () => {
      // Dessiner le favicon
      ctx.drawImage(img, 0, 0, 32, 32)

      if (count > 0) {
        // Dessiner le cercle rouge
        ctx.fillStyle = '#FF0000'
        ctx.beginPath()
        ctx.arc(24, 8, 8, 0, 2 * Math.PI)
        ctx.fill()

        // Dessiner le nombre
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const displayCount = count > 99 ? '99+' : count.toString()
        ctx.fillText(displayCount, 24, 8)
      }

      // Mettre à jour le favicon
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href = canvas.toDataURL()
      document.getElementsByTagName('head')[0].appendChild(link)
    }
    img.src = '/favicon.ico'
  }

  // Ajouter une notification du système
  addNotification(notification: Notification) {
    this.notifications.set(notification.id, notification)
    
    // Créer une notification native
    this.createNativeNotification({
      title: notification.title,
      body: notification.message,
      tag: `${notification.type}_${notification.id}`,
      requireInteraction: notification.is_important
    })

    // Mettre à jour le compteur
    this.updateNotificationCount()
  }

  // Marquer une notification comme lue
  markAsRead(notificationId: string) {
    const notification = this.notifications.get(notificationId)
    if (notification) {
      notification.is_read = true
      this.updateNotificationCount()
    }
  }

  // Mettre à jour le compteur de notifications
  private updateNotificationCount() {
    const unreadCount = Array.from(this.notifications.values())
      .filter(n => !n.is_read).length
    
    this.updateBadge(unreadCount)
  }

  // Effacer toutes les notifications
  clearAllNotifications() {
    this.notifications.clear()
    this.updateBadge(0)
  }

  // Effacer les notifications lues
  clearReadNotifications() {
    for (const [id, notification] of this.notifications) {
      if (notification.is_read) {
        this.notifications.delete(id)
      }
    }
    this.updateNotificationCount()
  }

  // Obtenir le nombre de notifications non lues
  getUnreadCount(): number {
    return Array.from(this.notifications.values())
      .filter(n => !n.is_read).length
  }

  // Obtenir toutes les notifications
  getAllNotifications(): Notification[] {
    return Array.from(this.notifications.values())
  }

  // Synchroniser avec la base de données
  async syncWithDatabase() {
    try {
      const dbNotifications = await EmailReceptionService.getNotifications(50, false)
      
      // Ajouter les nouvelles notifications
      dbNotifications.forEach(notification => {
        if (!this.notifications.has(notification.id)) {
          this.addNotification(notification)
        }
      })

      // Supprimer les notifications qui n'existent plus en base
      for (const [id] of this.notifications) {
        if (!dbNotifications.find(n => n.id === id)) {
          this.notifications.delete(id)
        }
      }

      this.updateNotificationCount()
    } catch (error) {
      console.error('Erreur lors de la synchronisation des notifications:', error)
    }
  }

  // Démarrer la synchronisation automatique
  startAutoSync(intervalMs: number = 30000) {
    setInterval(() => {
      this.syncWithDatabase()
    }, intervalMs)
  }

  // Animation du badge
  animateBadge() {
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement
    if (!favicon) return

    let pulseCount = 0
    const maxPulses = 6

    const pulse = setInterval(() => {
      if (pulseCount >= maxPulses) {
        clearInterval(pulse)
        return
      }

      // Alterner entre le favicon avec badge et sans badge
      if (pulseCount % 2 === 0) {
        this.updateFaviconBadge(this.notificationCount)
      } else {
        // Restaurer le favicon original temporairement
        const originalFavicon = document.createElement('link')
        originalFavicon.type = 'image/x-icon'
        originalFavicon.rel = 'shortcut icon'
        originalFavicon.href = '/favicon.ico'
        document.getElementsByTagName('head')[0].appendChild(originalFavicon)
      }

      pulseCount++
    }, 500)
  }

  // Jouer un son de notification
  playNotificationSound() {
    try {
      const audio = new Audio('/notification-sound.mp3')
      audio.volume = 0.3
      audio.play().catch(error => {
        console.log('Impossible de jouer le son de notification:', error)
      })
    } catch (error) {
      console.log('Son de notification non disponible:', error)
    }
  }

  // Créer une notification complète avec toutes les fonctionnalités
  async createCompleteNotification(notification: {
    title: string
    body: string
    type: 'email_received' | 'email_replied' | 'campaign_update' | 'system'
    isImportant?: boolean
    data?: any
  }) {
    // Ajouter au système interne
    const internalNotification: Notification = {
      id: Date.now().toString(),
      type: notification.type,
      title: notification.title,
      message: notification.body,
      data: notification.data || {},
      is_read: false,
      is_important: notification.isImportant || false,
      created_at: new Date().toISOString(),
      time_category: 'new'
    }

    this.addNotification(internalNotification)

    // Créer la notification native
    await this.createNativeNotification({
      title: notification.title,
      body: notification.body,
      tag: `${notification.type}_${internalNotification.id}`,
      requireInteraction: notification.isImportant
    })

    // Animer le badge si c'est important
    if (notification.isImportant) {
      this.animateBadge()
    }

    // Jouer le son
    this.playNotificationSound()
  }
}

// Exporter l'instance singleton
export const notificationService = NotificationService.getInstance()
