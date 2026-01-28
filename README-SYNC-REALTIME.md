# Guide de Synchronisation en Temps Réel

## 🎯 Objectif

Base de données complète avec synchronisation en temps réel pour :
- **Aperçu** : Vue d'ensemble en temps réel
- **Campagnes** : Suivi des campagnes d'emails
- **Contacts** : Gestion des contacts et organisations
- **Analytique** : Statistiques en temps réel

## 📋 Structure de la Base de Données

### Tables Principales

#### `organizations`
- `id` : UUID unique
- `name` : Nom de l'organisation (unique)
- `user_id` : Propriétaire

#### `contacts`
- `id` : UUID unique
- `email` : Adresse email (unique par utilisateur)
- `organization_name` : Nom de l'organisation associée
- `user_id` : Propriétaire

#### `email_campaigns`
- `id` : UUID unique
- `name` : Nom de la campagne
- `subject` : Sujet de l'email
- `content` : Contenu de l'email
- `status` : draft, scheduled, sending, sent, failed
- `user_id` : Propriétaire

#### `emails_sent`
- `id` : UUID unique
- `campaign_id` : Lien vers la campagne
- `contact_id` : Lien vers le contact
- `recipient_email` : Email du destinataire
- `recipient_organization` : Organisation du destinataire
- `status` : pending, sending, sent, delivered, failed, bounced
- `user_id` : Propriétaire

#### `email_templates`
- `id` : UUID unique
- `name` : Nom du template
- `subject` : Sujet du template
- `content` : Contenu du template
- `user_id` : Propriétaire

## 🔄 Vues Analytiques en Temps Réel

### `campaign_analytics`
Statistiques des campagnes en temps réel :
- Total emails envoyés
- Emails par statut (pending, sending, sent, delivered, failed, bounced)
- Taux de succès
- Informations de la campagne

### `contact_analytics`
Statistiques des contacts en temps réel :
- Emails reçus par contact
- Taux de livraison par contact
- Organisation associée

### `dashboard_analytics`
Tableau de bord en temps réel :
- Total contacts
- Total organisations
- Campagnes actives
- Emails envoyés aujourd'hui

## 📥 Import Excel

### Format Attendu
Le fichier Excel doit contenir :
- **Colonne A** : Nom de l'organisation
- **Colonne B** : Adresse email

### Processus d'Import
1. **Lire le fichier Excel**
2. **Extraire** nom organisation + email
3. **Créer** l'organisation si elle n'existe pas
4. **Créer** le contact avec l'email et l'organisation
5. **Synchroniser** immédiatement avec Supabase

## 🚀 Synchronisation en Temps Réel

### "Envoi en Progression"
- Utilise la vue `campaign_analytics`
- Filtre sur `campaign_status = 'sending'`
- Met à jour en temps réel avec les triggers

### "Campagne Terminée"
- Utilise la vue `campaign_analytics`
- Filtre sur `campaign_status = 'sent'`
- Statistiques complètes et finales

### Triggers Automatiques
- `update_updated_at_column` : Met à jour les timestamps
- `update_recipient_organization` : Lie l'organisation au contact

## 🔧 Politiques de Sécurité (RLS)

Chaque table a des politiques RLS complètes :
- **SELECT** : Voir ses propres données
- **INSERT** : Insérer dans ses données
- **UPDATE** : Modifier ses données
- **DELETE** : Supprimer ses données

## 📊 Requêtes Exemples

### Obtenir les campagnes en cours
```sql
SELECT * FROM campaign_analytics 
WHERE campaign_status = 'sending' 
AND user_id = auth.uid();
```

### Obtenir les contacts avec organisations
```sql
SELECT * FROM contact_analytics 
WHERE user_id = auth.uid()
ORDER BY organization_name, email;
```

### Statistiques du tableau de bord
```sql
SELECT * FROM dashboard_analytics 
WHERE user_id = auth.uid();
```

## 🎯 Flux de Travail

### 1. Import des Contacts
```sql
-- Import depuis Excel
INSERT INTO contacts (email, organization_name, user_id)
VALUES ('contact@entreprise.com', 'Entreprise SA', auth.uid());
```

### 2. Création de Campagne
```sql
-- Nouvelle campagne
INSERT INTO email_campaigns (name, subject, content, user_id)
VALUES ('Newsletter', 'Sujet', 'Contenu', auth.uid());
```

### 3. Envoi en Temps Réel
```sql
-- Ajout d'email envoyé
INSERT INTO emails_sent (campaign_id, contact_id, recipient_email, status, user_id)
VALUES (campaign_uuid, contact_uuid, 'email@contact.com', 'sending', auth.uid());
```

### 4. Mise à jour du Statut
```sql
-- Mise à jour en temps réel
UPDATE emails_sent 
SET status = 'delivered', delivered_at = NOW()
WHERE id = email_uuid;
```

## ✅ Avantages

### Synchronisation Complète
- **Toutes les tables** synchronisées
- **Vues analytiques** en temps réel
- **Triggers automatiques** pour la cohérence

### Sécurité Maximale
- **RLS complet** sur toutes les tables
- **Isolation par utilisateur**
- **Politiques granulaires**

### Performance Optimisée
- **Index optimisés** pour les requêtes
- **Vues matérialisées** pour l'analyse
- **Triggers efficaces**

---

🎯 **Exécutez `MASTER-CLEAN.sql` puis `MASTER-DATABASE.sql` pour une base complète !**
