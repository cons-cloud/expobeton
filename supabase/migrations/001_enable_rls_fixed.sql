-- Étape 1: Ajouter les colonnes user_id si elles n'existent pas
ALTER TABLE emails_sent ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE emails_received ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Étape 2: Activer RLS sur toutes les tables
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Étape 3: Créer les politiques RLS

-- Politiques pour emails_sent
CREATE POLICY IF NOT EXISTS "Users can only see their own sent emails" ON emails_sent
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only insert their own sent emails" ON emails_sent
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only update their own sent emails" ON emails_sent
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only delete their own sent emails" ON emails_sent
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour emails_received
CREATE POLICY IF NOT EXISTS "Users can only see their own received emails" ON emails_received
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only insert their own received emails" ON emails_received
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only update their own received emails" ON emails_received
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only delete their own received emails" ON emails_received
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour contacts
CREATE POLICY IF NOT EXISTS "Users can only see their own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only insert their own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only update their own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only delete their own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour campaigns
CREATE POLICY IF NOT EXISTS "Users can only see their own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only insert their own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only update their own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only delete their own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour notifications
CREATE POLICY IF NOT EXISTS "Users can only see their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can only delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Étape 4: Créer des indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_emails_sent_user_id ON emails_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_status ON emails_sent(status);
CREATE INDEX IF NOT EXISTS idx_emails_sent_created_at ON emails_sent(created_at);

CREATE INDEX IF NOT EXISTS idx_emails_received_user_id ON emails_received(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_received_status ON emails_received(status);
CREATE INDEX IF NOT EXISTS idx_emails_received_received_at ON emails_received(received_at);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Étape 5: Fonctions de sécurité supplémentaires
CREATE OR REPLACE FUNCTION user_can_access_email(email_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM emails_sent 
    WHERE id = email_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM emails_received 
    WHERE id = email_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Étape 6: Trigger pour automatiquement ajouter user_id lors de l'insertion
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer le trigger sur les tables (uniquement si elles n'existent pas déjà)
DROP TRIGGER IF EXISTS set_emails_sent_user_id ON emails_sent;
CREATE TRIGGER set_emails_sent_user_id
  BEFORE INSERT ON emails_sent
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_emails_received_user_id ON emails_received;
CREATE TRIGGER set_emails_received_user_id
  BEFORE INSERT ON emails_received
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_contacts_user_id ON contacts;
CREATE TRIGGER set_contacts_user_id
  BEFORE INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_campaigns_user_id ON campaigns;
CREATE TRIGGER set_campaigns_user_id
  BEFORE INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_notifications_user_id ON notifications;
CREATE TRIGGER set_notifications_user_id
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Étape 7: Mettre à jour les données existantes (optionnel - pour les données déjà présentes)
-- Cette étape est optionnelle et ne doit être exécutée que si vous avez des données existantes
-- COMMENTEZ les lignes suivantes si vous ne voulez pas migrer les données existantes

/*
-- Mettre à jour les emails existants avec l'user_id actuel (à adapter selon vos besoins)
UPDATE emails_sent SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE emails_received SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE contacts SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE campaigns SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE notifications SET user_id = auth.uid() WHERE user_id IS NULL;
*/
