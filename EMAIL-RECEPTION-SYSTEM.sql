-- SYSTÈME COMPLET DE RÉCEPTION D'EMAILS AVEC NOTIFICATIONS
-- Permet de recevoir les réponses aux emails envoyés et de gérer les notifications

-- ========================================
-- 1. TABLES POUR LA RÉCEPTION D'EMAILS
-- ========================================

-- Table pour stocker les emails reçus (réponses)
CREATE TABLE IF NOT EXISTS emails_received (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id VARCHAR(255) UNIQUE, -- ID unique du message email
  thread_id VARCHAR(255), -- ID du fil de conversation
  in_reply_to VARCHAR(255), -- ID de l'email auquel on répond
  message_references TEXT, -- Références du fil
  from_email VARCHAR(255) NOT NULL, -- Email de l'expéditeur
  from_name VARCHAR(255), -- Nom de l'expéditeur
  to_email VARCHAR(255) NOT NULL, -- Email de destination (notre email)
  subject TEXT NOT NULL, -- Sujet de l'email
  body_text TEXT, -- Corps du email en texte
  body_html TEXT, -- Corps du email en HTML
  attachments JSONB DEFAULT '[]', -- Pièces jointes
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Date de réception
  read_at TIMESTAMP WITH TIME ZONE, -- Date de lecture
  is_read BOOLEAN DEFAULT FALSE, -- Statut de lecture
  is_starred BOOLEAN DEFAULT FALSE, -- Email important
  is_archived BOOLEAN DEFAULT FALSE, -- Email archivé
  folder VARCHAR(50) DEFAULT 'inbox', -- Boîte de réception
  labels TEXT[] DEFAULT '{}', -- Étiquettes
  original_email_sent_id UUID REFERENCES emails_sent(id), -- Lien avec l'email envoyé original
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table pour les notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email_received', 'email_replied', 'campaign_update', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Données additionnelles
  is_read BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table pour les réponses aux emails
CREATE TABLE IF NOT EXISTS email_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  received_email_id UUID REFERENCES emails_received(id) ON DELETE CASCADE,
  reply_to VARCHAR(255) NOT NULL, -- Email de réponse
  reply_cc VARCHAR(255) DEFAULT '', -- Copie carbone
  reply_bcc VARCHAR(255) DEFAULT '', -- Copie carbone cachée
  subject VARCHAR(255) NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,
  attachments JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table pour les filtres d'emails
CREATE TABLE IF NOT EXISTS email_filters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  conditions JSONB NOT NULL, -- Conditions du filtre
  actions JSONB NOT NULL, -- Actions à appliquer
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ========================================
-- 2. INDEX POUR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_emails_received_user_id ON emails_received(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_received_from_email ON emails_received(from_email);
CREATE INDEX IF NOT EXISTS idx_emails_received_subject ON emails_received(subject);
CREATE INDEX IF NOT EXISTS idx_emails_received_received_at ON emails_received(received_at);
CREATE INDEX IF NOT EXISTS idx_emails_received_is_read ON emails_received(is_read);
CREATE INDEX IF NOT EXISTS idx_emails_received_thread_id ON emails_received(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_received_original_email_sent_id ON emails_received(original_email_sent_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_email_replies_user_id ON email_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_received_email_id ON email_replies(received_email_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_status ON email_replies(status);

-- ========================================
-- 3. ACTIVATION RLS
-- ========================================
ALTER TABLE emails_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_filters ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. POLITIQUES RLS
-- ========================================

-- Emails reçus
CREATE POLICY "Users can view own emails_received" ON emails_received 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails_received" ON emails_received 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emails_received" ON emails_received 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emails_received" ON emails_received 
FOR DELETE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications 
FOR DELETE USING (auth.uid() = user_id);

-- Réponses emails
CREATE POLICY "Users can view own email_replies" ON email_replies 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email_replies" ON email_replies 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email_replies" ON email_replies 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email_replies" ON email_replies 
FOR DELETE USING (auth.uid() = user_id);

-- Filtres emails
CREATE POLICY "Users can view own email_filters" ON email_filters 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email_filters" ON email_filters 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email_filters" ON email_filters 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email_filters" ON email_filters 
FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 5. FONCTIONS POUR LA GESTION DES EMAILS
-- ========================================

-- Fonction pour recevoir un email
CREATE OR REPLACE FUNCTION receive_email(
  p_message_id VARCHAR(255),
  p_from_email VARCHAR(255),
  p_from_name VARCHAR(255),
  p_to_email VARCHAR(255),
  p_subject TEXT,
  p_body_text TEXT,
  p_body_html TEXT,
  p_in_reply_to VARCHAR(255) DEFAULT NULL,
  p_thread_id VARCHAR(255) DEFAULT NULL,
  p_attachments JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
  email_id UUID;
  notification_id UUID;
  original_sent_id UUID;
BEGIN
  -- Trouver l'email envoyé original si c'est une réponse
  SELECT id INTO original_sent_id
  FROM emails_sent es
  WHERE es.recipient_email = p_from_email
  AND es.user_id = auth.uid()
  ORDER BY es.created_at DESC
  LIMIT 1;
  
  -- Insérer l'email reçu
  INSERT INTO emails_received (
    message_id, from_email, from_name, to_email, subject, 
    body_text, body_html, in_reply_to, thread_id, attachments,
    original_email_sent_id, user_id
  )
  VALUES (
    p_message_id, p_from_email, p_from_name, p_to_email, p_subject,
    p_body_text, p_body_html, p_in_reply_to, p_thread_id, p_attachments,
    original_sent_id, auth.uid()
  )
  RETURNING id INTO email_id;
  
  -- Créer une notification
  INSERT INTO notifications (
    type, title, message, data, is_important, user_id
  )
  VALUES (
    'email_received',
    'Nouvel email reçu',
    'Vous avez reçu un email de ' || p_from_name || ' (' || p_from_email || ')',
    jsonb_build_object(
      'email_id', email_id,
      'from_email', p_from_email,
      'subject', p_subject,
      'is_reply', original_sent_id IS NOT NULL
    ),
    original_sent_id IS NOT NULL,
    auth.uid()
  )
  RETURNING id INTO notification_id;
  
  RETURN email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer un email comme lu
CREATE OR REPLACE FUNCTION mark_email_as_read(p_email_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE emails_received 
  SET is_read = TRUE, read_at = NOW()
  WHERE id = p_email_id 
  AND user_id = auth.uid();
  
  -- Marquer les notifications associées comme lues
  UPDATE notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE data->>'email_id' = p_email_id::text
  AND user_id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une réponse
CREATE OR REPLACE FUNCTION create_email_reply(
  p_received_email_id UUID,
  p_reply_to VARCHAR(255),
  p_subject VARCHAR(255),
  p_body_text TEXT,
  p_body_html TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  reply_id UUID;
  received_email RECORD;
BEGIN
  -- Récupérer l'email reçu
  SELECT * INTO received_email
  FROM emails_received 
  WHERE id = p_received_email_id 
  AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email reçu non trouvé';
  END IF;
  
  -- Créer la réponse
  INSERT INTO email_replies (
    received_email_id, reply_to, subject, body_text, body_html, user_id
  )
  VALUES (
    p_received_email_id, p_reply_to, p_subject, p_body_text, p_body_html, auth.uid()
  )
  RETURNING id INTO reply_id;
  
  -- Créer une notification
  INSERT INTO notifications (
    type, title, message, data, user_id
  )
  VALUES (
    'email_replied',
    'Réponse envoyée',
    'Votre réponse à ' || received_email.from_name || ' a été préparée',
    jsonb_build_object(
      'reply_id', reply_id,
      'received_email_id', p_received_email_id,
      'reply_to', p_reply_to
    ),
    auth.uid()
  );
  
  RETURN reply_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 6. VUES POUR L'INTERFACE
-- ========================================

-- Vue pour la boîte de réception
CREATE OR REPLACE VIEW inbox_view AS
SELECT 
  er.id,
  er.from_email,
  er.from_name,
  er.subject,
  er.body_text,
  er.received_at,
  er.is_read,
  er.is_starred,
  er.is_archived,
  er.folder,
  er.labels,
  es.recipient_email as original_recipient,
  es.subject as original_subject,
  CASE 
    WHEN es.id IS NOT NULL THEN 'reply'
    ELSE 'new'
  END as email_type,
  COUNT(er_reply.id) as reply_count,
  er.user_id
FROM emails_received er
LEFT JOIN emails_sent es ON er.original_email_sent_id = es.id
LEFT JOIN email_replies er_reply ON er.id = er_reply.received_email_id
WHERE er.user_id = auth.uid()
AND er.is_archived = FALSE
GROUP BY er.id, er.from_email, er.from_name, er.subject, er.body_text, 
         er.received_at, er.is_read, er.is_starred, er.is_archived, 
         er.folder, er.labels, es.recipient_email, es.subject, es.id, er.user_id
ORDER BY er.received_at DESC;

-- Vue pour les notifications
CREATE OR REPLACE VIEW notifications_view AS
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.data,
  n.is_read,
  n.is_important,
  n.created_at,
  CASE 
    WHEN n.created_at > NOW() - INTERVAL '1 hour' THEN 'new'
    WHEN n.created_at > NOW() - INTERVAL '1 day' THEN 'recent'
    ELSE 'old'
  END as time_category,
  n.user_id
FROM notifications n
WHERE n.user_id = auth.uid()
AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.is_important DESC, n.is_read ASC, n.created_at DESC;

-- Vue pour les statistiques de réception
CREATE OR REPLACE VIEW email_reception_stats AS
SELECT 
  'Total Emails Reçus' as metric,
  COUNT(*) as value
FROM emails_received 
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Emails Non Lus' as metric,
  COUNT(*) as value
FROM emails_received 
WHERE user_id = auth.uid() 
AND is_read = FALSE

UNION ALL

SELECT 
  'Réponses Reçues' as metric,
  COUNT(*) as value
FROM emails_received er
WHERE er.user_id = auth.uid() 
AND er.original_email_sent_id IS NOT NULL

UNION ALL

SELECT 
  'Notifications Non Lues' as metric,
  COUNT(*) as value
FROM notifications 
WHERE user_id = auth.uid() 
AND is_read = FALSE;

-- ========================================
-- 7. FONCTIONS POUR TRIGGERS
-- ========================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. TRIGGERS AUTOMATIQUES
-- ========================================

-- Trigger pour mettre à jour les timestamps
CREATE TRIGGER update_emails_received_updated_at 
    BEFORE UPDATE ON emails_received 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_replies_updated_at 
    BEFORE UPDATE ON email_replies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 8. DONNÉES INITIALES
-- ========================================

-- Créer des filtres par défaut
INSERT INTO email_filters (name, conditions, actions, user_id)
VALUES 
  ('Emails importants', 
   jsonb_build_object('from_contains', 'important', 'subject_contains', 'urgent'),
   jsonb_build_object('add_label', 'important', 'set_starred', true),
   auth.uid()),
  ('Réponses automatiques',
   jsonb_build_object('subject_contains', 'auto-reply', 'body_contains', 'automatic'),
   jsonb_build_object('add_label', 'auto-reply', 'move_to_folder', 'archive'),
   auth.uid())
ON CONFLICT DO NOTHING;

-- ========================================
-- 9. VÉRIFICATION FINALE
-- ========================================

SELECT '=== SYSTÈME DE RÉCEPTION D''EMAILS CRÉÉ ===' as info;

SELECT 
  'emails_received' as table_name,
  'Stocke tous les emails reçus' as description

UNION ALL

SELECT 
  'notifications' as table_name,
  'Gère les notifications du système' as description

UNION ALL

SELECT 
  'email_replies' as table_name,
  'Stocke les réponses aux emails' as description

UNION ALL

SELECT 
  'email_filters' as table_name,
  'Filtres automatiques pour les emails' as description;

SELECT '=== PRÊT POUR LA RÉCEPTION D''EMAILS EN TEMPS RÉEL ===' as info;
