-- Script de diagnostic immédiat
-- Exécutez ce script pour voir exactement ce qui existe dans votre base de données

-- 1. Voir toutes les tables existantes
SELECT '=== TABLES EXISTANTES ===' as info;

SELECT 
  table_name,
  table_type,
  is_insertable_into
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Vérifier spécifiquement les tables dont nous avons besoin
SELECT '=== VÉRIFICATION DES TABLES REQUISES ===' as info;

SELECT 
  'emails_sent' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'emails_sent'
    AND table_type = 'BASE TABLE'
  ) as exists;

SELECT 
  'email_campaigns' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'email_campaigns'
    AND table_type = 'BASE TABLE'
  ) as exists;

SELECT 
  'contacts' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'contacts'
    AND table_type = 'BASE TABLE'
  ) as exists;

SELECT 
  'organizations' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations'
    AND table_type = 'BASE TABLE'
  ) as exists;

-- 3. Vérifier les politiques RLS
SELECT '=== POLITIQUES RLS EXISTANTES ===' as info;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Vérifier si RLS est activé
SELECT '=== STATUT RLS ===' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Compter les enregistrements dans chaque table
SELECT '=== NOMBRE D ENREGISTREMENTS ===' as info;

SELECT 
  'organizations' as table_name,
  (SELECT COUNT(*) FROM organizations) as count
UNION ALL
SELECT 
  'contacts' as table_name,
  (SELECT COUNT(*) FROM contacts) as count
UNION ALL
SELECT 
  'email_campaigns' as table_name,
  (SELECT COUNT(*) FROM email_campaigns) as count
UNION ALL
SELECT 
  'emails_sent' as table_name,
  (SELECT COUNT(*) FROM emails_sent) as count
UNION ALL
SELECT 
  'email_templates' as table_name,
  (SELECT COUNT(*) FROM email_templates) as count;

-- 6. Vérifier l'utilisateur actuel
SELECT '=== UTILISATEUR ACTUEL ===' as info;

SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email;
