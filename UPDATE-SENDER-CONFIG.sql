-- Mettre à jour la configuration pour utiliser henrinelngando229@gmail.com comme expéditeur principal

-- 1. Mettre à jour la configuration email principale
UPDATE email_config 
SET 
  sender_email = 'henrinelngando229@gmail.com',
  admin_email = 'henrinelngando229@gmail.com',
  updated_at = NOW()
WHERE user_id = auth.uid();

-- 2. Insérer si la configuration n'existe pas
INSERT INTO email_config (sender_email, sender_password, admin_email, user_id)
VALUES 
  ('henrinelngando229@gmail.com', 'fdwajklvbsmrges', 'henrinelngando229@gmail.com', auth.uid())
ON CONFLICT (user_id) 
DO UPDATE SET 
  sender_email = EXCLUDED.sender_email,
  admin_email = EXCLUDED.admin_email,
  updated_at = NOW();

-- 3. Ajouter une colonne pour l'expéditeur principal dans les campagnes si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_campaigns' 
        AND column_name = 'sender_email'
    ) THEN
        ALTER TABLE email_campaigns ADD COLUMN sender_email VARCHAR(255) DEFAULT 'henrinelngando229@gmail.com';
    END IF;
END $$;

-- 4. Mettre à jour toutes les campagnes existantes pour utiliser le bon expéditeur
UPDATE email_campaigns 
SET 
  sender_email = 'henrinelngando229@gmail.com',
  updated_at = NOW()
WHERE user_id = auth.uid()
AND (sender_email IS NULL OR sender_email != 'henrinelngando229@gmail.com');

-- 5. Mettre à jour les templates pour utiliser le bon expéditeur
UPDATE email_templates 
SET 
  content = REPLACE(
    REPLACE(
      REPLACE(content, 
        'Cet email a été envoyé par',
        'Cet email a été envoyé par henrinelngando229@gmail.com'
      ),
      'Pour toute question, contactez',
      'Pour toute question, contactez henrinelngando229@gmail.com'
    ),
    'Envoyé depuis',
    'Envoyé depuis henrinelngando229@gmail.com'
  ),
  updated_at = NOW()
WHERE user_id = auth.uid();

-- 6. Créer une vue pour les campagnes avec l'expéditeur
CREATE OR REPLACE VIEW campaign_with_sender AS
SELECT 
  c.id,
  c.name,
  c.subject,
  c.content,
  c.status,
  c.sender_email,
  COALESCE(c.sender_email, ec.sender_email, 'henrinelngando229@gmail.com') as actual_sender,
  c.scheduled_at,
  c.created_at,
  c.updated_at,
  c.user_id
FROM email_campaigns c
LEFT JOIN email_config ec ON c.user_id = ec.user_id AND ec.is_active = true
WHERE c.user_id = auth.uid();

-- 7. Créer une fonction pour obtenir l'expéditeur principal
CREATE OR REPLACE FUNCTION get_main_sender()
RETURNS TABLE (
  sender_email VARCHAR(255),
  admin_email VARCHAR(255),
  is_configured BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ec.sender_email, 'henrinelngando229@gmail.com') as sender_email,
    COALESCE(ec.admin_email, 'henrinelngando229@gmail.com') as admin_email,
    (ec.sender_email IS NOT NULL) as is_configured
  FROM email_config ec
  WHERE ec.user_id = auth.uid()
  AND ec.is_active = true
  LIMIT 1;
  
  -- Si aucune configuration trouvée, retourner les valeurs par défaut
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      'henrinelngando229@gmail.com' as sender_email,
      'henrinelngando229@gmail.com' as admin_email,
      false as is_configured;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Mettre à jour les emails envoyés pour utiliser le bon expéditeur
UPDATE emails_sent 
SET 
  recipient_organization = ct.societe,
  updated_at = NOW()
FROM contacts ct
WHERE ct.id = emails_sent.contact_id 
AND emails_sent.user_id = auth.uid();

-- 9. Créer une vue pour les statistiques d'envoi par expéditeur
CREATE OR REPLACE VIEW sender_stats AS
SELECT 
  COALESCE(c.sender_email, ec.sender_email, 'henrinelngando229@gmail.com') as sender_email,
  COUNT(es.id) as total_sent,
  COUNT(CASE WHEN es.status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN es.status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN es.status = 'bounced' THEN 1 END) as bounced,
  ROUND(
    COUNT(CASE WHEN es.status = 'delivered' THEN 1 END) * 100.0 / 
    NULLIF(COUNT(es.id), 0), 2
  ) as success_rate,
  c.user_id
FROM email_campaigns c
LEFT JOIN emails_sent es ON c.id = es.campaign_id
LEFT JOIN email_config ec ON c.user_id = ec.user_id AND ec.is_active = true
WHERE c.user_id = auth.uid()
GROUP BY COALESCE(c.sender_email, ec.sender_email, 'henrinelngando229@gmail.com'), c.user_id;

-- 10. Afficher la configuration actuelle
SELECT '=== CONFIGURATION DE L''EXPÉDITEUR PRINCIPAL ===' as info;

SELECT 
  'Expéditeur principal' as configuration,
  'henrinelngando229@gmail.com' as valeur

UNION ALL

SELECT 
  'Email admin' as configuration,
  'henrinelngando229@gmail.com' as valeur

UNION ALL

SELECT 
  'Campagnes mises à jour' as configuration,
  COUNT(*)::text as valeur
FROM email_campaigns 
WHERE user_id = auth.uid()
AND sender_email = 'henrinelngando229@gmail.com';

-- 11. Afficher les campagnes avec l'expéditeur configuré
SELECT '=== CAMPAGNES AVEC EXPÉDITEUR CONFIGURÉ ===' as info;

SELECT 
  name,
  subject,
  sender_email,
  status,
  created_at
FROM campaign_with_sender
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

SELECT '=== EXPÉDITEUR PRINCIPAL CONFIGURÉ : henrinelngando229@gmail.com ===' as info;
