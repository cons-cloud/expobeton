# Configuration de l'Accusé de Réception Gmail

Ce guide explique comment configurer les accusés de réception automatiques pour recevoir des notifications dans votre boîte Gmail lorsque des emails sont envoyés depuis Expobeton Email.

## 🎯 **Fonctionnalités**

### ✅ **Accusé de Réception Automatique**
- **Emails envoyés** : Notification immédiate dans votre Gmail
- **Échecs d'envoi** : Alertes en cas d'échec
- **Détails complets** : Destinataire, sujet, date, campagne
- **Design professionnel** : Templates HTML modernes
- **Tracking complet** : Statut et erreurs détaillées

### ✅ **Informations Incluses**
- ✅ **Destinataire** : Email et nom du contact
- ✅ **Sujet** : Sujet de l'email original
- ✅ **Date/Heure** : Timestamp précis
- ✅ **Campagne** : ID de la campagne (si applicable)
- ✅ **Statut** : Succès ou échec
- ✅ **Erreurs** : Messages d'erreur détaillés

## 📧 **Exemples d'Emails Reçus**

### ✅ **Email de Succès**
```
✅ Email envoyé avec succès - client@example.com

📧 Destinataire: client@example.com
👤 Nom: Jean Dupont
📋 Sujet: Offre spéciale Expobeton
🕐 Date d'envoi: 27/01/2026 17:30:45
📊 Campagne ID: uuid-campagne-123

✅ Statut: Envoyé avec succès
```

### ❌ **Email d'Échec**
```
❌ Échec d'envoi - client@example.com

📧 Destinataire: client@example.com
📋 Sujet: Offre spéciale Expobeton
🕐 Date: 27/01/2026 17:30:45

❌ Erreur: Erreur de connexion au serveur SMTP
```

## 🔧 **Configuration**

### 1. **Configurer l'Email Administrateur**

#### Option A: Configuration Directe dans le Code
Modifiez `src/lib/emailService.ts` :

```typescript
const emailConfig: EmailConfig = {
  from: 'noreply@expobetonrdc.com',
  replyTo: 'support@expobetonrdc.com',
  adminEmail: 'votre-email@gmail.com' // Remplacez par votre email Gmail
}
```

#### Option B: Configuration Dynamique
Dans votre composant Dashboard :

```typescript
import { setAdminEmail } from '../../lib/emailService'

// Configuration lors du chargement du composant
useEffect(() => {
  setAdminEmail('votre-email@gmail.com')
}, [])
```

#### Option C: Configuration depuis les Variables d'Environnement
Créez `.env.local` :

```env
VITE_ADMIN_EMAIL=votre-email@gmail.com
```

Puis modifiez `src/lib/emailService.ts` :

```typescript
const emailConfig: EmailConfig = {
  from: 'noreply@expobetonrdc.com',
  replyTo: 'support@expobetonrdc.com',
  adminEmail: import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'
}
```

### 2. **Configuration Gmail (Optionnel)**

Pour garantir la réception des emails, configurez Gmail :

#### Filtres Gmail
1. **Allez dans Gmail** → Paramètres
2. **Filtres et blocage** → Créer un nouveau filtre
3. **Critères** :
   - De : `noreply@expobetonrdc.com`
   - Contient : `✅` ou `❌` ou `Accusé de réception`
4. **Action** : Appliquer le label "Expobeton Email"
5. **Envoyer vers** : `votre-email@gmail.com`

#### Règles Gmail (Alternative)
1. **Paramètres** → **Voir tous les paramètres**
2. **Règles** → **Créer une nouvelle règle**
3. **Configuration** :
   - **De** : `noreply@expobetonrdc.com`
   - **Sujet contient** : `Email envoyé` ou `Échec d'envoi`
   - **Action** : Transférer vers `votre-email@gmail.com`

## 🚀 **Utilisation**

### 1. **Test d'Envoi**
```typescript
import { sendEmail } from '../../lib/emailService'

// Envoyer un email test
const result = await sendEmail({
  to: 'test@example.com',
  toName: 'Test User',
  subject: 'Test d\'envoi',
  html: '<h1>Ceci est un test</h1>',
  campaignId: 'test-campaign'
})

// Vous recevrez un email dans votre Gmail avec le résultat
```

### 2. **Campagne en Masse**
```typescript
import { sendBulkEmails } from '../../lib/emailService'

const emails = [
  { to: 'client1@example.com', subject: 'Newsletter', html: '...' },
  { to: 'client2@example.com', subject: 'Newsletter', html: '...' }
]

const result = await sendBulkEmails(emails)
// Vous recevrez un accusé pour chaque email envoyé
```

## 📊 **Gestion des Accusés**

### Statistiques dans le Dashboard
- ✅ **Total d'emails envoyés**
- ✅ **Taux de réussite**
- ✅ **Erreurs tracking**
- ✅ **Historique complet**

### Archivage Gmail
- **Labels automatiques** : "Expobeton Email"
- **Filtres intelligents** : Succès/Échec
- **Recherche** : Par destinataire, sujet, date

## 🛡️ **Sécurité**

### Protection contre le Spam
- ✅ **En-têtes SPF/DKIM** configurés
- ✅ **Domaine vérifié** : `expobetonrdc.com`
- ✅ **Rate limiting** : Protection anti-spam

### Confidentialité
- ✅ **Données masquées** : Pas d'infos sensibles
- ✅ **Logs sécurisés** : Erreurs sans données personnelles
- ✅ **Isolation** : Séparation admin/utilisateurs

## 🔍 **Dépannage**

### Problèmes Communs

#### "Je ne reçois pas les accusés"
1. ✅ **Vérifiez l'email admin** dans la configuration
2. ✅ **Consultez les logs** dans la console du navigateur
3. **Vérifiez les filtres Gmail**
4. **Testez avec un email simple**

#### "Les accusés vont dans le spam"
1. ✅ **Ajoutez l'expéditeur** à vos contacts Gmail
2. ✅ **Créez une règle Gmail** pour éviter le spam
3. ✅ **Vérifiez le domaine** : `expobetonrdc.com`

#### "Trop d'accusés reçus"
1. ✅ **Filtrez par campagne** : Utilisez les labels Gmail
2. ✅ **Archivage automatique** : Configurez les règles Gmail
3. ✅ **Résumé quotidien** : Configurez les notifications

### Logs de Débogage
```typescript
// Activer les logs dans la console
console.log('Envoi d\'accusé de réception à:', emailConfig.adminEmail)
console.log('Statut de l\'email:', status)
console.log('Erreur:', error)
```

## 📈 **Personnalisation**

### Modifier le Template
Éditez la fonction `sendReceiptEmail` dans `src/lib/emailService.ts` :

```typescript
// Personnaliser le sujet
const receiptSubject = status === 'sent' 
  ? `🎯 [Expobeton] Email envoyé - ${originalEmail.to}`
  : `⚠️ [Expobeton] Échec - ${originalEmail.to}`

// Personnaliser le contenu
const receiptContent = `
  <!-- Votre template personnalisé ici -->
`
```

### Ajouter des Informations
```typescript
// Ajouter plus de détails dans l'accusé
<p style="margin: 5px 0;"><strong>🏢 Organisation:</strong> ${organizationName}</p>
<p style="margin: 5px 0;"><strong>📊 Campagne:</strong> ${campaignName}</p>
<p style="margin: 5px 0;"><strong>📈 Statistiques:</strong> ${stats}</p>
```

## 🔄 **Mises à Jour Futures**

### Prochaines Améliorations
- [ ] **SMS notifications** : Accusés par SMS
- [ ] **Slack/Discord** : Intégrations messagerie
- [ ] **Dashboard dédié** : Vue des accusés
- [] **Templates multiples** : Différents designs
- [ ] **Programmation** : Horaires d'envoi
- [ ] **Filtres avancés** : Par type, campagne, statut

---

🎉 **Vous recevrez maintenant un accusé de réception Gmail pour chaque email envoyé depuis Expobeton Email !**
