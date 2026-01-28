-- Script pour créer l'utilisateur Supabase et configurer l'authentification
-- Exécutez ce script dans l'éditeur SQL Supabase

-- 1. Créer l'utilisateur avec les identifiants configurés
-- Email: expobeton@gmail.com
-- Mot de passe: Expobeton1@

-- Note: La création d'utilisateurs doit se faire via l'interface Supabase Auth
-- Allez dans: Authentication > Users > Add User

-- 2. Insérer l'utilisateur dans la table users (si elle existe)
INSERT INTO public.users (
  id,
  email,
  created_at,
  updated_at
) VALUES (
  'YOUR_USER_ID_HERE', -- Remplacez par l'UUID généré par Supabase
  'expobeton@gmail.com',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Vérifier que l'utilisateur existe
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'expobeton@gmail.com';

-- 4. Créer des données de test pour cet utilisateur
INSERT INTO public.email_campaigns (
  id,
  name,
  subject,
  status,
  user_id,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Newsletter Janvier 2024',
  'Nouveautés et offres du mois',
  'sent',
  (SELECT id FROM auth.users WHERE email = 'expobeton@gmail.com'),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Lancement Produit',
  'Découvrez notre nouvelle gamme',
  'draft',
  (SELECT id FROM auth.users WHERE email = 'expobeton@gmail.com'),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Promotion Spéciale',
  'Offre limitée -20%',
  'sending',
  (SELECT id FROM auth.users WHERE email = 'expobeton@gmail.com'),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Créer des emails envoyés pour les statistiques
INSERT INTO public.emails_sent (
  id,
  campaign_id,
  recipient_email,
  status,
  user_id,
  sent_at,
  created_at
) 
SELECT 
  gen_random_uuid(),
  c.id,
  'contact' || generate_series(1, 100) || '@example.com',
  CASE 
    WHEN generate_series(1, 100) <= 80 THEN 'delivered'
    WHEN generate_series(1, 100) <= 90 THEN 'sent'
    WHEN generate_series(1, 100) <= 95 THEN 'failed'
    ELSE 'bounced'
  END,
  c.user_id,
  NOW() - (generate_series(1, 100) || ' days')::INTERVAL,
  NOW()
FROM public.email_campaigns c
WHERE c.user_id = (SELECT id FROM auth.users WHERE email = 'expobeton@gmail.com')
LIMIT 100;

-- 6. Vérifier les données créées
SELECT 
  'Campagnes créées:' as info,
  COUNT(*) as count
FROM public.email_campaigns 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'expobeton@gmail.com')

UNION ALL

SELECT 
  'Emails envoyés:' as info,
  COUNT(*) as count
FROM public.emails_sent 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'expobeton@gmail.com');

-- Instructions:
-- 1. Allez dans votre projet Supabase
-- 2. Allez dans Authentication > Users
-- 3. Cliquez sur "Add User"
-- 4. Entrez: expobeton@gmail.com / Expobeton1@
-- 5. Copiez l'UUID généré
-- 6. Remplacez YOUR_USER_ID_HERE dans ce script
-- 7. Exécutez ce script SQL
