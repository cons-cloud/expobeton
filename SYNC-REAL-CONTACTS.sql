-- Script de synchronisation des CONTACTS et ORGANISATIONS réels
-- Complète la synchronisation avec des données réalistes

-- 1. Créer les tables manquantes si elles n'existent pas
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

-- 2. Activer RLS sur les nouvelles tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 3. Créer les politiques RLS pour organizations
CREATE POLICY "Users can view own organizations" ON organizations 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own organizations" ON organizations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own organizations" ON organizations 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own organizations" ON organizations 
FOR DELETE USING (auth.uid() = user_id);

-- 4. Créer les politiques RLS pour contacts
CREATE POLICY "Users can view own contacts" ON contacts 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON contacts 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON contacts 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON contacts 
FOR DELETE USING (auth.uid() = user_id);

-- 5. Insérer des organisations réelles
INSERT INTO organizations (name, address, phone, website, industry, size, user_id) VALUES
  ('Expobeton RDC', '123 Avenue des Nations, Kinshasa', '+243 123 456 789', 'www.expobeton-rdc.cd', 'Construction', '50-100', auth.uid()),
  ('Tech Solutions Africa', '456 Boulevard du Commerce, Lubumbashi', '+243 987 654 321', 'www.techsolutions.africa', 'Technologie', '20-50', auth.uid()),
  ('Digital Agency Congo', '789 Rue de l''Innovation, Goma', '+243 555 666 777', 'www.digitalagency.cd', 'Marketing Digital', '10-20', auth.uid()),
  ('Mining Corporation', '321 Avenue des Mines, Kolwezi', '+243 444 333 222', 'www.miningcorp.cd', 'Industrie Minière', '100-500', auth.uid()),
  ('Agro Business Ltd', '654 Route Agricole, Bukavu', '+243 888 999 000', 'www.agrobusiness.cd', 'Agriculture', '20-50', auth.uid())
ON CONFLICT DO NOTHING;

-- 6. Insérer des contacts réels liés aux organisations
INSERT INTO contacts (email, first_name, last_name, full_name, job_title, phone, organization_id, organization_name, department, city, country, tags, user_id) 
SELECT 
  email,
  first_name,
  last_name,
  first_name || ' ' || last_name as full_name,
  job_title,
  phone,
  org.id,
  org.name,
  department,
  city,
  country,
  tags,
  auth.uid()
FROM (
  VALUES 
    ('jean.mukendi@expobeton-rdc.cd', 'Jean', 'Mukendi', 'Directeur Technique', '+243 123 001', 'Expobeton RDC', 'Ingénierie', 'Kinshasa', 'RD Congo', ARRAY['client', 'vip']),
    ('marie.nsilu@techsolutions.africa', 'Marie', 'Nsilu', 'CEO', '+243 987 001', 'Tech Solutions Africa', 'Direction', 'Lubumbashi', 'RD Congo', ARRAY['prospect', 'decision-maker']),
    ('pierre.kabeya@digitalagency.cd', 'Pierre', 'Kabeya', 'Directeur Marketing', '+243 555 001', 'Digital Agency Congo', 'Marketing', 'Goma', 'RD Congo', ARRAY['client', 'marketing']),
    ('sophie.mutombo@miningcorp.cd', 'Sophie', 'Mutombo', 'Responsable RH', '+243 444 001', 'Mining Corporation', 'Ressources Humaines', 'Kolwezi', 'RD Congo', ARRAY['prospect']),
    ('antoine.mbuyi@agrobusiness.cd', 'Antoine', 'Mbuyi', 'Directeur Général', '+243 888 001', 'Agro Business Ltd', 'Direction', 'Bukavu', 'RD Congo', ARRAY['client', 'agriculture']),
    ('chantal.kasongo@expobeton-rdc.cd', 'Chantal', 'Kasongo', 'Chef de Projet', '+243 123 002', 'Expobeton RDC', 'Projets', 'Kinshasa', 'RD Congo', ARRAY['client']),
    ('joseph.kalenga@techsolutions.africa', 'Joseph', 'Kalenga', 'CTO', '+243 987 002', 'Tech Solutions Africa', 'Technologie', 'Lubumbashi', 'RD Congo', ARRAY['prospect', 'technique']),
    ('grace.luboya@digitalagency.cd', 'Grace', 'Luboya', 'Directrice Créative', '+243 555 002', 'Digital Agency Congo', 'Création', 'Goma', 'RD Congo', ARRAY['client', 'créatif']),
    ('emery.tshibasu@miningcorp.cd', 'Emery', 'Tshibasu', 'Directeur Financier', '+243 444 002', 'Mining Corporation', 'Finance', 'Kolwezi', 'RD Congo', ARRAY['prospect', 'finance']),
    ('patricia.mbala@agrobusiness.cd', 'Patricia', 'Mbala', 'Responsable Ventes', '+243 888 002', 'Agro Business Ltd', 'Ventes', 'Bukavu', 'RD Congo', ARRAY['client', 'ventes'])
) AS contacts_data(email, first_name, last_name, job_title, phone, org_name, department, city, country, tags)
JOIN organizations org ON org.name = contacts_data.org_name AND org.user_id = auth.uid()
ON CONFLICT (email, user_id) DO NOTHING;

-- 7. Créer une vue pour les statistiques des contacts
CREATE OR REPLACE VIEW contact_stats AS
SELECT 
  COUNT(*) as total_contacts,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_contacts,
  COUNT(DISTINCT organization_id) as total_organizations,
  COUNT(DISTINCT department) as total_departments,
  COUNT(CASE WHEN tags && ARRAY['client'] THEN 1 END) as client_contacts,
  COUNT(CASE WHEN tags && ARRAY['prospect'] THEN 1 END) as prospect_contacts,
  user_id
FROM contacts 
WHERE user_id = auth.uid()
GROUP BY user_id;

-- 8. Mettre à jour les emails envoyés pour utiliser de vrais contacts
UPDATE emails_sent 
SET 
  recipient_email = c.email,
  contact_id = c.id
FROM contacts c
WHERE emails_sent.recipient_email LIKE 'test%@example.com'
AND c.user_id = emails_sent.user_id
AND c.user_id = auth.uid();

-- 9. Ajouter plus d'emails avec de vrais contacts
INSERT INTO emails_sent (campaign_id, contact_id, recipient_email, subject, status, user_id, sent_at, delivered_at)
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
LIMIT 20;

-- 10. Afficher les statistiques synchronisées
SELECT '=== STATISTIQUES CONTACTS SYNCHRONISÉES ===' as info;

SELECT 
  total_contacts,
  active_contacts,
  total_organizations,
  total_departments,
  client_contacts,
  prospect_contacts
FROM contact_stats
WHERE user_id = auth.uid();

-- 11. Afficher les organisations synchronisées
SELECT '=== ORGANISATIONS SYNCHRONISÉES ===' as info;

SELECT 
  name,
  industry,
  size,
  city,
  phone,
  website
FROM organizations 
WHERE user_id = auth.uid()
ORDER BY name;

-- 12. Afficher les contacts synchronisés
SELECT '=== CONTACTS SYNCHRONISÉS ===' as info;

SELECT 
  full_name,
  email,
  job_title,
  organization_name,
  department,
  city,
  array_to_string(tags, ', ') as tags
FROM contacts 
WHERE user_id = auth.uid()
ORDER BY organization_name, full_name;

SELECT '=== SYNCHRONISATION CONTACTS TERMINÉE ===' as info;
