-- SCRIPT DE NETTOYAGE FORCÉ COMPLET
-- Supprime TOUT sans vérification préalable

-- 1. Supprimer toutes les vues d'abord
DROP VIEW IF EXISTS campaign_analytics CASCADE;
DROP VIEW IF EXISTS contact_analytics CASCADE;
DROP VIEW IF EXISTS dashboard_analytics CASCADE;
DROP VIEW IF EXISTS current_email_config CASCADE;
DROP VIEW IF EXISTS receipt_analytics CASCADE;
DROP VIEW IF EXISTS campaign_stats CASCADE;
DROP VIEW IF EXISTS contact_stats CASCADE;

-- 2. Supprimer toutes les fonctions
DROP FUNCTION IF EXISTS update_campaign_stats() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_recipient_organization() CASCADE;
DROP FUNCTION IF EXISTS get_email_config() CASCADE;
DROP FUNCTION IF EXISTS log_email_receipt() CASCADE;

-- 3. Supprimer tous les triggers (sans vérifier leur existence)
DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON emails_sent;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
DROP TRIGGER IF EXISTS update_emails_sent_updated_at ON emails_sent;
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
DROP TRIGGER IF EXISTS update_recipient_organization_trigger ON emails_sent;

-- 4. Désactiver RLS sur toutes les tables (sans vérifier l'existence)
DO $$
BEGIN
    BEGIN ALTER TABLE organizations DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN ALTER TABLE contacts DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN ALTER TABLE email_campaigns DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN ALTER TABLE emails_sent DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN ALTER TABLE email_config DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN ALTER TABLE email_receipts DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END;
END $$;

-- 5. Supprimer toutes les politiques RLS (sans vérifier l'existence)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own organizations" ON organizations; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can insert own organizations" ON organizations; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can update own organizations" ON organizations; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can delete own organizations" ON organizations; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    DROP POLICY IF EXISTS "Users can view own contacts" ON contacts; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can update own contacts" ON contacts; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    DROP POLICY IF EXISTS "Users can view own campaigns" ON email_campaigns; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can insert own campaigns" ON email_campaigns; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can update own campaigns" ON email_campaigns; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can delete own campaigns" ON email_campaigns; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    DROP POLICY IF EXISTS "Users can view own emails_sent" ON emails_sent; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can insert own emails_sent" ON emails_sent; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can update own emails_sent" ON emails_sent; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can delete own emails_sent" ON emails_sent; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    DROP POLICY IF EXISTS "Users can view own templates" ON email_templates; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can insert own templates" ON email_templates; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can update own templates" ON email_templates; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can delete own templates" ON email_templates; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    DROP POLICY IF EXISTS "Users can view own email_config" ON email_config; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can insert own email_config" ON email_config; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can update own email_config" ON email_config; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    DROP POLICY IF EXISTS "Users can view own email_receipts" ON email_receipts; EXCEPTION WHEN undefined_table THEN NULL; END;
    DROP POLICY IF EXISTS "Users can insert own email_receipts" ON email_receipts; EXCEPTION WHEN undefined_table THEN NULL; END;
END $$;

-- 6. Supprimer toutes les tables avec CASCADE (dans le bon ordre)
DROP TABLE IF EXISTS email_receipts CASCADE;
DROP TABLE IF EXISTS email_config CASCADE;
DROP TABLE IF EXISTS emails_sent CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;

-- 7. Vérification finale du nettoyage
SELECT '=== NETTOYAGE FORCÉ TERMINÉ ===' as info;

SELECT 
  table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name AND table_schema = 'public') 
    THEN 'ENCORE PRÉSENTE - ERREUR' 
    ELSE 'SUPPRIMÉE AVEC SUCCÈS' 
  END as status
FROM (
  VALUES 
    ('email_receipts'),
    ('email_config'),
    ('emails_sent'),
    ('contacts'),
    ('organizations'),
    ('email_campaigns'),
    ('email_templates')
) AS t(table_name)
ORDER BY table_name;
