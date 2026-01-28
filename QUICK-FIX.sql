-- Script rapide pour créer les tables manquantes
-- Version simplifiée sans erreurs SQL complexes

-- 1. Créer la table emails_sent si elle n'existe pas
CREATE TABLE IF NOT EXISTS emails_sent (
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

-- 2. Créer la table email_campaigns si elle n'existe pas
CREATE TABLE IF NOT EXISTS email_campaigns (
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

-- 3. Créer les index essentiels
CREATE INDEX IF NOT EXISTS idx_emails_sent_user_id ON emails_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_status ON emails_sent(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);

-- 4. Activer RLS
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques RLS simples
DROP POLICY IF EXISTS "Users can view own emails_sent" ON emails_sent;
CREATE POLICY "Users can view own emails_sent" ON emails_sent 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own emails_sent" ON emails_sent;
CREATE POLICY "Users can insert own emails_sent" ON emails_sent 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own campaigns" ON email_campaigns;
CREATE POLICY "Users can view own campaigns" ON email_campaigns 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own campaigns" ON email_campaigns;
CREATE POLICY "Users can insert own campaigns" ON email_campaigns 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Insérer des données de test simples
INSERT INTO email_campaigns (name, subject, status, user_id)
VALUES 
  ('Newsletter Janvier 2024', 'Nouveautés et offres du mois', 'sent', auth.uid()),
  ('Lancement Produit', 'Découvrez notre nouvelle gamme', 'draft', auth.uid()),
  ('Promotion Spéciale', 'Offre limitée -20%', 'sending', auth.uid())
ON CONFLICT DO NOTHING;

-- 7. Insérer quelques emails de test
INSERT INTO emails_sent (campaign_id, recipient_email, status, user_id)
SELECT 
  id,
  'test' || generate_series(1, 10) || '@example.com',
  CASE 
    WHEN generate_series(1, 10) <= 8 THEN 'delivered'
    WHEN generate_series(1, 10) <= 9 THEN 'sent'
    ELSE 'failed'
  END,
  auth.uid()
FROM email_campaigns 
WHERE name = 'Newsletter Janvier 2024' 
AND user_id = auth.uid()
LIMIT 10;

-- 8. Vérification
SELECT 'emails_sent created: ' || COUNT(*) as result
FROM emails_sent 
WHERE user_id = auth.uid()

UNION ALL

SELECT 'email_campaigns created: ' || COUNT(*) as result
FROM email_campaigns 
WHERE user_id = auth.uid();
