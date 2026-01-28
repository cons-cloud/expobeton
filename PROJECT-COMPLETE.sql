-- SCRIPT COMPLET DU PROJET EXPOBETON EMAIL
-- Version finale sans erreurs - Crée toutes les tables, politiques et données

-- ========================================
-- 1. EXTENSIONS ET CONFIGURATION
-- ========================================

-- Activer l'extension UUID si non déjà active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 2. CRÉATION DES TABLES
-- ========================================

-- Table organizations
CREATE TABLE organizations (
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

-- Table contacts
CREATE TABLE contacts (
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

-- Table email_campaigns
CREATE TABLE email_campaigns (
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

-- Table emails_sent
CREATE TABLE emails_sent (
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

-- Table email_templates
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
-- 3. CRÉATION DES INDEX
-- ========================================

-- Index pour organizations
CREATE INDEX idx_organizations_user_id ON organizations(user_id);
CREATE INDEX idx_organizations_name ON organizations(name);

-- Index pour contacts
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_full_name ON contacts(full_name);
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_contacts_organization_name ON contacts(organization_name);
CREATE INDEX idx_contacts_source ON contacts(source);
CREATE INDEX idx_contacts_import_batch_id ON contacts(import_batch_id);

-- Index pour email_campaigns
CREATE INDEX idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);

-- Index pour emails_sent
CREATE INDEX idx_emails_sent_user_id ON emails_sent(user_id);
CREATE INDEX idx_emails_sent_campaign_id ON emails_sent(campaign_id);
CREATE INDEX idx_emails_sent_status ON emails_sent(status);
CREATE INDEX idx_emails_sent_recipient_email ON emails_sent(recipient_email);

-- Index pour email_templates
CREATE INDEX idx_email_templates_user_id ON email_templates(user_id);

-- ========================================
-- 4. FONCTION DE TRIGGER POUR updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- 5. CRÉATION DES TRIGGERS
-- ========================================

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
-- 6. ACTIVATION DE ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. CRÉATION DES POLITIQUES RLS - ORGANIZATIONS
-- ========================================

CREATE POLICY "Users can view own organizations" ON organizations 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own organizations" ON organizations 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own organizations" ON organizations 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own organizations" ON organizations 
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 8. CRÉATION DES POLITIQUES RLS - CONTACTS
-- ========================================

CREATE POLICY "Users can view own contacts" ON contacts 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON contacts 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON contacts 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON contacts 
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 9. CRÉATION DES POLITIQUES RLS - EMAIL_CAMPAIGNS
-- ========================================

CREATE POLICY "Users can view own campaigns" ON email_campaigns 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" ON email_campaigns 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON email_campaigns 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON email_campaigns 
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 10. CRÉATION DES POLITIQUES RLS - EMAILS_SENT
-- ========================================

CREATE POLICY "Users can view own emails_sent" ON emails_sent 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails_sent" ON emails_sent 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emails_sent" ON emails_sent 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emails_sent" ON emails_sent 
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 11. CRÉATION DES POLITIQUES RLS - EMAIL_TEMPLATES
-- ========================================

CREATE POLICY "Users can view own templates" ON email_templates 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON email_templates 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON email_templates 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON email_templates 
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 12. DONNÉES DE TEST
-- ========================================

-- Insérer des organisations de test
INSERT INTO organizations (name, user_id) VALUES
  ('Expobeton RDC', auth.uid()),
  ('Tech Solutions', auth.uid()),
  ('Digital Agency', auth.uid())
ON CONFLICT DO NOTHING;

-- Insérer des campagnes de test
INSERT INTO email_campaigns (name, subject, status, user_id) VALUES
  ('Newsletter Janvier 2024', 'Nouveautés et offres du mois', 'sent', auth.uid()),
  ('Lancement Produit', 'Découvrez notre nouvelle gamme', 'draft', auth.uid()),
  ('Promotion Spéciale', 'Offre limitée -20%', 'sending', auth.uid()),
  ('Rapport Mensuel', 'Votre rapport d''activité', 'scheduled', auth.uid())
ON CONFLICT DO NOTHING;

-- Insérer des contacts de test
INSERT INTO contacts (email, first_name, last_name, full_name, organization_name, user_id) VALUES
  ('john.doe@company.com', 'John', 'Doe', 'John Doe', 'Tech Solutions', auth.uid()),
  ('jane.smith@business.com', 'Jane', 'Smith', 'Jane Smith', 'Expobeton RDC', auth.uid()),
  ('mike.wilson@startup.com', 'Mike', 'Wilson', 'Mike Wilson', 'Digital Agency', auth.uid()),
  ('sarah.johnson@corp.com', 'Sarah', 'Johnson', 'Sarah Johnson', 'Tech Solutions', auth.uid()),
  ('david.brown@enterprise.com', 'David', 'Brown', 'David Brown', 'Expobeton RDC', auth.uid())
ON CONFLICT DO NOTHING;

-- Insérer des emails envoyés pour les statistiques
INSERT INTO emails_sent (campaign_id, recipient_email, subject, status, user_id, sent_at)
SELECT 
  c.id,
  'contact' || generate_series || '@example.com',
  c.subject,
  CASE 
    WHEN generate_series <= 40 THEN 'delivered'
    WHEN generate_series <= 45 THEN 'sent'
    WHEN generate_series <= 48 THEN 'failed'
    ELSE 'bounced'
  END,
  c.user_id,
  NOW() - (generate_series || ' days')::INTERVAL
FROM email_campaigns c,
generate_series(1, 20)
WHERE c.name = 'Newsletter Janvier 2024'
AND c.user_id = auth.uid();

-- Insérer des templates d'email
INSERT INTO email_templates (name, subject, content, category, user_id) VALUES
  ('Newsletter Standard', 'Newsletter de {{month}}', '<h1>Bonjour {{name}}</h1><p>Voici nos nouveautés...</p>', 'newsletter', auth.uid()),
  ('Lancement Produit', 'Nouveau produit disponible !', '<h1>Exciting news!</h1><p>Nous sommes ravis de...</p>', 'product', auth.uid()),
  ('Promotion', 'Offre spéciale -20%', '<h1>Offre limitée!</h1><p>Pour une durée limitée...</p>', 'promotion', auth.uid())
ON CONFLICT DO NOTHING;

-- ========================================
-- 13. VÉRIFICATION FINALE
-- ========================================

-- Afficher le résumé de la création
SELECT '=== RÉSUMÉ DE LA CRÉATION ===' as info;

SELECT 
  'organizations' as table_name,
  COUNT(*) as record_count
FROM organizations 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'contacts' as table_name,
  COUNT(*) as record_count
FROM contacts 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'email_campaigns' as table_name,
  COUNT(*) as record_count
FROM email_campaigns 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'emails_sent' as table_name,
  COUNT(*) as record_count
FROM emails_sent 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'email_templates' as table_name,
  COUNT(*) as record_count
FROM email_templates 
WHERE user_id = auth.uid();

-- Afficher les statistiques des emails
SELECT '=== STATISTIQUES EMAILS ===' as info;

SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM emails_sent 
WHERE user_id = auth.uid()
GROUP BY status
ORDER BY count DESC;

SELECT '=== PROJET EXPORBETON EMAIL - TERMINÉ AVEC SUCCÈS ===' as info;
