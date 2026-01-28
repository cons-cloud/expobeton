-- Création des tables pour ExpoBeton Email

-- Table des campagnes
CREATE TABLE IF NOT EXISTS campaigns (
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

-- Table des statistiques d'emails
CREATE TABLE IF NOT EXISTS email_stats (
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

-- Table des contacts
CREATE TABLE IF NOT EXISTS contacts (
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

-- Table des emails envoyés
CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
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

-- Table de réception d'emails
CREATE TABLE IF NOT EXISTS email_reception (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT UNIQUE NOT NULL,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  folder TEXT DEFAULT 'inbox',
  labels TEXT[] DEFAULT '{}',
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statistiques de réception
CREATE TABLE IF NOT EXISTS email_reception_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  total_received INTEGER DEFAULT 0,
  total_unread INTEGER DEFAULT 0,
  total_starred INTEGER DEFAULT 0,
  total_archived INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_stats_campaign_id ON email_stats(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_sent_emails_campaign_id ON sent_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_contact_id ON sent_emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_status ON sent_emails(status);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_reception_is_read ON email_reception(is_read);
CREATE INDEX IF NOT EXISTS idx_email_reception_received_at ON email_reception(received_at DESC);

-- Activer Row Level Security (RLS)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_reception ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_reception_stats ENABLE ROW LEVEL SECURITY;

-- Politiques RSL pour permettre l'accès
CREATE POLICY "Enable read access for all users" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON campaigns FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON campaigns FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON email_stats FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON email_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON email_stats FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON email_stats FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON contacts FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON contacts FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON contacts FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON sent_emails FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON sent_emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON sent_emails FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON sent_emails FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON notifications FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON email_reception FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON email_reception FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON email_reception FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON email_reception FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON email_reception_stats FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON email_reception_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON email_reception_stats FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON email_reception_stats FOR DELETE USING (true);

-- Insertion de données de démonstration
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
