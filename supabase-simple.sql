-- Script simple pour créer les tables manquantes
-- Exécutez ce script étape par étape

-- Étape 1: Supprimer la table campaigns si elle existe et la recréer correctement
DROP TABLE IF EXISTS campaigns CASCADE;

-- Recréer la table campaigns avec toutes les colonnes nécessaires
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  recipients_count INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  sender_email TEXT DEFAULT 'henrinelngando229@gmail.com'
);

-- Étape 2: Créer la table email_stats
DROP TABLE IF EXISTS email_stats CASCADE;

CREATE TABLE email_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Étape 3: Créer la table contacts
DROP TABLE IF EXISTS contacts CASCADE;

CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'unsubscribed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Étape 4: Créer la table notifications
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('email_received', 'email_replied', 'campaign_update', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  time_category TEXT DEFAULT 'new' CHECK (time_category IN ('new', 'recent', 'old')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Étape 5: Créer les index
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX idx_email_stats_campaign_id ON email_stats(campaign_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Étape 6: Activer RLS et créer les politiques
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for campaigns" ON campaigns FOR ALL USING (true);

ALTER TABLE email_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for email_stats" ON email_stats FOR ALL USING (true);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for contacts" ON contacts FOR ALL USING (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for notifications" ON notifications FOR ALL USING (true);

-- Étape 7: Insérer des données de démonstration
INSERT INTO campaigns (name, subject, content, status, recipients_count) VALUES
('Campagne de Bienvenue', 'Bienvenue chez ExpoBeton', 'Merci de vous être inscrit !', 'sent', 150),
('Promotion Printemps', 'Offres spéciales Printemps 2026', 'Découvrez nos nouvelles offres...', 'draft', 200),
('Newsletter Mensuelle', 'Actualités ExpoBeton', 'Les dernières nouveautés...', 'scheduled', 100);

INSERT INTO email_stats (campaign_id, total_sent, total_delivered, total_opened, total_clicked) VALUES
((SELECT id FROM campaigns WHERE name = 'Campagne de Bienvenue'), 150, 145, 120, 45),
((SELECT id FROM campaigns WHERE name = 'Promotion Printemps'), 0, 0, 0, 0),
((SELECT id FROM campaigns WHERE name = 'Newsletter Mensuelle'), 0, 0, 0, 0);

INSERT INTO contacts (email, name, company) VALUES
('contact@entreprise-abc.com', 'Jean Dupont', 'Entreprise ABC'),
('info@societe.fr', 'Marie Martin', 'Société France'),
('client@exemple.com', 'Pierre Durand', 'Exemple Corp');

INSERT INTO notifications (type, title, message, is_read, is_important) VALUES
('email_received', 'Nouvel email reçu', 'contact@entreprise-abc.com vous a envoyé un message', false, true),
('campaign_update', 'Campagne terminée', 'La campagne "Campagne de Bienvenue" a été envoyée avec succès', false, false),
('system', 'Système', 'Connexion à la base de données établie', true, false);

-- Étape 8: Vérifier que tout est bien créé
SELECT 'campaigns' as table_name, COUNT(*) as row_count FROM campaigns
UNION ALL
SELECT 'email_stats' as table_name, COUNT(*) as row_count FROM email_stats  
UNION ALL
SELECT 'contacts' as table_name, COUNT(*) as row_count FROM contacts
UNION ALL
SELECT 'notifications' as table_name, COUNT(*) as row_count FROM notifications;
