-- Script de mise à jour de la configuration email
-- Change l'email d'envoi et configure les accusés de réception

-- 1. Mettre à jour le fichier .env avec les nouvelles informations
-- NOTE: Ce script SQL met à jour la base de données,
-- vous devrez aussi mettre à jour votre fichier .env manuellement

-- 2. Créer une table pour la configuration email si elle n'existe pas
CREATE TABLE IF NOT EXISTS email_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_email VARCHAR(255) NOT NULL,
  sender_password VARCHAR(255) NOT NULL,
  smtp_host VARCHAR(255) DEFAULT 'smtp.gmail.com',
  smtp_port INTEGER DEFAULT 587,
  use_tls BOOLEAN DEFAULT true,
  admin_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Activer RLS sur email_config
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour email_config
CREATE POLICY "Users can view own email_config" ON email_config 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email_config" ON email_config 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email_config" ON email_config 
FOR UPDATE USING (auth.uid() = user_id);

-- 5. Insérer ou mettre à jour la configuration email
INSERT INTO email_config (sender_email, sender_password, admin_email, user_id)
VALUES 
  ('henrinelngando229@gmail.com', 'fdwajklvbsmrges', 'henrinelngando229@gmail.com', auth.uid())
ON CONFLICT (user_id) 
DO UPDATE SET 
  sender_email = EXCLUDED.sender_email,
  sender_password = EXCLUDED.sender_password,
  admin_email = EXCLUDED.admin_email,
  updated_at = NOW();

-- 6. Créer une fonction pour obtenir la configuration email
CREATE OR REPLACE FUNCTION get_email_config()
RETURNS TABLE (
  sender_email VARCHAR(255),
  sender_password VARCHAR(255),
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  use_tls BOOLEAN,
  admin_email VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.sender_email,
    ec.sender_password,
    ec.smtp_host,
    ec.smtp_port,
    ec.use_tls,
    ec.admin_email
  FROM email_config ec
  WHERE ec.user_id = auth.uid()
  AND ec.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Créer une vue pour la configuration email
CREATE OR REPLACE VIEW current_email_config AS
SELECT 
  sender_email,
  sender_password,
  smtp_host,
  smtp_port,
  use_tls,
  admin_email,
  is_active,
  updated_at
FROM email_config 
WHERE user_id = auth.uid()
AND is_active = true;

-- 8. Mettre à jour les templates d'email pour utiliser le nouvel expéditeur
UPDATE email_templates 
SET 
  content = REPLACE(
    REPLACE(content, 
      'Cet email a été envoyé via Expobeton Email System',
      'Cet email a été envoyé par henrinelngando229@gmail.com via Expobeton Email System'
    ),
    'Pour toute question, contactez-nous',
    'Pour toute question, contactez henrinelngando229@gmail.com'
  ),
  updated_at = NOW()
WHERE user_id = auth.uid();

-- 9. Créer une table pour les accusés de réception
CREATE TABLE IF NOT EXISTS email_receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email_sent_id UUID REFERENCES emails_sent(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  receipt_type VARCHAR(50) NOT NULL CHECK (receipt_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  receipt_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 10. Activer RLS sur email_receipts
ALTER TABLE email_receipts ENABLE ROW LEVEL SECURITY;

-- 11. Politiques RLS pour email_receipts
CREATE POLICY "Users can view own email_receipts" ON email_receipts 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email_receipts" ON email_receipts 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 12. Créer une fonction pour enregistrer les accusés de réception
CREATE OR REPLACE FUNCTION log_email_receipt(
  p_email_sent_id UUID,
  p_recipient_email VARCHAR(255),
  p_receipt_type VARCHAR(50),
  p_receipt_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  receipt_id UUID;
BEGIN
  INSERT INTO email_receipts (email_sent_id, recipient_email, receipt_type, receipt_data, user_id)
  VALUES (p_email_sent_id, p_recipient_email, p_receipt_type, p_receipt_data, auth.uid())
  RETURNING id INTO receipt_id;
  
  RETURN receipt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Créer une vue pour les statistiques d'accusés de réception
CREATE OR REPLACE VIEW receipt_analytics AS
SELECT 
  er.receipt_type,
  COUNT(*) as count,
  COUNT(DISTINCT er.email_sent_id) as unique_emails,
  DATE_TRUNC('day', er.created_at) as date,
  ec.user_id
FROM email_receipts er
JOIN emails_sent es ON er.email_sent_id = es.id
JOIN email_config ec ON ec.user_id = es.user_id
WHERE ec.user_id = auth.uid()
GROUP BY er.receipt_type, DATE_TRUNC('day', er.created_at), ec.user_id
ORDER BY date DESC, count DESC;

-- 14. Afficher la configuration actuelle
SELECT '=== CONFIGURATION EMAIL MISE À JOUR ===' as info;

SELECT 
  sender_email,
  smtp_host,
  smtp_port,
  use_tls,
  admin_email,
  'CONFIGURÉ' as status
FROM current_email_config;

-- 15. Instructions pour le fichier .env
SELECT '=== INSTRUCTIONS POUR .env ===' as info;

SELECT 
  'VITE_SENDER_EMAIL=henrinelngando229@gmail.com' as variable,
  'VITE_SENDER_PASSWORD=fdwajklvbsmrges' as valeur,
  'Email d''envoi configuré' as description

UNION ALL

SELECT 
  'VITE_ADMIN_EMAIL=henrinelngando229@gmail' as variable,
  'Email pour accusés de réception' as valeur,
  'Admin email configuré' as description;

SELECT '=== MISE À JOUR TERMINÉE ===' as info;
