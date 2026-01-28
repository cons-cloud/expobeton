-- Script SIMPLE de synchronisation des CONTACTS
-- Version simplifiée : juste organisation + email

-- 1. Créer la table organizations (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Créer la table contacts simplifiée
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  organization_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Activer RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS simples
CREATE POLICY "Users can view own organizations" ON organizations 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own organizations" ON organizations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own contacts" ON contacts 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON contacts 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Insérer des organisations simples
INSERT INTO organizations (name, user_id) VALUES
  ('Expobeton RDC', auth.uid()),
  ('Tech Solutions Africa', auth.uid()),
  ('Digital Agency Congo', auth.uid()),
  ('Mining Corporation', auth.uid()),
  ('Agro Business Ltd', auth.uid())
ON CONFLICT DO NOTHING;

-- 6. Insérer des contacts simples (email + organisation)
INSERT INTO contacts (email, organization_name, user_id) VALUES
  ('contact@expobeton-rdc.cd', 'Expobeton RDC', auth.uid()),
  ('info@techsolutions.africa', 'Tech Solutions Africa', auth.uid()),
  ('hello@digitalagency.cd', 'Digital Agency Congo', auth.uid()),
  ('contact@miningcorp.cd', 'Mining Corporation', auth.uid()),
  ('sales@agrobusiness.cd', 'Agro Business Ltd', auth.uid()),
  ('support@expobeton-rdc.cd', 'Expobeton RDC', auth.uid()),
  ('admin@techsolutions.africa', 'Tech Solutions Africa', auth.uid()),
  ('team@digitalagency.cd', 'Digital Agency Congo', auth.uid()),
  ('office@miningcorp.cd', 'Mining Corporation', auth.uid()),
  ('info@agrobusiness.cd', 'Agro Business Ltd', auth.uid())
ON CONFLICT (email, user_id) DO NOTHING;

-- 7. Mettre à jour les emails envoyés pour utiliser les vrais contacts
UPDATE emails_sent 
SET 
  recipient_email = c.email,
  contact_id = c.id
FROM contacts c
WHERE emails_sent.recipient_email LIKE 'test%@example.com'
AND c.user_id = emails_sent.user_id
AND c.user_id = auth.uid();

-- 8. Ajouter plus d'emails avec les vrais contacts
INSERT INTO emails_sent (campaign_id, contact_id, recipient_email, subject, status, user_id, sent_at)
SELECT 
  c.id,
  c.id,
  c.email,
  camp.subject,
  CASE 
    WHEN random() <= 0.8 THEN 'delivered'
    WHEN random() <= 0.9 THEN 'sent'
    WHEN random() <= 0.95 THEN 'failed'
    ELSE 'bounced'
  END,
  c.user_id,
  NOW() - (FLOOR(RANDOM() * 7) || ' days')::INTERVAL,
  CASE 
    WHEN random() <= 0.8 THEN NOW() - (FLOOR(RANDOM() * 2) || ' days')::INTERVAL
    ELSE NULL
  END
FROM contacts c
CROSS JOIN email_campaigns camp
WHERE c.user_id = auth.uid()
AND camp.user_id = auth.uid()
AND camp.status = 'sent'
AND NOT EXISTS (
  SELECT 1 FROM emails_sent es 
  WHERE es.contact_id = c.id 
  AND es.campaign_id = camp.id
)
LIMIT 15;

-- 9. Afficher les résultats
SELECT '=== CONTACTS SIMPLIFIÉS SYNCHRONISÉS ===' as info;

SELECT 
  email,
  organization_name
FROM contacts 
WHERE user_id = auth.uid()
ORDER BY organization_name, email;

-- 10. Afficher les organisations
SELECT '=== ORGANISATIONS SYNCHRONISÉES ===' as info;

SELECT 
  name
FROM organizations 
WHERE user_id = auth.uid()
ORDER BY name;

-- 11. Statistiques
SELECT '=== STATISTIQUES FINALES ===' as info;

SELECT 
  'Total Organisations' as metric,
  COUNT(*) as value
FROM organizations 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Total Contacts' as metric,
  COUNT(*) as value
FROM contacts 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Total Emails Envoyés' as metric,
  COUNT(*) as value
FROM emails_sent 
WHERE user_id = auth.uid();

SELECT '=== SYNCHRONISATION CONTACTS TERMINÉE ===' as info;
