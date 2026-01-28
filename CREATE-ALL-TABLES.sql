-- Script complet pour créer toutes les tables nécessaires
-- Exécutez ce script dans l'éditeur SQL Supabase

-- 1. Activer l'extension UUID si non déjà active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Créer la table organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  website VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Créer la table contacts
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(255),
  job_title VARCHAR(100),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  organization_name VARCHAR(255),
  department VARCHAR(100),
  linkedin_url VARCHAR(255),
  notes TEXT,
  tags TEXT[],
  source VARCHAR(50) DEFAULT 'manual',
  import_batch_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. Créer la table email_campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. Créer la table emails_sent
CREATE TABLE IF NOT EXISTS emails_sent (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 6. Créer la table email_templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 7. Créer les index
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_full_name ON contacts(full_name);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_name ON contacts(organization_name);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_import_batch_id ON contacts(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_emails_sent_user_id ON emails_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_campaign_id ON emails_sent(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_status ON emails_sent(status);
CREATE INDEX IF NOT EXISTS idx_emails_sent_recipient_email ON emails_sent(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);

-- 8. Activer Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- 9. Créer les politiques RLS pour organizations
DROP POLICY IF EXISTS "Users can view own organizations" ON organizations;
CREATE POLICY "Users can view own organizations" ON organizations 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own organizations" ON organizations;
CREATE POLICY "Users can insert own organizations" ON organizations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own organizations" ON organizations;
CREATE POLICY "Users can update own organizations" ON organizations 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own organizations" ON organizations;
CREATE POLICY "Users can delete own organizations" ON organizations 
FOR DELETE USING (auth.uid() = user_id);

-- 10. Créer les politiques RLS pour contacts
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
CREATE POLICY "Users can view own contacts" ON contacts 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
CREATE POLICY "Users can insert own contacts" ON contacts 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
CREATE POLICY "Users can update own contacts" ON contacts 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;
CREATE POLICY "Users can delete own contacts" ON contacts 
FOR DELETE USING (auth.uid() = user_id);

-- 11. Créer les politiques RLS pour email_campaigns
DROP POLICY IF EXISTS "Users can view own campaigns" ON email_campaigns;
CREATE POLICY "Users can view own campaigns" ON email_campaigns 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own campaigns" ON email_campaigns;
CREATE POLICY "Users can insert own campaigns" ON email_campaigns 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own campaigns" ON email_campaigns;
CREATE POLICY "Users can update own campaigns" ON email_campaigns 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own campaigns" ON email_campaigns;
CREATE POLICY "Users can delete own campaigns" ON email_campaigns 
FOR DELETE USING (auth.uid() = user_id);

-- 12. Créer les politiques RLS pour emails_sent
DROP POLICY IF EXISTS "Users can view own emails_sent" ON emails_sent;
CREATE POLICY "Users can view own emails_sent" ON emails_sent 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own emails_sent" ON emails_sent;
CREATE POLICY "Users can insert own emails_sent" ON emails_sent 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own emails_sent" ON emails_sent;
CREATE POLICY "Users can update own emails_sent" ON emails_sent 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own emails_sent" ON emails_sent;
CREATE POLICY "Users can delete own emails_sent" ON emails_sent 
FOR DELETE USING (auth.uid() = user_id);

-- 13. Créer les politiques RLS pour email_templates
DROP POLICY IF EXISTS "Users can view own templates" ON email_templates;
CREATE POLICY "Users can view own templates" ON email_templates 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own templates" ON email_templates;
CREATE POLICY "Users can insert own templates" ON email_templates 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own templates" ON email_templates;
CREATE POLICY "Users can update own templates" ON email_templates 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own templates" ON email_templates;
CREATE POLICY "Users can delete own templates" ON email_templates 
FOR DELETE USING (auth.uid() = user_id);

-- 14. Créer un trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger aux tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_sent_updated_at BEFORE UPDATE ON emails_sent 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. Insérer des données de test
-- Créer des organisations de test
INSERT INTO organizations (name, user_id) 
SELECT 'Expobeton RDC', auth.uid() 
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Expobeton RDC' AND user_id = auth.uid());

INSERT INTO organizations (name, user_id) 
SELECT 'Tech Solutions', auth.uid() 
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Tech Solutions' AND user_id = auth.uid());

-- Créer des campagnes de test
INSERT INTO email_campaigns (name, subject, status, user_id)
SELECT 
  'Newsletter Janvier 2024',
  'Nouveautés et offres du mois',
  'sent',
  auth.uid()
WHERE NOT EXISTS (
  SELECT 1 FROM email_campaigns 
  WHERE name = 'Newsletter Janvier 2024' AND user_id = auth.uid()
);

INSERT INTO email_campaigns (name, subject, status, user_id)
SELECT 
  'Lancement Produit',
  'Découvrez notre nouvelle gamme',
  'draft',
  auth.uid()
WHERE NOT EXISTS (
  SELECT 1 FROM email_campaigns 
  WHERE name = 'Lancement Produit' AND user_id = auth.uid()
);

INSERT INTO email_campaigns (name, subject, status, user_id)
SELECT 
  'Promotion Spéciale',
  'Offre limitée -20%',
  'sending',
  auth.uid()
WHERE NOT EXISTS (
  SELECT 1 FROM email_campaigns 
  WHERE name = 'Promotion Spéciale' AND user_id = auth.uid()
);

-- Créer des emails envoyés pour les statistiques
INSERT INTO emails_sent (campaign_id, recipient_email, status, user_id, sent_at)
SELECT 
  c.id,
  'contact' || generate_series(1, 50) || '@example.com',
  CASE 
    WHEN generate_series(1, 50) <= 40 THEN 'delivered'
    WHEN generate_series(1, 50) <= 45 THEN 'sent'
    WHEN generate_series(1, 50) <= 48 THEN 'failed'
    ELSE 'bounced'
  END,
  c.user_id,
  NOW() - (generate_series(1, 50) || ' days')::INTERVAL
FROM email_campaigns c
WHERE c.user_id = auth.uid()
AND c.name = 'Newsletter Janvier 2024'
LIMIT 50;

-- 16. Vérification
SELECT 
  'Tables créées:' as info,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
  'Organisations créées:' as info,
  COUNT(*) as count
FROM organizations 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Campagnes créées:' as info,
  COUNT(*) as count
FROM email_campaigns 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Emails envoyés créés:' as info,
  COUNT(*) as count
FROM emails_sent 
WHERE user_id = auth.uid();
