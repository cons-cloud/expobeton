-- BASE DE DONNÉES COMPLÈTE - SYNCHRONISATION EN TEMPS RÉEL
-- Version finale avec toutes les fonctionnalités

-- ========================================
-- 1. EXTENSIONS
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 2. CRÉATION DES TABLES
-- ========================================

-- Table organisations (pour l'import Excel)
CREATE TABLE organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table contacts (email + organisation)
CREATE TABLE contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(email, user_id)
);

-- Table email_campaigns (campagnes)
CREATE TABLE email_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table emails_sent (envois en temps réel)
CREATE TABLE emails_sent (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_organization VARCHAR(255),
  subject TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table email_templates (modèles)
CREATE TABLE email_templates (
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

-- ========================================
-- 3. INDEX OPTIMISÉS
-- ========================================
CREATE INDEX idx_organizations_user_id ON organizations(user_id);
CREATE INDEX idx_organizations_name ON organizations(name);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_organization_name ON contacts(organization_name);

CREATE INDEX idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);

CREATE INDEX idx_emails_sent_user_id ON emails_sent(user_id);
CREATE INDEX idx_emails_sent_campaign_id ON emails_sent(campaign_id);
CREATE INDEX idx_emails_sent_contact_id ON emails_sent(contact_id);
CREATE INDEX idx_emails_sent_status ON emails_sent(status);
CREATE INDEX idx_emails_sent_recipient_email ON emails_sent(recipient_email);

CREATE INDEX idx_email_templates_user_id ON email_templates(user_id);

-- ========================================
-- 4. TRIGGERS POUR updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at 
    BEFORE UPDATE ON email_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_sent_updated_at 
    BEFORE UPDATE ON emails_sent 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. ACTIVATION RLS
-- ========================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. POLITIQUES RLS COMPLÈTES
-- ========================================

-- Organizations
CREATE POLICY "Users can view own organizations" ON organizations 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own organizations" ON organizations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own organizations" ON organizations 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own organizations" ON organizations 
FOR DELETE USING (auth.uid() = user_id);

-- Contacts
CREATE POLICY "Users can view own contacts" ON contacts 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON contacts 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON contacts 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON contacts 
FOR DELETE USING (auth.uid() = user_id);

-- Email Campaigns
CREATE POLICY "Users can view own campaigns" ON email_campaigns 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" ON email_campaigns 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON email_campaigns 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON email_campaigns 
FOR DELETE USING (auth.uid() = user_id);

-- Emails Sent
CREATE POLICY "Users can view own emails_sent" ON emails_sent 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails_sent" ON emails_sent 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emails_sent" ON emails_sent 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emails_sent" ON emails_sent 
FOR DELETE USING (auth.uid() = user_id);

-- Email Templates
CREATE POLICY "Users can view own templates" ON email_templates 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON email_templates 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON email_templates 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON email_templates 
FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 7. VUES POUR ANALYTIQUE EN TEMPS RÉEL
-- ========================================

-- Vue pour les statistiques des campagnes en temps réel
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT 
  c.id,
  c.name,
  c.subject,
  c.status as campaign_status,
  c.created_at,
  c.updated_at,
  COUNT(es.id) as total_emails,
  COUNT(CASE WHEN es.status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN es.status = 'sending' THEN 1 END) as sending,
  COUNT(CASE WHEN es.status = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN es.status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN es.status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN es.status = 'bounced' THEN 1 END) as bounced,
  ROUND(
    COUNT(CASE WHEN es.status IN ('delivered', 'sent') THEN 1 END) * 100.0 / 
    NULLIF(COUNT(es.id), 0), 2
  ) as success_rate,
  c.user_id
FROM email_campaigns c
LEFT JOIN emails_sent es ON c.id = es.campaign_id
WHERE c.user_id = auth.uid()
GROUP BY c.id, c.name, c.subject, c.status, c.created_at, c.updated_at, c.user_id;

-- Vue pour les contacts avec organisations
CREATE OR REPLACE VIEW contact_analytics AS
SELECT 
  ct.id,
  ct.email,
  ct.organization_name,
  ct.created_at,
  COUNT(es.id) as emails_received,
  COUNT(CASE WHEN es.status = 'delivered' THEN 1 END) as emails_delivered,
  COUNT(CASE WHEN es.status = 'failed' THEN 1 END) as emails_failed,
  ROUND(
    COUNT(CASE WHEN es.status = 'delivered' THEN 1 END) * 100.0 / 
    NULLIF(COUNT(es.id), 0), 2
  ) as delivery_rate,
  ct.user_id
FROM contacts ct
LEFT JOIN emails_sent es ON ct.id = es.contact_id
WHERE ct.user_id = auth.uid()
GROUP BY ct.id, ct.email, ct.organization_name, ct.created_at, ct.user_id;

-- Vue pour le tableau de bord en temps réel
CREATE OR REPLACE VIEW dashboard_analytics AS
SELECT 
  'Total Contacts' as metric,
  COUNT(*) as value,
  (SELECT COUNT(*) FROM contacts WHERE user_id = auth.uid()) as total
FROM contacts 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Total Organisations' as metric,
  COUNT(*) as value,
  (SELECT COUNT(*) FROM organizations WHERE user_id = auth.uid()) as total
FROM organizations 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Campagnes Actives' as metric,
  COUNT(*) as value,
  (SELECT COUNT(*) FROM email_campaigns WHERE user_id = auth.uid() AND status IN ('sending', 'sent')) as total
FROM email_campaigns 
WHERE user_id = auth.uid() 
AND status IN ('sending', 'sent')

UNION ALL

SELECT 
  'Emails Envoyés Aujourd''hui' as metric,
  COUNT(*) as value,
  COUNT(*) as total
FROM emails_sent 
WHERE user_id = auth.uid() 
AND DATE(created_at) = CURRENT_DATE;

-- ========================================
-- 8. TRIGGERS POUR SYNCHRONISATION EN TEMPS RÉEL
-- ========================================

-- Trigger pour mettre à jour l'organisation dans les emails envoyés
CREATE OR REPLACE FUNCTION update_recipient_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE emails_sent 
    SET recipient_organization = ct.organization_name
    FROM contacts ct
    WHERE ct.id = NEW.contact_id 
    AND emails_sent.id = NEW.id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipient_organization_trigger
    AFTER INSERT ON emails_sent
    FOR EACH ROW
    EXECUTE FUNCTION update_recipient_organization();

-- ========================================
-- 9. DONNÉES INITIALES
-- ========================================

-- Insérer quelques organisations de base
INSERT INTO organizations (name, user_id) VALUES
  ('Expobeton RDC', auth.uid()),
  ('Tech Solutions Africa', auth.uid()),
  ('Digital Agency Congo', auth.uid())
ON CONFLICT (name, user_id) DO NOTHING;

-- Insérer quelques contacts de base
INSERT INTO contacts (email, organization_name, user_id) VALUES
  ('contact@expobeton-rdc.cd', 'Expobeton RDC', auth.uid()),
  ('info@techsolutions.africa', 'Tech Solutions Africa', auth.uid()),
  ('hello@digitalagency.cd', 'Digital Agency Congo', auth.uid())
ON CONFLICT (email, user_id) DO NOTHING;

-- Insérer un template de base
INSERT INTO email_templates (name, subject, content, category, user_id) VALUES
  ('Newsletter Standard', 'Newsletter {{month}}', '<h1>Bonjour {{organization_name}}</h1><p>Ceci est un test...</p>', 'newsletter', auth.uid())
ON CONFLICT DO NOTHING;

-- ========================================
-- 10. VÉRIFICATION FINALE
-- ========================================

SELECT '=== BASE DE DONNÉES COMPLÈTE CRÉÉE ===' as info;

SELECT 
  'Organisations' as table_name,
  COUNT(*) as count
FROM organizations 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Contacts' as table_name,
  COUNT(*) as count
FROM contacts 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Templates' as table_name,
  COUNT(*) as count
FROM email_templates 
WHERE user_id = auth.uid();

SELECT '=== PRÊT POUR SYNCHRONISATION EN TEMPS RÉEL ===' as info;
