-- SCRIPT DE NETTOYAGE COMPLET DE LA BASE DE DONNÉES
-- Supprime TOUT pour repartir de zéro

-- 1. Supprimer toutes les vues
DROP VIEW IF EXISTS campaign_stats CASCADE;
DROP VIEW IF EXISTS contact_stats CASCADE;

-- 2. Supprimer toutes les fonctions
DROP FUNCTION IF EXISTS update_campaign_stats() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. Supprimer tous les triggers
DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON emails_sent;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
DROP TRIGGER IF EXISTS update_emails_sent_updated_at ON emails_sent;
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;

-- 4. Supprimer toutes les politiques RLS
DROP POLICY IF EXISTS "Users can view own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete own organizations" ON organizations;

DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;

DROP POLICY IF EXISTS "Users can view own campaigns" ON email_campaigns;
DROP POLICY IF EXISTS "Users can insert own campaigns" ON email_campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON email_campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON email_campaigns;

DROP POLICY IF EXISTS "Users can view own emails_sent" ON emails_sent;
DROP POLICY IF EXISTS "Users can insert own emails_sent" ON emails_sent;
DROP POLICY IF EXISTS "Users can update own emails_sent" ON emails_sent;
DROP POLICY IF EXISTS "Users can delete own emails_sent" ON emails_sent;

DROP POLICY IF EXISTS "Users can view own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON email_templates;

-- 5. Désactiver RLS
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS emails_sent DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_templates DISABLE ROW LEVEL SECURITY;

-- 6. Supprimer toutes les tables dans le bon ordre
DROP TABLE IF EXISTS emails_sent CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;

-- 7. Vérification du nettoyage
SELECT '=== NETTOYAGE COMPLET TERMINÉ ===' as info;

SELECT 
  table_name,
  'SUPPRIMÉE' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
