-- Script de nettoyage FORCÉ - Supprime TOUT sans erreur
-- Exécutez ce script pour nettoyer complètement votre base

-- 1. Supprimer toutes les tables avec CASCADE (force la suppression)
DROP TABLE IF EXISTS emails_sent CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;

-- 2. Supprimer la fonction de trigger
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. Vérifier que tout est supprimé
SELECT 'NETTOYAGE TERMINE - Tables restantes:' as info;

SELECT 
  table_name,
  'ENCORE PRESENTE' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
