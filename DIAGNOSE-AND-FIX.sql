-- Script de diagnostic et réparation pour Supabase
-- Exécutez ce script pour voir ce qui existe et créer ce qui manque

-- 1. D'abord, vérifions ce qui existe déjà
SELECT '=== DIAGNOSTIC DES TABLES EXISTANTES ===' as info;

SELECT 
  table_name,
  table_type,
  is_insertable_into
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Vérifier si les tables requises existent
SELECT '=== VÉRIFICATION DES TABLES REQUISES ===' as info;

SELECT 
  'emails_sent' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'emails_sent'
  ) as exists;

SELECT 
  'email_campaigns' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'email_campaigns'
  ) as exists;

SELECT 
  'contacts' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'contacts'
  ) as exists;

SELECT 
  'organizations' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations'
  ) as exists;

-- 3. Créer uniquement la table emails_sent si elle n'existe pas
SELECT '=== CRÉATION DE LA TABLE emails_sent ===' as info;

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

-- 4. Créer email_campaigns si elle n'existe pas
SELECT '=== CRÉATION DE LA TABLE email_campaigns ===' as info;

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

-- 5. Créer les index pour emails_sent
SELECT '=== CRÉATION DES INDEX ===' as info;

CREATE INDEX IF NOT EXISTS idx_emails_sent_user_id ON emails_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_campaign_id ON emails_sent(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_status ON emails_sent(status);
CREATE INDEX IF NOT EXISTS idx_emails_sent_recipient_email ON emails_sent(recipient_email);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);

-- 6. Activer RLS
SELECT '=== ACTIVATION DE RLS ===' as info;

ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- 7. Créer les politiques RLS pour emails_sent
SELECT '=== CRÉATION DES POLITIQUES RLS ===' as info;

DROP POLICY IF EXISTS "Users can view own emails_sent" ON emails_sent;
CREATE POLICY "Users can view own emails_sent" ON emails_sent 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own emails_sent" ON emails_sent;
CREATE POLICY "Users can insert own emails_sent" ON emails_sent 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own emails_sent" ON emails_sent;
CREATE POLICY "Users can update own emails_sent" ON emails_sent 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own emails_sent" ON emails_sent;
CREATE POLICY "Users can delete own emails_sent" ON emails_sent 
FOR DELETE USING (auth.uid() = user_id);

-- 8. Créer les politiques RLS pour email_campaigns
DROP POLICY IF EXISTS "Users can view own campaigns" ON email_campaigns;
CREATE POLICY "Users can view own campaigns" ON email_campaigns 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own campaigns" ON email_campaigns;
CREATE POLICY "Users can insert own campaigns" ON email_campaigns 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own campaigns" ON email_campaigns;
CREATE POLICY "Users can update own campaigns" ON email_campaigns 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own campaigns" ON email_campaigns;
CREATE POLICY "Users can delete own campaigns" ON email_campaigns 
FOR DELETE USING (auth.uid() = user_id);

-- 9. Créer le trigger pour updated_at
SELECT '=== CRÉATION DES TRIGGERS ===' as info;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_emails_sent_updated_at ON emails_sent;
CREATE TRIGGER update_emails_sent_updated_at BEFORE UPDATE ON emails_sent 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Insérer des données de test pour l'utilisateur actuel
SELECT '=== INSERTION DES DONNÉES DE TEST ===' as info;

-- Créer des campagnes de test
INSERT INTO email_campaigns (name, subject, status, user_id)
SELECT 
  'Newsletter Janvier 2024',
  'Nouveautés et offres du mois',
  'sent',
  auth.uid()
WHERE NOT EXISTS (
  SELECT 1 FROM email_campaigns 
  WHERE name = 'Newsletter Janvier 2024' AND user_id = auth.uid()
)
AND auth.uid() IS NOT NULL;

INSERT INTO email_campaigns (name, subject, status, user_id)
SELECT 
  'Lancement Produit',
  'Découvrez notre nouvelle gamme',
  'draft',
  auth.uid()
WHERE NOT EXISTS (
  SELECT 1 FROM email_campaigns 
  WHERE name = 'Lancement Produit' AND user_id = auth.uid()
)
AND auth.uid() IS NOT NULL;

INSERT INTO email_campaigns (name, subject, status, user_id)
SELECT 
  'Promotion Spéciale',
  'Offre limitée -20%',
  'sending',
  auth.uid()
WHERE NOT EXISTS (
  SELECT 1 FROM email_campaigns 
  WHERE name = 'Promotion Spéciale' AND user_id = auth.uid()
)
AND auth.uid() IS NOT NULL;

-- Créer des emails envoyés pour les statistiques
INSERT INTO emails_sent (campaign_id, recipient_email, status, user_id, sent_at)
SELECT 
  c.id,
  'contact' || n.num || '@example.com',
  CASE 
    WHEN n.num <= 25 THEN 'delivered'
    WHEN n.num <= 28 THEN 'sent'
    WHEN n.num <= 29 THEN 'failed'
    ELSE 'bounced'
  END,
  c.user_id,
  NOW() - (n.num || ' days')::INTERVAL
FROM email_campaigns c
CROSS JOIN (SELECT generate_series(1, 30) as num) n
WHERE c.user_id = auth.uid()
AND c.name = 'Newsletter Janvier 2024'
AND auth.uid() IS NOT NULL
LIMIT 30;

-- 11. Vérification finale
SELECT '=== VÉRIFICATION FINALE ===' as info;

SELECT 
  'emails_sent' as table_name,
  (SELECT COUNT(*) FROM emails_sent WHERE user_id = auth.uid()) as record_count
UNION ALL
SELECT 
  'email_campaigns' as table_name,
  (SELECT COUNT(*) FROM email_campaigns WHERE user_id = auth.uid()) as record_count;

-- 12. Test de requête pour vérifier que tout fonctionne
SELECT '=== TEST DE REQUÊTE ===' as info;

SELECT status, COUNT(*) as count
FROM emails_sent 
WHERE user_id = auth.uid()
GROUP BY status;

SELECT '=== TERMINÉ ===' as info;
