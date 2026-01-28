-- Script de mise à jour de la configuration email - VERSION CORRIGÉE
-- Change l'email d'envoi et configure les accusés de réception

-- NOTE: Ce script doit être exécuté APRÈS FINAL-MASTER-DATABASE.sql

-- 1. Mettre à jour la configuration email existante
UPDATE email_config 
SET 
  sender_email = 'henrinelngando229@gmail.com',
  sender_password = 'fdwajklvbsmrges',
  admin_email = 'henrinelngando229@gmail.com',
  updated_at = NOW()
WHERE user_id = auth.uid();

-- 2. Insérer la configuration si elle n'existe pas
INSERT INTO email_config (sender_email, sender_password, admin_email, user_id)
VALUES 
  ('henrinelngando229@gmail.com', 'fdwajklvbsmrges', 'henrinelngando229@gmail.com', auth.uid())
ON CONFLICT (user_id) 
DO UPDATE SET 
  sender_email = EXCLUDED.sender_email,
  sender_password = EXCLUDED.sender_password,
  admin_email = EXCLUDED.admin_email,
  updated_at = NOW();

-- 3. Créer une fonction pour obtenir la configuration email
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

-- 4. Créer une fonction pour enregistrer les accusés de réception
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

-- 5. Mettre à jour les templates d'email pour utiliser le nouvel expéditeur
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

-- 6. Afficher la configuration actuelle
SELECT '=== CONFIGURATION EMAIL MISE À JOUR ===' as info;

SELECT 
  sender_email,
  smtp_host,
  smtp_port,
  use_tls,
  admin_email,
  'CONFIGURÉE' as status
FROM current_email_config;

-- 7. Vérifier les accusés de réception
SELECT '=== SYSTÈME D'ACCUSÉS DE RÉCEPTION PRÊT ===' as info;

SELECT 
  'Types d''accusés disponibles' as feature,
  'sent, delivered, opened, clicked, bounced, failed' as types

UNION ALL

SELECT 
  'Table de stockage' as feature,
  'email_receipts' as table_name

UNION ALL

SELECT 
  'Fonction d''enregistrement' as feature,
  'log_email_receipt()' as function_name;

-- 8. Instructions pour Gmail
SELECT '=== CONFIGURATION GMAIL REQUISE ===' as info;

SELECT 
  'Action requise' as requirement,
  'Description' as description

UNION ALL

SELECT 
  'Activer "Less secure apps"' as requirement,
  'Dans les paramètres Gmail → Sécurité'

UNION ALL

SELECT 
  'Ou utiliser App Password' as requirement,
  'Si l''authentification 2FA est activée'

UNION ALL

SELECT 
  'Vérifier le mot de passe' as requirement,
  'fdwajklvbsmrges doit être correct';

SELECT '=== MISE À JOUR EMAIL TERMINÉE ===' as info;
