// Service Worker pour les notifications natives et le badge de l'application

const CACHE_NAME = 'expobeton-email-v1'

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installation')
  // Ne pas essayer de mettre en cache pour éviter les erreurs
  self.skipWaiting()
})

// Activation du Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Interception des requêtes (simplifié)
self.addEventListener('fetch', event => {
  // Laisser les requêtes passer normalement
  // Pas de mise en cache pour éviter les erreurs
})

// Gestion des messages pour le badge
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'UPDATE_BADGE') {
    // Mettre à jour le badge de l'application
    updateAppBadge(event.data.count)
  }
})

// Fonction pour mettre à jour le badge
function updateAppBadge(count) {
  if ('setAppBadge' in navigator) {
    navigator.setAppBadge(count).catch(error => {
      console.log('Erreur lors de la mise à jour du badge:', error)
    })
  }
  
  // Pour les navigateurs qui ne supportent pas setAppBadge
  if ('clearAppBadge' in navigator && count === 0) {
    navigator.clearAppBadge()
  }
}

// Gestion des notifications push
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Voir l\'email',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/favicon.ico'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Expobeton Email', options)
  )
})

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'explore') {
    // Ouvrir l'application et naviguer vers la boîte de réception
    event.waitUntil(
      clients.openWindow('/inbox')
    )
  } else if (event.action === 'close') {
    // Fermer la notification
    event.notification.close()
  } else {
    // Comportement par défaut : ouvrir l'application
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
