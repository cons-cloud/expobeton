# Configuration Supabase pour Expobeton Email

Ce guide explique comment configurer Supabase pour synchroniser votre application Expobeton Email avec la base de données.

## 🚀 Étapes de Configuration

### 1. Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur "New Project"
4. Choisissez votre organisation
5. Nommez votre projet (ex: `expobeton-email`)
6. Choisissez une base de données et une région
7. Créez un mot de passe pour la base de données
8. Attendez la création du projet (2-3 minutes)

### 2. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine de votre projet :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

Où trouver ces valeurs :
- Allez dans votre projet Supabase
- Settings > API
- Copiez l'URL du projet et la clé `anon`

### 3. Exécuter le script SQL

1. Allez dans l'éditeur SQL de votre projet Supabase
2. Copiez et collez le contenu du fichier `supabase-schema.sql`
3. Cliquez sur "Run" pour exécuter le script

Ce script va créer :
- ✅ Les tables nécessaires (`email_templates`, `contacts`, `email_campaigns`, `emails_sent`)
- ✅ Les index pour optimiser les performances
- ✅ Les triggers pour mettre à jour automatiquement `updated_at`
- ✅ La sécurité RLS (Row Level Security)
- ✅ Les politiques de sécurité pour chaque utilisateur
- ✅ Des données de test

### 4. Fonctionnalités maintenant synchronisées

#### ✅ **Envoi d'emails**
- Tous les emails envoyés sont stockés dans la table `emails_sent`
- Statuts en temps réel : `pending` → `sent` → `delivered`
- Tracking des erreurs avec messages détaillés

#### ✅ **Campagnes d'emails**
- Création de campagnes dans `email_campaigns`
- Statuts des campagnes : `draft` → `sending` → `sent` → `failed`
- Association automatique avec les emails envoyés

#### ✅ **Statistiques en temps réel**
- Nombre total d'emails envoyés
- Taux de livraison
- Taux d'échec
- Statistiques par campagne

#### ✅ **Sécurité**
- Chaque utilisateur ne voit que ses propres données
- RLS activé sur toutes les tables
- Authentification Supabase intégrée

## 📊 Tables créées

### `email_templates`
```sql
- id (UUID)
- name (VARCHAR)
- subject (VARCHAR)
- content (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- user_id (UUID)
```

### `contacts`
```sql
- id (UUID)
- email (VARCHAR, UNIQUE)
- first_name (VARCHAR)
- last_name (VARCHAR)
- company (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- user_id (UUID)
```

### `email_campaigns`
```sql
- id (UUID)
- name (VARCHAR)
- subject (VARCHAR)
- content (TEXT)
- status (ENUM: draft, scheduled, sending, sent, failed)
- scheduled_at (TIMESTAMP)
- sent_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- user_id (UUID)
- template_id (UUID)
```

### `emails_sent`
```sql
- id (UUID)
- campaign_id (UUID)
- recipient_email (VARCHAR)
- recipient_name (VARCHAR)
- subject (VARCHAR)
- content (TEXT)
- status (ENUM: pending, sent, delivered, failed, bounced)
- sent_at (TIMESTAMP)
- delivered_at (TIMESTAMP)
- error_message (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- user_id (UUID)
```

## 🔧 Utilisation

### Envoyer un email simple

```typescript
import { sendEmail } from '../lib/emailService'

const result = await sendEmail({
  to: 'client@example.com',
  toName: 'Jean Dupont',
  subject: 'Bienvenue chez Expobeton',
  html: '<h1>Bienvenue !</h1><p>Nous sommes ravis de vous avoir parmi nous.</p>',
  campaignId: 'uuid-campagne'
})
```

### Envoyer des emails en masse

```typescript
import { sendBulkEmails } from '../lib/emailService'

const emails = [
  { to: 'client1@example.com', subject: 'Promotion', html: '...' },
  { to: 'client2@example.com', subject: 'Promotion', html: '...' }
]

const result = await sendBulkEmails(emails, (sent, total, email) => {
  console.log(`Progression: ${sent}/${total} - ${email}`)
})
```

### Obtenir les statistiques

```typescript
import { getEmailStats } from '../lib/supabase'

const stats = await getEmailStats()
console.log(stats)
// { total: 100, sent: 95, delivered: 90, failed: 5, bounced: 0, pending: 0 }
```

## 🎯 Prochaines améliorations

- [ ] Intégration avec SendGrid/Mailgun pour l'envoi réel
- [ ] Webhooks pour le tracking en temps réel
- [ ] Templates d'emails avancés
- [ ] Segmentation des contacts
- [ ] Automatisations d'emails
- [ ] A/B testing
- [ ] Analytics détaillés

## 🐛 Dépannage

### Erreur "Missing Supabase environment variables"
- Vérifiez que votre fichier `.env.local` est bien configuré
- Redémarrez votre serveur de développement

### Erreur RLS (Row Level Security)
- Assurez-vous d'être connecté
- Vérifiez que les politiques RLS sont bien créées

### Emails qui ne s'envoient pas
- Vérifiez la console pour les erreurs
- Les emails sont simulés en développement (90% de succès)

## 📞 Support

Si vous avez des questions :
1. Vérifiez les logs dans la console Supabase
2. Consultez la [documentation Supabase](https://supabase.com/docs)
3. Vérifiez que toutes les étapes ci-dessus ont été suivies

---

🎉 **Votre application Expobeton Email est maintenant synchronisée avec Supabase !**
