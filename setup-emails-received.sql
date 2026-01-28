-- Créer la table pour les emails reçus
CREATE TABLE IF NOT EXISTS emails_received (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  message_id TEXT UNIQUE NOT NULL,
  reply_to_email_id UUID REFERENCES emails_received(id),
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'read', 'archived', 'deleted')),
  is_read BOOLEAN DEFAULT false,
  headers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour optimiser les performances
CREATE INDEX idx_emails_received_to_email ON emails_received(to_email);
CREATE INDEX idx_emails_received_status ON emails_received(status);
CREATE INDEX idx_emails_received_received_at ON emails_received(received_at);
CREATE INDEX idx_emails_received_message_id ON emails_received(message_id);

-- Activer RLS (Row Level Security)
ALTER TABLE emails_received ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture des emails
CREATE POLICY "Users can view emails" ON emails_received
  FOR SELECT USING (
    to_email = 'henrinelngando229@gmail.com' OR 
    from_email = 'henrinelngando229@gmail.com'
  );

-- Politique pour permettre l'insertion des emails via webhook
CREATE POLICY "Webhook can insert emails" ON emails_received
  FOR INSERT WITH CHECK (true);

-- Politique pour permettre la mise à jour des emails
CREATE POLICY "Users can update emails" ON emails_received
  FOR UPDATE USING (
    to_email = 'henrinelngando229@gmail.com' OR 
    from_email = 'henrinelngando229@gmail.com'
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_emails_received_updated_at 
  BEFORE UPDATE ON emails_received 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
