-- Étape 1: Vérifier et ajouter les colonnes manquantes
-- Ajouter user_id si n'existe pas
DO $$
BEGIN
    -- emails_sent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_sent' AND column_name = 'user_id') THEN
        ALTER TABLE emails_sent ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- emails_received
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_received' AND column_name = 'user_id') THEN
        ALTER TABLE emails_received ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- contacts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'user_id') THEN
        ALTER TABLE contacts ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- campaigns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'user_id') THEN
        ALTER TABLE campaigns ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- notifications
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        ALTER TABLE notifications ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Ajouter status si n'existe pas (pour emails_sent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_sent' AND column_name = 'status') THEN
        ALTER TABLE emails_sent ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_sent' AND column_name = 'sent_at') THEN
        ALTER TABLE emails_sent ADD COLUMN sent_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_sent' AND column_name = 'delivered_at') THEN
        ALTER TABLE emails_sent ADD COLUMN delivered_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_sent' AND column_name = 'error_message') THEN
        ALTER TABLE emails_sent ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- Ajouter status si n'existe pas (pour emails_received)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_received' AND column_name = 'status') THEN
        ALTER TABLE emails_received ADD COLUMN status TEXT DEFAULT 'received' CHECK (status IN ('received', 'read', 'archived', 'deleted'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_received' AND column_name = 'is_read') THEN
        ALTER TABLE emails_received ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Ajouter status si n'existe pas (pour campaigns)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'status') THEN
        ALTER TABLE campaigns ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed'));
    END IF;
END $$;

-- Étape 2: Activer RLS sur toutes les tables
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Étape 3: Créer les politiques RLS (syntaxe corrigée)

-- Supprimer les politiques existantes pour éviter les erreurs
DROP POLICY IF EXISTS "Users can only see their own sent emails" ON emails_sent;
DROP POLICY IF EXISTS "Users can only insert their own sent emails" ON emails_sent;
DROP POLICY IF EXISTS "Users can only update their own sent emails" ON emails_sent;
DROP POLICY IF EXISTS "Users can only delete their own sent emails" ON emails_sent;

-- Politiques pour emails_sent
CREATE POLICY "Users can only see their own sent emails" ON emails_sent
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own sent emails" ON emails_sent
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own sent emails" ON emails_sent
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own sent emails" ON emails_sent
  FOR DELETE USING (auth.uid() = user_id);

-- Supprimer les politiques existantes pour emails_received
DROP POLICY IF EXISTS "Users can only see their own received emails" ON emails_received;
DROP POLICY IF EXISTS "Users can only insert their own received emails" ON emails_received;
DROP POLICY IF EXISTS "Users can only update their own received emails" ON emails_received;
DROP POLICY IF EXISTS "Users can only delete their own received emails" ON emails_received;

-- Politiques pour emails_received
CREATE POLICY "Users can only see their own received emails" ON emails_received
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own received emails" ON emails_received
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own received emails" ON emails_received
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own received emails" ON emails_received
  FOR DELETE USING (auth.uid() = user_id);

-- Supprimer les politiques existantes pour contacts
DROP POLICY IF EXISTS "Users can only see their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can only insert their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can only update their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can only delete their own contacts" ON contacts;

-- Politiques pour contacts
CREATE POLICY "Users can only see their own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Supprimer les politiques existantes pour campaigns
DROP POLICY IF EXISTS "Users can only see their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can only insert their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can only update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can only delete their own campaigns" ON campaigns;

-- Politiques pour campaigns
CREATE POLICY "Users can only see their own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Supprimer les politiques existantes pour notifications
DROP POLICY IF EXISTS "Users can only see their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can only insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can only update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can only delete their own notifications" ON notifications;

-- Politiques pour notifications
CREATE POLICY "Users can only see their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Étape 4: Créer des indexes pour optimiser les performances (uniquement si les colonnes existent)
DO $$
BEGIN
    -- Index pour emails_sent
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_sent' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_emails_sent_user_id ON emails_sent(user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_sent' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_emails_sent_status ON emails_sent(status);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_sent' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_emails_sent_created_at ON emails_sent(created_at);
    END IF;
    
    -- Index pour emails_received
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_received' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_emails_received_user_id ON emails_received(user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_received' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_emails_received_status ON emails_received(status);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails_received' AND column_name = 'received_at') THEN
        CREATE INDEX IF NOT EXISTS idx_emails_received_received_at ON emails_received(received_at);
    END IF;
    
    -- Index pour contacts
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'email') THEN
        CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
    END IF;
    
    -- Index pour campaigns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
    END IF;
    
    -- Index pour notifications
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    END IF;
END $$;

-- Étape 5: Trigger pour automatiquement ajouter user_id lors de l'insertion
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer le trigger sur les tables
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
