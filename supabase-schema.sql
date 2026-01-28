-- Schema Supabase pour Expobeton Email
-- Exécuter ce script dans l'éditeur SQL Supabase

-- Activer l'extension UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table pour les templates d'emails
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table pour les organisations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  website VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(50), -- PME, Grand compte, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table pour les contacts (améliorée pour l'import Excel)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(255), -- Pour l'import Excel
  job_title VARCHAR(100),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  organization_name VARCHAR(255), -- Pour l'import Excel si l'organisation n'existe pas encore
  department VARCHAR(100),
  linkedin_url VARCHAR(255),
  notes TEXT,
  tags TEXT[], -- Pour les tags personnalisés
  source VARCHAR(50) DEFAULT 'manual', -- manual, excel, import, etc.
  import_batch_id UUID, -- Pour suivre les imports par lot
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(email, user_id) -- Unicité par utilisateur
);

-- Table pour les campagnes d'emails
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL
);

-- Table pour les emails envoyés (tracking complet)
CREATE TABLE IF NOT EXISTS emails_sent (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_name ON contacts(organization_name);
CREATE INDEX IF NOT EXISTS idx_contacts_full_name ON contacts(full_name);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_import_batch_id ON contacts(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_emails_sent_user_id ON emails_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_campaign_id ON emails_sent(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_status ON emails_sent(status);
CREATE INDEX IF NOT EXISTS idx_emails_sent_recipient_email ON emails_sent(recipient_email);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger aux tables
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emails_sent_updated_at BEFORE UPDATE ON emails_sent FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) pour la sécurité
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour que chaque utilisateur ne voie que ses données
CREATE POLICY "Users can view own email templates" ON email_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email templates" ON email_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email templates" ON email_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own email templates" ON email_templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own organizations" ON organizations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own organizations" ON organizations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own organizations" ON organizations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own organizations" ON organizations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own contacts" ON contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON contacts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own email campaigns" ON email_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email campaigns" ON email_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email campaigns" ON email_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own email campaigns" ON email_campaigns FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own emails sent" ON emails_sent FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emails sent" ON emails_sent FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emails sent" ON emails_sent FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emails sent" ON emails_sent FOR DELETE USING (auth.uid() = user_id);

-- Données de test (optionnel)
INSERT INTO email_templates (name, subject, content, user_id) VALUES 
('Bienvenue', 'Bienvenue chez Expobeton', '<h1>Bienvenue !</h1><p>Merci de nous rejoindre.</p>', auth.uid()),
('Promotion', 'Offre spéciale', '<h1>Offre spéciale !</h1><p>Découvrez nos offres.</p>', auth.uid())
ON CONFLICT DO NOTHING;

INSERT INTO contacts (email, first_name, last_name, company, user_id) VALUES 
('client1@example.com', 'Jean', 'Dupont', 'Entreprise A', auth.uid()),
('client2@example.com', 'Marie', 'Martin', 'Entreprise B', auth.uid())
ON CONFLICT (email) DO NOTHING;

-- Fonction pour obtenir les statistiques d'emails
CREATE OR REPLACE FUNCTION get_email_stats(p_user_id UUID DEFAULT NULL, p_campaign_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_emails BIGINT,
  sent_emails BIGINT,
  delivered_emails BIGINT,
  failed_emails BIGINT,
  bounced_emails BIGINT,
  pending_emails BIGINT,
  delivery_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_emails,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_emails,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered_emails,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_emails,
        COUNT(*) FILTER (WHERE status = 'bounced') as bounced_emails,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_emails,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'delivered')::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
            ELSE 0 
        END as delivery_rate
    FROM emails_sent 
    WHERE 
        (p_user_id IS NULL OR user_id = p_user_id) AND
        (p_campaign_id IS NULL OR campaign_id = p_campaign_id);
END;
$$ LANGUAGE plpgsql;
