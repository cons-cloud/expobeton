-- Script ULTRA SIMPLE - Sans generate_series complexe
-- Version garantie de fonctionner

-- 1. Créer les tables essentielles
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS emails_sent (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Activer RLS
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;

-- 3. Créer les politiques RLS simples
CREATE POLICY "Users can view own campaigns" ON email_campaigns 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" ON email_campaigns 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own emails_sent" ON emails_sent 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails_sent" ON emails_sent 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Insérer des campagnes de test (simples)
INSERT INTO email_campaigns (name, subject, status, user_id)
VALUES 
  ('Newsletter Janvier 2024', 'Nouveautés et offres du mois', 'sent', auth.uid()),
  ('Lancement Produit', 'Découvrez notre nouvelle gamme', 'draft', auth.uid()),
  ('Promotion Spéciale', 'Offre limitée -20%', 'sending', auth.uid())
ON CONFLICT DO NOTHING;

-- 5. Insérer des emails de test (simples, sans generate_series)
INSERT INTO emails_sent (campaign_id, recipient_email, status, user_id) VALUES
  ((SELECT id FROM email_campaigns WHERE name = 'Newsletter Janvier 2024' AND user_id = auth.uid() LIMIT 1), 'test1@example.com', 'delivered', auth.uid()),
  ((SELECT id FROM email_campaigns WHERE name = 'Newsletter Janvier 2024' AND user_id = auth.uid() LIMIT 1), 'test2@example.com', 'delivered', auth.uid()),
  ((SELECT id FROM email_campaigns WHERE name = 'Newsletter Janvier 2024' AND user_id = auth.uid() LIMIT 1), 'test3@example.com', 'delivered', auth.uid()),
  ((SELECT id FROM email_campaigns WHERE name = 'Newsletter Janvier 2024' AND user_id = auth.uid() LIMIT 1), 'test4@example.com', 'delivered', auth.uid()),
  ((SELECT id FROM email_campaigns WHERE name = 'Newsletter Janvier 2024' AND user_id = auth.uid() LIMIT 1), 'test5@example.com', 'sent', auth.uid()),
  ((SELECT id FROM email_campaigns WHERE name = 'Newsletter Janvier 2024' AND user_id = auth.uid() LIMIT 1), 'test6@example.com', 'sent', auth.uid()),
  ((SELECT id FROM email_campaigns WHERE name = 'Newsletter Janvier 2024' AND user_id = auth.uid() LIMIT 1), 'test7@example.com', 'failed', auth.uid()),
  ((SELECT id FROM email_campaigns WHERE name = 'Newsletter Janvier 2024' AND user_id = auth.uid() LIMIT 1), 'test8@example.com', 'bounced', auth.uid());

-- 6. Vérification
SELECT 'CREATION ULTRA SIMPLE TERMINEE' as info;

SELECT 
  'email_campaigns' as table_name,
  COUNT(*) as count
FROM email_campaigns 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'emails_sent' as table_name,
  COUNT(*) as count
FROM emails_sent 
WHERE user_id = auth.uid();
