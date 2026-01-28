# Guide d'Intégration des Notifications Natives

## 🎯 Objectif

Intégrer les notifications du logiciel avec les notifications natives du système d'exploitation pour une expérience utilisateur complète.

## 📱 Fonctionnalités

### 1. **Notifications Natives**
- **Notifications système** : Apparaissent dans le centre de notifications
- **Badge animé** : Compteur sur l'icône de l'application
- **Son de notification** : Alertes audio pour les emails importants
- **Actions rapides** : Répondre, archiver directement depuis la notification

### 2. **Badge de l'Application**
- **Compteur dynamique** : 1, 2, 3... selon le nombre de notifications non lues
- **Animation** : Le badge pulse et l'icône anime lors de nouvelles notifications
- **Favicon dynamique** : Le favicon du navigateur affiche le compteur
- **Service Worker** : Gère le badge même quand l'application est en arrière-plan

### 3. **Synchronisation Complète**
- **Temps réel** : Vérification toutes les 15 secondes
- **Double synchronisation** : Gmail + Application
- **Statuts synchronisés** : Lu/non lu synchronisé partout
- **Persistance** : Notifications conservées même après rechargement

## 🚀 Installation

### 1. Enregistrer le Service Worker

Ajoutez ce code dans votre `public/index.html` :

```html
<script>
  // Enregistrer le service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker enregistré:', registration)
        })
        .catch(error => {
          console.log('Erreur Service Worker:', error)
        })
    })
  }
</script>
```

### 2. Ajouter le NotificationBadge au Dashboard

Dans votre composant principal (Dashboard.tsx) :

```tsx
import { NotificationBadge } from '../components/NotificationBadge'

// Dans la barre de navigation
<Group>
  <NotificationBadge 
    onNotificationClick={(notification) => {
      // Naviguer vers la section appropriée
      if (notification.type === 'email_received') {
        setActiveTab('inbox')
      }
    }}
  />
</Group>
```

### 3. Créer les fichiers audio

Créez un fichier `public/notification-sound.mp3` pour le son de notification.

## 🔧 Configuration

### 1. Permissions de Notification

Le système demande automatiquement la permission au premier lancement :

```typescript
// Demander la permission
const hasPermission = await notificationService.requestPermission()
if (hasPermission) {
  console.log('Notifications activées')
}
```

### 2. Configuration du Badge

Le badge se met à jour automatiquement :

```typescript
// Mettre à jour manuellement si nécessaire
notificationService.updateBadge(5) // Affiche "5" sur le badge
```

### 3. Personnalisation des Notifications

```typescript
// Créer une notification complète
await notificationService.createCompleteNotification({
  title: 'Nouvel email reçu',
  body: 'Vous avez reçu un email de contact@entreprise.com',
  type: 'email_received',
  isImportant: true,
  data: { emailId: '123' }
})
```

## 📊 Comportement

### 1. Réception d'Email

```
Email reçu → Base de données → Notification native → Badge animé → Son
```

### 2. Badge de l'Icône

- **0 notifications** : Icône normale
- **1 notification** : Badge "1" qui pulse
- **2+ notifications** : Badge avec le nombre exact
- **99+ notifications** : Badge "99+"

### 3. Animations

- **Nouvelle notification** : L'icône de cloche secoue pendant 0.5s
- **Badge** : Pulse toutes les 2 secondes pendant 6 secondes
- **Favicon** : Affiche le compteur dans l'onglet du navigateur

## 🎨 Personnalisation

### 1. Couleurs et Styles

Dans `NotificationBadge.tsx` :

```tsx
const getNotificationColor = (type: string) => {
  switch (type) {
    case 'email_received': return 'blue'
    case 'email_replied': return 'green'
    case 'campaign_update': return 'orange'
    default: return 'gray'
  }
}
```

### 2. Sons de Notification

Remplacez `public/notification-sound.mp3` par votre son personnalisé.

### 3. Icônes

Modifiez les icônes dans le composant :

```tsx
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'email_received': return '📧'
    case 'email_replied': return '↩️'
    default: return '🔔'
  }
}
```

## 🔧 Dépannage

### 1. Notifications ne s'affichent pas

- **Vérifiez la permission** : `Notification.permission === 'granted'`
- **HTTPS requis** : Les notifications natives nécessitent HTTPS
- **Service Worker** : Vérifiez que `/sw.js` est accessible

### 2. Badge ne se met pas à jour

- **Service Worker actif** : Vérifiez dans les outils de développement
- **Favicon** : Assurez-vous que `/favicon.ico` existe
- **Console** : Vérifiez les erreurs JavaScript

### 3. Son ne joue pas

- **Interaction utilisateur** : Le son nécessite une interaction utilisateur
- **Format audio** : Vérifiez que le fichier est au bon format
- **Volume** : Vérifiez le volume du navigateur

## 📱 Support Plateforme

### Navigateurs Supportés
- ✅ Chrome (Desktop + Mobile)
- ✅ Firefox (Desktop + Mobile)  
- ✅ Safari (Desktop + Mobile)
- ✅ Edge (Desktop + Mobile)

### Fonctionnalités par Plateforme
- **Badge application** : Chrome, Edge (partiel)
- **Notifications natives** : Tous les navigateurs modernes
- **Service Worker** : Tous les navigateurs modernes
- **Son** : Tous les navigateurs (avec interaction utilisateur)

## 🎯 Résultat Final

Une fois intégré, votre système offrira :

1. **Notifications immédiates** dans le centre de notifications du système
2. **Badge animé** sur l'icône avec le compteur exact
3. **Synchronisation parfaite** entre Gmail et l'application
4. **Expérience utilisateur** professionnelle et moderne

---

🎯 **Le système est maintenant prêt pour des notifications natives complètes avec badge animé !**
